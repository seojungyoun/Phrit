import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/src/components/Screen';
import { Body, Heading } from '@/src/components/Typography';
import { supabase } from '@/src/lib/supabase';
import { useSessionStore } from '@/src/store/sessionStore';
import { useThemeColors } from '@/src/theme/useThemeColors';
import { ensureProfile, pickAndUploadAvatar, updateEmail, updatePassword, updateProfile, useMyPosts, useProfile, useSavedPosts } from './api';

export function ProfileScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const session = useSessionStore((state) => state.session);
  const clearSession = useSessionStore((state) => state.clearSession);
  const profile = useProfile(session?.user.id);
  const posts = useMyPosts(session?.user.id);
  const savedPosts = useSavedPosts(session?.user.id);
  const [view, setView] = useState<'mine' | 'saved'>('mine');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session?.user.id && !profile.isLoading && !profile.data) {
      ensureProfile(session.user.id, session.user.email).catch(() => undefined);
    }
  }, [profile.data, profile.isLoading, session?.user.email, session?.user.id]);

  useEffect(() => {
    if (profile.data) {
      setUsername(profile.data.username);
      setBio(profile.data.bio ?? '');
    }
    setEmail(session?.user.email ?? '');
  }, [profile.data, session?.user.email]);

  const refreshProfile = async () => {
    if (!session?.user.id) return;
    await queryClient.invalidateQueries({ queryKey: ['profile', session.user.id] });
  };

  const saveProfile = async () => {
    if (!session?.user.id) return;
    setBusy(true);
    setMessage('');
    try {
      await updateProfile(session.user.id, username, bio);
      await refreshProfile();
      setMessage('Profile saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save profile.');
    } finally {
      setBusy(false);
    }
  };

  const changeAvatar = async () => {
    if (!session?.user.id) return;
    setBusy(true);
    setMessage('');
    try {
      await pickAndUploadAvatar(session.user.id);
      await refreshProfile();
      setMessage('Profile photo updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update profile photo.');
    } finally {
      setBusy(false);
    }
  };

  const saveEmail = async () => {
    setBusy(true);
    setMessage('');
    try {
      await updateEmail(email);
      setMessage('Check your new email to confirm the change.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update email.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    setBusy(true);
    setMessage('');
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setMessage('Password updated.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update password.');
    } finally {
      setBusy(false);
    }
  };

  const visiblePosts = view === 'mine' ? posts.data ?? [] : savedPosts.data ?? [];
  const isLoadingPosts = view === 'mine' ? posts.isLoading : savedPosts.isLoading;

  const logout = async () => {
    setBusy(true);
    setMessage('');
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      queryClient.clear();
      clearSession();
      setBusy(false);
    }
  };

  return (
    <Screen>
      <FlatList
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Pressable onPress={changeAvatar} style={[styles.avatar, { backgroundColor: colors.background, borderColor: colors.border }]}>
                {profile.data?.avatar_url ? (
                  <Image source={{ uri: profile.data.avatar_url }} style={styles.avatarImage} contentFit="cover" />
                ) : (
                  <Body style={[styles.avatarInitial, { color: colors.accent }]}>{(profile.data?.username ?? 'P').slice(0, 1).toUpperCase()}</Body>
                )}
              </Pressable>

              <View style={styles.profileMain}>
                <Body style={[styles.kicker, { color: colors.accent }]}>My page</Body>
                <Heading>{profile.data?.username ? `@${profile.data.username}` : 'My page'}</Heading>
                <Body style={[styles.email, { color: colors.muted }]}>{session?.user.email}</Body>
                <Body style={[styles.bio, { color: colors.muted }]}>{profile.data?.bio || 'No bio yet.'}</Body>
              </View>
              <Pressable onPress={logout} style={[styles.smallButton, { borderColor: colors.border }]}>
                <Body>Logout</Body>
              </Pressable>
            </View>

            <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Body style={styles.sectionTitle}>회원정보 수정</Body>
              <TextInput
                autoCapitalize="none"
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor={colors.muted}
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                value={username}
              />
              <TextInput
                maxLength={160}
                multiline
                onChangeText={setBio}
                placeholder="Bio"
                placeholderTextColor={colors.muted}
                style={[styles.textarea, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                value={bio}
              />
              <Pressable disabled={busy} onPress={saveProfile} style={[styles.primary, { backgroundColor: colors.accent, opacity: busy ? 0.72 : 1 }]}>
                {busy ? <ActivityIndicator color="#fff" /> : <Body style={styles.primaryText}>Save profile</Body>}
              </Pressable>
            </View>

            <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Body style={styles.sectionTitle}>계정 설정</Body>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={colors.muted}
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                value={email}
              />
              <Pressable disabled={busy} onPress={saveEmail} style={[styles.secondary, { borderColor: colors.border }]}>
                <Body>Change email</Body>
              </Pressable>
              <TextInput
                autoCapitalize="none"
                onChangeText={setNewPassword}
                placeholder="New password"
                placeholderTextColor={colors.muted}
                secureTextEntry
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.text }]}
                value={newPassword}
              />
              <Pressable disabled={busy || !newPassword} onPress={savePassword} style={[styles.secondary, { borderColor: colors.border, opacity: newPassword ? 1 : 0.5 }]}>
                <Body>Change password</Body>
              </Pressable>
              <Body style={{ color: colors.muted, lineHeight: 20 }}>Google/Apple social login is available on the login page after enabling providers in Supabase Auth.</Body>
            </View>

            {profile.data?.is_admin ? (
              <View style={styles.row}>
                <Pressable onPress={() => router.push('/admin/questions')} style={[styles.secondary, { borderColor: colors.border }]}>
                  <Body>Questions</Body>
                </Pressable>
                <Pressable onPress={() => router.push('/admin/reports')} style={[styles.secondary, { borderColor: colors.border }]}>
                  <Body>Reports</Body>
                </Pressable>
              </View>
            ) : null}

            {message ? <Body style={{ color: colors.muted }}>{message}</Body> : null}
            <View style={[styles.segment, { borderColor: colors.border }]}>
              <Pressable onPress={() => setView('mine')} style={[styles.segmentItem, { backgroundColor: view === 'mine' ? colors.accent : 'transparent' }]}>
                <Body style={{ color: view === 'mine' ? '#fff' : colors.text }}>Mine</Body>
              </Pressable>
              <Pressable onPress={() => setView('saved')} style={[styles.segmentItem, { backgroundColor: view === 'saved' ? colors.accent : 'transparent' }]}>
                <Body style={{ color: view === 'saved' ? '#fff' : colors.text }}>Saved</Body>
              </Pressable>
            </View>
            {isLoadingPosts ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}
          </View>
        }
        contentContainerStyle={styles.grid}
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Body style={{ color: colors.muted }}>No PHRITs yet.</Body>
          </View>
        }
        numColumns={3}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/post/${item.id}`)} style={styles.tile}>
            <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" />
            <Body numberOfLines={2} style={styles.caption}>
              {item.caption}
            </Body>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerWrap: { gap: 14 },
  profileCard: { flexDirection: 'row', gap: 14, borderWidth: 1, borderRadius: 8, padding: 14, alignItems: 'flex-start' },
  avatar: { width: 82, height: 82, borderRadius: 41, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { fontSize: 34, fontWeight: '900' },
  profileMain: { flex: 1 },
  kicker: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginBottom: 6 },
  email: { marginTop: 8 },
  bio: { marginTop: 10, lineHeight: 20 },
  smallButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  settingsCard: { borderWidth: 1, borderRadius: 8, padding: 14, gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '900' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12 },
  textarea: { minHeight: 88, borderWidth: 1, borderRadius: 8, padding: 12, textAlignVertical: 'top' },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, padding: 3 },
  segmentItem: { flex: 1, alignItems: 'center', borderRadius: 6, paddingVertical: 10 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  primary: { borderRadius: 8, paddingHorizontal: 18, paddingVertical: 13, alignItems: 'center' },
  primaryText: { color: '#fff', fontWeight: '900' },
  secondary: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center' },
  loader: { marginTop: 16 },
  grid: { paddingVertical: 18, gap: 12 },
  empty: { borderWidth: 1, borderRadius: 8, padding: 18 },
  tile: { flex: 1, margin: 3 },
  image: { aspectRatio: 1, borderRadius: 8 },
  caption: { marginTop: 6, fontSize: 12, fontWeight: '700' },
});
