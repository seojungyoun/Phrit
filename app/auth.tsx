import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/src/components/Screen';
import { Body, Heading } from '@/src/components/Typography';
import { forgotPassword, formatAuthError, signInWithApple, signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/src/features/auth/useAuth';
import { supabase } from '@/src/lib/supabase';
import { useSessionStore } from '@/src/store/sessionStore';
import { useThemeColors } from '@/src/theme/useThemeColors';

export default function AuthScreen() {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const session = useSessionStore((state) => state.session);
  const clearSession = useSessionStore((state) => state.clearSession);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const isWide = width >= 860;

  const submit = async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setMessage('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setMessage('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const response = mode === 'signin' ? await signInWithEmail(cleanEmail, password) : await signUpWithEmail(cleanEmail, password);
      if (response.error) throw response.error;
      if (mode === 'signin' || response.data.session) {
        router.replace('/(tabs)');
      } else {
        setMessage('Account created. Check your email confirmation link, then log in.');
      }
    } catch (error) {
      setMessage(formatAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setMessage('');
    try {
      await supabase.auth.signOut({ scope: 'local' });
      queryClient.clear();
      clearSession();
      setMessage('Logged out. Sign in again to continue.');
    } catch (error) {
      setMessage(formatAuthError(error, 'Could not log out.'));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim()) {
      setMessage('Enter your email first.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const { error } = await forgotPassword(email.trim());
      if (error) throw error;
      setMessage('Password reset email sent.');
    } catch (error) {
      setMessage(formatAuthError(error, 'Could not send reset email.'));
    } finally {
      setLoading(false);
    }
  };

  const socialSignIn = async (provider: 'google' | 'apple') => {
    setLoading(true);
    setMessage('');
    try {
      await (provider === 'google' ? signInWithGoogle() : signInWithApple());
    } catch (error) {
      setMessage(formatAuthError(error, 'Social sign-in failed. Check Supabase provider settings and redirect URLs.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <ScrollView contentContainerStyle={[styles.page, isWide && styles.pageWide]} keyboardShouldPersistTaps="handled">
          <View style={styles.brandPanel}>
            <Body style={[styles.logo, { color: colors.accent }]}>PHRIT</Body>
            <Heading style={styles.title}>One photo. One sentence. One day.</Heading>
            <Body style={[styles.copy, { color: colors.muted }]}>Sign in, answer today's question, and post it like a quiet story.</Body>
          </View>

          <View style={[styles.authPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {session ? (
              <View style={[styles.sessionPanel, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Body style={[styles.sessionLabel, { color: colors.muted }]}>Signed in as</Body>
                <Body numberOfLines={1} style={styles.sessionEmail}>
                  {session.user.email ?? 'current user'}
                </Body>
                <View style={styles.sessionActions}>
                  <Pressable onPress={() => router.replace('/(tabs)')} style={[styles.sessionButton, { backgroundColor: colors.accent }]}>
                    <Body style={styles.sessionButtonText}>Continue</Body>
                  </Pressable>
                  <Pressable disabled={loading} onPress={logout} style={[styles.sessionButton, { borderColor: colors.border, borderWidth: 1 }]}>
                    <Body style={{ fontWeight: '900' }}>Logout</Body>
                  </Pressable>
                </View>
              </View>
            ) : null}

            <View style={[styles.segment, { borderColor: colors.border }]}>
              <Pressable onPress={() => setMode('signin')} style={[styles.segmentItem, { backgroundColor: mode === 'signin' ? colors.accent : 'transparent' }]}>
                <Body style={{ color: mode === 'signin' ? '#fff' : colors.text, fontWeight: '900' }}>Login</Body>
              </Pressable>
              <Pressable onPress={() => setMode('signup')} style={[styles.segmentItem, { backgroundColor: mode === 'signup' ? colors.accent : 'transparent' }]}>
                <Body style={{ color: mode === 'signup' ? '#fff' : colors.text, fontWeight: '900' }}>Sign up</Body>
              </Pressable>
            </View>

            <View style={styles.form}>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                value={email}
              />
              <TextInput
                autoCapitalize="none"
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
                value={password}
              />

              <Pressable disabled={loading} onPress={submit} style={[styles.primary, { backgroundColor: colors.accent, opacity: loading ? 0.72 : 1 }]}>
                {loading ? <ActivityIndicator color="#fff" /> : <Body style={styles.primaryText}>{mode === 'signin' ? 'Login' : 'Create account'}</Body>}
              </Pressable>
              <Pressable onPress={resetPassword} style={styles.textButton}>
                <Body style={{ color: colors.muted }}>Forgot password?</Body>
              </Pressable>
            </View>

            <View style={styles.dividerRow}>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
              <Body style={{ color: colors.muted }}>or</Body>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.socials}>
              <Pressable onPress={() => socialSignIn('google')} style={[styles.secondary, { borderColor: colors.border }]}>
                <Body style={styles.socialText}>Continue with Google</Body>
              </Pressable>
              <Pressable onPress={() => socialSignIn('apple')} style={[styles.secondary, { borderColor: colors.border }]}>
                <Body style={styles.socialText}>Continue with Apple</Body>
              </Pressable>
            </View>
            <Body style={[styles.helpText, { color: colors.muted }]}>
              Social login requires Google/Apple providers and redirect URL settings in Supabase Auth.
            </Body>

            {message ? <Body style={[styles.message, { color: colors.muted }]}>{message}</Body> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  page: { flexGrow: 1, justifyContent: 'center', gap: 24, paddingVertical: 24 },
  pageWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 54 },
  brandPanel: { maxWidth: 430, gap: 14 },
  logo: { fontSize: 18, fontWeight: '900' },
  title: { maxWidth: 420 },
  copy: { maxWidth: 360, lineHeight: 23 },
  authPanel: { width: '100%', maxWidth: 420, alignSelf: 'center', borderWidth: 1, borderRadius: 8, padding: 16, gap: 16 },
  sessionPanel: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 10 },
  sessionLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  sessionEmail: { fontWeight: '900' },
  sessionActions: { flexDirection: 'row', gap: 10 },
  sessionButton: { flex: 1, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sessionButtonText: { color: '#fff', fontWeight: '900' },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, padding: 3 },
  segmentItem: { flex: 1, alignItems: 'center', borderRadius: 6, paddingVertical: 11 },
  form: { gap: 10 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16 },
  primary: { height: 52, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { color: '#fff', fontWeight: '900' },
  textButton: { alignItems: 'center', paddingVertical: 6 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  line: { flex: 1, height: 1 },
  socials: { gap: 10 },
  secondary: { height: 48, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  socialText: { fontWeight: '800' },
  helpText: { fontSize: 12, lineHeight: 18 },
  message: { lineHeight: 21 },
});
