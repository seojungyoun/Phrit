import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { Screen } from '@/src/components/Screen';
import { Body, Heading } from '@/src/components/Typography';
import { useSessionStore } from '@/src/store/sessionStore';
import { useThemeColors } from '@/src/theme/useThemeColors';
import { useEchoes } from './api';

export function NotificationsScreen() {
  const colors = useThemeColors();
  const session = useSessionStore((state) => state.session);
  const echoes = useEchoes(session?.user.id);

  return (
    <Screen>
      <Heading>Echoes</Heading>
      {echoes.isLoading ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}
      <FlatList
        contentContainerStyle={styles.list}
        data={echoes.data ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Body style={{ color: colors.muted }}>No echoes yet.</Body>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: colors.card }]}>
            <Body style={styles.title}>@{item.profiles?.username ?? 'someone'} left a {item.reaction_type} reaction.</Body>
            <Body style={{ color: colors.muted }}>{item.posts?.caption}</Body>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 16 },
  list: { gap: 12, paddingVertical: 18 },
  empty: { borderWidth: 1, borderRadius: 14, padding: 18 },
  item: { borderRadius: 14, padding: 16, gap: 8 },
  title: { fontWeight: '800' },
});
