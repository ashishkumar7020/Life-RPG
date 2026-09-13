import { AuthShell } from '../../components/auth-shell';
import { AuthForm } from '../../components/auth-form';
import { getSupabaseConfig } from '../../lib/supabase/config';
import { redirectAuthenticatedUser } from '../../lib/auth';
export const dynamic = 'force-dynamic';
export default async function SignupPage() {
  await redirectAuthenticatedUser();
  return <AuthShell title="Start Your Legend" eyebrow="A NEW ADVENTURER"><AuthForm mode="signup" configured={!!getSupabaseConfig()} /></AuthShell>;
}
