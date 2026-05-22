import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

type SessionState = {
  isReady: boolean;
  session: Session | null;
  setReady: (isReady: boolean) => void;
  setSession: (s: Session | null) => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  isReady: false,
  session: null,
  setReady: (isReady) => set({ isReady }),
  setSession: (session) => set({ session }),
}));
