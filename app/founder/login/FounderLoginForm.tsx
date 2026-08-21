"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { buildAuthCallbackUrl } from "@/lib/authRedirect";
import { FOUNDER_EMAIL } from "@/lib/clean/founder/founderIdentity";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

const SAFE_ERROR = "The Founder account could not be verified.";

export default function FounderLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (!hasSupabaseEnv || !supabase) {
      setError(SAFE_ERROR);
      return;
    }
    setBusy(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: FOUNDER_EMAIL,
        password,
      });
      if (authError || !data.user) {
        setError(SAFE_ERROR);
        return;
      }
      router.replace("/founder");
      router.refresh();
    } catch {
      setError(SAFE_ERROR);
    } finally {
      setBusy(false);
    }
  }

  async function handleSetOrResetPassword() {
    setError(null);
    setNotice(null);
    if (!hasSupabaseEnv || !supabase) {
      setError(SAFE_ERROR);
      return;
    }

    setResetBusy(true);
    try {
      const redirectTo = buildAuthCallbackUrl("/founder/password");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        FOUNDER_EMAIL,
        { redirectTo },
      );
      if (resetError) {
        setError("A secure Founder password link could not be sent. Please try again.");
        return;
      }
      setNotice(`A secure password setup link has been sent to ${FOUNDER_EMAIL}.`);
    } catch {
      setError("A secure Founder password link could not be sent. Please try again.");
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "#f7f8f5" }}>
      <section style={{ width: "100%", maxWidth: 420, padding: "2rem", border: "1px solid #d9ded7", borderRadius: 18, background: "#fff", boxShadow: "0 18px 45px rgba(34, 52, 40, 0.08)" }}>
        <p style={{ margin: 0, color: "#687568", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Private access</p>
        <h1 style={{ margin: "0.45rem 0 0.4rem", color: "#213229", fontSize: "1.75rem" }}>MyLearna Founder</h1>
        <p style={{ margin: "0 0 1.5rem", color: "#687568", fontSize: "0.9rem", lineHeight: 1.5 }}>
          This private workspace is locked to the Founder account.
        </p>

        <div style={{ marginBottom: "1rem", padding: "0.75rem", border: "1px solid #d9ded7", borderRadius: 10, background: "#f8faf8" }}>
          <span style={{ display: "block", marginBottom: "0.2rem", color: "#687568", fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Founder account</span>
          <strong style={{ color: "#213229", fontSize: "0.95rem" }}>{FOUNDER_EMAIL}</strong>
        </div>

        <form aria-label="Founder sign in" onSubmit={handleSubmit}>
          <label style={{ display: "grid", gap: "0.4rem", marginBottom: "1rem", color: "#33443a", fontSize: "0.9rem" }} htmlFor="founder-password">
            Password
            <input id="founder-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} style={{ padding: "0.75rem", border: "1px solid #bbc7bd", borderRadius: 10, font: "inherit" }} />
          </label>
          {error ? <p role="alert" style={{ color: "#a32929", fontSize: "0.9rem" }}>{error}</p> : null}
          {notice ? <p role="status" style={{ color: "#2d5a43", fontSize: "0.9rem", lineHeight: 1.5 }}>{notice}</p> : null}
          <button type="submit" disabled={busy || resetBusy} style={{ width: "100%", padding: "0.8rem 1rem", border: 0, borderRadius: 10, background: "#2d5a43", color: "#fff", font: "inherit", fontWeight: 600, cursor: busy ? "wait" : "pointer" }}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
          <button type="button" onClick={handleSetOrResetPassword} disabled={busy || resetBusy} style={{ width: "100%", marginTop: "0.75rem", padding: "0.75rem 1rem", border: "1px solid #bbc7bd", borderRadius: 10, background: "#fff", color: "#2d5a43", font: "inherit", fontWeight: 600, cursor: resetBusy ? "wait" : "pointer" }}>
            {resetBusy ? "Sending secure link..." : "Set or reset Founder password"}
          </button>
        </form>
      </section>
    </main>
  );
}
