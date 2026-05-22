import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Screen } from '@/src/components/Screen';
import { Body, Heading } from '@/src/components/Typography';
import { forgotPassword, signInWithApple, signInWithEmail, signInWithGoogle, signUpWithEmail } from '@/src/features/auth/useAuth';
import { useThemeColors } from '@/src/theme/useThemeColors';

export default function AuthScreen() {
  const colors = useThemeColors();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = mode === 'signin' ? await signInWithEmail(email.trim(), password) : await signUpWithEmail(email.trim(), password);
      if (response.error) throw response.error;
      if (mode === 'signup') setMessage('Check your email, then sign in.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Authentication failed.');
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
      setMessage(error instanceof Error ? error.message : 'Could not send reset email.');
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
      setMessage(error instanceof Error ? error.message : 'Social sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <View>
          <Body style={[styles.logo, { color: colors.accent }]}>PHRIT</Body>
          <Heading>{mode === 'signin' ? 'Sign in to PHRIT' : 'Start PHRIT'}</Heading>
          <Body style={[styles.copy, { color: colors.muted }]}>Share one photo and one short sentence for today.</Body>
        </View>

        <View style={styles.form}>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="email"
            placeholderTextColor={colors.muted}
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            value={email}
          />
          <TextInput
            autoCapitalize="none"
            onChangeText={setPassword}
            placeholder="password"
            placeholderTextColor={colors.muted}
            secureTextEntry
            style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
            value={password}
          />

          <Pressable disabled={loading} onPress={submit} style={[styles.primary, { backgroundColor: colors.accent, opacity: loading ? 0.72 : 1 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Body style={styles.primaryText}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Body>}
          </Pressable>

          <View style={styles.row}>
            <Pressable onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
              <Body style={{ color: colors.accent }}>{mode === 'signin' ? 'Create account' : 'Back to sign in'}</Body>
            </Pressable>
            <Pressable onPress={resetPassword}>
              <Body style={{ color: colors.muted }}>Reset password</Body>
            </Pressable>
          </View>

          <View style={styles.socials}>
            <Pressable onPress={() => socialSignIn('google')} style={[styles.secondary, { borderColor: colors.border }]}>
              <Body>Continue with Google</Body>
            </Pressable>
            <Pressable onPress={() => socialSignIn('apple')} style={[styles.secondary, { borderColor: colors.border }]}>
              <Body>Continue with Apple</Body>
            </Pressable>
          </View>

          {message ? <Body style={[styles.message, { color: colors.muted }]}>{message}</Body> : null}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: 32 },
  logo: { fontSize: 16, fontWeight: '800', marginBottom: 12 },
  copy: { marginTop: 12, lineHeight: 22 },
  form: { gap: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16 },
  primary: { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryText: { color: '#fff', fontWeight: '800' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginTop: 4 },
  socials: { gap: 10, marginTop: 18 },
  secondary: { height: 48, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  message: { marginTop: 12, lineHeight: 21 },
});
