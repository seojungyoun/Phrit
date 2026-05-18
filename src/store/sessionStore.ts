import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';

type SessionState = { session: Session | null; setSession: (s: Session | null) => void };
export const useSessionStore = create<SessionState>((set) => ({ session: null, setSession: (session) => set({ session }) }));
