import { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/src/components/Screen';
import { Body, Heading } from '@/src/components/Typography';
import { supabase } from '@/src/lib/supabase';
import { useThemeColors } from '@/src/theme/useThemeColors';

const first = <T,>(value: T | T[] | null | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;

export function SearchScreen() {
  const colors = useThemeColors();
  const [term, setTerm] = useState('');
  const query = term.trim();
  const results = useQuery({
    enabled: query.length >= 2,
    queryKey: ['search', query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id,caption,created_at,profiles(username)')
        .ilike('caption', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return (data ?? []).map((item) => ({ ...item, profiles: first(item.profiles) }));
    },
  });

  return (
    <Screen>
      <Heading>Search</Heading>
      <TextInput
        autoCapitalize="none"
        onChangeText={setTerm}
        placeholder="Search captions"
        placeholderTextColor={colors.muted}
        style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
        value={term}
      />
      {results.isLoading ? <ActivityIndicator color={colors.accent} style={styles.loader} /> : null}
      <FlatList
        contentContainerStyle={styles.list}
        data={results.data ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Body style={{ color: colors.muted }}>{query.length < 2 ? 'Enter at least two characters.' : 'No results yet.'}</Body>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: colors.card }]}>
            <Body style={styles.caption}>{item.caption}</Body>
            <Body style={{ color: colors.muted }}>@{item.profiles?.username ?? 'phriter'}</Body>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, marginTop: 18, fontSize: 16 },
  loader: { marginTop: 16 },
  list: { gap: 12, paddingVertical: 18 },
  empty: { borderWidth: 1, borderRadius: 14, padding: 18 },
  item: { borderRadius: 14, padding: 16, gap: 8 },
  caption: { fontSize: 17, fontWeight: '700' },
});
