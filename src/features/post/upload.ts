import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { supabase } from '@/src/lib/supabase';

export type PickedPostImage = {
  uri: string;
  width?: number;
  height?: number;
};

const pickerOptions: ImagePicker.ImagePickerOptions = {
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  allowsEditing: true,
  aspect: [9, 16],
  quality: 0.88,
};

export async function pickPostImageFromLibrary() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Photo library permission is required.');

  const result = await ImagePicker.launchImageLibraryAsync(pickerOptions);
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0] satisfies PickedPostImage;
}

export async function takePostPhoto() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new Error('Camera permission is required.');

  const result = await ImagePicker.launchCameraAsync(pickerOptions);
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0] satisfies PickedPostImage;
}

export async function createPostWithImage(caption: string, userId: string, questionId: string, image: PickedPostImage) {
  const cleanCaption = caption.trim().slice(0, 80);
  if (!cleanCaption) throw new Error('Enter a short sentence.');
  if (!image.uri) throw new Error('Choose a photo first.');

  const compressed = await manipulateAsync(image.uri, [{ resize: { width: 1440 } }], {
    compress: 0.78,
    format: SaveFormat.JPEG,
  });
  const path = `${userId}/${Date.now()}.jpg`;
  const file = await fetch(compressed.uri).then((response) => response.blob());
  const { error: uploadError } = await supabase.storage.from('post-images').upload(path, file, { contentType: 'image/jpeg' });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('post-images').getPublicUrl(path);
  const { error } = await supabase.from('posts').insert({
    caption: cleanCaption,
    image_url: data.publicUrl,
    user_id: userId,
    question_id: questionId,
  });
  if (error) throw error;
}
