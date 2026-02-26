import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import createMemoryStore from "memorystore";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import {
  insertInquirySchema,
  insertProductSchema,
  insertPartnerSchema,
  insertReviewSchema,
  insertStaffSchema,
  insertNewsSchema,
} from "@shared/schema";

const MemoryStore = createMemoryStore(session);

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!(req.session as any).userId) {
    return res.status(401).json({ message: "Не авторизован" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const servePath = await import("path");
  const clientDir = servePath.resolve(process.cwd(), "client");

  app.get("/", (_req, res) => {
    res.sendFile(servePath.resolve(clientDir, "landing.html"));
  });
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "woodini-admin-secret-key-2025",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: 86400000 }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "lax",
      },
    })
  );

  async function ensureAdminExists() {
    const admin = await storage.getUserByUsername("admin");
    if (!admin) {
      const hash = await bcrypt.hash("admin123", 10);
      await storage.createUser({ username: "admin", password: hash });
    }
  }
  await ensureAdminExists();

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Неверный логин или пароль" });
      }
      (req.session as any).userId = user.id;
      res.json({ id: user.id, username: user.username });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
    res.json({ id: user.id, username: user.username });
  });

  app.post("/api/auth/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = (req.session as any).userId;
      const user = await storage.getUser(userId);
      if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(400).json({ message: "Неверный текущий пароль" });
      }
      const hash = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hash);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
      res.status(500).json({ message: e.message });
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
      const item = await storage.upsertSetting(req.params.key, req.body.value, req.body.category);
      res.json(item);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/stats/visits", requireAuth, async (_req, res) => {
    try {
      res.json(await storage.getVisitStats());
    } catch (e: any) {
      res.status(500).json({ message: e.message });
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
        res.status(500).json({ message: e.message });
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
        res.status(500).json({ message: e.message });
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

  return httpServer;
}
