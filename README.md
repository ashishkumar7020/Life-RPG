# Life RPG — Step 5

The approved dark fantasy/System RPG/Hunter HUD now connects Supabase authentication and the core RPG engine to Proof of Action, Focus sessions, achievements and cosmetic inventory. Existing artwork and visual direction are preserved.

Read STEP_4_SETUP.md and docs/STEP_4_RULES.md for deployment, validation and honest browser limitations. The user confirmed the Step 4 migration was applied. The user-supplied deployed catalog audit passed on 2026-09-13. Step 4 is complete within the documented browser-compatible scope; physical gym/device acceptance remains unperformed.

Run `npm install`, `npm run dev -- --port 3001`. Validate with `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. Production output uses `.next-build` separately from the development cache.

Configure `.env.local` from `.env.example`. The local configuration uses the supplied project URL and publishable key and is ignored by Git. Never expose service-role credentials.

Step 2 provides authentication, protected routes, character creation and persistent owner data. Step 3 provides quest CRUD, daily occurrences, XP and credit ledgers, leveling, attributes and UTC streaks. Their migrations and historical reports are preserved.

Step 4 adds server-evaluated verification sessions, gym geofence/dwell/checkpoints, foreground Focus timers, six automatic achievements, 39 cosmetic catalog items, purchases, inventory and equipped appearance. Strong verification and unsupported independent evidence remain Pending. Browser signals cannot establish cheating-proof activity or biometric identity.

Step 5 adds opt-in social discovery, server-authoritative friend requests, public/friends/private RPG profiles, featured achievements, cosmetic profile identity and seven privacy-respecting leaderboards. Apply `supabase/migrations/202609130004_step_5_social.sql`, then run `supabase/verify_step_5.sql`; see `STEP_5_SETUP.md`. Social RPCs deliberately return only an allowlisted public profile projection. Proof evidence, GPS, camera state and security metadata remain private.

No Step 6 deployment or submission functionality is implemented. STEP_1_5_REPORT.md remains the historical visual report; public/assets/ASSET_MANIFEST.md contains the semantic artwork mapping.

