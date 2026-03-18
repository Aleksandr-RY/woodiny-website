import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import createMemoryStore from "memorystore";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import multer from "multer";
import {
  insertInquirySchema,
  insertProductSchema,
  insertPartnerSchema,
  insertReviewSchema,
  insertStaffSchema,
  insertNewsSchema,
  insertBlockSchema,
  insertPortfolioSchema,
} from "@shared/schema";
import { db } from "./db";
import { blocks, portfolio } from "@shared/schema";
import { eq, asc } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

const UPLOADS_DIR = path.resolve(process.cwd(), "client", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const multerStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Допустимые форматы: JPG, JPEG, PNG, WEBP"));
    }
  },
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any).userId) {
    return res.status(401).json({ message: "Не авторизован" });
  }
  next();
}

function safeError(res: Response, status: number, e: any) {
  const isProduction = process.env.NODE_ENV === "production";
  const message = isProduction && status >= 500 ? "Внутренняя ошибка сервера" : e.message;
  return res.status(status).json({ message });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const isProduction = process.env.NODE_ENV === "production";

  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: 86400000 }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
      },
    })
  );

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Неверный логин или пароль" });
      }
      (req.session as any).userId = user.id;
      res.json({ id: user.id, username: user.username, mustChangePassword: user.mustChangePassword });
    } catch (e: any) {
      safeError(res, 500, e);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Не авторизован" });
    const user = await storage.getUser(userId);
    if (!user) return res.status(401).json({ message: "Не авторизован" });
    res.json({ id: user.id, username: user.username, mustChangePassword: user.mustChangePassword });
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Пароль должен быть не менее 6 символов" });
      }
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(400).json({ message: "Неверный текущий пароль" });
      }
      const hash = await bcrypt.hash(newPassword, 12);
      await storage.updateUserPassword(user.id, hash);
      res.json({ ok: true });
    } catch (e: any) {
      safeError(res, 500, e);
    }
  });

  app.post("/api/track", async (req, res) => {
    try {
      await storage.trackVisit({
        page: req.body.page || "/",
        referrer: req.body.referrer || req.headers.referer || null,
        userAgent: req.headers["user-agent"] || null,
        ip: req.ip || null,
      });
      res.json({ ok: true });
    } catch (e: any) {
      safeError(res, 500, e);
    }
  });

  app.get("/api/inquiries", requireAuth, async (_req, res) => {
    res.json(await storage.getInquiries());
  });

  app.post("/api/inquiries", async (req, res) => {
    try {
      const data = insertInquirySchema.parse(req.body);
      const item = await storage.createInquiry(data);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/inquiries/:id/status", requireAuth, async (req, res) => {
    try {
      const item = await storage.updateInquiryStatus(Number(req.params.id), req.body.status);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/inquiries/:id", requireAuth, async (req, res) => {
    await storage.deleteInquiry(Number(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/products", async (_req, res) => {
    res.json(await storage.getProducts());
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const data = insertProductSchema.parse(req.body);
      const item = await storage.createProduct(data);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.updateProduct(Number(req.params.id), req.body);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    await storage.deleteProduct(Number(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/partners", async (_req, res) => {
    res.json(await storage.getPartners());
  });

  app.post("/api/partners", requireAuth, async (req, res) => {
    try {
      const data = insertPartnerSchema.parse(req.body);
      const item = await storage.createPartner(data);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/partners/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.updatePartner(Number(req.params.id), req.body);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/partners/:id", requireAuth, async (req, res) => {
    await storage.deletePartner(Number(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/reviews", async (_req, res) => {
    res.json(await storage.getReviews());
  });

  app.post("/api/reviews", requireAuth, async (req, res) => {
    try {
      const data = insertReviewSchema.parse(req.body);
      const item = await storage.createReview(data);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/reviews/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.updateReview(Number(req.params.id), req.body);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/reviews/:id", requireAuth, async (req, res) => {
    await storage.deleteReview(Number(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/staff", requireAuth, async (_req, res) => {
    res.json(await storage.getStaff());
  });

  app.post("/api/staff", requireAuth, async (req, res) => {
    try {
      const data = insertStaffSchema.parse(req.body);
      const item = await storage.createStaff(data);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/staff/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.updateStaff(Number(req.params.id), req.body);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/staff/:id", requireAuth, async (req, res) => {
    await storage.deleteStaff(Number(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/news", async (_req, res) => {
    res.json(await storage.getNews());
  });

  app.post("/api/news", requireAuth, async (req, res) => {
    try {
      const data = insertNewsSchema.parse(req.body);
      const item = await storage.createNews(data);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.patch("/api/news/:id", requireAuth, async (req, res) => {
    try {
      const item = await storage.updateNews(Number(req.params.id), req.body);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/news/:id", requireAuth, async (req, res) => {
    await storage.deleteNews(Number(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/content", async (_req, res) => {
    const all = await storage.getSettings();
    const contentSettings = all.filter(s => s.category === "content");
    const result: Record<string, any> = {};
    contentSettings.forEach(s => {
      try { result[s.key] = JSON.parse(s.value); } catch { result[s.key] = s.value; }
    });
    res.json(result);
  });

  app.get("/api/settings/public", async (_req, res) => {
    const all = await storage.getSettings();
    const publicSettings = all.filter(s => s.category === "contacts" || s.category === "seo");
    res.json(publicSettings);
  });

  app.get("/api/settings", requireAuth, async (_req, res) => {
    res.json(await storage.getSettings());
  });

  app.put("/api/settings/:key", requireAuth, async (req, res) => {
    try {
      const item = await storage.upsertSetting(String(req.params.key), req.body.value, req.body.category);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/stats/visits", requireAuth, async (_req, res) => {
    try {
      res.json(await storage.getVisitStats());
    } catch (e: any) {
      safeError(res, 500, e);
    }
  });

  app.post("/api/upload-price", requireAuth, (req, res) => {
    const MAX_SIZE = 10 * 1024 * 1024;
    const chunks: Buffer[] = [];
    let totalSize = 0;
    req.on("data", (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > MAX_SIZE) {
        req.destroy();
        return res.status(413).json({ message: "Файл слишком большой (макс. 10 МБ)" });
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const buffer = Buffer.concat(chunks);
        if (buffer.length < 4 || buffer.slice(0, 4).toString() !== "%PDF") {
          return res.status(400).json({ message: "Файл не является PDF" });
        }
        const pricePath = path.resolve(process.cwd(), "client", "price.pdf");
        fs.writeFileSync(pricePath, buffer);
        res.json({ ok: true, size: buffer.length });
      } catch (e: any) {
        safeError(res, 500, e);
      }
    });
  });

  app.post("/api/upload-partner-logo/:id", requireAuth, (req, res) => {
    const MAX_SIZE = 2 * 1024 * 1024;
    const chunks: Buffer[] = [];
    let totalSize = 0;
    req.on("data", (chunk: Buffer) => {
      totalSize += chunk.length;
      if (totalSize > MAX_SIZE) {
        req.destroy();
        return res.status(413).json({ message: "Файл слишком большой (макс. 2 МБ)" });
      }
      chunks.push(chunk);
    });
    req.on("end", async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const ext = req.headers["x-file-ext"] || "png";
        const uploadsDir = path.resolve(process.cwd(), "client", "uploads");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const filename = `partner-${req.params.id}.${ext}`;
        fs.writeFileSync(path.join(uploadsDir, filename), buffer);
        const logoUrl = `/uploads/${filename}?t=${Date.now()}`;
        await storage.updatePartner(Number(req.params.id), { logoUrl });
        res.json({ ok: true, logoUrl });
      } catch (e: any) {
        safeError(res, 500, e);
      }
    });
  });

  app.get("/api/price-info", requireAuth, (_req, res) => {
    const pricePath = path.resolve(process.cwd(), "client", "price.pdf");
    try {
      const stat = fs.statSync(pricePath);
      res.json({ exists: true, size: stat.size, modified: stat.mtime });
    } catch {
      res.json({ exists: false });
    }
  });

  app.post("/api/upload", requireAuth, (req, res) => {
    console.log("[upload] UPLOADS_DIR:", UPLOADS_DIR);
    console.log("[upload] dir exists:", fs.existsSync(UPLOADS_DIR));
    console.log("[upload] content-type:", req.headers["content-type"]);
    upload.single("image")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        console.error("[upload] MulterError:", err.code, err.message);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({ message: "Файл слишком большой (макс. 5 МБ)" });
        }
        return res.status(400).json({ message: err.message });
      }
      if (err) {
        console.error("[upload] error:", err.message);
        return res.status(400).json({ message: err.message || "Ошибка загрузки" });
      }
      if (!req.file) {
        console.error("[upload] no file received");
        return res.status(400).json({ message: "Файл не получен" });
      }
      const url = `/uploads/${req.file.filename}`;
      console.log("[upload] success:", url);
      res.json({ url });
    });
  });

  app.get("/api/media", requireAuth, (_req, res) => {
    try {
      if (!fs.existsSync(UPLOADS_DIR)) {
        return res.json([]);
      }
      const files = fs.readdirSync(UPLOADS_DIR)
        .filter(f => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f))
        .map(f => {
          const filePath = path.join(UPLOADS_DIR, f);
          const stat = fs.statSync(filePath);
          return {
            filename: f,
            url: `/uploads/${f}`,
            size: stat.size,
            createdAt: stat.birthtime.toISOString(),
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(files);
    } catch (e: any) {
      safeError(res, 500, e);
    }
  });

  app.delete("/api/media/:filename", requireAuth, (req, res) => {
    try {
      const filename = path.basename(String(req.params.filename));
      const filePath = path.join(UPLOADS_DIR, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Файл не найден" });
      }
      fs.unlinkSync(filePath);
      res.json({ ok: true });
    } catch (e: any) {
      safeError(res, 500, e);
    }
  });

  // ─── BLOCKS (Page Builder) ───────────────────────────────────────────────
  app.get("/api/blocks", async (_req, res) => {
    try {
      const rows = await db.select().from(blocks).orderBy(asc(blocks.order));
      if (rows.length === 0) {
        const defaultBlocks = [
          { type: "hero", order: 0, data: JSON.stringify({ title: "Крупносерийное производство изделий из дерева", subtitle: "Разделочные доски, подносы, кухонные принадлежности и декор из массива. Работаем с B2B-клиентами по всей России.", cta: "Оставить заявку" }), isActive: true },
          { type: "clients", order: 1, data: JSON.stringify({ title: "Нам доверяют" }), isActive: true },
          { type: "features", order: 2, data: JSON.stringify({ title: "Почему выбирают нас", items: [{ icon: "factory", title: "Собственное производство", description: "1500 м² в Московской области" }, { icon: "truck", title: "Быстрая доставка", description: "По всей России" }, { icon: "shield", title: "Гарантия качества", description: "Контроль на каждом этапе" }] }), isActive: true },
          { type: "products", order: 3, data: JSON.stringify({ title: "Каталог продукции", description: "Широкий ассортимент деревянных изделий для вашего бизнеса" }), isActive: true },
          { type: "portfolio", order: 4, data: JSON.stringify({ title: "Портфолио", description: "Примеры наших работ" }), isActive: true },
          { type: "process", order: 5, data: JSON.stringify({ title: "Как мы работаем", steps: [{ title: "Заявка", description: "Оставьте заявку или позвоните нам" }, { title: "Расчёт", description: "Рассчитаем стоимость и сроки" }, { title: "Производство", description: "Изготовим в срок с контролем качества" }, { title: "Доставка", description: "Доставим в любую точку России" }] }), isActive: true },
          { type: "contacts", order: 6, data: JSON.stringify({ title: "Свяжитесь с нами", phone: "+7 (495) 000-00-00", email: "info@woodiny.ru", address: "Московская область" }), isActive: true },
        ];
        const inserted = await db.insert(blocks).values(defaultBlocks).returning();
        return res.json(inserted);
      }
      res.json(rows);
    } catch (e: any) { safeError(res, 500, e); }
  });

  app.post("/api/blocks", requireAuth, async (req, res) => {
    try {
      const parsed = insertBlockSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
      const [row] = await db.insert(blocks).values(parsed.data).returning();
      res.status(201).json(row);
    } catch (e: any) { safeError(res, 500, e); }
  });

  app.patch("/api/blocks/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [row] = await db.update(blocks).set(req.body).where(eq(blocks.id, id)).returning();
      if (!row) return res.status(404).json({ message: "Блок не найден" });
      res.json(row);
    } catch (e: any) { safeError(res, 500, e); }
  });

  app.delete("/api/blocks/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(blocks).where(eq(blocks.id, id));
      res.json({ ok: true });
    } catch (e: any) { safeError(res, 500, e); }
  });

  // ─── PORTFOLIO ────────────────────────────────────────────────────────────
  app.get("/api/portfolio", async (_req, res) => {
    try {
      const rows = await db.select().from(portfolio).orderBy(asc(portfolio.sortOrder));
      res.json(rows);
    } catch (e: any) { safeError(res, 500, e); }
  });

  app.post("/api/portfolio", requireAuth, async (req, res) => {
    try {
      const parsed = insertPortfolioSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.errors[0].message });
      const [row] = await db.insert(portfolio).values(parsed.data).returning();
      res.status(201).json(row);
    } catch (e: any) { safeError(res, 500, e); }
  });

  app.patch("/api/portfolio/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const [row] = await db.update(portfolio).set(req.body).where(eq(portfolio.id, id)).returning();
      if (!row) return res.status(404).json({ message: "Работа не найдена" });
      res.json(row);
    } catch (e: any) { safeError(res, 500, e); }
  });

  app.delete("/api/portfolio/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(portfolio).where(eq(portfolio.id, id));
      res.json({ ok: true });
    } catch (e: any) { safeError(res, 500, e); }
  });

  app.post("/api/upload-portfolio-image/:id", requireAuth, (req, res) => {
    upload.single("image")(req, res, async (err) => {
      if (err) return res.status(400).json({ message: err.message });
      if (!req.file) return res.status(400).json({ message: "Файл не выбран" });
      const id = parseInt(req.params.id);
      const imageUrl = `/uploads/${req.file.filename}`;
      try {
        const [row] = await db.update(portfolio).set({ imageUrl }).where(eq(portfolio.id, id)).returning();
        res.json(row);
      } catch (e: any) { safeError(res, 500, e); }
    });
  });

  return httpServer;
}
