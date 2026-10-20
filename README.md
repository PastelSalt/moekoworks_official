# Moeko Works — a portfolio by Kyle Zoleta

Moeko Works is Kyle Zoleta's portfolio: creative websites and the systems behind them.
Plan: [`PRELIMENARYPLAN.md`](PRELIMENARYPLAN.md) · Progress: [`docs/PROGRESS.md`](docs/PROGRESS.md) · Conventions: [`CLAUDE.md`](CLAUDE.md)

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · MUI 9 · GSAP / Lenis · Drizzle ORM + Neon Postgres · Cloudinary · Vercel

## Local development
1. Node 24+: `npm install`
2. `cp .env.example .env.local` and fill it in (never commit it).
3. `npm run db:migrate` then `npm run admin:seed` (creates the owner; the password must be changed at first login).
4. `npm run dev` → http://localhost:3000 (admin: `/admin`, unlinked and not indexed).
