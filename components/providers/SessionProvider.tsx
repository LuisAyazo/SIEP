'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { ReactNode } from 'react';

type SupabaseContext = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

const Context = createContext<SupabaseContext>({
  user: null,
  session: null,
  loading: true,
});

export default function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <Context.Provider value={{ user, session, loading }}>
      {children}
    </Context.Provider>
  );
}

export const useSupabaseSession = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error('useSupabaseSession must be used within a SessionProvider');
  }
  return context;
};