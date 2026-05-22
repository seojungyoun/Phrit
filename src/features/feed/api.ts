import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';

const pageSize = 10;

const getLocalDateKey = () => {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

export type FeedPost = {
  id: string;
  caption: string;
  image_url: string;
  created_at: string;
  user_id: string;
  profiles: { username: string | null; avatar_url?: string | null } | null;
  reactions?: { count: number }[];
};

export type DailyQuestion = {
  id: string;
  question_text: string;
  question_date: string;
};

const first = <T,>(value: T | T[] | null | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;

export const useFeed = () =>
  useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('posts')
        .select('id,caption,image_url,created_at,user_id,profiles(username,avatar_url),reactions(count)')
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return (data ?? []).map((post) => ({ ...post, profiles: first(post.profiles) })) as unknown as FeedPost[];
    },
    getNextPageParam: (last, all) => (last.length < pageSize ? undefined : all.length),
    initialPageParam: 0,
  });

export async function toggleReaction(postId: string, userId: string, reactionType: 'felt' | 'echo' | 'ripple' = 'felt') {
  const { data, error } = await supabase
    .from('reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType)
    .maybeSingle();
  if (error) throw error;

  if (data?.id) {
    const { error: deleteError } = await supabase.from('reactions').delete().eq('id', data.id);
    if (deleteError) throw deleteError;
    return;
  }

  const { error: insertError } = await supabase.from('reactions').insert({ post_id: postId, user_id: userId, reaction_type: reactionType });
  if (insertError) throw insertError;
}

export const useTodayQuestion = () =>
  useQuery({
    queryKey: ['today-question'],
    queryFn: async () => {
      const today = getLocalDateKey();
      const { data, error } = await supabase
        .from('daily_questions')
        .select('id,question_text,question_date')
        .eq('question_date', today)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data as DailyQuestion | null;
    },
  });

export const useHasPostedToday = (userId?: string, questionId?: string) =>
  useQuery({
    enabled: Boolean(userId && questionId),
    queryKey: ['has-posted-today', userId, questionId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('question_id', questionId);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
  });
