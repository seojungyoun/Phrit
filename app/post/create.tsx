import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/src/components/Screen';
import { Body, Heading } from '@/src/components/Typography';
import { useTodayQuestion } from '@/src/features/feed/api';
import { createPost } from '@/src/features/post/upload';
import { ensureProfile } from '@/src/features/profile/api';
import { useSessionStore } from '@/src/store/sessionStore';
import { useThemeColors } from '@/src/theme/useThemeColors';

export default function CreatePostScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const session = useSessionStore((state) => state.session);
  const question = useTodayQuestion();
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async () => {
    if (!session || !question.data) return;
    setLoading(true);
    setMessage('');
    try {
      await ensureProfile(session.user.id, session.user.email);
      await createPost(caption, session.user.id, question.data.id);
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
      <View style={styles.wrap}>
        <View>
          <Heading>PHRIT IT</Heading>
          <Body style={[styles.question, { color: colors.muted }]}>{question.data?.question_text ?? 'Create today question first.'}</Body>
        </View>

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

        <Pressable
          disabled={loading || !caption.trim() || !question.data}
          onPress={submit}
          style={[styles.primary, { backgroundColor: !caption.trim() || !question.data ? colors.border : colors.accent }]}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Body style={styles.primaryText}>Choose photo and post</Body>}
        </Pressable>
        <Pressable onPress={() => router.back()} style={[styles.secondary, { borderColor: colors.border }]}>
          <Body>Cancel</Body>
        </Pressable>
        {message ? <Body style={[styles.message, { color: colors.accent }]}>{message}</Body> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: 14 },
  question: { marginTop: 12, lineHeight: 22 },
  input: { minHeight: 120, borderWidth: 1, borderRadius: 16, padding: 14, fontSize: 18, textAlignVertical: 'top' },
  counter: { textAlign: 'right' },
  primary: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondary: { height: 48, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  message: { lineHeight: 21 },
});
