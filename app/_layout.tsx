import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AppProviders } from '@/src/providers/AppProviders';
import { useSessionStore } from '@/src/store/sessionStore';
import { useThemeColors } from '@/src/theme/useThemeColors';

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}

function RootNavigator() {
  const colors = useThemeColors();
  const isReady = useSessionStore((state) => state.isReady);
  const session = useSessionStore((state) => state.session);

  if (!isReady) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {session ? (
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="post/create" options={{ presentation: 'modal' }} />
          <Stack.Screen name="post/[id]" />
          <Stack.Screen name="admin/questions" options={{ presentation: 'modal' }} />
          <Stack.Screen name="admin/reports" options={{ presentation: 'modal' }} />
        </>
      ) : (
        <Stack.Screen name="auth" />
      )}
    </Stack>
  );
}
