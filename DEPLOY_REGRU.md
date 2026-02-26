# Развёртывание WOODINY на Reg.ru (VPS)

## Требования к серверу

- **ОС**: Ubuntu 22.04 / 24.04
- **Node.js**: 18+ (рекомендуется 20 LTS)
- **PostgreSQL**: 14+
- **RAM**: от 1 ГБ
- **Диск**: от 5 ГБ
- **Открытые порты**: 80, 443

---

## 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Проверка версий
node -v   # должно быть v20.x.x
npm -v    # должно быть 10.x.x

# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установка Nginx (для проксирования)
sudo apt install -y nginx

# Установка PM2 (менеджер процессов)
sudo npm install -g pm2
```

## 2. Настройка PostgreSQL

```bash
# Создание базы данных
sudo -u postgres psql

CREATE USER woodiny WITH PASSWORD 'ВАШ_НАДЁЖНЫЙ_ПАРОЛЬ';
CREATE DATABASE woodiny_db OWNER woodiny;
GRANT ALL PRIVILEGES ON DATABASE woodiny_db TO woodiny;
\q
```

## 3. Загрузка проекта

```bash
# Создание директории
sudo mkdir -p /var/www/woodiny
sudo chown $USER:$USER /var/www/woodiny
cd /var/www/woodiny

# Вариант 1: Через Git (если загрузили на GitHub)
git clone https://github.com/ВАШ_РЕПОЗИТОРИЙ/woodiny.git .

# Вариант 2: Через архив (скачать из Replit)
# Загрузите архив и распакуйте:
# unzip woodiny.zip -d /var/www/woodiny

# Установка зависимостей
npm install

# Сборка проекта
npm run build
```

## 4. Настройка переменных окружения

```bash
# Создайте файл .env
nano /var/www/woodiny/.env
```

Содержимое `.env`:
```
DATABASE_URL=postgresql://woodiny:ВАШ_НАДЁЖНЫЙ_ПАРОЛЬ@localhost:5432/woodiny_db
SESSION_SECRET=ВАША_СЛУЧАЙНАЯ_СТРОКА_ДЛЯ_СЕССИЙ_32_СИМВОЛА
NODE_ENV=production
PORT=5000
```

Генерация SESSION_SECRET:
```bash
openssl rand -hex 32
```

## 5. Инициализация базы данных

```bash
cd /var/www/woodiny

# Применение схемы БД
npx drizzle-kit push
```

## 6. Копирование статических файлов

Статические файлы лендинга должны быть в папке `client/`:

```bash
# Проверьте что эти файлы на месте:
ls client/landing.html
ls client/logo.png
ls client/hero-video-*.mp4
ls client/hero-production.png
ls client/production-1.png
ls client/price.pdf

# Создайте папку для загрузок
mkdir -p client/uploads
```

## 7. Запуск через PM2

```bash
cd /var/www/woodiny

# Запуск
pm2 start dist/index.cjs --name woodiny --env production

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Полезные команды:
pm2 status          # статус
pm2 logs woodiny    # логи
pm2 restart woodiny # перезапуск
```

## 8. Настройка Nginx

```bash
sudo nano /etc/nginx/sites-available/woodiny
```

Содержимое:
```nginx
server {
    listen 80;
    server_name woodiny.ru www.woodiny.ru;

    client_max_body_size 10M;

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

```bash
# Активация конфига
sudo ln -s /etc/nginx/sites-available/woodiny /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 9. SSL-сертификат (HTTPS)

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d woodiny.ru -d www.woodiny.ru

# Автопродление
sudo certbot renew --dry-run
```

## 10. Направление домена

В панели Reg.ru укажите A-запись:
- **woodiny.ru** → IP вашего VPS
- **www.woodiny.ru** → IP вашего VPS

---

## Структура файлов на сервере

```
/var/www/woodiny/
├── dist/                  # Собранный проект
│   ├── index.cjs          # Серверный бандл
│   └── public/            # Собранный React (админка)
├── client/                # Статические файлы лендинга
│   ├── landing.html
│   ├── logo.png
│   ├── price.pdf
│   ├── hero-video-*.mp4
│   ├── hero-production.png
│   ├── production-*.png
│   └── uploads/           # Загруженные логотипы партнёров
├── .env                   # Переменные окружения
├── package.json
└── node_modules/
```

---

## Администрирование

- **Админка**: https://woodiny.ru/admin/login
- **Логин по умолчанию**: admin / admin123
- **Важно**: Сразу после развёртывания смените пароль в админке!

---

## Обновление сайта

```bash
cd /var/www/woodiny
git pull                    # или загрузите новые файлы
npm install                 # если изменились зависимости
npm run build               # пересборка
npx drizzle-kit push        # если изменилась схема БД
pm2 restart woodiny         # перезапуск
```

---

## Резервное копирование

```bash
# Бэкап базы данных
pg_dump -U woodiny woodiny_db > backup_$(date +%Y%m%d).sql

# Восстановление
psql -U woodiny woodiny_db < backup_XXXXXXXX.sql
```
