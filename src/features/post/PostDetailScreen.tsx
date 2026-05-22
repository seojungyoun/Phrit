import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/src/components/Screen';
import { Body, Heading } from '@/src/components/Typography';
import { toggleReaction } from '@/src/features/feed/api';
import { sendPush } from '@/src/features/notifications/push';
import { useSessionStore } from '@/src/store/sessionStore';
import { useThemeColors } from '@/src/theme/useThemeColors';
import { addComment, blockUser, deleteComment, deletePost, reportPost, toggleSave, useComments, useIsSaved, usePost } from './api';

export function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const session = useSessionStore((state) => state.session);
  const post = usePost(id);
  const comments = useComments(id);
  const saved = useIsSaved(id, session?.user.id);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const isOwner = Boolean(session?.user.id && post.data?.user_id === session.user.id);

  const refreshPost = async () => {
    await queryClient.invalidateQueries({ queryKey: ['post', id] });
    await queryClient.invalidateQueries({ queryKey: ['comments', id] });
    await queryClient.invalidateQueries({ queryKey: ['saved', id] });
    await queryClient.invalidateQueries({ queryKey: ['feed'] });
  };

  const submitComment = async () => {
    if (!id || !session?.user.id) return;
    setBusy(true);
    try {
      await addComment(id, session.user.id, body);
      if (post.data?.user_id && post.data.user_id !== session.user.id) {
        sendPush(post.data.user_id, 'New comment', 'Someone commented on your PHRIT.', { postId: id }).catch(() => undefined);
      }
      setBody('');
      await refreshPost();
    } finally {
      setBusy(false);
    }
  };

  const confirmDeletePost = () => {
    if (!id) return;
    Alert.alert('Delete post', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePost(id);
          await queryClient.invalidateQueries({ queryKey: ['feed'] });
          router.back();
        },
      },
    ]);
  };

  const report = async () => {
    if (!id || !session?.user.id) return;
    await reportPost(id, session.user.id, 'reported from app');
    Alert.alert('Report sent', 'Thanks. This post is marked for review.');
  };

  const block = async () => {
    if (!session?.user.id || !post.data?.user_id) return;
    await blockUser(session.user.id, post.data.user_id);
    await queryClient.invalidateQueries({ queryKey: ['blocked-users'] });
    await queryClient.invalidateQueries({ queryKey: ['feed'] });
    router.back();
  };

  if (post.isLoading) {
    return (
      <Screen style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </Screen>
    );
  }

  if (!post.data) {
    return (
      <Screen style={styles.center}>
        <Body style={{ color: colors.muted }}>Post not found.</Body>
      </Screen>
    );
  }

  const postData = post.data;

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={comments.data ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <Body style={{ color: colors.accent }}>Back</Body>
            </Pressable>
            <Heading>{postData.caption}</Heading>
            <Image source={{ uri: postData.image_url }} style={styles.image} contentFit="cover" />
            <Body style={{ color: colors.muted }}>@{postData.profiles?.username ?? 'phriter'}</Body>
            <View style={styles.actions}>
              <Pressable
                onPress={async () => {
                  if (!session?.user.id || !id) return;
                  await toggleReaction(id, session.user.id);
                  if (postData.user_id !== session.user.id) {
                    sendPush(postData.user_id, 'New echo', 'Someone felt your PHRIT.', { postId: id }).catch(() => undefined);
                  }
                  await refreshPost();
                }}
                style={[styles.action, { borderColor: colors.border }]}
              >
                <Body style={{ color: colors.accent }}>felt {postData.reactions?.[0]?.count ?? 0}</Body>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (!session?.user.id || !id) return;
                  await toggleSave(id, session.user.id);
                  await refreshPost();
                }}
                style={[styles.action, { borderColor: colors.border }]}
              >
                <Body>{saved.data ? 'Saved' : 'Save'}</Body>
              </Pressable>
              {isOwner ? (
                <Pressable onPress={confirmDeletePost} style={[styles.action, { borderColor: colors.border }]}>
                  <Body style={{ color: colors.accent }}>Delete</Body>
                </Pressable>
              ) : (
                <>
                  <Pressable onPress={report} style={[styles.action, { borderColor: colors.border }]}>
                    <Body>Report</Body>
                  </Pressable>
                  <Pressable onPress={block} style={[styles.action, { borderColor: colors.border }]}>
                    <Body>Block</Body>
                  </Pressable>
                </>
              )}
            </View>
            <Body style={styles.sectionTitle}>Comments</Body>
          </View>
        }
        ListEmptyComponent={<Body style={{ color: colors.muted }}>No comments yet.</Body>}
        ListFooterComponent={
          <View style={styles.composer}>
            <TextInput
              maxLength={280}
              multiline
              onChangeText={setBody}
              placeholder="Leave a comment"
              placeholderTextColor={colors.muted}
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
              value={body}
            />
            <Pressable disabled={busy || !body.trim()} onPress={submitComment} style={[styles.primary, { backgroundColor: body.trim() ? colors.accent : colors.border }]}>
              {busy ? <ActivityIndicator color="#fff" /> : <Body style={styles.primaryText}>Post comment</Body>}
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.comment, { backgroundColor: colors.card }]}>
            <View style={styles.commentTop}>
              <Body style={styles.commentAuthor}>@{item.profiles?.username ?? 'phriter'}</Body>
              {item.user_id === session?.user.id ? (
                <Pressable
                  onPress={async () => {
                    await deleteComment(item.id);
                    await refreshPost();
                  }}
                >
                  <Body style={{ color: colors.accent }}>Delete</Body>
                </Pressable>
              ) : null}
            </View>
            <Body>{item.body}</Body>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingVertical: 18, gap: 12 },
  header: { gap: 14 },
  image: { width: '100%', aspectRatio: 1, borderRadius: 16 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  sectionTitle: { marginTop: 8, fontWeight: '800' },
  comment: { borderRadius: 14, padding: 14, gap: 8 },
  commentTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  commentAuthor: { fontWeight: '800' },
  composer: { gap: 10, paddingTop: 10 },
  input: { minHeight: 88, borderWidth: 1, borderRadius: 14, padding: 12, textAlignVertical: 'top' },
  primary: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '800' },
});
