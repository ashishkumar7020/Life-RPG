# STEP 1.5 semantic asset manifest

Based on the already completed, verified 23-file audit supplied in Fix Runtime Issues. No repeat audit, renamed source images, generated artwork, or replacement artwork. All 23 source images are preserved; 22 distinct files are integrated (one exact duplicate is intentionally unused).

`lib/assets.ts` is the source of truth. Components request semantic artwork, never infer meaning from filenames.

| Source under public/assets | Semantic use in STEP 1.5 |
|---|---|
| backgrounds/realm-backgrounds-sheet.jpg | Three individually clipped environments: fortress, sanctum, gold citadel |
| backgrounds/realm-city.png | Explorer hero in Balanced identity preview |
| backgrounds/realm-hall.png | Creator workstation in Creator identity preview |
| backgrounds/realm-lake.png | Gym quest |
| badges/achievement-badges-sheet.jpg | Six individual achievement plates |
| characters/armored-warrior.png | Decorative corner, separator, credit coin, silver rank, hanging banner; XP and energy regions available |
| characters/character-paths-sheet.jpg | Four individually clipped class selection cards |
| characters/character-portraits-sheet.jpg | Four portraits for HUD and class selection |
| characters/creator.png | Command Hall background |
| characters/scholar.png | 33 individual rewards across six categories |
| characters/warrior.png | Moonlit Citadel navigation scene |
| quests/coding.png | Study/planning quest card |
| quests/focus.png | Coding and Focus quest cards |
| quests/gym-quest-verification.jpg | Labeled illustrative Proof of Action flow; no real verification |
| quests/gym.png | Moonlit Quest Citadel realm selector/background |
| quests/reading.png | Study notes in Study quest briefing |
| quests/running.png | Preserved but unused: exact duplicate of quests/reading.png from verified audit |
| quests/study-alt.png | Running quest |
| quests/study.png | Reading quest |
| ui/decorative-assets-sheet.png | Single Warrior hero, not a sheet |
| ui/reward-showcase-sheet.png | Single Scholar hero, not a sheet |
| ui/rpg-emblems-sheet.jpg | Six individual quest and attribute emblems |
| ui/verification-icons-sheet.jpg | Six individual Proof of Action icons |

## Sheet handling

Eight true sheets are handled: portraits, paths, achievements, realms, emblems, verification icons, decorative UI, rewards/cosmetics. SheetRegion renders a source-pixel viewBox inside a clipped SVG. Source artwork and original files remain unchanged. Each sheet URL is shared and browser-cached, and below-fold regions mount through IntersectionObserver. Standalone artwork uses next/image, responsive sizes, lazy loading, and priority only for initial hero/HUD imagery.

The realm sheet has uneven row heights. Reward banners, frames, titles, auras, themes, and miscellaneous objects have explicit rectangles; they are not treated as a uniform grid. The two misleadingly named ui/*-sheet.png files are standalone character scenes.

## Presentation boundary

Existing sample level, XP, credits, streak, and attributes are retained. Preview interactions use component state only. No localStorage, GPS, camera, authentication, persistence, reward processing, social backend, or Supabase changes. A quest preview never grants XP, credits, achievements, or verification.
