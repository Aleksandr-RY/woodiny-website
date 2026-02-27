import bcrypt from "bcryptjs";
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error("Использование: npx tsx scripts/create-admin.ts <логин> <пароль>");
    console.error("Пример: npx tsx scripts/create-admin.ts admin MySecurePass123");
    process.exit(1);
  }

  const [username, password] = args;

  if (password.length < 6) {
    console.error("Ошибка: пароль должен быть не менее 6 символов.");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("Ошибка: переменная окружения DATABASE_URL не задана.");
    process.exit(1);
  }

  const existing = await db.select().from(users).where(eq(users.username, username));
  if (existing.length > 0) {
    console.error(`Ошибка: пользователь «${username}» уже существует.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(users).values({
    username,
    password: hash,
    mustChangePassword: true,
  }).returning();

  console.log(`Администратор «${user.username}» создан (ID: ${user.id}).`);
  console.log("При первом входе будет запрошена смена пароля.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Ошибка:", err.message);
  process.exit(1);
});
