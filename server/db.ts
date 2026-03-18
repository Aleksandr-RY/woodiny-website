import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS blocks (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        "order" INTEGER DEFAULT 0,
        data TEXT NOT NULL DEFAULT '{}',
        is_active BOOLEAN NOT NULL DEFAULT true
      );

      CREATE TABLE IF NOT EXISTS portfolio (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true
      );
    `);

    const { rows } = await client.query("SELECT COUNT(*) FROM blocks");
    if (parseInt(rows[0].count) === 0) {
      await client.query(`
        INSERT INTO blocks (type, "order", data, is_active) VALUES
        ('hero', 0, '{"title":"Крупносерийное производство изделий из дерева","subtitle":"Разделочные доски, подносы, кухонные принадлежности и декор из массива. Работаем с B2B-клиентами по всей России.","cta":"Оставить заявку"}', true),
        ('clients', 1, '{"title":"Нам доверяют"}', true),
        ('features', 2, '{"title":"Почему выбирают нас","items":[{"icon":"factory","title":"Собственное производство","description":"1500 м² в Московской области"},{"icon":"truck","title":"Быстрая доставка","description":"По всей России"},{"icon":"shield","title":"Гарантия качества","description":"Контроль на каждом этапе"}]}', true),
        ('products', 3, '{"title":"Каталог продукции","description":"Широкий ассортимент деревянных изделий для вашего бизнеса"}', true),
        ('portfolio', 4, '{"title":"Портфолио","description":"Примеры наших работ"}', true),
        ('process', 5, '{"title":"Как мы работаем","steps":[{"title":"Заявка","description":"Оставьте заявку или позвоните нам"},{"title":"Расчёт","description":"Рассчитаем стоимость и сроки"},{"title":"Производство","description":"Изготовим в срок с контролем качества"},{"title":"Доставка","description":"Доставим в любую точку России"}]}', true),
        ('contacts', 6, '{"title":"Свяжитесь с нами","phone":"+7 (495) 000-00-00","email":"info@woodiny.ru","address":"Московская область"}', true)
      `);
    }

    console.log("[db] migrations complete");
  } catch (e) {
    console.error("[db] migration error:", e);
  } finally {
    client.release();
  }
}
