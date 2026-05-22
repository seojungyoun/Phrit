import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/src/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export const signInWithEmail = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });
export const signUpWithEmail = (email: string, password: string) => supabase.auth.signUp({ email, password });
export const forgotPassword = (email: string) => supabase.auth.resetPasswordForEmail(email);

export async function signInWithGoogle() {
  const redirect = AuthSession.makeRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirect, skipBrowserRedirect: true } });
  if (error) throw error;
  if (data.url) await completeOAuth(data.url, redirect);
  return data;
}
export async function signInWithApple() {
  const redirect = AuthSession.makeRedirectUri();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'apple', options: { redirectTo: redirect, skipBrowserRedirect: true } });
  if (error) throw error;
  if (data.url) await completeOAuth(data.url, redirect);
  return data;
}

async function completeOAuth(url: string, redirect: string) {
  const result = await WebBrowser.openAuthSessionAsync(url, redirect);
  if (result.type !== 'success') return;

  const parsedUrl = new URL(result.url);
  const code = parsedUrl.searchParams.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
  }
}
