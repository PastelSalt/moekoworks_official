# PROGRESS.md — status & resume protocol

> Plan: [`../PRELIMENARYPLAN.md`](../PRELIMENARYPLAN.md) v0.3 (approved 2026-10-04). This file tracks execution.

## Resume protocol (do this first, every new session)
1. Read this file, then `CLAUDE.md`. Don't re-ask decided questions (plan §0, §24, §26.1).
2. Check real state: `git status`, `git log --oneline -10`, and that files listed as done exist.
3. Continue from "Current focus". Update this file after every completed item; commit small and often.

## Status
| Phase | Status | Notes |
|---|---|---|
| P0 Start-up | ✅ done 2026-10-04 | Node 24.21, `gh` login, private repo `PastelSalt/moesoft_official`, Neon `moesoft-official` (`shy-rice-98401386`, Singapore, PG 17), Cloudinary folders `moesoft-official/{projects,certifications,site}` + presets `moesoft_images_signed` / `moesoft_videos_signed` |
| P1 Foundations | ✅ done | Next 16.3.8, React 19.2.8, MUI 9.4 (`@layer mui`), tokens/base CSS, Fredoka 400/700 + Lilita One, security headers (CSP report-only), brand SVGs from the logo PDF |
| P3 Data & auth | ✅ core done | Schema + migration `0000_init` applied; owner seeded (forced change); login / forced change / Account change password / sign out / sign out others / lockout — 9/9 e2e checks passed with a throwaway account (deleted) |
| P2 Shell & design system | ⏳ next | On branch `dev` |
| P4 Admin inputs | ⬜ | Project History + Certifications CRUD |
| P5 Public pages | ⬜ | |
| P6 Statistics | ⬜ | |
| P7 Messages | ⬜ | |
| P8 Kotoha seed & media | ⬜ | Local Kotoha copy on a temporary Neon branch for admin shots (S4 approved) |
| P9 Quality | ⬜ | |
| P10 Launch | ⬜ | Owner removes `moesoft-web` after launch |

## Decisions taken during execution
- **Classic caching model** (Cache Components off): public pages pre-render; admin saves call `revalidatePath`. Simpler with MUI/Emotion and cookie-based admin (plan §14.3 fallback).
- Kept the scaffold's React 19.2.8 / TypeScript 5 / ESLint 9 (more conservative than plan's "latest").
- Cover/preview/OG are `media_assets.role` values instead of columns on `projects` (no circular FKs).
- Single DB role (`moesoft_owner`) for now instead of separate app/migrator roles.
- Logo tagline is rasterised in the Canva PDF; brand SVGs embed it as a small WebP (vector flowers + wordmark).

## Owner to-dos
- Add **Cloudinary API key + secret** to `.env.local` and Vercel (needed for admin uploads; not for viewing).
- First login on the live site → set your own password (the seed password is temporary).
