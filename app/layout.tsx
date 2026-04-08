import React, { Suspense } from "react";
import type { Metadata } from "next";
import "./globals.css";

import { AuthUserProvider } from "@/app/components/AuthUserProvider";

export const metadata: Metadata = {
  title: "Edu Dashboard",
  description: "Football Manager-style student and class insights for schools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        }}
      >
        <AuthUserProvider>
          <Suspense fallback={<div />}>{children}</Suspense>
        </AuthUserProvider>
      </body>
    </html>
  );
}
