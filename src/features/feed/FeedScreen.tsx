import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/src/components/Screen';
import { Body, Heading } from '@/src/components/Typography';
import { sendPush } from '@/src/features/notifications/push';
import { useBlockedUserIds } from '@/src/features/post/api';
import { useSessionStore } from '@/src/store/sessionStore';
import { useThemeColors } from '@/src/theme/useThemeColors';
import { toggleReaction, useFeed, useHasPostedToday, useTodayQuestion } from './api';

export function FeedScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const session = useSessionStore((state) => state.session);
  const question = useTodayQuestion();
  const blockedUsers = useBlockedUserIds(session?.user.id);
  const hasPosted = useHasPostedToday(session?.user.id, question.data?.id);
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } = useFeed();
  const blockedSet = new Set(blockedUsers.data ?? []);
  const posts = (data?.pages.flat() ?? []).filter((post) => !blockedSet.has(post.user_id));
  const disabled = !question.data || Boolean(hasPosted.data);

  const react = async (postId: string, ownerId: string) => {
    if (!session?.user.id) return;
    await toggleReaction(postId, session.user.id);
    if (ownerId !== session.user.id) {
      sendPush(ownerId, 'New echo', 'Someone felt your PHRIT.', { postId }).catch(() => undefined);
    }
    await queryClient.invalidateQueries({ queryKey: ['feed'] });
    await queryClient.invalidateQueries({ queryKey: ['echoes'] });
  };

  return (
    <Screen>
      <Body style={styles.logo}>PHRIT</Body>
      <Heading>{question.data?.question_text ?? 'Preparing today question'}</Heading>
      <Body style={[styles.subcopy, { color: colors.muted }]}>
        {question.data ? 'Share one photo and one short sentence each day.' : 'Create today question in Supabase first.'}
      </Body>
      <Pressable
        disabled={disabled}
        onPress={() => router.push('/post/create')}
        style={[styles.button, { backgroundColor: disabled ? colors.border : colors.accent }]}
      >
        <Body style={[styles.buttonText, { color: disabled ? colors.muted : '#fff' }]}>{hasPosted.data ? 'Already posted today' : 'PHRIT IT'}</Body>
      </Pressable>
      {error ? <Body style={[styles.message, { color: colors.accent }]}>Could not load the feed. Please try again.</Body> : null}
      {isLoading ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}
      <FlatList
        contentContainerStyle={styles.list}
        data={posts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !isLoading ? (
            <View style={[styles.empty, { borderColor: colors.border }]}>
              <Body style={{ color: colors.muted }}>No PHRITs yet. Share the first moment today.</Body>
            </View>
          ) : null
        }
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}
        onEndReached={() => hasNextPage && fetchNextPage()}
        refreshControl={<RefreshControl refreshing={isRefetching} tintColor={colors.accent} onRefresh={refetch} />}
        renderItem={({ item, index }) => (
          <MotiView animate={{ opacity: 1 }} from={{ opacity: 0 }} transition={{ delay: index * 40 }}>
            <Pressable onPress={() => router.push(`/post/${item.id}`)} style={[styles.card, { backgroundColor: colors.card }]}>
              <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" />
              <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
                <Body style={styles.caption}>{item.caption}</Body>
              </View>
              <Body style={[styles.meta, { color: colors.muted }]}>
                @{item.profiles?.username ?? 'phriter'} - {new Date(item.created_at).toLocaleTimeString()}
              </Body>
              <Pressable onPress={() => react(item.id, item.user_id)} style={[styles.reaction, { borderColor: colors.border }]}>
                <Body style={{ color: colors.accent }}>felt {item.reactions?.[0]?.count ?? 0}</Body>
              </Pressable>
            </Pressable>
          </MotiView>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { textAlign: 'center', marginTop: 8, marginBottom: 20, fontWeight: '700' },
  subcopy: { marginTop: 10, lineHeight: 21 },
  button: { marginTop: 16, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  buttonText: { fontWeight: '700' },
  message: { marginTop: 12 },
  loader: { marginVertical: 16 },
  list: { paddingVertical: 16, gap: 16 },
  card: { borderRadius: 18, padding: 10, overflow: 'hidden' },
  image: { height: 240, borderRadius: 12 },
  overlay: { position: 'absolute', top: 80, left: 24, right: 24, borderRadius: 8, padding: 8 },
  caption: { textAlign: 'center', color: '#fff', fontWeight: '300' },
  meta: { marginTop: 10 },
  reaction: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginTop: 10 },
  empty: { borderWidth: 1, borderRadius: 14, padding: 18 },
});
