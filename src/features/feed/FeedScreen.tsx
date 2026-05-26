import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const session = useSessionStore((state) => state.session);
  const question = useTodayQuestion();
  const blockedUsers = useBlockedUserIds(session?.user.id);
  const hasPosted = useHasPostedToday(session?.user.id, question.data?.id);
  const { data, error, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } = useFeed();
  const blockedSet = new Set(blockedUsers.data ?? []);
  const posts = (data?.pages.flat() ?? []).filter((post) => !blockedSet.has(post.user_id));
  const disabled = !question.data || Boolean(hasPosted.data);
  const columns = 3;
  const isCompact = width < 560;
  const contentWidth = Math.min(width - (isCompact ? 16 : 40), 1120);

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
    <Screen style={styles.screen}>
      <FlatList
        key={columns}
        columnWrapperStyle={styles.columnWrap}
        contentContainerStyle={[styles.content, { width: contentWidth }]}
        data={posts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topbar}>
              <Body style={[styles.logo, { color: colors.accent }]}>PHRIT</Body>
              <Pressable
                disabled={disabled}
                onPress={() => router.push('/post/create')}
                style={[styles.topButton, { backgroundColor: disabled ? colors.border : colors.accent }]}
              >
                <Body style={[styles.topButtonText, { color: disabled ? colors.muted : '#fff' }]}>{hasPosted.data ? 'Posted' : 'Create'}</Body>
              </Pressable>
            </View>

            <View style={[styles.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.heroCopy}>
                <Body style={[styles.kicker, { color: colors.accent }]}>Today question</Body>
                <Heading style={styles.heroTitle}>{question.data?.question_text ?? 'Preparing today question'}</Heading>
                <Body style={[styles.heroText, { color: colors.muted }]}>
                  {question.data ? 'Share one photo and one short sentence. Keep it quiet, honest, and today-shaped.' : 'Create today question in Supabase first.'}
                </Body>
              </View>
              <Pressable
                disabled={disabled}
                onPress={() => router.push('/post/create')}
                style={[styles.heroAction, { backgroundColor: disabled ? colors.border : colors.accent }]}
              >
                <Body style={[styles.heroActionText, { color: disabled ? colors.muted : '#fff' }]}>{hasPosted.data ? 'Already posted today' : 'PHRIT IT'}</Body>
              </Pressable>
            </View>

            {error ? <Body style={[styles.message, { color: colors.accent }]}>Could not load the feed. Please try again.</Body> : null}
            {isLoading ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Body style={{ color: colors.muted }}>No PHRITs yet. Share the first moment today.</Body>
            </View>
          ) : null
        }
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}
        numColumns={columns}
        onEndReached={() => hasNextPage && fetchNextPage()}
        refreshControl={<RefreshControl refreshing={isRefetching} tintColor={colors.accent} onRefresh={refetch} />}
        renderItem={({ item, index }) => (
          <MotiView animate={{ opacity: 1, translateY: 0 }} from={{ opacity: 0, translateY: 8 }} style={styles.itemWrap} transition={{ delay: index * 35 }}>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Pressable onPress={() => router.push(`/post/${item.id}`)} style={styles.imageButton}>
                <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.82)']} style={styles.overlay}>
                  <Body numberOfLines={isCompact ? 2 : 3} style={[styles.caption, isCompact && styles.captionCompact]}>
                    {item.caption}
                  </Body>
                </LinearGradient>
              </Pressable>
              <View style={[styles.cardFooter, isCompact && styles.cardFooterCompact]}>
                <View style={styles.metaBlock}>
                  <Body style={styles.username}>@{item.profiles?.username ?? 'phriter'}</Body>
                  <Body style={{ color: colors.muted }}>{new Date(item.created_at).toLocaleTimeString()}</Body>
                </View>
                <Pressable onPress={() => react(item.id, item.user_id)} style={[styles.reaction, isCompact && styles.reactionCompact, { borderColor: colors.border }]}>
                  <Body style={{ color: colors.accent }}>felt {item.reactions?.[0]?.count ?? 0}</Body>
                </Pressable>
              </View>
            </View>
          </MotiView>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center' },
  content: { alignSelf: 'center', paddingVertical: 12, paddingBottom: 36 },
  header: { gap: 16, marginBottom: 18 },
  topbar: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 18, fontWeight: '900' },
  topButton: { minWidth: 92, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  topButtonText: { fontWeight: '900' },
  hero: { borderWidth: 1, borderRadius: 8, padding: 20, gap: 18 },
  heroCopy: { gap: 10 },
  kicker: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  heroTitle: { maxWidth: 760 },
  heroText: { maxWidth: 620, lineHeight: 22 },
  heroAction: { height: 52, borderRadius: 8, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 22 },
  heroActionText: { fontWeight: '900' },
  message: { marginTop: 2 },
  loader: { marginVertical: 16 },
  columnWrap: { gap: 6 },
  itemWrap: { flex: 1, marginBottom: 6 },
  card: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 4, overflow: 'hidden' },
  imageButton: { width: '100%', aspectRatio: 1, borderRadius: 6, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0, minHeight: 92, justifyContent: 'flex-end', padding: 8 },
  caption: { textAlign: 'center', color: '#fff', fontWeight: '800', lineHeight: 20 },
  captionCompact: { fontSize: 10, lineHeight: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center', paddingTop: 10 },
  cardFooterCompact: { display: 'none' },
  metaBlock: { flex: 1 },
  username: { fontWeight: '900', marginBottom: 2 },
  reaction: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7 },
  reactionCompact: { display: 'none' },
  empty: { borderWidth: 1, borderRadius: 8, padding: 18 },
});
