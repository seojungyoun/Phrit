import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/src/components/Screen';
import { Body, Heading } from '@/src/components/Typography';
import { useTodayQuestion } from '@/src/features/feed/api';
import { createPostWithImage, pickPostImageFromLibrary, PickedPostImage, takePostPhoto } from '@/src/features/post/upload';
import { ensureProfile } from '@/src/features/profile/api';
import { useSessionStore } from '@/src/store/sessionStore';
import { useThemeColors } from '@/src/theme/useThemeColors';

export default function CreatePostScreen() {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const session = useSessionStore((state) => state.session);
  const question = useTodayQuestion();
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState<PickedPostImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const isWide = width >= 860;
  const previewWidth = Math.min(isWide ? 390 : width - 40, 430);
  const canPost = Boolean(caption.trim() && image && question.data && !loading);
  const disabledReason = !question.data
    ? 'Today question is missing. Run supabase/schema.sql or create a question as admin.'
    : !image
      ? 'Choose a photo or capture one with the camera.'
      : !caption.trim()
        ? 'Write one sentence before posting.'
        : '';

  const chooseLibrary = async () => {
    setMessage('');
    try {
      const picked = await pickPostImageFromLibrary();
      if (picked) setImage(picked);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not open photo library.');
    }
  };

  const openCamera = async () => {
    setMessage('');
    try {
      const captured = await takePostPhoto();
      if (captured) setImage(captured);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not open camera.');
    }
  };

  const submit = async () => {
    if (!session) {
      setMessage('Sign in again before posting.');
      return;
    }
    if (!question.data || !image || !caption.trim()) {
      setMessage(disabledReason);
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await ensureProfile(session.user.id, session.user.email);
      await createPostWithImage(caption, session.user.id, question.data.id, image);
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      await queryClient.invalidateQueries({ queryKey: ['has-posted-today'] });
      router.back();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not create the post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[styles.page, isWide && styles.pageWide]} keyboardShouldPersistTaps="handled">
        <View style={[styles.previewPanel, { width: previewWidth }]}>
          <View style={[styles.storyFrame, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {image ? (
              <Image source={{ uri: image.uri }} style={styles.previewImage} contentFit="cover" />
            ) : (
              <View style={styles.emptyPreview}>
                <Body style={[styles.previewBrand, { color: colors.accent }]}>PHRIT</Body>
                <Body style={[styles.previewHint, { color: colors.muted }]}>Choose a photo or open the camera.</Body>
              </View>
            )}
            <View style={[styles.previewCaption, { backgroundColor: colors.overlay }]}>
              <Body numberOfLines={3} style={styles.previewCaptionText}>
                {caption.trim() || 'One sentence for today'}
              </Body>
            </View>
          </View>
        </View>

        <View style={[styles.controls, { maxWidth: isWide ? 420 : undefined }]}>
          <View>
            <Body style={[styles.kicker, { color: colors.accent }]}>Create</Body>
            <Heading>PHRIT IT</Heading>
            <Body style={[styles.question, { color: colors.muted }]}>{question.data?.question_text ?? 'Create today question first.'}</Body>
          </View>

          <View style={styles.mediaActions}>
            <Pressable onPress={chooseLibrary} style={[styles.mediaButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Body style={styles.mediaTitle}>{Platform.OS === 'web' ? 'Upload file' : 'Album'}</Body>
              <Body style={{ color: colors.muted }}>Pick from your device</Body>
            </Pressable>
            <Pressable onPress={openCamera} style={[styles.mediaButton, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Body style={styles.mediaTitle}>Camera</Body>
              <Body style={{ color: colors.muted }}>Take it now</Body>
            </Pressable>
          </View>

          <View>
            <TextInput
              maxLength={80}
              multiline
              onChangeText={setCaption}
              placeholder="One sentence for today"
              placeholderTextColor={colors.muted}
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
              value={caption}
            />
            <Body style={[styles.counter, { color: colors.muted }]}>{caption.length}/80</Body>
          </View>

          <Pressable disabled={!canPost} onPress={submit} style={[styles.primary, { backgroundColor: canPost ? colors.accent : colors.border }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Body style={[styles.primaryText, { color: canPost ? '#fff' : colors.muted }]}>Post story</Body>}
          </Pressable>
          {!canPost && !loading ? <Body style={[styles.disabledReason, { color: colors.muted }]}>{disabledReason}</Body> : null}
          <Pressable onPress={() => router.back()} style={[styles.secondary, { borderColor: colors.border }]}>
            <Body>Cancel</Body>
          </Pressable>
          {message ? <Body style={[styles.message, { color: colors.accent }]}>{message}</Body> : null}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: 'center', gap: 22, paddingVertical: 20 },
  pageWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 44 },
  previewPanel: { alignSelf: 'center' },
  storyFrame: { width: '100%', aspectRatio: 9 / 16, borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  emptyPreview: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  previewBrand: { fontSize: 30, fontWeight: '900' },
  previewHint: { marginTop: 12, textAlign: 'center', lineHeight: 21 },
  previewCaption: { position: 'absolute', left: 20, right: 20, bottom: 34, borderRadius: 8, padding: 12 },
  previewCaptionText: { color: '#fff', textAlign: 'center', fontSize: 18, fontWeight: '800' },
  controls: { flex: 1, gap: 16 },
  kicker: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase' },
  question: { marginTop: 12, lineHeight: 22 },
  mediaActions: { flexDirection: 'row', gap: 10 },
  mediaButton: { flex: 1, minHeight: 86, borderWidth: 1, borderRadius: 8, padding: 14, justifyContent: 'center' },
  mediaTitle: { fontSize: 16, fontWeight: '900', marginBottom: 6 },
  input: { minHeight: 112, borderWidth: 1, borderRadius: 8, padding: 14, fontSize: 18, textAlignVertical: 'top' },
  counter: { textAlign: 'right', marginTop: 6 },
  primary: { height: 54, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontWeight: '900' },
  disabledReason: { marginTop: -6, lineHeight: 19 },
  secondary: { height: 48, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  message: { lineHeight: 21 },
});
