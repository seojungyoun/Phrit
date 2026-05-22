import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/src/components/Screen';
import { Body, Heading } from '@/src/components/Typography';
import { useThemeColors } from '@/src/theme/useThemeColors';
import { createQuestion, setQuestionActive, useQuestions } from './api';

const getDateKey = () => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

export function QuestionsAdminScreen() {
  const colors = useThemeColors();
  const queryClient = useQueryClient();
  const questions = useQuestions();
  const [questionText, setQuestionText] = useState('');
  const [questionDate, setQuestionDate] = useState(getDateKey());
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setMessage('');
    try {
      await createQuestion(questionText, questionDate);
      setQuestionText('');
      await queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
      await queryClient.invalidateQueries({ queryKey: ['today-question'] });
      setMessage('Question saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save question.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <FlatList
        contentContainerStyle={styles.content}
        data={questions.data ?? []}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable onPress={() => router.back()}>
              <Body style={{ color: colors.accent }}>Back</Body>
            </Pressable>
            <Heading>Questions</Heading>
            <TextInput
              onChangeText={setQuestionDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              style={[styles.input, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
              value={questionDate}
            />
            <TextInput
              maxLength={180}
              multiline
              onChangeText={setQuestionText}
              placeholder="Question text"
              placeholderTextColor={colors.muted}
              style={[styles.textarea, { borderColor: colors.border, backgroundColor: colors.card, color: colors.text }]}
              value={questionText}
            />
            <Pressable disabled={busy} onPress={submit} style={[styles.primary, { backgroundColor: colors.accent }]}>
              {busy ? <ActivityIndicator color="#fff" /> : <Body style={styles.primaryText}>Save question</Body>}
            </Pressable>
            {message ? <Body style={{ color: colors.muted }}>{message}</Body> : null}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: colors.card }]}>
            <View style={styles.itemTop}>
              <Body style={styles.date}>{item.question_date}</Body>
              <Pressable
                onPress={async () => {
                  await setQuestionActive(item.id, !item.is_active);
                  await queryClient.invalidateQueries({ queryKey: ['admin-questions'] });
                  await queryClient.invalidateQueries({ queryKey: ['today-question'] });
                }}
              >
                <Body style={{ color: item.is_active ? colors.accent : colors.muted }}>{item.is_active ? 'Active' : 'Paused'}</Body>
              </Pressable>
            </View>
            <Body>{item.question_text}</Body>
          </View>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: 18, gap: 12 },
  header: { gap: 12 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  textarea: { minHeight: 96, borderWidth: 1, borderRadius: 14, padding: 12, textAlignVertical: 'top' },
  primary: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '800' },
  item: { borderRadius: 14, padding: 14, gap: 8 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  date: { fontWeight: '800' },
});
