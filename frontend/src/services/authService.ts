import { supabase } from '../config/supabaseClient';
import { EmployeeUser } from '../types';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error(error?.message || 'Authentication failed');
  }

  const user: EmployeeUser = {
    id: data.user.id,
    email: data.user.email ?? '',
  };

  return { ok: true, user };
}

export async function signOut() {
  await supabase.auth.signOut();
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const user: EmployeeUser = {
    id: session.user.id,
    email: session.user.email ?? '',
  };

  return { session, user };
}
