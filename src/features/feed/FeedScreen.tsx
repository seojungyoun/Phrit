import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const contentWidth = Math.min(width - (isCompact ? 20 : 40), 960);

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
              <Pressable onPress={() => router.push('/notifications')} style={styles.iconButton}>
                <Ionicons name="notifications-outline" color="#fff" size={32} />
                <View style={[styles.notificationDot, { backgroundColor: colors.accent }]} />
              </Pressable>
              <Body style={styles.logo}>P H R I T</Body>
              <Pressable onPress={() => router.push('/profile')} style={styles.iconButton}>
                <Ionicons name="person-outline" color="#fff" size={32} />
              </Pressable>
            </View>

            <View style={styles.hero}>
              <Body style={[styles.kicker, { color: colors.accent }]}>TODAY'S QUESTION</Body>
              <Heading style={[styles.heroTitle, isCompact && styles.heroTitleCompact]}>{question.data?.question_text ?? 'Preparing today question'}</Heading>
              <Body style={styles.heroText}>{question.data ? 'Share a moment. Add one line.' : 'Create today question in Supabase first.'}</Body>
              <Pressable
                disabled={disabled}
                onPress={() => router.push('/post/create')}
                style={[styles.cameraButton, { borderColor: disabled ? colors.border : colors.accent, opacity: disabled ? 0.45 : 1 }]}
              >
                <Ionicons name="camera-outline" color={disabled ? colors.muted : colors.accent} size={40} />
              </Pressable>
              <Body style={[styles.actionLabel, { color: disabled ? colors.muted : colors.accent }]}>{hasPosted.data ? 'POSTED' : 'PHRIT IT'}</Body>
            </View>

            {error ? <Body style={[styles.message, { color: colors.accent }]}>Could not load the feed. Please try again.</Body> : null}
            {isLoading ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={[styles.empty, { borderColor: colors.border }]}>
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
            <Pressable onLongPress={() => react(item.id, item.user_id)} onPress={() => router.push(`/post/${item.id}`)} style={styles.card}>
              <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" />
              <LinearGradient colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.38)', 'rgba(0,0,0,0.88)']} style={styles.cardShade} />
              <Body numberOfLines={3} style={[styles.caption, isCompact && styles.captionCompact]}>
                {item.caption}
              </Body>
              <View style={styles.cardMeta}>
                <View style={[styles.avatar, { borderColor: 'rgba(255,255,255,0.32)' }]}>
                  {item.profiles?.avatar_url ? (
                    <Image source={{ uri: item.profiles.avatar_url }} style={styles.avatarImage} contentFit="cover" />
                  ) : (
                    <Body style={styles.avatarInitial}>{(item.profiles?.username ?? 'p').slice(0, 1).toUpperCase()}</Body>
                  )}
                </View>
                {!isCompact ? <Body style={styles.username}>{item.profiles?.username ?? 'phriter'}</Body> : null}
                <Body style={styles.time}>{new Date(item.created_at).toLocaleTimeString([], { minute: '2-digit', hour: 'numeric' })}</Body>
              </View>
            </Pressable>
          </MotiView>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center' },
  content: { alignSelf: 'center', paddingTop: 28, paddingBottom: 36 },
  header: { gap: 18, marginBottom: 16 },
  topbar: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', top: 7, right: 7, width: 9, height: 9, borderRadius: 5 },
  logo: { color: '#fff', fontSize: 25, fontWeight: '300', textAlign: 'center' },
  hero: { alignItems: 'center', paddingTop: 16, paddingBottom: 18 },
  kicker: { fontSize: 13, fontWeight: '800' },
  heroTitle: { marginTop: 26, maxWidth: 620, color: '#fff', textAlign: 'center', fontSize: 60, lineHeight: 72, fontWeight: '200' },
  heroTitleCompact: { fontSize: 42, lineHeight: 52 },
  heroText: { marginTop: 18, color: '#77777D', textAlign: 'center', fontSize: 18 },
  cameraButton: { marginTop: 34, width: 124, height: 124, borderRadius: 62, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { marginTop: 16, fontSize: 15, fontWeight: '800' },
  message: { textAlign: 'center' },
  loader: { marginVertical: 16 },
  columnWrap: { gap: 12 },
  itemWrap: { flex: 1, marginBottom: 12 },
  card: { flex: 1, aspectRatio: 0.72, borderRadius: 8, overflow: 'hidden', backgroundColor: '#111' },
  image: { width: '100%', height: '100%', opacity: 0.82 },
  cardShade: { ...StyleSheet.absoluteFillObject },
  caption: { position: 'absolute', left: 14, right: 14, top: '38%', color: '#fff', textAlign: 'center', fontSize: 23, lineHeight: 29, fontFamily: 'Georgia' },
  captionCompact: { left: 7, right: 7, fontSize: 13, lineHeight: 17 },
  cardMeta: { position: 'absolute', left: 14, right: 14, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 25, height: 25, borderRadius: 13, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { color: '#fff', fontSize: 11, fontWeight: '800' },
  username: { color: '#fff', flex: 1, fontSize: 13 },
  time: { color: '#C5C5C5', marginLeft: 'auto', fontSize: 13 },
  empty: { borderWidth: 1, borderRadius: 8, padding: 18 },
});
