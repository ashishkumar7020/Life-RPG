import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '../../../lib/supabase/server';
import { getSupabaseConfig } from '../../../lib/supabase/config';
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type');
  if (getSupabaseConfig() && tokenHash && tokenHash.length < 4096 && type === 'email') {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' });
      if (!error) return NextResponse.redirect(new URL('/', request.url), { headers: { 'Cache-Control': 'private, no-store' } });
    } catch { /* Invalid, expired and unavailable links share the same safe response. */ }
  }
  return NextResponse.redirect(new URL('/login?error=confirmation', request.url), { headers: { 'Cache-Control': 'private, no-store' } });
}
