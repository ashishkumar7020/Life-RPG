import { AuthShell } from '../../components/auth-shell';
import { AuthForm } from '../../components/auth-form';
import { getSupabaseConfig } from '../../lib/supabase/config';
import { redirectAuthenticatedUser } from '../../lib/auth';
export const dynamic = 'force-dynamic';
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await redirectAuthenticatedUser();
  const params = await searchParams;
  return <AuthShell title="Enter the Realm" eyebrow="YOUR JOURNEY CONTINUES"><AuthForm mode="login" configured={!!getSupabaseConfig()} confirmationError={params.error === 'confirmation'} /></AuthShell>;
}
