# Codex Handoff — First Build

Read `README.md` first, then the Life RPG implementation documentation supplied separately.

## Do not change
- dark fantasy / system RPG HUD direction
- blue/cyan primary progression accent
- gold reward/credit accent
- quest tracker as dashboard center
- server-authoritative progression
- no localStorage as primary persistence
- no fake verification claims
- no stock/recognizable copyrighted art

## This build
Foundation/HUD only. The dashboard is intentionally a real UI shell with the user's generated assets.
The numeric data shown here is presentation-only until Supabase is connected.

## Next implementation stage
Implement Supabase Auth + persistent profiles/characters, then migrate dashboard data from local constants
to server-backed queries. Do not skip straight to social or advanced verification.
