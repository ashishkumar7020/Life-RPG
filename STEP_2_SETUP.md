# STEP 2 setup

The working Step 2 project is this folder. The original D: project could not be updated because this session has no write access there.

## Supabase

The supplied project URL and publishable key are saved in the ignored `.env.local`. No privileged key is used. On 2026-09-13 the project accepted the public credentials but returned PGRST205 for all four required tables.

1. Open your Supabase project's SQL Editor.
2. Run `supabase/migrations/202609130001_step_2_identity.sql` once. It creates the four tables, owner-only RLS, restricted privileges and atomic character setup function.
3. In Authentication URL Configuration set the Site URL to the app origin and allow its `/auth/callback` URL. The current preview uses `http://127.0.0.1:3001`; normal development uses `http://localhost:3000`. Keep `SITE_URL` in `.env.local` consistent.
4. Use the app's signup page and confirm the email. Choose Warrior, Scholar, Creator or Balanced. New characters start at level 1 with zero XP, credits, streak and attributes; game progression belongs to a later step.
5. Verify that refresh and logout/login preserve the same character. Repeat with a second account to verify isolation against the deployed project.

Default confirmation emails support the PKCE callback. For a cross-device token confirmation template, use a link to `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.

The publishable key cannot execute migrations. Apply the SQL through your authenticated Supabase SQL Editor; do not put a service-role key in this app.

## Run and validate

`npm install`, then `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.

Run `npm run dev` for port 3000, or `npm run dev -- --hostname 127.0.0.1 --port 3001` while the original preview occupies port 3000.

The database tests run actual PostgreSQL through PGlite with a test-only auth role fixture. They verify RLS, privileges, atomic setup and idempotency; they do not replace testing live Supabase email/session behavior.

## Scope

The existing visual design and supplied images are preserved. Auth uses server-validated cookie sessions. Dashboard identity and attributes come from Supabase. Browser roles cannot write progression. Character selection is permanent through this onboarding flow; repeated setup for the same class preserves all progression. Privacy defaults are private.

Quests, evidence and cosmetic interactions remain previews. No quest engine, verification, economy, friends or leaderboard was implemented. No localStorage persistence or fake authentication is used.

The requested AGENTS.md and docs/ARCHITECTURE.md, DATABASE.md, API_SPEC.md, SECURITY.md, ROUTES.md and GAME_SYSTEM.md were not present in the available project. Existing architecture was preserved; no missing game rules were invented.
