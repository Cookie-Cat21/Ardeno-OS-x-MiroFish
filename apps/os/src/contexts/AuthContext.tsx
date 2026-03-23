import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLocalDevBypass: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const LOCAL_DEV_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const isLocalDevBypass =
  typeof window !== "undefined" && LOCAL_DEV_HOSTS.has(window.location.hostname);

// Temporary localhost-only bypass user for faster local UI development.
const LOCAL_DEV_USER = {
  id: "local-dev",
  aud: "authenticated",
  role: "authenticated",
  email: "dev@ardeno.local",
  app_metadata: { provider: "local-dev", providers: ["local-dev"] },
  user_metadata: { name: "Local Dev" },
  identities: [],
  created_at: "1970-01-01T00:00:00.000Z",
} as User;

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isLocalDevBypass: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// For now, allow all authenticated users. Whitelist enforcement will happen 
// once the whitelisted_emails table is created in Supabase.
const WHITELISTED_EMAILS = [
  "ardenostudio@gmail.com",
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(isLocalDevBypass ? LOCAL_DEV_USER : null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!isLocalDevBypass);

  useEffect(() => {
    if (isLocalDevBypass) {
      setSession(null);
      setUser(LOCAL_DEV_USER);
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (isLocalDevBypass) return;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    if (isLocalDevBypass) {
      setSession(null);
      setUser(LOCAL_DEV_USER);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, isLocalDevBypass, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
