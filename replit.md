# ВУДИНИ (Woodini) — B2B Website

## Overview
B2B website for ВУДИНИ — a wooden products manufacturer in Moscow Oblast. The site features a large static HTML landing page plus a React-based admin panel for content management.

## Architecture
- **Main Site**: Static HTML file at `client/landing.html` served via Express at `/`
- **Admin Panel**: React SPA at `/admin/*` routes, built with Vite + React + Tailwind CSS + shadcn/ui
- **Backend**: Express.js with PostgreSQL database via Drizzle ORM
- **Database**: PostgreSQL (Neon serverless driver)
- **Content System**: Section content stored as JSON in `siteSettings` table (category="content"), injected into landing page via `/api/content` endpoint and JavaScript

## Key Files
- `client/landing.html` — Main B2B landing page (~2500+ lines of HTML/CSS/JS) with data-content attributes for dynamic content
- `client/hero-video-*.mp4` — Hero section background videos (4 videos)
- `client/production-*.png`, `client/hero-*.png` — Production and hero images
- `shared/schema.ts` — Database schema (users, inquiries, products, partners, reviews, staff, news, siteSettings, pageVisits)
- `server/db.ts` — Database connection (Neon serverless)
- `server/storage.ts` — Data access layer (DatabaseStorage class)
- `server/routes.ts` — API routes with session-based auth + public content API
- `server/index.ts` — Express server setup with env var validation, serves static files from client/ dir (index:false), landing.html at `/`
- `client/src/App.tsx` — React router with all admin pages
- `client/src/pages/admin-*.tsx` — Admin panel pages
- `client/src/pages/admin-site-editor.tsx` — Section content editor (hero, clients, stats, capabilities, etc.)
- `scripts/create-admin.ts` — CLI script to create admin user with bcrypt-hashed password

## Admin Panel Features
1. **Dashboard** — Overview of all data counts
2. **Inquiries** — View/manage contact form submissions with status tracking
3. **Products** — CRUD for product catalog
4. **Partners** — Manage partner logos for "Нам доверяют" section
5. **Reviews** — Manage client reviews and case studies
6. **Staff** — Employee directory management
7. **News** — Publish news, promotions, special offers
8. **Settings** — Contact info (phone, email, address, social media)
9. **SEO** — Meta tags, Open Graph settings
10. **Stats** — Page visit statistics
11. **Site Editor** — Edit text content of all landing page sections (hero, clients, stats, capabilities, production, products, process, portfolio, contacts)

## Content Editing System
- Landing page elements have `data-content="section.field"` attributes
- Content stored in siteSettings with category="content", key=section name, value=JSON
- Public API: `GET /api/content` returns all content sections
- Landing page JS fetches content and replaces DOM elements on load
- Admin editor at `/admin/editor` provides forms for each section

## Security
- No default credentials — admin created via CLI: `npx tsx scripts/create-admin.ts <login> <password>`
- Passwords hashed with bcrypt (salt 12)
- First login forces password change (`mustChangePassword` flag)
- SESSION_SECRET and DATABASE_URL required at startup (server exits if missing)
- Production mode: `secure: true` cookies, `sameSite: lax`, no stack traces in error responses
- `.env` excluded from Git via `.gitignore`

## Admin Login
- URL: `/admin/login`
- Session-based authentication with express-session

## Dependencies
- Express, Drizzle ORM, pg (node-postgres)
- bcryptjs (password hashing), express-session, memorystore
- React, wouter, @tanstack/react-query, shadcn/ui, Tailwind CSS

## Deployment
- Build: `npm run build`
- Run: `npm run start`
- See `DEPLOY_REGRU.md` for full VPS deployment guide
- `.env.example` provided as template

## User Preferences
- All communication in Russian
- B2B professional corporate style
- Font: Inter (single sans-serif font throughout)
