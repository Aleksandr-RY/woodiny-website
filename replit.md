# ВУДИНИ (Woodini) — B2B Website

## Overview
B2B website for ВУДИНИ — a wooden products manufacturer in Moscow Oblast. The site features a React-based landing page (matching original HTML design) plus an admin panel for content management. Both are served by Express/Vite.

## Architecture
- **Main Site**: React SPA (`client/src/pages/landing.tsx`) at `/`, served by React Router via Vite. Uses **custom CSS** (`client/src/landing.css`) matching original `landing.html` design — NOT Tailwind
- **CMS**: Content blocks stored in `blocks` table, fetched via `/api/blocks`. Landing page reads block `data` JSON field
- **Admin Panel**: React SPA at `/admin/*` routes, built with Vite + React + Tailwind CSS + shadcn/ui
- **Backend**: Express.js with PostgreSQL database via Drizzle ORM
- **Database**: PostgreSQL (Neon serverless driver)

## Key Files
- `client/landing.html` — Original static HTML (reference only, not served)
- `client/src/pages/landing.tsx` — React landing page, uses CSS classes from `landing.css`
- `client/src/landing.css` — Full custom design system (CSS variables: `--primary: #2C1D0E`, `--accent: #C4975A`, Inter font, all section styles)
- `client/hero-video-*.mp4` — Hero section background videos (4 videos)
- `client/production-*.png`, `client/hero-*.png` — Production and hero images
- `shared/schema.ts` — Database schema (users, inquiries, products, partners, reviews, staff, news, siteSettings, pageVisits, blocks, portfolio)
- `server/db.ts` — Database connection (Neon serverless)
- `server/storage.ts` — Data access layer (DatabaseStorage class)
- `server/routes.ts` — API routes with session-based auth + blocks/portfolio/CMS APIs
- `server/index.ts` — Express server setup, serves static files from `dist/public/` in production
- `client/src/App.tsx` — React router: `/` → LandingPage, `/admin/*` → admin pages
- `client/src/pages/admin-*.tsx` — Admin panel pages
- `client/src/pages/admin-blocks.tsx` — Visual page builder for CMS blocks
- `client/src/pages/admin-portfolio.tsx` — Portfolio CRUD
- `scripts/create-admin.ts` — CLI script to create admin user with bcrypt-hashed password

## Admin Panel Features
1. **Dashboard** — Overview of all data counts
2. **Inquiries** — View/manage contact form submissions with status tracking
3. **Products** — CRUD for product catalog with drag & drop image upload
4. **Partners** — Manage partner logos for "Нам доверяют" section
5. **Reviews** — Manage client reviews and case studies
6. **Staff** — Employee directory management
7. **News** — Publish news with TipTap WYSIWYG editor (rich text, images, formatting)
8. **Media Library** — Upload/manage images (drag & drop, preview, copy URL, delete)
9. **Settings** — Contact info (phone, email, address, social media)
10. **SEO** — Meta tags, Open Graph settings
11. **Stats** — Page visit statistics
12. **Site Editor** — Edit text content of all landing page sections (hero, clients, stats, capabilities, production, products, process, portfolio, contacts)

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

## Media Upload System
- **Endpoint**: `POST /api/upload` (multer, 5MB limit, jpg/jpeg/png/webp)
- **Response**: `{ url: "/uploads/filename.jpg" }`
- **Media List**: `GET /api/media` — list all uploaded files
- **Delete**: `DELETE /api/media/:filename`
- **Storage**: Files saved to `client/uploads/` (served as static assets at `/uploads/`)
- **Components**: `ImageUpload` (drag & drop + URL fallback), `RichTextEditor` (TipTap WYSIWYG)

## Dependencies
- Express, Drizzle ORM, pg (node-postgres)
- bcryptjs (password hashing), express-session, memorystore, multer (file upload)
- React, wouter, @tanstack/react-query, shadcn/ui, Tailwind CSS
- TipTap (@tiptap/react, starter-kit, image, link, underline, text-align, placeholder)

## Deployment
- Build: `npm run build`
- Run: `npm run start`
- See `DEPLOY_REGRU.md` for full VPS deployment guide
- `.env.example` provided as template

## User Preferences
- All communication in Russian
- B2B professional corporate style
- Font: Inter (single sans-serif font throughout)
