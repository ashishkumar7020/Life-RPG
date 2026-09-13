# Step 3 deployment and verification

Apply supabase/migrations/202609130002_step_3_core_engine.sql once after the Step 2 migration. Do not rerun Step 2 or delete existing tables. The user confirmed successful deployment during implementation.

Refresh the signed-in app at http://localhost:3001/. Six daily definitions are seeded once, retaining the existing character and balances.

Create an easy, one-time five-minute quest with one target unit and a clear condition. Edit before starting, start, perform the action, save progress, wait for the real minimum duration and confirm completion. Expect 10 XP, 2 credits, primary and secondary attribute gains and a first-day streak of 1. Retry must not award twice. Refresh and sign out/in to verify persistence. Archiving preserves history.

Run npm test, npm run lint, npm run typecheck and npm run build. Development uses .next; production uses .next-build. Tests use isolated PostgreSQL with test-only auth fixtures; the app always uses real Supabase auth.

Balance defaults and security details are documented in docs/STEP_3_RULES.md because the referenced source documents were not supplied. This output folder contains the complete implementation; the original D: project remains outside this session's writable roots.
