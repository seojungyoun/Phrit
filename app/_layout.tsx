import { Stack } from 'expo-router';
import { AppProviders } from '@/src/providers/AppProviders';

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="post/create" options={{ presentation: 'modal' }} />
      </Stack>
    </AppProviders>
  );
}
