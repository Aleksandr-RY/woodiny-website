import { eq, desc, sql, count } from "drizzle-orm";
import { db } from "./db";
import {
  users, type User, type InsertUser,
  inquiries, type Inquiry, type InsertInquiry,
  products, type Product, type InsertProduct,
  partners, type Partner, type InsertPartner,
  reviews, type Review, type InsertReview,
  staff, type Staff, type InsertStaff,
  news, type News, type InsertNews,
  siteSettings, type SiteSetting, type InsertSiteSetting,
  pageVisits, type PageVisit, type InsertPageVisit,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;

  getInquiries(): Promise<Inquiry[]>;
  getInquiry(id: number): Promise<Inquiry | undefined>;
  createInquiry(data: InsertInquiry): Promise<Inquiry>;
  updateInquiryStatus(id: number, status: string): Promise<Inquiry | undefined>;
  deleteInquiry(id: number): Promise<void>;

  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(data: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<void>;

  getPartners(): Promise<Partner[]>;
  createPartner(data: InsertPartner): Promise<Partner>;
  updatePartner(id: number, data: Partial<InsertPartner>): Promise<Partner | undefined>;
  deletePartner(id: number): Promise<void>;

  getReviews(): Promise<Review[]>;
  createReview(data: InsertReview): Promise<Review>;
  updateReview(id: number, data: Partial<InsertReview>): Promise<Review | undefined>;
  deleteReview(id: number): Promise<void>;

  getStaff(): Promise<Staff[]>;
  createStaff(data: InsertStaff): Promise<Staff>;
  updateStaff(id: number, data: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaff(id: number): Promise<void>;

  getNews(): Promise<News[]>;
  getNewsItem(id: number): Promise<News | undefined>;
  createNews(data: InsertNews): Promise<News>;
  updateNews(id: number, data: Partial<InsertNews>): Promise<News | undefined>;
  deleteNews(id: number): Promise<void>;

  getSettings(): Promise<SiteSetting[]>;
  getSetting(key: string): Promise<SiteSetting | undefined>;
  upsertSetting(key: string, value: string, category?: string): Promise<SiteSetting>;

  trackVisit(data: InsertPageVisit): Promise<void>;
  getVisitStats(): Promise<{ total: number; today: number; pages: { page: string; count: number }[] }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }

  async getInquiries(): Promise<Inquiry[]> {
    return db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
  }

  async getInquiry(id: number): Promise<Inquiry | undefined> {
    const [item] = await db.select().from(inquiries).where(eq(inquiries.id, id));
    return item;
  }

  async createInquiry(data: InsertInquiry): Promise<Inquiry> {
    const [item] = await db.insert(inquiries).values(data).returning();
    return item;
  }

  async updateInquiryStatus(id: number, status: string): Promise<Inquiry | undefined> {
    const [item] = await db.update(inquiries).set({ status }).where(eq(inquiries.id, id)).returning();
    return item;
  }

  async deleteInquiry(id: number): Promise<void> {
    await db.delete(inquiries).where(eq(inquiries.id, id));
  }

  async getProducts(): Promise<Product[]> {
    return db.select().from(products).orderBy(products.sortOrder);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [item] = await db.select().from(products).where(eq(products.id, id));
    return item;
  }

  async createProduct(data: InsertProduct): Promise<Product> {
    const [item] = await db.insert(products).values(data).returning();
    return item;
  }

  async updateProduct(id: number, data: Partial<InsertProduct>): Promise<Product | undefined> {
    const [item] = await db.update(products).set(data).where(eq(products.id, id)).returning();
    return item;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getPartners(): Promise<Partner[]> {
    return db.select().from(partners).orderBy(partners.sortOrder);
  }

  async createPartner(data: InsertPartner): Promise<Partner> {
    const [item] = await db.insert(partners).values(data).returning();
    return item;
  }

  async updatePartner(id: number, data: Partial<InsertPartner>): Promise<Partner | undefined> {
    const [item] = await db.update(partners).set(data).where(eq(partners.id, id)).returning();
    return item;
  }

  async deletePartner(id: number): Promise<void> {
    await db.delete(partners).where(eq(partners.id, id));
  }

  async getReviews(): Promise<Review[]> {
    return db.select().from(reviews).orderBy(desc(reviews.createdAt));
  }

  async createReview(data: InsertReview): Promise<Review> {
    const [item] = await db.insert(reviews).values(data).returning();
    return item;
  }

  async updateReview(id: number, data: Partial<InsertReview>): Promise<Review | undefined> {
    const [item] = await db.update(reviews).set(data).where(eq(reviews.id, id)).returning();
    return item;
  }

  async deleteReview(id: number): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }

  async getStaff(): Promise<Staff[]> {
    return db.select().from(staff);
  }

  async createStaff(data: InsertStaff): Promise<Staff> {
    const [item] = await db.insert(staff).values(data).returning();
    return item;
  }

  async updateStaff(id: number, data: Partial<InsertStaff>): Promise<Staff | undefined> {
    const [item] = await db.update(staff).set(data).where(eq(staff.id, id)).returning();
    return item;
  }

  async deleteStaff(id: number): Promise<void> {
    await db.delete(staff).where(eq(staff.id, id));
  }

  async getNews(): Promise<News[]> {
    return db.select().from(news).orderBy(desc(news.createdAt));
  }

  async getNewsItem(id: number): Promise<News | undefined> {
    const [item] = await db.select().from(news).where(eq(news.id, id));
    return item;
  }

  async createNews(data: InsertNews): Promise<News> {
    const [item] = await db.insert(news).values(data).returning();
    return item;
  }

  async updateNews(id: number, data: Partial<InsertNews>): Promise<News | undefined> {
    const [item] = await db.update(news).set(data).where(eq(news.id, id)).returning();
    return item;
  }

  async deleteNews(id: number): Promise<void> {
    await db.delete(news).where(eq(news.id, id));
  }

  async getSettings(): Promise<SiteSetting[]> {
    return db.select().from(siteSettings);
  }

  async getSetting(key: string): Promise<SiteSetting | undefined> {
    const [item] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return item;
  }

  async upsertSetting(key: string, value: string, category = "general"): Promise<SiteSetting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [item] = await db.update(siteSettings).set({ value }).where(eq(siteSettings.key, key)).returning();
      return item;
    }
    const [item] = await db.insert(siteSettings).values({ key, value, category }).returning();
    return item;
  }

  async trackVisit(data: InsertPageVisit): Promise<void> {
    await db.insert(pageVisits).values(data);
  }

  async getVisitStats(): Promise<{ total: number; today: number; pages: { page: string; count: number }[] }> {
    const [totalResult] = await db.select({ count: count() }).from(pageVisits);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayResult] = await db.select({ count: count() }).from(pageVisits).where(
      sql`${pageVisits.createdAt} >= ${today}`
    );
    const pagesResult = await db.select({
      page: pageVisits.page,
      count: count(),
    }).from(pageVisits).groupBy(pageVisits.page).orderBy(desc(count())).limit(20);

    return {
      total: totalResult.count,
      today: todayResult.count,
      pages: pagesResult.map(r => ({ page: r.page, count: r.count })),
    };
  }
}

export const storage = new DatabaseStorage();
