'use client';
import { useActionState } from 'react';
import { LogOut } from 'lucide-react';
import { logout } from '../app/auth/actions';
import type { ActionState } from '../lib/validation';
export function LogoutButton() {
  const [state, action, pending] = useActionState<ActionState, FormData>(logout, {});
  return <form action={action} className="logout-control"><button className="icon-button" title="Sign out" aria-label="Sign out" disabled={pending}><LogOut size={16} /></button>{state.error && <p role="alert" className="logout-error">{state.error}</p>}</form>;
}
