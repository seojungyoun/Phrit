import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';

export const useEchoes = (userId?: string) =>
  useQuery({
    enabled: Boolean(userId),
    queryKey: ['echoes', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reactions')
        .select('id,reaction_type,created_at,profiles(username),posts!inner(user_id,caption)')
        .eq('posts.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });
