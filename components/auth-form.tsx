'use client';
import { useActionState } from 'react';
import Link from 'next/link';
import { login, signup } from '../app/auth/actions';
import type { ActionState } from '../lib/validation';

export function AuthForm({ mode, configured, confirmationError = false }: { mode: 'login' | 'signup'; configured: boolean; confirmationError?: boolean }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(mode === 'login' ? login : signup, {});
  const signingUp = mode === 'signup';
  return <><p className="auth-description">{signingUp ? 'Create your account, then choose your path.' : 'Return to your character and saved progress.'}</p>{!configured && <p className="auth-message" role="status">The realm connection is not configured. Supabase credentials are required before accounts or saved progress can be used.</p>}{confirmationError && <p className="auth-message" role="alert">That confirmation link is invalid or expired. Try signing in, or request a new confirmation through the account service.</p>}<form action={action} className="auth-form">
    {signingUp && <div><label htmlFor="displayName">Player name</label><input id="displayName" name="displayName" autoComplete="nickname" minLength={2} maxLength={40} required aria-invalid={!!state.fields?.displayName} aria-describedby="displayName-error" /><p id="displayName-error" className="field-error">{state.fields?.displayName?.[0]}</p></div>}
    <div><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="email" maxLength={254} required aria-invalid={!!state.fields?.email} aria-describedby="email-error" /><p id="email-error" className="field-error">{state.fields?.email?.[0]}</p></div>
    <div><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete={signingUp ? 'new-password' : 'current-password'} minLength={signingUp ? 12 : 1} maxLength={128} required aria-invalid={!!state.fields?.password} aria-describedby="password-error" />{signingUp && <small>Use at least 12 characters.</small>}<p id="password-error" className="field-error">{state.fields?.password?.[0]}</p></div>
    <div aria-live="polite">{state.error && <p className="auth-message" role="alert">{state.error}</p>}{state.message && <p className="auth-message">{state.message}</p>}</div>
    <button className="rpg-button" disabled={pending || !configured} type="submit">{pending ? 'Connecting…' : signingUp ? 'Create Account' : 'Enter the Realm'}</button>
  </form><p className="auth-switch">{signingUp ? 'Already have an account?' : 'New to the realm?'} <Link href={signingUp ? '/login' : '/signup'}>{signingUp ? 'Sign in' : 'Create an account'}</Link></p></>;
}
