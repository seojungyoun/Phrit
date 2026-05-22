import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';

export type PostComment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  profiles: { username: string | null } | null;
};

export const usePost = (postId?: string) =>
  useQuery({
    enabled: Boolean(postId),
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id,caption,image_url,created_at,user_id,profiles(username),reactions(count)')
        .eq('id', postId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const useComments = (postId?: string) =>
  useQuery({
    enabled: Boolean(postId),
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('id,body,created_at,user_id,profiles(username)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as PostComment[];
    },
  });

export const useIsSaved = (postId?: string, userId?: string) =>
  useQuery({
    enabled: Boolean(postId && userId),
    queryKey: ['saved', postId, userId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('saved_posts')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId)
        .eq('user_id', userId);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
  });

export const useBlockedUserIds = (userId?: string) =>
  useQuery({
    enabled: Boolean(userId),
    queryKey: ['blocked-users', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userId);
      if (error) throw error;
      return (data ?? []).map((row) => row.blocked_id as string);
    },
  });

export async function addComment(postId: string, userId: string, body: string) {
  const cleanBody = body.trim();
  if (!cleanBody) throw new Error('Enter a comment.');
  const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: userId, body: cleanBody.slice(0, 280) });
  if (error) throw error;
}

export async function deleteComment(commentId: string) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw error;
}

export async function toggleSave(postId: string, userId: string) {
  const { data, error } = await supabase.from('saved_posts').select('id').eq('post_id', postId).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  if (data?.id) {
    const { error: deleteError } = await supabase.from('saved_posts').delete().eq('id', data.id);
    if (deleteError) throw deleteError;
    return;
  }
  const { error: insertError } = await supabase.from('saved_posts').insert({ post_id: postId, user_id: userId });
  if (insertError) throw insertError;
}

export async function reportPost(postId: string, reporterId: string, reason: string) {
  const { error } = await supabase
    .from('reports')
    .upsert({ post_id: postId, reporter_id: reporterId, reason: reason.trim().slice(0, 280) || 'unspecified' }, { onConflict: 'post_id,reporter_id' });
  if (error) throw error;
}

export async function blockUser(blockerId: string, blockedId: string) {
  if (blockerId === blockedId) return;
  const { error } = await supabase.from('blocked_users').upsert({ blocker_id: blockerId, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id' });
  if (error) throw error;
}

export async function deletePost(postId: string) {
  const { error } = await supabase.from('posts').delete().eq('id', postId);
  if (error) throw error;
}
