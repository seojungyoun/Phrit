import { PropsWithChildren, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { registerPushToken } from '@/src/features/notifications/push';
import { supabase } from '@/src/lib/supabase';
import { useSessionStore } from '@/src/store/sessionStore';

const queryClient = new QueryClient();

export function AppProviders({ children }: PropsWithChildren) {
  const setReady = useSessionStore((state) => state.setReady);
  const setSession = useSessionStore((state) => state.setSession);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
      if (data.session?.user.id) {
        registerPushToken(data.session.user.id).catch(() => undefined);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      queryClient.invalidateQueries();
      if (session?.user.id) {
        registerPushToken(session.user.id).catch(() => undefined);
      }
    });

    return () => data.subscription.unsubscribe();
  }, [setReady, setSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
