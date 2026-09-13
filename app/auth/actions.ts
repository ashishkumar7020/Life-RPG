'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import { getSupabaseConfig } from '../../lib/supabase/config';
import { requireUser } from '../../lib/auth';
import { loginSchema, signupSchema, characterSchema, type ActionState } from '../../lib/validation';

const unavailable = { error: 'The realm connection is not configured. Follow the Supabase setup instructions before signing in.' };

export async function login(_previous: ActionState, data: FormData): Promise<ActionState> {
  const result = loginSchema.safeParse({ email: data.get('email'), password: data.get('password') });
  if (!result.success) return { error: 'Check your sign-in details.', fields: result.error.flatten().fieldErrors };
  if (!getSupabaseConfig()) return unavailable;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword(result.data);
    if (error) return { error: 'Unable to sign in. Check your credentials and confirm your email, or try again later.' };
  } catch { return { error: 'Unable to reach the authentication service. Please try again.' }; }
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signup(_previous: ActionState, data: FormData): Promise<ActionState> {
  const result = signupSchema.safeParse({ email: data.get('email'), password: data.get('password'), displayName: data.get('displayName') });
  if (!result.success) return { error: 'Check the highlighted fields.', fields: result.error.flatten().fieldErrors };
  if (!getSupabaseConfig()) return unavailable;
  const siteUrl = process.env.SITE_URL?.trim();
  if (!siteUrl) return { error: 'The email confirmation URL is not configured. Set SITE_URL before signing up.' };
  let origin: string;
  try {
    const url = new URL(siteUrl);
    if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) return { error: 'The email confirmation URL is invalid.' };
    origin = url.origin;
  } catch { return { error: 'The email confirmation URL is invalid.' }; }
  let signedIn = false;
  try {
    const supabase = await createClient();
    const { data: response, error } = await supabase.auth.signUp({
      email: result.data.email, password: result.data.password,
      options: { data: { display_name: result.data.displayName }, emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error) return { error: 'Unable to create the account. Check your details or try again later.' };
    signedIn = !!response.session;
  } catch { return { error: 'Unable to reach the authentication service. Please try again.' }; }
  if (signedIn) { revalidatePath('/', 'layout'); redirect('/onboarding'); }
  return { message: 'If registration can proceed, check your inbox to confirm your email. Then sign in to choose your character.' };
}

export async function logout(_previous: ActionState): Promise<ActionState> {
  void _previous;
  if (!getSupabaseConfig()) redirect('/login');
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) return { error: 'Unable to sign out. Please try again.' };
  } catch { return { error: 'Unable to reach the authentication service. Please try again.' }; }
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function createCharacter(_previous: ActionState, data: FormData): Promise<ActionState> {
  const result = characterSchema.safeParse({ displayName: data.get('displayName'), characterClass: data.get('characterClass') });
  if (!result.success) return { error: 'Choose a valid name and character path.', fields: result.error.flatten().fieldErrors };
  const { supabase } = await requireUser();
  // No user id, progression or attribute values are accepted from the browser.
  const { error } = await supabase.rpc('complete_character_setup', { p_display_name: result.data.displayName, p_class: result.data.characterClass });
  if (error) return { error: 'Unable to save your character. Your existing progression has not changed. Check the migration and retry.' };
  revalidatePath('/', 'layout');
  redirect('/');
}
