'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from './config';
import type { Database } from './database.types';

export function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new Error('Supabase public configuration is missing or invalid.');
  return createBrowserClient<Database>(config.url, config.key);
}
