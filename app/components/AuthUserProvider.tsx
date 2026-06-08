"use client";

import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";
import { readSignupPrefill } from "@/lib/signupPrefill";

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
  const notifiedUserIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!hasSupabaseEnv) {
      setLoading(false);
      return;
    }

    let active = true;

    async function applySession(nextUser: User | null, accessToken?: string | null) {
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

      if (!notifiedUserIds.current.has(nextUser.id)) {
        notifiedUserIds.current.add(nextUser.id);
        const searchParams = new URLSearchParams(window.location.search);
        const signupPrefill = readSignupPrefill();
        const source =
          searchParams.get("source") ||
          searchParams.get("utm_source") ||
          signupPrefill?.source ||
          null;

        fetch("/api/internal/new-user-notification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          body: JSON.stringify({
            source,
            referrer: document.referrer || null,
          }),
        }).catch(() => {
          console.warn("Could not check new user notification status.");
        });
      }
    }

    async function hydrate() {
      try {
        const { data } = await supabase.auth.getSession();
        await applySession(data.session?.user ?? null, data.session?.access_token ?? null);
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
      void applySession(session?.user ?? null, session?.access_token ?? null);
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
