import { NextResponse, type NextRequest } from 'next/server';

// This module is bundled for the Vercel Edge runtime. Keep it independent from
// Supabase and session refresh code: every protected page is already guarded
// server-side by requireUser(), where cookies and the Supabase client run in
// the Node request runtime. That preserves authorization without making a
// public page depend on an external authentication call at the Edge.
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

// Do not invoke Edge middleware for framework/static assets.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
