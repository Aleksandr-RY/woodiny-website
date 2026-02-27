# Развёртывание WOODINY на VPS (Reg.ru / Timeweb / любой Ubuntu)

## Требования

- **ОС**: Ubuntu 22.04 / 24.04
- **Node.js**: 20 LTS
- **PostgreSQL**: 14+
- **RAM**: от 1 ГБ
- **Диск**: от 5 ГБ
- **Открытые порты**: 22 (SSH), 80 (HTTP), 443 (HTTPS)

---

## Шаг 1. Подключение к серверу

```bash
ssh root@ВАШ_IP_АДРЕС
```

---

## Шаг 2. Создание пользователя для проекта

Не запускайте проект от root — создайте отдельного пользователя:

```bash
adduser woodiny
usermod -aG sudo woodiny
```

Система попросит задать пароль и данные — пароль обязательно, остальное можно пропустить (Enter).

Переключитесь на нового пользователя:

```bash
su - woodiny
```

**Все дальнейшие команды выполняйте от пользователя woodiny.**

---

## Шаг 3. Установка программ

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка
node -v   # должно быть v20.x.x
npm -v    # должно быть 10.x.x

# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установка Nginx
sudo apt install -y nginx

# Установка PM2 (менеджер процессов)
sudo npm install -g pm2

# Установка Git
sudo apt install -y git
```

---

## Шаг 4. Создание базы данных

```bash
sudo -u postgres psql
```

В консоли PostgreSQL введите (замените ПАРОЛЬ на свой):

```sql
CREATE USER woodiny WITH PASSWORD 'ВАШ_НАДЁЖНЫЙ_ПАРОЛЬ_БД';
CREATE DATABASE woodiny_db OWNER woodiny;
GRANT ALL PRIVILEGES ON DATABASE woodiny_db TO woodiny;
\q
```

Запомните пароль — он понадобится на шаге 6.

---

## Шаг 5. Загрузка проекта

### Вариант А — через GitHub:

```bash
sudo mkdir -p /var/www/woodiny
sudo chown woodiny:woodiny /var/www/woodiny
cd /var/www/woodiny
git clone https://github.com/Aleksandr-RY/woodiny-website.git .
```

### Вариант Б — через архив:

Загрузите `woodiny-project.tar.gz` на сервер через SCP:

```bash
# На ВАШЕМ компьютере (не на сервере):
scp woodiny-project.tar.gz woodiny@ВАШ_IP:/tmp/
```

Затем на сервере:

```bash
sudo mkdir -p /var/www/woodiny
sudo chown woodiny:woodiny /var/www/woodiny
cd /var/www/woodiny
tar -xzf /tmp/woodiny-project.tar.gz
```

---

## Шаг 6. Настройка переменных окружения

```bash
cd /var/www/woodiny
cp .env.example .env
nano .env
```

Заполните файл (замените значения на свои):

```
DATABASE_URL=postgresql://woodiny:ВАШ_НАДЁЖНЫЙ_ПАРОЛЬ_БД@localhost:5432/woodiny_db
SESSION_SECRET=вставьте_сюда_результат_команды_ниже
NODE_ENV=production
PORT=5000
```

Для генерации SESSION_SECRET выполните в другом терминале:

```bash
openssl rand -hex 32
```

Скопируйте результат и вставьте в `.env` вместо `вставьте_сюда_результат_команды_ниже`.

Сохраните: `Ctrl+O`, `Enter`, `Ctrl+X`.

---

## Шаг 7. Установка зависимостей и сборка

```bash
cd /var/www/woodiny
npm install
npm run db:push
npm run build
```

Если `npm run db:push` спрашивает подтверждение — введите `yes`.

---

## Шаг 8. Создание администратора

```bash
cd /var/www/woodiny
npx tsx scripts/create-admin.ts admin ВашБезопасныйПароль
```

Замените `admin` и `ВашБезопасныйПароль` на свои логин и пароль (пароль минимум 6 символов).

При первом входе в админку система попросит сменить пароль.

---

## Шаг 9. Проверка запуска

```bash
cd /var/www/woodiny
npm run start
```

Если видите `serving on port 5000` — всё работает. Остановите: `Ctrl+C`.

---

## Шаг 10. Запуск через PM2

PM2 держит приложение запущенным постоянно и перезапускает при падении:

```bash
cd /var/www/woodiny
pm2 start dist/index.cjs --name woodiny
pm2 save
pm2 startup
```

Последняя команда выведет строку вида `sudo env PATH=...` — скопируйте и выполните её.

Полезные команды:

```bash
pm2 status              # статус приложения
pm2 logs woodiny        # логи в реальном времени
pm2 restart woodiny     # перезапуск
pm2 stop woodiny        # остановка
```

---

## Шаг 11. Настройка Nginx

```bash
sudo nano /etc/nginx/sites-available/woodiny
```

Вставьте (замените `woodiny.ru` на ваш домен):

```nginx
server {
    listen 80;
    server_name woodiny.ru www.woodiny.ru;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Сохраните и активируйте:

```bash
sudo ln -s /etc/nginx/sites-available/woodiny /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

После этого сайт доступен по `http://ВАШ_IP`.

---

## Шаг 12. Привязка домена

В панели Reg.ru (или вашего регистратора) добавьте DNS-записи:

| Тип | Имя | Значение |
|-----|-----|----------|
| A | @ | ВАШ_IP_АДРЕС |
| A | www | ВАШ_IP_АДРЕС |

DNS обновится в течение 15 минут — 24 часов.

---

## Шаг 13. SSL-сертификат (HTTPS)

Выполните после того, как домен заработал:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d woodiny.ru -d www.woodiny.ru
```

Certbot спросит email и согласие — ответьте. Сертификат обновляется автоматически.

Проверка автопродления:

```bash
sudo certbot renew --dry-run
```

---

## После установки

- **Сайт**: https://woodiny.ru
- **Админка**: https://woodiny.ru/admin/login

---

## Обновление сайта

```bash
cd /var/www/woodiny
git pull
npm install
npm run build
npm run db:push
pm2 restart woodiny
```

---

## Резервное копирование

```bash
# Бэкап базы данных
cd /var/www/woodiny
pg_dump -U woodiny woodiny_db > backup_$(date +%Y%m%d).sql

# Восстановление из бэкапа
psql -U woodiny woodiny_db < backup_XXXXXXXX.sql
```

---

## Решение проблем

**Сервер не запускается:**
```bash
pm2 logs woodiny --lines 50
```

**Ошибка «DATABASE_URL is not set»:**
Проверьте файл `.env` — он должен быть в `/var/www/woodiny/.env`.

**Ошибка «SESSION_SECRET не задана»:**
Проверьте что в `.env` есть строка `SESSION_SECRET=...`.

**Nginx показывает 502 Bad Gateway:**
Проверьте что приложение запущено: `pm2 status`. Если нет — `pm2 start dist/index.cjs --name woodiny`.

**Не открывается по домену:**
Проверьте DNS: `dig woodiny.ru`. Должен показать ваш IP.

**Ошибка при npm install:**
```bash
sudo apt install -y build-essential python3
npm install
```
