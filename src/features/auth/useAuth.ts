import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/src/lib/supabase';

export const signInWithEmail = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });
export const signUpWithEmail = (email: string, password: string) => supabase.auth.signUp({ email, password });
export const forgotPassword = (email: string) => supabase.auth.resetPasswordForEmail(email);

export async function signInWithGoogle() {
  const redirect = AuthSession.makeRedirectUri();
  return supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirect } });
}
export async function signInWithApple() {
  const redirect = AuthSession.makeRedirectUri();
  return supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: redirect } });
}
