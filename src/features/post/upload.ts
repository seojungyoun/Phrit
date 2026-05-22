import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '@/src/lib/supabase';

export async function createPost(caption: string, userId: string, questionId: string) {
  const cleanCaption = caption.trim().slice(0, 80);
  if (!cleanCaption) throw new Error('Enter a short sentence.');

  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 });
  if (result.canceled || !result.assets[0]) return;
  const compressed = await manipulateAsync(result.assets[0].uri, [{ resize: { width: 1440 } }], { compress: 0.78, format: SaveFormat.JPEG });
  const path = `${userId}/${Date.now()}.jpg`;
  const file = await fetch(compressed.uri).then((r) => r.blob());
  const { error: uploadError } = await supabase.storage.from('post-images').upload(path, file, { contentType: 'image/jpeg' });
  if (uploadError) throw uploadError;
  const { data } = supabase.storage.from('post-images').getPublicUrl(path);
  const { error } = await supabase.from('posts').insert({ caption: cleanCaption, image_url: data.publicUrl, user_id: userId, question_id: questionId });
  if (error) throw error;
}
