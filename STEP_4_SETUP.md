# Step 4 deployment and verification

The user confirmed successful application of `supabase/migrations/202609130003_step_4_engagement.sql`. Do not rerun this migration against the same database. Preserve the Step 2 and Step 3 migrations.

For a fresh database, apply all three migrations in filename order. Configure `.env.local` using `.env.example`; use only the Supabase URL and publishable key. Never place service-role credentials in browser configuration.

Run `npm install`, `npm run dev -- --port 3001`. Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` for validation.

Run `supabase/verify_step_4.sql` in Supabase SQL Editor for the final deployed catalog audit. Expected: nine RLS-enabled tables; owner SELECT policies on private tables; authenticated SELECT-only grants; authenticated execution of public entry points; no anonymous execution or client execution of private functions; 39 cosmetic items; six achievement definitions; zero duplicate equipped slots and invalid purchase ledgers. The user supplied the returned JSON on 2026-09-13; every listed check passed.

Gym acceptance on a real device requires explicit location permission, a privately saved gym, accurate foreground GPS samples, the required activity time and continuous dwell, the randomized checkpoint and final confirmation. Camera preview is optional and local only. Do not treat it as biometric identification. Do not fabricate device evidence for a live account.

Focus acceptance requires keeping the page visible, enabling the foreground timer, responding during the random checkpoint window, completing the defined activity and requesting final verification. Reload preserves server time; re-enable sampling after reload. Pause stops time; exit ends the attempt. Other applications are not controlled.

Strong Verified and task-specific methods without independent evidence remain honestly Pending. See docs/STEP_4_RULES.md for evidence limits, achievement thresholds, cosmetic economy and privacy retention.

The working implementation is the project in the outputs folder. The original D: source was not writable in this session. No Step 5 features were added.

