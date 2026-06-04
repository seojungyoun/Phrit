import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/src/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export const signInWithEmail = (email: string, password: string) => supabase.auth.signInWithPassword({ email, password });

export const signUpWithEmail = (email: string, password: string) =>
  supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: AuthSession.makeRedirectUri() },
  });

export const forgotPassword = (email: string) => supabase.auth.resetPasswordForEmail(email, { redirectTo: AuthSession.makeRedirectUri() });

export function formatAuthError(error: unknown, fallback = 'Authentication failed.') {
  const message = error instanceof Error ? error.message : fallback;
  const lower = message.toLowerCase();

  if (lower.includes('password')) {
    return 'Password must meet Supabase Auth rules. Try at least 6 characters.';
  }
  if (lower.includes('invalid email')) {
    return 'Enter a valid email address.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Email is not confirmed yet. Open the confirmation email from Supabase, then log in.';
  }
  if (lower.includes('signup') && lower.includes('disabled')) {
    return 'Email signup is disabled in Supabase. Enable Authentication > Providers > Email.';
  }
  if (lower.includes('redirect')) {
    return 'Supabase redirect URL is not allowed. Add this app URL in Authentication > URL Configuration.';
  }
  if (lower.includes('invalid login credentials')) {
    return 'Email or password is incorrect, or the email confirmation is not finished.';
  }

  return message;
}

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
