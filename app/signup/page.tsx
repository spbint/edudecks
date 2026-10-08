import PublicSiteShell from "@/app/components/PublicSiteShell";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthenticatedRouteUser } from "@/lib/auth/serverRouteAuth";
import { MISSING_PUBLIC_SUPABASE_ENV_MESSAGE } from "@/lib/supabaseClient";
import { buildPublicMetadata } from "@/app/lib/publicMetadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "New Registrations Paused | MyLearna",
  description:
    "MyLearna is temporarily pausing new account registrations while we improve the platform. Existing families can still sign in.",
  path: "/signup",
});

export default async function SignupPage() {
  try {
    const user = await getAuthenticatedRouteUser();

    if (user) {
      redirect("/my-profile");
    }
  } catch (error) {
    const message = String((error as { message?: unknown })?.message ?? "").trim();
    if (!message || message !== MISSING_PUBLIC_SUPABASE_ENV_MESSAGE) {
      throw error;
    }
  }

  return (
    <PublicSiteShell
      eyebrow="Registrations paused"
      heroTitle="New registrations are temporarily paused"
      heroText="We’re improving MyLearna and are not accepting new family accounts for a little while."
      heroBadges={["Existing accounts stay active", "Sign-in remains available", "No account changes", "Temporary pause"]}
      primaryCta={{ label: "Sign in to MyLearna", href: "/login" }}
      secondaryCta={{ label: "Explore the demo", href: "/demo?source=registrations-paused" }}
      footerPrimaryCta={{ label: "Sign in", href: "/login" }}
      compactHero
    >
      <section
        style={{
          maxWidth: 760,
          margin: "0 auto",
          border: "1px solid #dbeafe",
          borderRadius: 20,
          background: "#ffffff",
          padding: 24,
          boxShadow: "0 10px 28px rgba(15,23,42,0.05)",
        }}
      >
        <h2 style={{ margin: "0 0 10px", color: "#0f172a", fontSize: 26 }}>
          We’re pausing new accounts while we build
        </h2>
        <p style={{ margin: "0 0 12px", color: "#475569", lineHeight: 1.65 }}>
          MyLearna is in an active build phase, so we have temporarily paused new registrations.
          This keeps our focus on improving the product for the families already using it.
        </p>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.65 }}>
          If you already have a MyLearna account, you can continue to sign in and use it normally.
        </p>
      </section>
    </PublicSiteShell>
  );
}
