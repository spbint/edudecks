"use client";

import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

type ProfileRow = {
  is_admin?: boolean | null;
};

type AuthUserContextValue = {
  user: User | null;
  profile: ProfileRow | null;
  loading: boolean;
};

const AuthUserContext = createContext<AuthUserContextValue>({
  user: null,
  profile: null,
  loading: true,
});

async function fetchProfile(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}

async function hydrateProfile(userId: string, onResolved: (profile: ProfileRow | null) => void) {
  try {
    const profileRow = await fetchProfile(userId);
    onResolved(profileRow);
  } catch (profileError) {
    console.error("AuthUserProvider profile hydrate failed", profileError);
    onResolved(null);
  }
}

export function AuthUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setLoading(false);
      return;
    }

    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function hydrate() {
      try {
        const sessionResp = await supabase.auth.getSession();
        const sessionUser = sessionResp.data.session?.user ?? null;
        if (!active) return;

        setUser(sessionUser);
        setLoading(false);

        if (sessionUser) {
          void hydrateProfile(sessionUser.id, (profileRow) => {
            if (!active) return;
            setProfile(profileRow);
          });
        } else {
          setProfile(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void hydrate();

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        void hydrateProfile(session.user.id, (profileRow) => {
          if (!active) return;
          setProfile(profileRow);
        });
      } else {
        setProfile(null);
      }
    });

    subscription = authSubscription;

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
    }),
    [loading, profile, user]
  );

  return <AuthUserContext.Provider value={value}>{children}</AuthUserContext.Provider>;
}

export function useAuthUser() {
  return useContext(AuthUserContext);
}
