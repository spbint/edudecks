"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

type BrandHomeLinkProps = {
  height?: number;
  width?: number;
  hrefWhenAuthenticated?: string;
  hrefWhenUnauthenticated?: string;
  style?: React.CSSProperties;
};

export default function BrandHomeLink({
  height = 36,
  width = 132,
  hrefWhenAuthenticated = "/family",
  hrefWhenUnauthenticated = "/",
  style,
}: BrandHomeLinkProps) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;

    async function hydrateAuth() {
      if (!hasSupabaseEnv) {
        if (mounted) setIsAuthenticated(false);
        return;
      }

      const { data } = await supabase.auth.getUser();
      if (mounted) {
        setIsAuthenticated(Boolean(data.user));
      }
    }

    void hydrateAuth();

    if (!hasSupabaseEnv) {
      return () => {
        mounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setIsAuthenticated(Boolean(session?.user));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const href = isAuthenticated ? hrefWhenAuthenticated : hrefWhenUnauthenticated;

  return (
    <Link
      href={href}
      aria-label="EduDecks Home"
      style={{
        display: "inline-flex",
        alignItems: "center",
        textDecoration: "none",
        lineHeight: 0,
        ...style,
      }}
    >
      <Image
        src="/branding/ed-logo-beta-v1.jpg"
        alt="EduDecks Home"
        width={width}
        height={height}
        priority
        style={{
          width: "auto",
          height,
          objectFit: "contain",
          display: "block",
        }}
      />
    </Link>
  );
}
