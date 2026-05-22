import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from '@/src/lib/supabase';

export async function registerPushToken(userId: string) {
  if (!Device.isDevice) return null;

  const current = await Notifications.getPermissionsAsync();
  const permission = current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.projectId;
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : {});

  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      token: token.data,
      platform: Device.osName ?? 'unknown',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  );
  if (error) throw error;
  return token.data;
}

export async function sendPush(userId: string, title: string, body: string, data?: Record<string, string>) {
  const { error } = await supabase.functions.invoke('send-push', {
    body: { userId, title, body, data },
  });
  if (error) throw error;
}
