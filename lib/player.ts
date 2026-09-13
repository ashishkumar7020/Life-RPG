import 'server-only';
import { redirect } from 'next/navigation';
import { requireUser } from './auth';
import type { PlayerData } from './supabase/database.types';

export async function loadPlayer(): Promise<PlayerData> {
  const { supabase, user } = await requireUser();
  const [profile, character] = await Promise.all([
    supabase.from('profiles').select('id, display_name, created_at, updated_at').eq('id', user.id).maybeSingle(),
    supabase.from('characters').select('id, user_id, class, level, xp, credits, streak, created_at, updated_at').eq('user_id', user.id).maybeSingle(),
  ]);
  if (profile.error || character.error) throw new Error('Unable to load your character. Check the database migration and connection.');
  if (!profile.data || !character.data) redirect('/onboarding');
  const attributes = await supabase.from('attributes').select('character_id, strength, intelligence, focus, discipline, vitality, charisma, updated_at').eq('character_id', character.data.id).single();
  if (attributes.error || !attributes.data) throw new Error('Unable to load your saved attributes.');
  return { name: profile.data.display_name, character: character.data, attributes: attributes.data };
}
