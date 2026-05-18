import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';

const pageSize = 10;

export const useFeed = () =>
  useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * pageSize;
      const to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('posts')
        .select('id,caption,image_url,created_at,profiles(username),reactions(count)')
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return data;
    },
    getNextPageParam: (last, all) => (last.length < pageSize ? undefined : all.length),
    initialPageParam: 0,
  });
