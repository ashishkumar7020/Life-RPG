# Step 3 rules and implementation

The requested PRD, GAME_SYSTEM, DATABASE, API_SPEC, SECURITY and COMPONENTS documents were absent from the available project and original project. This implementation follows the Step 3 request. The balance values below are explicit implementation defaults, not claims about unavailable agreed documentation.

## XP and credits

BASE_XP is 100. Advancing from level N to N+1 costs ceil(100 * N^1.5). Lifetime XP never decreases. Current XP is lifetime XP minus prior level costs. Level 2 starts at 100 lifetime XP, level 3 at 383, level 4 at 903. The database returns level, current XP, next-level cost and progress percentage.

Quest XP is min(240, duration_minutes * difficulty_multiplier). Multipliers are easy=2, medium=3, hard=4. Credits are floor(XP/5). Quest durations are 5–240 minutes, with 1–1000 target units. Users cannot submit XP, credits, attribute awards, start times or reward dates.

Completion requires ownership, an active quest occurrence, all units recorded, the minimum server-measured duration, an eligible type, and available daily allowance. Confirming completion asserts that the defined condition is satisfied; it does not claim external verification or activity monitoring.

Anti-abuse bounds: one active occurrence per character, 50 active definitions, and a UTC daily maximum of 20 rewarded completions, 1500 XP and 300 credits. A completion exceeding a limit is rejected atomically. Archive an abandoned active quest to start another. There are no streak bonuses to farm. game_rules is server-owned, read-only client configuration.

## Quest lifecycle

Six daily definitions are seeded idempotently. Recurring quests use a UTC date occurrence; one-time quests use a fixed occurrence. Unique constraints enforce one progress row per occurrence and one completion per progress row. Previous-day daily starts expire without erasing history.

Quest CRUD supports daily, custom, verified and focus types and daily/once recurrence. Daily types must recur daily. Definitions may be edited before any start; afterward they are immutable to prevent reward/condition changes. Archive and create a new definition to change a started quest. Delete archives the definition and preserves completion and ledger history. Archived seeded definitions are not recreated.

Verified quests can be defined, started and progressed; completion remains locked until Step 4 supplies actual verification. Focus-type quests use ordinary progress tracking and minimum duration, not Focus Mode or verification signals.

## Attributes

Primary category gain: easy=1, medium=2, hard=3. Secondary gain is 1:

| Primary | Secondary |
|---|---|
| Strength | Vitality |
| Vitality | Strength |
| Intelligence | Focus |
| Focus | Intelligence |
| Discipline | Focus |
| Charisma | Discipline |

Focus-type quests award at least one Focus point before capping. All attributes retain the Step 2 cap of 100. History stores actual post-cap gains. Browser roles cannot edit attributes.

## Streak

A rewarded completion is meaningful activity. Consecutive UTC days increment once; same-day completions preserve the count. A gap resets the next completion to 1. Dashboard synchronization clears expired current streaks to 0 before another completion. Longest streak is retained. Client clocks/timezones cannot choose a reward day.

## Database and security

Migration 202609130002_step_3_core_engine.sql follows the unchanged Step 2 migration. It creates game_rules, quests, quest_progress, quest_completions, xp_transactions, credit_transactions and streaks, with RLS, owner indexes, composite owner foreign keys, amount checks and unique completion references.

Authenticated roles have SELECT only on the new tables, restricted to their own rows except shared game_rules. Mutations use SECURITY DEFINER RPCs with an empty search_path, explicit auth.uid ownership, authenticated execution grants and anonymous/PUBLIC revocation. Step 2 progression columns remain locked.

Every mutation locks the character row first. Completion locks the quest/progress/attributes/streak records, derives all awards and commits both ledgers, balances, attributes and completion in one transaction. Replays return already-completed without rewards. A late ledger error rolls back every change. No service-role key is needed.

## Application integration

Next server actions: saveQuest, archiveQuest, advanceQuest, readQuestHistory. RPCs: sync_daily_quests, save_quest, archive_quest, advance_quest. Sessions are verified server-side, inputs are validated with Zod and database checks, and errors are mapped to safe feedback.

QuestTracker retains existing artwork, quest-card styles and RPG frames. HUD bars, level, credits, streak, attributes and recent gains read Supabase data. QuestHistory shows snapshots, actual attribute deltas and ledger balances with pagination. Ledger rows are fetched by completion ID to avoid pagination ordering mismatches.

No Step 4 features were implemented. Existing achievement/shop/proof/social sections retain their prior preview behavior without awarding or spending anything.
