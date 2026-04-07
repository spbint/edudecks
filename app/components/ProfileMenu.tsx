"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

type ProfileMenuProps = {
  mobile?: boolean;
};

type ProfileRow = {
  is_admin?: boolean | null;
};

export default function ProfileMenu({ mobile }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasSupabaseEnv) {
      return;
    }

    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function hydrate() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user || null);
      if (data.user) {
        const profileRow = await fetchProfile(data.user.id);
        if (!mounted) return;
        setProfile(profileRow);
      } else {
        setProfile(null);
      }
    }

    void hydrate();

      const {
        data: { subscription: authSub },
      } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        const profileRow = await fetchProfile(session.user.id);
        if (!mounted) return;
        setProfile(profileRow);
      } else {
        setProfile(null);
      }
    });

    subscription = authSub;

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!open) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  if (!user) {
    return null;
  }

  const adminLinks = profile?.is_admin
    ? [
        { label: "Admin dashboard", href: "/admin" },
        { label: "Command centre", href: "/admin/command-centre" },
      ]
    : [];

  const metadata =
    (user.user_metadata as { full_name?: string | null; name?: string | null } | null) ?? {};
  const displayName: string =
    (typeof metadata.full_name === "string" && metadata.full_name) ||
    (typeof metadata.name === "string" && metadata.name) ||
    user.email ||
    "Signed-in user";
  const email = user.email || "";
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("ProfileMenu sign out failed", error);
    } finally {
      setSigningOut(false);
      window.location.assign("/");
    }
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          borderRadius: 999,
          border: "1px solid #d1d5db",
          padding: mobile ? "6px 10px" : "8px 12px",
          background: "#ffffff",
          cursor: "pointer",
          minWidth: mobile ? 0 : 130,
          fontSize: 14,
          fontWeight: 700,
          color: "#0f172a",
        }}
      >
        <span
          style={{
            width: mobile ? 32 : 36,
            height: mobile ? 32 : 36,
            borderRadius: "50%",
            background: "#eef2ff",
            color: "#1d4ed8",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          {initials || "ED"}
        </span>
        {!mobile ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <span>{displayName}</span>
            <span aria-hidden style={{ fontSize: 12 }}>
              ▾
            </span>
          </span>
        ) : (
          <span aria-hidden style={{ fontSize: 12 }}>
            ▾
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 260,
            borderRadius: 18,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            boxShadow: "0 16px 40px rgba(15,23,42,0.2)",
            padding: 16,
            display: "grid",
            gap: 10,
            zIndex: 50,
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{displayName}</div>
            {email ? (
              <div style={{ fontSize: 12, color: "#475569", wordBreak: "break-all" }}>{email}</div>
            ) : null}
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10, display: "grid", gap: 6 }}>
            {[
              { label: "My profile", href: "/profile" },
              { label: "Settings", href: "/settings" },
              { label: "Curriculum setup", href: "/settings?section=curriculum" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  textDecoration: "none",
                  padding: "10px 12px",
                  borderRadius: 12,
                  color: "#0f172a",
                  fontWeight: 700,
                  background: "#f8fafc",
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {adminLinks.length ? (
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10, display: "grid", gap: 6 }}>
              {adminLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  style={{
                    textDecoration: "none",
                    padding: "10px 12px",
                    borderRadius: 12,
                    color: "#0f172a",
                    fontWeight: 700,
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              marginTop: 10,
              borderRadius: 12,
              border: "none",
              padding: "10px 12px",
              fontWeight: 700,
              fontSize: 14,
              background: "#1d4ed8",
              color: "#ffffff",
              cursor: signingOut ? "not-allowed" : "pointer",
            }}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}

async function fetchProfile(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  return data ?? null;
}

