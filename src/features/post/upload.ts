import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';
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
  if (Platform.OS === 'web') {
    return takeWebCameraPhoto();
  }

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

  const uploadUri =
    Platform.OS === 'web'
      ? image.uri
      : (
          await manipulateAsync(image.uri, [{ resize: { width: 1440 } }], {
            compress: 0.78,
            format: SaveFormat.JPEG,
          })
        ).uri;
  const path = `${userId}/${Date.now()}.jpg`;
  const file = await fetch(uploadUri).then((response) => response.blob());
  const { error: uploadError } = await supabase.storage.from('post-images').upload(path, file, { contentType: file.type || 'image/jpeg' });
  if (uploadError) throw new Error(formatSupabaseError(uploadError.message, 'Image upload failed'));

  const { data } = supabase.storage.from('post-images').getPublicUrl(path);
  const { error } = await supabase.from('posts').insert({
    caption: cleanCaption,
    image_url: data.publicUrl,
    user_id: userId,
    question_id: questionId,
  });
  if (error) throw new Error(formatSupabaseError(error.message, 'Post creation failed'));
}

function formatSupabaseError(message: string, fallback: string) {
  if (message.toLowerCase().includes('bucket')) {
    return `${fallback}: Supabase Storage bucket "post-images" is missing or blocked. Run supabase/schema.sql first.`;
  }
  if (message.toLowerCase().includes('row-level security') || message.toLowerCase().includes('policy')) {
    return `${fallback}: Supabase RLS policy blocked this action. Run supabase/schema.sql and sign in again.`;
  }
  if (message.toLowerCase().includes('relation') || message.toLowerCase().includes('does not exist')) {
    return `${fallback}: Supabase tables are not ready. Run supabase/schema.sql in SQL Editor.`;
  }
  return `${fallback}: ${message}`;
}

async function takeWebCameraPhoto(): Promise<PickedPostImage | null> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('This browser does not support direct camera capture.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });

  return new Promise((resolve, reject) => {
    const root = document.createElement('div');
    const video = document.createElement('video');
    const actions = document.createElement('div');
    const capture = document.createElement('button');
    const cancel = document.createElement('button');

    root.style.position = 'fixed';
    root.style.inset = '0';
    root.style.zIndex = '99999';
    root.style.background = '#101010';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    root.style.justifyContent = 'center';
    root.style.flexDirection = 'column';
    root.style.gap = '16px';
    root.style.padding = '16px';

    video.autoplay = true;
    video.playsInline = true;
    video.srcObject = stream;
    video.style.width = 'min(100%, 420px)';
    video.style.aspectRatio = '9 / 16';
    video.style.objectFit = 'cover';
    video.style.borderRadius = '8px';
    video.style.background = '#000';

    actions.style.display = 'flex';
    actions.style.gap = '10px';

    capture.textContent = 'Capture';
    cancel.textContent = 'Cancel';
    for (const button of [capture, cancel]) {
      button.style.height = '44px';
      button.style.border = '0';
      button.style.borderRadius = '8px';
      button.style.padding = '0 18px';
      button.style.fontWeight = '800';
      button.style.cursor = 'pointer';
    }
    capture.style.background = '#B1865B';
    capture.style.color = '#fff';
    cancel.style.background = '#fff';
    cancel.style.color = '#262320';

    const cleanup = () => {
      stream.getTracks().forEach((track) => track.stop());
      root.remove();
    };

    cancel.onclick = () => {
      cleanup();
      resolve(null);
    };

    capture.onclick = () => {
      try {
        const canvas = document.createElement('canvas');
        const width = video.videoWidth || 1080;
        const height = video.videoHeight || 1920;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not capture camera frame.');
        context.drawImage(video, 0, 0, width, height);
        const uri = canvas.toDataURL('image/jpeg', 0.9);
        cleanup();
        resolve({ uri, width, height });
      } catch (error) {
        cleanup();
        reject(error);
      }
    };

    actions.append(capture, cancel);
    root.append(video, actions);
    document.body.append(root);
    video.play().catch((error) => {
      cleanup();
      reject(error);
    });
  });
}
