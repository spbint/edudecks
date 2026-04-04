import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
