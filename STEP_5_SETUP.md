# Step 5 deployment and verification

Apply `supabase/migrations/202609130004_step_5_social.sql` once in Supabase SQL Editor, after Steps 1–4. It is additive and repeat-safe, but should not be used to reset data.

Then run `supabase/verify_step_5.sql`. The expected result has three RLS-enabled tables; participant-only friendship, owner-only featured-achievement and owner-only verified-ledger reads; authenticated SELECT grants only; public social RPCs callable only by authenticated users; private helpers callable by neither anonymous nor authenticated users; and zero duplicate relationship/feature/ledger rows.

Social access is deliberately private by default. To enter discovery or a leaderboard, use Profile & Privacy to select a public profile, enable the relevant visibility toggle, and opt in. Verification sessions, GPS, location checkpoints, camera information and raw evidence are not exposed through any Step 5 RPC.

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. The local Step 5 app runs on port 3002 during development if port 3001 is already occupied.
