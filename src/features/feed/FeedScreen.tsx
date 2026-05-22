import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { Screen } from '@/src/components/Screen';
import { Body, Heading } from '@/src/components/Typography';
import { useThemeColors } from '@/src/theme/useThemeColors';
import { useFeed } from './api';

export function FeedScreen() {
  const colors = useThemeColors();
  const { data, fetchNextPage, hasNextPage } = useFeed();
  const posts = data?.pages.flat() ?? [];

  return (
    <Screen>
      <Body style={styles.logo}>PHRIT</Body>
      <Heading>What felt most like today?</Heading>
      <Pressable style={[styles.button, { backgroundColor: colors.accent }]}><Body style={styles.buttonText}>PHRIT IT</Body></Pressable>
      <FlatList
        data={posts}
        onEndReached={() => hasNextPage && fetchNextPage()}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 40 }}>
            <View style={[styles.card, { backgroundColor: colors.card }]}> 
              <Image source={{ uri: item.image_url }} style={styles.image} contentFit="cover" />
              <View style={[styles.overlay, { backgroundColor: colors.overlay }]}><Body style={styles.caption}>{item.caption}</Body></View>
              <Body style={{ color: colors.muted }}>@{item.profiles?.username} · {new Date(item.created_at).toLocaleTimeString()}</Body>
            </View>
          </MotiView>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { textAlign: 'center', marginTop: 8, marginBottom: 20, fontWeight: '700' },
  button: { marginTop: 16, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  buttonText: { color: '#fff', letterSpacing: 1.2, fontWeight: '700' },
  list: { paddingVertical: 16, gap: 16 },
  card: { borderRadius: 18, padding: 10, overflow: 'hidden' },
  image: { height: 240, borderRadius: 12 },
  overlay: { position: 'absolute', top: 80, left: 24, right: 24, borderRadius: 8, padding: 8 },
  caption: { textAlign: 'center', color: '#fff', fontWeight: '300' },
});
