import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { PickedPostImage } from './upload';

export async function shareToInstagramStory(image: PickedPostImage | null) {
  if (!image?.uri) throw new Error('Choose or capture a photo first.');

  if (Platform.OS === 'web') {
    await shareOnWeb(image.uri);
    return;
  }

  const available = await Sharing.isAvailableAsync();
  if (!available) throw new Error('Sharing is not available on this device.');

  await Sharing.shareAsync(image.uri, {
    dialogTitle: 'Share to Instagram Story',
    mimeType: 'image/jpeg',
    UTI: 'public.jpeg',
  });
}

async function shareOnWeb(uri: string) {
  if (!navigator.share) {
    throw new Error('This browser does not support sharing. Download the image or test on mobile.');
  }

  const blob = await fetch(uri).then((response) => response.blob());
  const file = new File([blob], 'phrit-story.jpg', { type: blob.type || 'image/jpeg' });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'PHRIT Story' });
    return;
  }

  await navigator.share({ title: 'PHRIT Story', text: 'Share this moment to Instagram Story.' });
}
