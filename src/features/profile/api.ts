import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
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

export async function pickAndUploadAvatar(userId: string) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Photo library permission is required.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.82,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const blob = await fetch(asset.uri).then((response) => response.blob());
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const { error: uploadError } = await supabase.storage.from('profile-images').upload(path, blob, {
    contentType: blob.type || 'image/jpeg',
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('profile-images').getPublicUrl(path);
  const { error } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId);
  if (error) throw error;
  return data.publicUrl;
}

export async function updatePassword(password: string) {
  if (password.length < 8) throw new Error('Password must be at least 8 characters.');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function updateEmail(email: string) {
  const cleanEmail = email.trim();
  if (!cleanEmail.includes('@')) throw new Error('Enter a valid email.');
  const { error } = await supabase.auth.updateUser({ email: cleanEmail });
  if (error) throw error;
}
