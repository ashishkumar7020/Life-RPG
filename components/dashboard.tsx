"use client";

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Bell, ChevronRight, Flame, Home, ScrollText, Swords, Trophy, Sparkles, Users, X, ArrowUpRight, Plus } from 'lucide-react';
import { assets, pathNames, type CharacterPath } from '../lib/assets';
import { Artwork, RPGBackground, SheetRegion } from './artwork';
import type { PlayerData } from '../lib/supabase/database.types';
import { LogoutButton } from './logout-button';
import { QuestTracker, RecentGains } from './quest-tracker';
import { QuestHistory } from './quest-history';
import type { GameData } from '../lib/game/types';
import type { EngagementData } from '../lib/engagement/types';
import { ProofOfAction } from './proof-of-action';
import { AchievementHall, Treasury, EquippedCosmetics, cosmeticArt } from './treasury';
import { Leaderboards, ProfileManager, SocialHall } from './social';

const attributeSpecs = [
  ['Strength', 'strength', assets.emblems.strength], ['Intelligence', 'intelligence', assets.emblems.book],
  ['Focus', 'focus', assets.emblems.circuit], ['Discipline', 'discipline', assets.emblems.sword],
  ['Vitality', 'vitality', assets.emblems.flame], ['Charisma', 'charisma', assets.emblems.crown],
] as const;
const pathFocus: Record<CharacterPath, string> = { Warrior: 'Strength · Vitality · Discipline', Scholar: 'Intelligence · Focus · Growth', Creator: 'Creativity · Problem solving · Innovation', Balanced: 'Balance · Consistency · Growth' };
const heroForPath = { Warrior: assets.characters.warrior, Scholar: assets.characters.scholar, Creator: assets.characters.creator, Balanced: assets.characters.balanced };
const navigation = [{ id: 'hall', name: 'Command Hall', icon: Home }, { id: 'quests', name: 'Quests', icon: ScrollText }, { id: 'character', name: 'Character', icon: Swords }, { id: 'achievements', name: 'Achievements', icon: Trophy }, { id: 'rewards', name: 'Rewards', icon: Sparkles }, { id: 'profile', name: 'Profile', icon: Swords }, { id: 'friends', name: 'Friends', icon: Users }, { id: 'leaderboards', name: 'Legends', icon: Trophy }];

function Panel({ children, className = '', id }: { children: ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`rpg-panel ${className}`}><SheetRegion art={assets.decorativeUI.corner} className="panel-ornament" decorative />{children}</section>;
}
function ProgressBar({ value, label }: { value: number | null; label: string }) {
  return <div className="progress-track" role="progressbar" aria-label={label} aria-valuenow={value ?? undefined} aria-valuetext={value === null ? "Level progress is not calculated yet." : undefined} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${value ?? 0}%` }} /></div>;
}
function Heading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <div className="section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div>{children}</div>;
}
function Modal({ title, children, close }: { title: string; children: ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const el = ref.current; el?.showModal(); return () => el?.close(); }, []);
  return <dialog ref={ref} className="rpg-dialog" onCancel={close} aria-labelledby="dialog-title" onClick={event => { if (event.target === event.currentTarget) close(); }}><div className="dialog-body"><button className="icon-button close-button" onClick={close} aria-label="Close dialog"><X size={20} /></button><p className="eyebrow">SYSTEM INTERFACE · PREVIEW</p><h2 id="dialog-title">{title}</h2>{children}</div></dialog>;
}
export function Dashboard({ player, game, engagement }: { player: PlayerData; game: GameData; engagement:EngagementData }) {
  const equippedItem = (slot:string) => engagement.catalog.find(i=>i.slot===slot && engagement.inventory.some(x=>x.item_id===i.id&&x.equipped));
  const equippedFrame=equippedItem('frames'), equippedTheme=equippedItem('themes'), equippedTitle=equippedItem('titles'), equippedAura=equippedItem('auras');
  const actualPath = player.character.class;
  const format = (value: number) => value.toLocaleString('en-US');
  const stats = attributeSpecs.map(([name, key, emblem]) => [name, player.attributes[key], emblem] as const);
  const [path, setPath] = useState<CharacterPath>(actualPath);
  const [evidenceQuest,setEvidenceQuest] = useState<string|null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [createSignal, setCreateSignal] = useState(0);
  const [realm, setRealm] = useState<keyof typeof assets.realms>('commandHall');
  const [activeRealm, setActiveRealm] = useState('hall');
  useEffect(() => { const update = () => setActiveRealm(window.location.hash.slice(1) || 'hall'); update(); window.addEventListener('hashchange', update); return () => window.removeEventListener('hashchange', update); }, []);
  return <main>
    <a className="skip-link" href="#quests">Skip to quests</a>
    <header className="player-hud"><a href="#hall" className="brand"><SheetRegion art={assets.emblems.sword} priority decorative /><span><strong>LIFE RPG</strong><small>YOUR REAL LIFE IS THE GAME</small></span></a><div className="hud-progress"><b>LV. {player.character.level}</b><div><span>{format(player.character.xp)} <small>TOTAL XP</small></span><ProgressBar value={game.level?.progress_percent ?? null} label="XP to next level" /></div></div><div className="hud-currency"><SheetRegion art={assets.decorativeUI.credits} priority decorative /><b>{format(player.character.credits)}</b><small>Credits</small></div><div className="hud-streak"><Flame size={17} /><b>{player.character.streak}</b><small>day streak</small></div><button className="icon-button" aria-label="Notifications" onClick={() => setNotice('Your daily directives are ready. This preview has no live notifications.')}><Bell size={18} /></button><a className={`hud-identity ${equippedAura?'has-equipped-aura':null}`} href="#character" aria-label={`${player.name} character profile`}><SheetRegion art={assets.characterPortraits[actualPath]} priority />{equippedFrame&&<SheetRegion art={cosmeticArt(equippedFrame)} className="equipped-frame" decorative/>}<span>{player.name}<small>{equippedTitle?.name??actualPath}</small></span></a><LogoutButton /></header>
    <div className="shell"><aside className="realm-nav"><p className="eyebrow">YOUR REALM</p><nav aria-label="Realm navigation">{navigation.map(({ id, name, icon: Icon }) => <a className={activeRealm===id?'active':''} key={id} href={`#${id}`}><Icon size={17} /><span>{name}</span><ChevronRight size={12} /></a>)}</nav><SheetRegion art={assets.decorativeUI.separator} className="nav-separator" decorative /><div className="streak-panel"><SheetRegion art={assets.emblems.flame} decorative /><strong>{player.character.streak} <small>DAYS</small></strong><p>A flame worth keeping.</p><div className="streak-days" aria-label="Current streak length, up to seven days">{[1, 2, 3, 4, 5, 6, 7].map(day => <span className={day > player.character.streak ? "inactive" : ""} key={day}>{day}</span>)}</div></div><div className="nav-world"><Artwork art={assets.realms.moonlitCitadel} /><span>THE NIGHT CITADEL<small>Your journey continues.</small></span></div><p className="demo-label">ACCOUNT CONNECTED<br />Character and quest progression are saved. Cosmetics and proof sessions persist.</p></aside>
    <div className="realm-content"><div className="page-intro" id="hall"><div><p className="eyebrow">SYSTEM ONLINE / COMMAND HALL</p><h1>Welcome back, {player.name}.</h1></div><button className="rpg-button secondary" onClick={() => setCreateSignal(n => n + 1)} disabled={!game.ready}><Plus size={15} />Create Quest</button></div>
    <div className="dashboard-grid"><div className="main-column"><Panel className="command-hero"><RPGBackground art={equippedTheme?cosmeticArt(equippedTheme):assets.realms[realm]} priority /><div className="hero-copy"><p className="eyebrow">✦ DAILY DIRECTIVE</p><h2>Small steps.<br /><em>Big changes.</em></h2><p>The world changes with your actions. Choose a quest. Earn your next chapter.</p><a className="rpg-button" href="#quests">View Quests<ArrowUpRight size={16} /></a></div><span className="hero-coordinate">SECTOR 01 · THE SYSTEM SANCTUM</span></Panel>
    <QuestTracker game={game} createSignal={createSignal} onEvidence={id=>{setEvidenceQuest(id);document.getElementById("proof")?.scrollIntoView({behavior:"smooth"});}} /></div>
    <aside className="right-column"><Panel className="identity-panel"><div className="identity-art"><Artwork art={heroForPath[actualPath]} priority /><div className="identity-shade" /><span className="rank-label"><SheetRegion art={assets.decorativeUI.rank} decorative />CHARACTER PATH</span></div><div className="identity-copy"><p className="eyebrow">PLAYER IDENTITY</p><h2>{player.name}</h2><p className="gold">{actualPath} path</p><EquippedCosmetics data={engagement} /><span className="path-label">{actualPath} · Level {player.character.level}</span><ProgressBar value={game.level?.progress_percent ?? null} label="Level progress" /><small>{game.level ? `${format(game.level.current_xp)} / ${format(game.level.next_level_xp)} XP to level ${game.level.level + 1}` : "Progression connection pending"}</small><a href="#character" className="text-link">Explore your path<ChevronRight size={14} /></a></div></Panel>
    <Panel className="attribute-panel"><Heading eyebrow="CHARACTER GROWTH" title="Attributes" />{stats.map(([name, value, emblem]) => <div className="attribute" key={name}><SheetRegion art={emblem} decorative /><div><span>{name}<b>{value}</b></span><ProgressBar value={value} label={name} /></div></div>)}</Panel>
    <Panel className="treasury-panel gold-panel"><SheetRegion art={assets.rewards.miscellaneous[1]} className="chest" /><p className="eyebrow">YOUR TREASURY</p><h2>{format(player.character.credits)} <small>Credits</small></h2><a href="#rewards" className="rpg-button gold-button">Explore Rewards<ChevronRight size={14} /></a></Panel>
    <Panel className="recent-panel"><Heading eyebrow="YOUR ACTIVITY" title="Recent gains" /><RecentGains game={game} /></Panel></aside></div>
    <QuestHistory game={game} />
    <ProofOfAction data={engagement} game={game} selectedQuest={evidenceQuest} />
    <ProfileManager active={activeRealm==='profile'} engagement={engagement} />
    <Panel id="character" className="character-panel"><Heading eyebrow="ONE WORLD. DIFFERENT STRENGTHS." title="Choose Your Path"><span className="outlined-label">CHARACTER PREVIEW</span></Heading><div className="character-summary"><SheetRegion art={assets.characterPortraits[path]} /><div><h3>{player.name} · {path}</h3><p>{pathFocus[path]}</p><p className="cyan">Level {player.character.level} · {format(player.character.xp)} total XP</p><small>Preview only. Your saved path remains {actualPath}.</small></div></div><div className="path-grid">{pathNames.map(name => <button className={`path-card ${path === name ? 'selected' : ''}`} key={name} aria-label={`Preview ${name} path`} aria-pressed={path === name} onClick={() => setPath(name)}><SheetRegion art={assets.characterPaths[name]} /><span><SheetRegion art={assets.characterPortraits[name]} /><span>{name}<small>{path === name ? 'Selected preview' : 'Explore path'}</small></span><ChevronRight size={15} /></span></button>)}</div><div className="hero-gallery"><figure><Artwork art={assets.characters.warrior} /><figcaption>Warrior · The strength to begin</figcaption></figure><figure><Artwork art={assets.characters.scholar} /><figcaption>Scholar · The will to understand</figcaption></figure></div></Panel>
    <AchievementHall data={engagement} />
    <Treasury data={engagement} level={player.character.level} credits={player.character.credits} />
    <Panel className="realm-selection"><Heading eyebrow="BEYOND THE COMMAND HALL" title="Explore the Realms" /><div className="realm-grid">{(['fortress', 'sanctum', 'goldCitadel', 'questCitadel'] as const).map(key => <button key={key} className="realm-card" aria-pressed={realm === key} onClick={() => { setRealm(key); document.getElementById('hall')?.scrollIntoView({ behavior: 'smooth' }); }}><Artwork art={assets.realms[key]} /><span>{assets.realms[key].label}<small>Preview in Command Hall ↗</small></span></button>)}</div></Panel>
    <SocialHall active={activeRealm==='friends'} />
    <Leaderboards active={activeRealm==='leaderboards'} />
    <footer><span>LIFE RPG</span><p>QUEST · LEARN · BUILD · EVOLVE</p><small>STEP 5 · Social realm and legends</small></footer>
    </div></div>
    {notice && <Modal title="System Notifications" close={() => setNotice(null)}><p>{notice}</p><a className="rpg-button" href="#quests" onClick={() => setNotice(null)}>View Quests</a></Modal>}
  </main>;
}




