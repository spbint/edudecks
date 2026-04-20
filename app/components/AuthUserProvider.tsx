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

    async function applySession(nextUser: User | null) {
      if (!active) return;

      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const profileRow = await fetchProfile(nextUser.id);
        if (!active) return;
        setProfile(profileRow);
      } catch (error) {
        if (!active) return;
        console.error("AuthUserProvider profile hydrate failed", error);
        setProfile(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    async function hydrate() {
      try {
        const { data } = await supabase.auth.getSession();
        await applySession(data.session?.user ?? null);
      } catch (error) {
        console.error("AuthUserProvider session hydrate failed", error);
        if (!active) return;
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    }

    void hydrate();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void applySession(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
    }),
    [loading, profile, user],
  );

  return <AuthUserContext.Provider value={value}>{children}</AuthUserContext.Provider>;
}

export function useAuthUser() {
  return useContext(AuthUserContext);
}
