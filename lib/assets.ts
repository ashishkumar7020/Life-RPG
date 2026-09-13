/** Verified semantic mapping. Source filenames are intentionally preserved.
 * Regions use source-image pixels; they never redraw or modify the artwork.
 */
export type Art = { src: string; label: string; width: number; height: number; region?: readonly [number, number, number, number] };
const single = (path: string, label: string, width = 1536, height = 1024): Art => ({ src: `/assets/${path}`, label, width, height });
const region = (source: Art, label: string, x: number, y: number, w: number, h: number): Art => ({ ...source, label, region: [x, y, w, h] });
const portraits = single('characters/character-portraits-sheet.jpg', 'Character portraits', 1145, 1374);
const paths = single('characters/character-paths-sheet.jpg', 'Character paths');
const badges = single('badges/achievement-badges-sheet.jpg', 'Achievement badges');
const emblems = single('ui/rpg-emblems-sheet.jpg', 'RPG emblems', 1024, 1536);
const verification = single('ui/verification-icons-sheet.jpg', 'Verification icons', 1024, 1536);
const environments = single('backgrounds/realm-backgrounds-sheet.jpg', 'Realm environments', 1024, 1536);
const cosmetics = single('characters/scholar.png', 'Rewards and cosmetics');
const decoration = single('characters/armored-warrior.png', 'Decorative UI kit');
const icon = (source: Art, name: string, i: number) => region(source, name, (i % 2) * 512 + 24, Math.floor(i / 2) * 480, 464, 480);
export const pathNames = ['Warrior', 'Scholar', 'Creator', 'Balanced'] as const;
export type CharacterPath = typeof pathNames[number];
export const assets = {
  characters: {
    warrior: single('ui/decorative-assets-sheet.png', 'Armored Warrior hero'),
    scholar: single('ui/reward-showcase-sheet.png', 'Scholar hero'),
    creator: single('backgrounds/realm-hall.png', 'Creator at a holographic workstation'),
    balanced: single('backgrounds/realm-city.png', 'Realm adventurer overlooking the citadel'),
  },
  characterPortraits: Object.fromEntries(pathNames.map((name, i) => [name, region(portraits, `${name} portrait`, (i % 2) * 572.5, Math.floor(i / 2) * 687, 572.5, 687)])) as Record<CharacterPath, Art>,
  characterPaths: Object.fromEntries(pathNames.map((name, i) => [name, region(paths, `${name} path`, i * 384 + 12, 88, 360, 875)])) as Record<CharacterPath, Art>,
  quests: {
    gym: single('backgrounds/realm-lake.png', 'Strength training in a dark gym'),
    coding: single('quests/focus.png', 'Coding and deep work'),
    study: single('quests/coding.png', 'Study and planning'),
    studyNotes: single('quests/reading.png', 'Study notes and writing'),
    running: single('quests/study-alt.png', 'Running and cardio'),
    reading: single('quests/study.png', 'Reading quest'),
    focus: single('quests/focus.png', 'Focused work session'),
  },
  realms: {
    commandHall: single('characters/creator.png', 'Command Hall and System Sanctum', 1672, 941),
    moonlitCitadel: single('characters/warrior.png', 'Moonlit Citadel and waterfalls', 1672, 941),
    questCitadel: single('quests/gym.png', 'Moonlit Quest Citadel', 1672, 941),
    fortress: region(environments, 'Moonlit fortress', 0, 0, 1024, 470),
    sanctum: region(environments, 'Blue energy sanctum', 0, 476, 1024, 470),
    goldCitadel: region(environments, 'Gold Citadel above the clouds', 0, 954, 1024, 582),
  },
  achievements: ['First Quest', '7 Day Streak', 'Gym Veteran', 'Code Master', 'Scholar', 'Legendary'].map((name, i) => region(badges, name, (i % 3) * 512 + 76, Math.floor(i / 3) * 480 + 30, 404, 424)),
  emblems: {
    sword: icon(emblems, 'Sword and shield', 0), flame: icon(emblems, 'Flame', 1),
    strength: icon(emblems, 'Dumbbell', 2), circuit: icon(emblems, 'Cyber circuit', 3),
    book: icon(emblems, 'Open book', 4), crown: icon(emblems, 'Crown', 5),
  },
  verification: {
    scene: single('quests/gym-quest-verification.jpg', 'Gym Proof of Action illustration', 1145, 1374),
    document: icon(verification, 'Document and check', 0), location: icon(verification, 'GPS location', 1),
    duration: icon(verification, 'Activity and duration', 2), checkpoint: icon(verification, 'Checkpoint check', 3),
    identity: icon(verification, 'Identity shield', 4), confidence: icon(verification, 'System validation', 5),
  },
  rewards: {
    banners: ['Discipline Builds Freedom', 'Better Habits Brighter You', 'Small Steps Big Changes', 'Same Person Stronger Tomorrow'].map((n, i) => region(cosmetics, n, 28 + i * 374, 64, 358, 124)),
    frames: ['Default', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'].map((n, i) => region(cosmetics, `${n} frame`, 20 + i * 137, 270, 133, 164)),
    titles: ['Habit Builder', 'Focus Master', 'Consistent', 'Quest Champion'].map((n, i) => region(cosmetics, n, 876, 262 + i * 58, 214, 48)),
    auras: ['Calm', 'Focused', 'Legendary'].map((n, i) => region(cosmetics, `${n} aura`, 1126 + i * 132, 265, 125, 192)),
    themes: ['Night Citadel', 'Forest Sanctuary', 'Void Realm', 'Sunset Peaks', 'Cyber City', 'Ancient Ruins'].map((n, i) => region(cosmetics, n, 28 + i * 249, 550, 233, 194)),
    miscellaneous: ['Gems', 'Chest', 'Scroll', 'Time Boost', 'Growth', 'Companion', 'Knowledge', 'Emote', 'Lantern', 'Flag'].map((n, i) => region(cosmetics, n, 26 + i * 119, 845, 112, 122)),
  },
  decorativeUI: {
    corner: region(decoration, 'Blue metal corner', 32, 100, 110, 108),
    separator: region(decoration, 'Engraved metal separator', 32, 218, 492, 34),
    energy: region(decoration, 'Blue energy vortex', 560, 125, 132, 189),
    xp: region(decoration, 'XP crystal', 1066, 120, 74, 106),
    credits: region(decoration, 'Gold credit coin', 1172, 122, 89, 104),
    rank: region(decoration, 'Silver rank emblem', 1006, 500, 81, 114),
    banner: region(decoration, 'Hanging realm banner', 1380, 708, 117, 180),
  },
};
