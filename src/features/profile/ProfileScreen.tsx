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
import { ensureProfile, updateProfile, useMyPosts, useProfile, useSavedPosts } from './api';

export function ProfileScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const session = useSessionStore((state) => state.session);
  const profile = useProfile(session?.user.id);
  const posts = useMyPosts(session?.user.id);
  const savedPosts = useSavedPosts(session?.user.id);
  const [isEditing, setIsEditing] = useState(false);
  const [view, setView] = useState<'mine' | 'saved'>('mine');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [message, setMessage] = useState('');

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
  }, [profile.data]);

  const save = async () => {
    if (!session?.user.id) return;
    setMessage('');
    try {
      await updateProfile(session.user.id, username, bio);
      await queryClient.invalidateQueries({ queryKey: ['profile', session.user.id] });
      setIsEditing(false);
      setMessage('Profile saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save profile.');
    }
  };

  const visiblePosts = view === 'mine' ? posts.data ?? [] : savedPosts.data ?? [];
  const isLoadingPosts = view === 'mine' ? posts.isLoading : savedPosts.isLoading;

  return (
    <Screen>
      <FlatList
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <View style={styles.header}>
              <View style={styles.titleBlock}>
                <Heading>{profile.data?.username ? `@${profile.data.username}` : 'Profile'}</Heading>
                <Body style={[styles.email, { color: colors.muted }]}>{session?.user.email}</Body>
              </View>
              <Pressable onPress={() => supabase.auth.signOut()} style={[styles.smallButton, { borderColor: colors.border }]}>
                <Body>Logout</Body>
              </Pressable>
            </View>

            {isEditing ? (
              <View style={styles.editor}>
                <TextInput
                  autoCapitalize="none"
                  onChangeText={setUsername}
                  placeholder="username"
                  placeholderTextColor={colors.muted}
                  style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
                  value={username}
                />
                <TextInput
                  maxLength={160}
                  multiline
                  onChangeText={setBio}
                  placeholder="bio"
                  placeholderTextColor={colors.muted}
                  style={[styles.textarea, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
                  value={bio}
                />
                <View style={styles.row}>
                  <Pressable onPress={save} style={[styles.primary, { backgroundColor: colors.accent }]}>
                    <Body style={styles.primaryText}>Save</Body>
                  </Pressable>
                  <Pressable onPress={() => setIsEditing(false)} style={[styles.secondary, { borderColor: colors.border }]}>
                    <Body>Cancel</Body>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.profileActions}>
                <Body style={{ color: colors.muted }}>{profile.data?.bio || 'No bio yet.'}</Body>
                <View style={styles.row}>
                  <Pressable onPress={() => setIsEditing(true)} style={[styles.secondary, { borderColor: colors.border }]}>
                    <Body>Edit profile</Body>
                  </Pressable>
                  {profile.data?.is_admin ? (
                    <>
                      <Pressable onPress={() => router.push('/admin/questions')} style={[styles.secondary, { borderColor: colors.border }]}>
                        <Body>Questions</Body>
                      </Pressable>
                      <Pressable onPress={() => router.push('/admin/reports')} style={[styles.secondary, { borderColor: colors.border }]}>
                        <Body>Reports</Body>
                      </Pressable>
                    </>
                  ) : null}
                </View>
              </View>
            )}

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
        numColumns={2}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' },
  titleBlock: { flex: 1 },
  email: { marginTop: 8 },
  smallButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  editor: { gap: 10 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  textarea: { minHeight: 88, borderWidth: 1, borderRadius: 14, padding: 12, textAlignVertical: 'top' },
  profileActions: { gap: 12 },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, padding: 3 },
  segmentItem: { flex: 1, alignItems: 'center', borderRadius: 11, paddingVertical: 10 },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  primary: { borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12 },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondary: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 11 },
  loader: { marginTop: 16 },
  grid: { paddingVertical: 18, gap: 12 },
  empty: { borderWidth: 1, borderRadius: 14, padding: 18 },
  tile: { flex: 1, margin: 4 },
  image: { aspectRatio: 1, borderRadius: 12 },
  caption: { marginTop: 8, fontWeight: '700' },
});
