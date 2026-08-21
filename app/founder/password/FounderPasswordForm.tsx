"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FOUNDER_EMAIL,
  FOUNDER_MIN_PASSWORD_LENGTH,
} from "@/lib/clean/founder/founderIdentity";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

type AccessState = "checking" | "allowed" | "denied";

async function verifyFounderSession() {
  if (!hasSupabaseEnv || !supabase) return false;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user || user.email?.trim().toLowerCase() !== FOUNDER_EMAIL) {
    return false;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  return !profileError && profile?.is_admin === true;
}

export default function FounderPasswordForm() {
  const router = useRouter();
  const [accessState, setAccessState] = useState<AccessState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordValid = useMemo(
    () => password.length >= FOUNDER_MIN_PASSWORD_LENGTH,
    [password],
  );
  const passwordsMatch = useMemo(
    () => password.length > 0 && password === confirmPassword,
    [confirmPassword, password],
  );

  useEffect(() => {
    let active = true;

    async function checkAccess() {
      try {
        const allowed = await verifyFounderSession();
        if (active) setAccessState(allowed ? "allowed" : "denied");
      } catch {
        if (active) setAccessState("denied");
      }
    }

    void checkAccess();
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!passwordValid) {
      setError(`Use at least ${FOUNDER_MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (!passwordsMatch) {
      setError("Both password fields must match.");
      return;
    }

    setBusy(true);
    try {
      const allowed = await verifyFounderSession();
      if (!allowed) {
        setAccessState("denied");
        setError("Founder access could not be verified. Request a fresh secure link.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError("The Founder password could not be saved. Please try again.");
        return;
      }

      setPassword("");
      setConfirmPassword("");
      router.replace("/founder");
      router.refresh();
    } catch {
      setError("The Founder password could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (accessState === "checking") {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "#f7f8f5" }}>
        <p style={{ color: "#687568" }}>Verifying Founder access...</p>
      </main>
    );
  }

  if (accessState === "denied") {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "#f7f8f5" }}>
        <section style={{ width: "100%", maxWidth: 460, padding: "2rem", border: "1px solid #d9ded7", borderRadius: 18, background: "#fff" }}>
          <p style={{ margin: 0, color: "#687568", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Private access</p>
          <h1 style={{ margin: "0.45rem 0 0.75rem", color: "#213229", fontSize: "1.6rem" }}>Founder link required</h1>
          <p style={{ color: "#687568", lineHeight: 1.6 }}>
            Request a fresh password setup link from the Founder login page.
          </p>
          <button type="button" onClick={() => router.replace("/founder/login")} style={{ width: "100%", padding: "0.8rem 1rem", border: 0, borderRadius: 10, background: "#2d5a43", color: "#fff", font: "inherit", fontWeight: 600, cursor: "pointer" }}>
            Back to Founder login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "#f7f8f5" }}>
      <section style={{ width: "100%", maxWidth: 460, padding: "2rem", border: "1px solid #d9ded7", borderRadius: 18, background: "#fff", boxShadow: "0 18px 45px rgba(34, 52, 40, 0.08)" }}>
        <p style={{ margin: 0, color: "#687568", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Private Founder setup</p>
        <h1 style={{ margin: "0.45rem 0 0.4rem", color: "#213229", fontSize: "1.75rem" }}>Set your Founder password</h1>
        <p style={{ margin: "0 0 1rem", color: "#687568", fontSize: "0.9rem", lineHeight: 1.5 }}>
          Verified account: <strong>{FOUNDER_EMAIL}</strong>
        </p>

        <form aria-label="Set Founder password" onSubmit={handleSubmit}>
          <label style={{ display: "grid", gap: "0.4rem", marginBottom: "1rem", color: "#33443a", fontSize: "0.9rem" }} htmlFor="founder-new-password">
            New password
            <input id="founder-new-password" type="password" autoComplete="new-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={`Minimum ${FOUNDER_MIN_PASSWORD_LENGTH} characters`} style={{ padding: "0.75rem", border: "1px solid #bbc7bd", borderRadius: 10, font: "inherit" }} />
          </label>
          <label style={{ display: "grid", gap: "0.4rem", marginBottom: "1rem", color: "#33443a", fontSize: "0.9rem" }} htmlFor="founder-confirm-password">
            Confirm password
            <input id="founder-confirm-password" type="password" autoComplete="new-password" required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} style={{ padding: "0.75rem", border: "1px solid #bbc7bd", borderRadius: 10, font: "inherit" }} />
          </label>
          {error ? <p role="alert" style={{ color: "#a32929", fontSize: "0.9rem", lineHeight: 1.5 }}>{error}</p> : null}
          <button type="submit" disabled={busy || !passwordValid || !passwordsMatch} style={{ width: "100%", padding: "0.8rem 1rem", border: 0, borderRadius: 10, background: busy || !passwordValid || !passwordsMatch ? "#91a99c" : "#2d5a43", color: "#fff", font: "inherit", fontWeight: 600, cursor: busy ? "wait" : "pointer" }}>
            {busy ? "Saving..." : "Save Founder password"}
          </button>
        </form>
      </section>
    </main>
  );
}
