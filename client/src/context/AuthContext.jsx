import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still loading
  const [me, setMe] = useState(null);                // dashboard payload: profile, level, rank...

  const refresh = useCallback(async () => {
    try { setMe(await api('/api/me')); } catch (e) { console.error(e); setMe(null); }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) refresh(); else if (session === null) setMe(null); }, [session, refresh]);

  const signOut = () => supabase.auth.signOut();
  return <Ctx.Provider value={{ session, user: session?.user, me, profile: me?.profile, refresh, signOut, loading: session === undefined }}>{children}</Ctx.Provider>;
}
