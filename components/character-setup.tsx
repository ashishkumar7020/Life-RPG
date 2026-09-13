'use client';
import { useActionState, useState } from 'react';
import { assets, type CharacterPath, pathNames } from '../lib/assets';
import { SheetRegion } from './artwork';
import { createCharacter } from '../app/auth/actions';
import type { ActionState } from '../lib/validation';
export function CharacterSetup({ suggestedName }: { suggestedName: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createCharacter, {});
  const [selected, setSelected] = useState<CharacterPath | null>(null);
  return <form action={action} className="auth-form"><div><label htmlFor="displayName">Player name</label><input id="displayName" name="displayName" autoComplete="nickname" defaultValue={suggestedName} required minLength={2} maxLength={40} aria-describedby="name-error" aria-invalid={!!state.fields?.displayName} /><p className="field-error" id="name-error">{state.fields?.displayName?.[0]}</p></div><fieldset disabled={pending}><legend>Choose your character</legend><div className="path-grid">{pathNames.map(name => <label key={name} className={`path-card setup-path ${selected === name ? 'selected' : ''}`}><input type="radio" name="characterClass" value={name} required checked={selected === name} onChange={() => setSelected(name)} /><SheetRegion art={assets.characterPaths[name]} priority /><span>{name}</span></label>)}</div></fieldset><p className="auth-description">Your character is saved to your account. A path can be chosen once; progression starts at level 1.</p><div aria-live="polite">{state.error && <p className="auth-message" role="alert">{state.error}</p>}</div><button type="submit" className="rpg-button" disabled={!selected || pending}>{pending ? 'Saving character…' : 'Begin Your Journey'}</button></form>;
}
