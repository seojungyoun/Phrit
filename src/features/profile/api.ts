import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/src/lib/supabase';

export type Profile = {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  is_admin: boolean;
};

export type ProfilePost = {
  id: string;
  caption: string;
  image_url: string;
  created_at: string;
};

const first = <T,>(value: T | T[] | null | undefined) => (Array.isArray(value) ? value[0] : value) ?? null;

export const useProfile = (userId?: string) =>
  useQuery({
    enabled: Boolean(userId),
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id,username,avatar_url,bio,is_admin').eq('id', userId).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });

export const useMyPosts = (userId?: string) =>
  useQuery({
    enabled: Boolean(userId),
    queryKey: ['my-posts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id,caption,image_url,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ProfilePost[];
    },
  });

export const useSavedPosts = (userId?: string) =>
  useQuery({
    enabled: Boolean(userId),
    queryKey: ['saved-posts', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_posts')
        .select('id,posts(id,caption,image_url,created_at)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => first(row.posts)).filter(Boolean) as ProfilePost[];
    },
  });

export async function ensureProfile(userId: string, email?: string) {
  const baseName = email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') || 'user';
  const fallbackName = `${baseName}_${userId.slice(0, 8)}`;
  const { error } = await supabase
    .from('profiles')
    .upsert({ id: userId, username: fallbackName.slice(0, 24), bio: '' }, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw error;
}

export async function updateProfile(userId: string, username: string, bio: string) {
  const cleanUsername = username.trim().replace(/[^a-zA-Z0-9_]/g, '').slice(0, 24);
  if (cleanUsername.length < 3) throw new Error('Username must be at least 3 characters.');
  const { error } = await supabase.from('profiles').update({ username: cleanUsername, bio: bio.trim().slice(0, 160) }).eq('id', userId);
  if (error) throw error;
}
