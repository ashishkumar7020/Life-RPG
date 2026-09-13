import { redirect } from 'next/navigation';
import { requireUser } from '../../lib/auth';
import { AuthShell } from '../../components/auth-shell';
import { CharacterSetup } from '../../components/character-setup';
export const dynamic = 'force-dynamic';
export default async function OnboardingPage() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from('characters').select('id').eq('user_id', user.id).maybeSingle();
  if (error) throw new Error('Unable to read character setup. Check the database migration.');
  if (data) redirect('/');
  const name = typeof user.user_metadata.display_name === 'string' ? user.user_metadata.display_name.slice(0, 40) : '';
  return <AuthShell title="Choose Your Path" eyebrow="ONE WORLD. DIFFERENT STRENGTHS." wide><CharacterSetup suggestedName={name} /></AuthShell>;
}
