import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { getSupabaseConfig } from '../../../lib/supabase/config';
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (getSupabaseConfig() && code && code.length < 4096) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL('/', request.url), { headers: { 'Cache-Control': 'private, no-store' } });
    } catch { /* Return a generic failure without exposing provider details. */ }
  }
  return NextResponse.redirect(new URL('/login?error=confirmation', request.url), { headers: { 'Cache-Control': 'private, no-store' } });
}
