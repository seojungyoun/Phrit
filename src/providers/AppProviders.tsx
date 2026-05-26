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
  const clearSession = useSessionStore((state) => state.clearSession);

  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          if (isMounted) clearSession();
          return;
        }

        const { data: userData, error } = await supabase.auth.getUser();
        if (error || !userData.user) {
          await supabase.auth.signOut({ scope: 'local' });
          if (isMounted) clearSession();
          return;
        }

        if (isMounted) {
          setSession(sessionData.session);
          setReady(true);
          registerPushToken(userData.user.id).catch(() => undefined);
        }
      } catch {
        if (isMounted) clearSession();
      }
    }

    hydrateSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session);
      } else {
        clearSession();
      }
      queryClient.invalidateQueries();
      if (session?.user.id) {
        registerPushToken(session.user.id).catch(() => undefined);
      }
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, [clearSession, setReady, setSession]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
