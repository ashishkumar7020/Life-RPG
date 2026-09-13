import { assets } from '../lib/assets';
import { RPGBackground, SheetRegion } from './artwork';
import type { ReactNode } from 'react';
import Link from 'next/link';

export function AuthShell({ title, eyebrow, children, wide = false }: { title: string; eyebrow: string; children: ReactNode; wide?: boolean }) {
  return <main className="auth-shell"><RPGBackground art={assets.realms.commandHall} priority /><section className={`rpg-panel auth-panel ${wide ? 'auth-panel-wide' : ''}`}><Link className="brand" href="/"><SheetRegion art={assets.emblems.sword} priority decorative /><span><strong>LIFE RPG</strong><small>YOUR REAL LIFE IS THE GAME</small></span></Link><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{children}</section></main>;
}
