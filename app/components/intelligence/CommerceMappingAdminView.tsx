"use client";

import { useEffect, useState } from "react";
import { V2Card, V2PageHeader, v2Tokens } from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import type { CommerceResourceMapping } from "@/lib/intelligence/commerce/types";

export default function CommerceMappingAdminView() {
  const [mappings, setMappings] = useState<CommerceResourceMapping[]>([]);
  const [resourceKey, setResourceKey] = useState("");
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("approved");
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/intelligence/commerce/mappings", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Commerce mappings are unavailable.");
        return await response.json() as { mappings?: CommerceResourceMapping[] };
      })
      .then((result) => { if (active) setMappings(result.mappings ?? []); })
      .catch((error) => { if (active) setMessage(error instanceof Error ? error.message : "Commerce mappings are unavailable."); });
    return () => { active = false; };
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/intelligence/commerce/mappings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ resourceKey, providerProductId: productId, status, paused, preferred: status === "approved", matchConfidence: 1 }) });
    const result = await response.json() as { mapping?: CommerceResourceMapping; error?: string };
    if (!response.ok || !result.mapping) { setMessage(result.error || "The mapping could not be saved."); return; }
    setMappings((current) => [result.mapping!, ...current.filter((item) => item.id !== result.mapping!.id)]);
    setResourceKey(""); setProductId(""); setMessage("Mapping saved.");
  }

  return <div style={{ display: "grid", gap: 18 }}>
    <V2PageHeader eyebrow="Admin · Development" title="Commerce resource mappings" subtitle="Review automated matches, approve preferred products, or pause a product without changing learning recommendations." />
    {message ? <div role="status" style={{ color: v2Tokens.slate }}>{message}</div> : null}
    <V2Card>
      <h2 style={{ marginTop: 0 }}>Manual mapping</h2>
      <form onSubmit={save} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
        <label>Normalized resource key<input value={resourceKey} onChange={(event) => setResourceKey(event.target.value)} required /></label>
        <label>Shopify product ID<input value={productId} onChange={(event) => setProductId(event.target.value)} required /></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}><option value="approved">Approve</option><option value="pending">Pending review</option><option value="rejected">Reject</option></select></label>
        <label><input type="checkbox" checked={paused} onChange={(event) => setPaused(event.target.checked)} /> Pause product</label>
        <button type="submit">Save mapping</button>
      </form>
    </V2Card>
    <V2Card>
      <h2 style={{ marginTop: 0 }}>Mappings and unmatched requirements</h2>
      {!mappings.length ? <p style={{ color: v2Tokens.slate }}>No mappings have been reviewed yet.</p> : <div style={{ display: "grid", gap: 8 }}>{mappings.map((mapping) => <div key={mapping.id} style={{ borderBottom: `1px solid ${v2Tokens.border}`, paddingBottom: 8 }}><strong>{mapping.resourceKey}</strong> → {mapping.providerProductId} · {mapping.status}{mapping.paused ? " · paused" : ""} · confidence {mapping.matchConfidence.toFixed(2)}</div>)}</div>}
    </V2Card>
  </div>;
}
