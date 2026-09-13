"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useCleanFamilyWorkspace } from "@/app/components/clean/CleanFamilyWorkspaceProvider";
import { createFamilyResource, familyResourceTypeLabel, listFamilyResources, removeFamilyResource, type FamilyResource, type FamilyResourceType } from "@/lib/clean/resources/familyResources";
import { openCustomLearningPdf, resourceFileSizeLabel, uploadFamilyResourcePdf } from "@/lib/clean/onDeck/resourceFiles";

const card: React.CSSProperties = { border: "1px solid #e7eaf2", borderRadius: 18, background: "#fff", padding: 20, boxShadow: "0 6px 18px rgba(23,32,75,.05)" };
const input: React.CSSProperties = { width: "100%", minHeight: 42, border: "1px solid #cbd5e1", borderRadius: 10, padding: "9px 11px", fontSize: 14 };

export default function CleanResourceCupboardWorkspace() {
  const workspace = useCleanFamilyWorkspace();
  const [resources, setResources] = useState<FamilyResource[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<FamilyResourceType | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [newType, setNewType] = useState<"web_link" | "reference" | "file">("web_link");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [referenceText, setReferenceText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!workspace.profile) return;
    setResources(await listFamilyResources(workspace.profile.id));
  }, [workspace.profile]);
  useEffect(() => { void reload().catch((reason) => setError(String(reason?.message ?? "We could not load your Resource Cupboard."))); }, [reload]);
  const visible = useMemo(() => resources.filter((resource) => {
    const matchesType = type === "all" || resource.resourceType === type;
    const query = search.trim().toLowerCase();
    return matchesType && (!query || `${resource.name} ${resource.url ?? ""} ${resource.referenceText ?? ""}`.toLowerCase().includes(query));
  }), [resources, search, type]);

  async function addResource(event: React.FormEvent) {
    event.preventDefault();
    if (!workspace.profile) return;
    setBusy(true); setError(null);
    try {
      if (newType === "file") {
        if (!file) throw new Error("Choose a PDF file.");
        await uploadFamilyResourcePdf({ familyId: workspace.profile.id, file });
      } else {
        await createFamilyResource({ familyId: workspace.profile.id, resourceType: newType, name, url: newType === "web_link" ? url : null, referenceText: newType === "reference" ? referenceText : null });
      }
      setName(""); setUrl(""); setReferenceText(""); setFile(null); setAddOpen(false); await reload();
    } catch (reason) { setError(String((reason as { message?: unknown })?.message ?? "We could not add this resource.")); }
    finally { setBusy(false); }
  }
  async function remove(resource: FamilyResource) {
    if (!workspace.profile || !window.confirm(`Remove ${resource.name} from My Resource Cupboard?`)) return;
    setError(null);
    try { await removeFamilyResource(workspace.profile.id, resource.id); await reload(); } catch (reason) { setError(String((reason as { message?: unknown })?.message ?? "This resource is still used by learning items, so it was kept.")); }
  }

  return <main style={{ display: "grid", gap: 16 }}>
    <section style={card}><div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "start" }}><div><div style={{ color: "#6c4df6", fontSize: 12, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Family resources</div><h1 style={{ margin: "6px 0", color: "#17204b", fontSize: 30 }}>My Resource Cupboard</h1><p style={{ margin: 0, color: "#5b6478", lineHeight: 1.5 }}>A reusable inventory of things your family learns with.</p></div><button type="button" onClick={() => { setAddOpen((open) => !open); setError(null); }} style={{ minHeight: 42, border: 0, borderRadius: 10, background: "#6c4df6", color: "#fff", padding: "10px 14px", fontWeight: 750 }}>{addOpen ? "Close" : "Add resource"}</button></div></section>
    {addOpen ? <section style={card}><h2 style={{ marginTop: 0, color: "#17204b", fontSize: 20 }}>Add resource</h2><form onSubmit={(event) => void addResource(event)} style={{ display: "grid", gap: 12, maxWidth: 620 }}><label style={{ display: "grid", gap: 5, fontWeight: 700 }}>Resource type<select value={newType} onChange={(event) => setNewType(event.target.value as typeof newType)} style={input}><option value="web_link">Website</option><option value="reference">Book / curriculum / reference</option><option value="file">PDF resource</option></select></label>{newType === "file" ? <><label style={{ display: "grid", gap: 5, fontWeight: 700 }}>Choose PDF<input aria-label="Choose PDF" type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>{file ? <span>{file.name} · {resourceFileSizeLabel(file.size)}</span> : null}<span style={{ color: "#64748b", fontSize: 12 }}>PDF only · up to 25 MB · upload resources you have permission to use.</span></> : <><label style={{ display: "grid", gap: 5, fontWeight: 700 }}>Name<input required value={name} onChange={(event) => setName(event.target.value)} style={input} placeholder={newType === "web_link" ? "Khan Academy" : "The Hobbit"} /></label>{newType === "web_link" ? <label style={{ display: "grid", gap: 5, fontWeight: 700 }}>URL<input required type="url" value={url} onChange={(event) => setUrl(event.target.value)} style={input} placeholder="https://example.com" /></label> : <label style={{ display: "grid", gap: 5, fontWeight: 700 }}>Reference/details<textarea required value={referenceText} onChange={(event) => setReferenceText(event.target.value)} style={{ ...input, minHeight: 76 }} /></label>}</>} {error ? <div role="alert" style={{ color: "#b91c1c" }}>{error}</div> : null}<button type="submit" disabled={busy} style={{ width: "fit-content", minHeight: 42, border: 0, borderRadius: 10, background: "#17204b", color: "#fff", padding: "10px 14px", fontWeight: 750 }}>{busy ? "Saving..." : "Save to Cupboard"}</button></form></section> : null}
    <section style={card}><div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}><input aria-label="Search resources" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources..." style={{ ...input, flex: "1 1 260px" }} /><select aria-label="Filter resources" value={type} onChange={(event) => setType(event.target.value as typeof type)} style={{ ...input, width: "auto" }}><option value="all">All</option><option value="web_link">Links</option><option value="reference">References</option><option value="file">PDFs</option></select></div>{error && !addOpen ? <div role="alert" style={{ color: "#b91c1c", marginBottom: 12 }}>{error}</div> : null}{visible.length ? <div style={{ display: "grid", gap: 10 }}>{visible.map((resource) => <article key={resource.id} style={{ borderTop: "1px solid #e7eaf2", paddingTop: 12, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}><div style={{ minWidth: 0 }}><strong style={{ color: "#17204b", overflowWrap: "anywhere" }}>{resource.name}</strong><div style={{ color: "#64748b", fontSize: 13 }}>{familyResourceTypeLabel(resource.resourceType)}{resource.byteSize ? ` · ${resourceFileSizeLabel(resource.byteSize)}` : ""}</div>{resource.resourceType === "web_link" ? <a href={resource.url ?? "#"} target="_blank" rel="noopener noreferrer" style={{ overflowWrap: "anywhere", color: "#1d4ed8", fontSize: 13 }}>{resource.url}</a> : resource.resourceType === "reference" ? <div style={{ color: "#475569", fontSize: 13 }}>{resource.referenceText}</div> : null}</div><div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>{resource.resourceType === "file" && resource.resourceFilePath ? <button type="button" onClick={() => void openCustomLearningPdf(resource.resourceFilePath!)} style={{ minHeight: 38, border: "1px solid #cbd5e1", borderRadius: 9, background: "#fff", padding: "7px 10px", fontWeight: 700 }}>Open PDF</button> : null}<button type="button" onClick={() => void remove(resource)} style={{ minHeight: 38, border: "1px solid #cbd5e1", borderRadius: 9, background: "#fff", padding: "7px 10px", fontWeight: 700 }}>Remove</button></div></article>)}</div> : <p style={{ margin: 0, color: "#64748b" }}>{search || type !== "all" ? "No resources match this search." : "Your Resource Cupboard is empty. Add a website, reference, or PDF resource when you are ready."}</p>}</section>
  </main>;
}
