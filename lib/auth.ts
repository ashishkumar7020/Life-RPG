import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { getSupabaseConfig } from './supabase/config';

export async function requireUser() {
  if (!getSupabaseConfig()) redirect('/login');
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error?.name === 'AuthRetryableFetchError') throw new Error('The authentication service is temporarily unavailable.');
  if (!user) redirect('/login');
  return { supabase, user };
}

export async function redirectAuthenticatedUser() {
  if (!getSupabaseConfig()) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/');
}
