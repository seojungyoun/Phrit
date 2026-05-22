import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/src/components/Screen';
import { Body, Heading } from '@/src/components/Typography';
import { useThemeColors } from '@/src/theme/useThemeColors';
import { setReportStatus, useReports } from './api';

export function ReportsAdminScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const reports = useReports();

  const updateStatus = async (id: string, status: 'open' | 'reviewed' | 'dismissed') => {
    await setReportStatus(id, status);
    await queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
  };

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={reports.data ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <Body style={{ color: colors.accent }}>Back</Body>
            </Pressable>
            <Heading>Reports</Heading>
          </View>
        }
        ListEmptyComponent={
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Body style={{ color: colors.muted }}>No reports.</Body>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: colors.card }]}>
            <View style={styles.itemTop}>
              <Body style={styles.status}>{item.status}</Body>
              <Body style={{ color: colors.muted }}>@{item.profiles?.username ?? 'reporter'}</Body>
            </View>
            <Body>{item.posts?.caption ?? 'Deleted post'}</Body>
            <Body style={{ color: colors.muted }}>{item.reason}</Body>
            <View style={styles.actions}>
              <Pressable disabled={!item.posts?.id} onPress={() => item.posts?.id && router.push(`/post/${item.posts.id}`)} style={[styles.action, { borderColor: colors.border }]}>
                <Body>Open post</Body>
              </Pressable>
              <Pressable onPress={() => updateStatus(item.id, 'reviewed')} style={[styles.action, { borderColor: colors.border }]}>
                <Body>Reviewed</Body>
              </Pressable>
              <Pressable onPress={() => updateStatus(item.id, 'dismissed')} style={[styles.action, { borderColor: colors.border }]}>
                <Body>Dismiss</Body>
              </Pressable>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 18, gap: 12 },
  header: { gap: 14 },
  empty: { borderWidth: 1, borderRadius: 14, padding: 18 },
  item: { borderRadius: 14, padding: 14, gap: 8 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  status: { fontWeight: '800' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  action: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
});
