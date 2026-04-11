"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

type BrandHomeLinkProps = {
  height?: number;
  width?: number;
  href?: string;
  style?: React.CSSProperties;
};

export default function BrandHomeLink({
  height = 36,
  width = 132,
  href = "/",
  style,
}: BrandHomeLinkProps) {
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
