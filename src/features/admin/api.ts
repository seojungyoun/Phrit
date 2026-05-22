import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';

export const useQuestions = () =>
  useQuery({
    queryKey: ['admin-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_questions')
        .select('id,question_text,question_date,is_active,created_at')
        .order('question_date', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

export async function createQuestion(questionText: string, questionDate: string) {
  const cleanText = questionText.trim();
  if (cleanText.length < 8) throw new Error('Question is too short.');
  const { error } = await supabase.from('daily_questions').upsert(
    {
      question_text: cleanText.slice(0, 180),
      question_date: questionDate,
      is_active: true,
    },
    { onConflict: 'question_date' },
  );
  if (error) throw error;
}

export async function setQuestionActive(questionId: string, isActive: boolean) {
  const { error } = await supabase.from('daily_questions').update({ is_active: isActive }).eq('id', questionId);
  if (error) throw error;
}

export const useReports = () =>
  useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select('id,reason,status,created_at,profiles(username),posts(id,caption,user_id)')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

export async function setReportStatus(reportId: string, status: 'open' | 'reviewed' | 'dismissed') {
  const { error } = await supabase.from('reports').update({ status }).eq('id', reportId);
  if (error) throw error;
}
