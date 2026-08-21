"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { hasSupabaseEnv, supabase } from "@/lib/supabaseClient";

const SAFE_ERROR = "The email or password could not be verified.";

export default function FounderLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!hasSupabaseEnv || !supabase) {
      setError(SAFE_ERROR);
      return;
    }
    setBusy(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
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

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "#f7f8f5" }}>
      <section style={{ width: "100%", maxWidth: 420, padding: "2rem", border: "1px solid #d9ded7", borderRadius: 18, background: "#fff", boxShadow: "0 18px 45px rgba(34, 52, 40, 0.08)" }}>
        <p style={{ margin: 0, color: "#687568", fontSize: "0.75rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>Private access</p>
        <h1 style={{ margin: "0.45rem 0 1.5rem", color: "#213229", fontSize: "1.75rem" }}>MyLearna Founder</h1>
        <form aria-label="Founder sign in" onSubmit={handleSubmit}>
          <label style={{ display: "grid", gap: "0.4rem", marginBottom: "1rem", color: "#33443a", fontSize: "0.9rem" }} htmlFor="founder-email">
            Email
            <input id="founder-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} style={{ padding: "0.75rem", border: "1px solid #bbc7bd", borderRadius: 10, font: "inherit" }} />
          </label>
          <label style={{ display: "grid", gap: "0.4rem", marginBottom: "1rem", color: "#33443a", fontSize: "0.9rem" }} htmlFor="founder-password">
            Password
            <input id="founder-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} style={{ padding: "0.75rem", border: "1px solid #bbc7bd", borderRadius: 10, font: "inherit" }} />
          </label>
          {error ? <p role="alert" style={{ color: "#a32929", fontSize: "0.9rem" }}>{error}</p> : null}
          <button type="submit" disabled={busy} style={{ width: "100%", padding: "0.8rem 1rem", border: 0, borderRadius: 10, background: "#2d5a43", color: "#fff", font: "inherit", fontWeight: 600, cursor: busy ? "wait" : "pointer" }}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}
