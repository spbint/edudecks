"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import FamilyTopNavShell from "@/app/components/FamilyTopNavShell";
import ForumThreadRow from "@/app/components/ForumThreadRow";
import {
  loadCategoryPageData,
  requireCommunityUserId,
  type ForumCategory,
  type ForumThreadSummary,
} from "@/lib/communityForum";

function panelStyle(): React.CSSProperties {
  return {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: 22,
    padding: 20,
    boxShadow: "0 10px 30px rgba(15,23,42,0.04)",
    display: "grid",
    gap: 12,
  };
}

export default function CommunityCategoryPage() {
  const params = useParams<{ categorySlug: string }>();
  const slug = String(params?.categorySlug ?? "");

  const [viewerId, setViewerId] = useState<string | null>(null);
  const [category, setCategory] = useState<ForumCategory | null>(null);
  const [threads, setThreads] = useState<ForumThreadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const userId = await requireCommunityUserId();
        if (!mounted) return;

        setViewerId(userId);
        if (!userId) {
          setCategory(null);
          setThreads([]);
          setMessage("Sign in to browse Community.");
          return;
        }

        const data = await loadCategoryPageData(slug, userId);
        if (!mounted) return;

        setCategory(data.category);
        setThreads(data.threads ?? []);
        setMessage(data.category ? "" : "This Community category could not be found in the database.");
      } catch (error) {
        console.error("Community category load failed", error);
        if (!mounted) return;

        setCategory(null);
        setThreads([]);
        setMessage(error instanceof Error ? error.message : "Community could not load this category.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [slug]);

  return (
    <FamilyTopNavShell
      title="MyLearna Family"
      subtitle="Community"
      heroTitle={category?.name || "Community"}
      heroText={
        category?.description ||
        "Browse a real Community category and start a conversation only when the category is ready."
      }
      hideHeroAside={true}
      workflowHelperText="One category, one thread list, and one real path to start a new conversation."
    >
      <section style={{ ...panelStyle(), marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: 8, maxWidth: 760 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 1.1,
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              Category
            </div>
            <div style={{ fontSize: 28, lineHeight: 1.15, fontWeight: 900, color: "#0f172a" }}>
              {category?.name || "Community"}
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
              {category?.description || message}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/community"
              style={{
                border: "1px solid #d1d5db",
                background: "#ffffff",
                color: "#334155",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Back to categories
            </Link>
            {viewerId && category ? (
              <Link
                href={`/community/new?category=${encodeURIComponent(category.slug)}`}
                style={{
                  border: "1px solid #2563eb",
                  background: "#2563eb",
                  color: "#ffffff",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  fontWeight: 800,
                  textDecoration: "none",
                }}
              >
                Start a conversation
              </Link>
            ) : (
              <span
                style={{
                  border: "1px solid #d1d5db",
                  background: "#f8fafc",
                  color: "#64748b",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 14,
                  fontWeight: 800,
                  display: "inline-flex",
                }}
              >
                Sign in to start a conversation
              </span>
            )}
          </div>
        </div>
      </section>

      {loading ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 15, color: "#475569", fontWeight: 700 }}>Loading discussions...</div>
        </section>
      ) : !viewerId ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>Community sign-in required</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
            Sign in to browse categories, read discussions, and reply.
          </div>
        </section>
      ) : !category ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>Category not ready</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
            {message || "This category could not be found in the database."}
          </div>
          <div>
            <Link href="/community" style={{ color: "#2563eb", fontWeight: 800, textDecoration: "none" }}>
              Back to Community
            </Link>
          </div>
        </section>
      ) : threads.length === 0 ? (
        <section style={panelStyle()}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0f172a" }}>No discussions here yet</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569" }}>
            Start the first conversation in this category when you are ready.
          </div>
          <div>
            <Link
              href={`/community/new?category=${encodeURIComponent(category.slug)}`}
              style={{
                border: "1px solid #2563eb",
                background: "#2563eb",
                color: "#ffffff",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                fontWeight: 800,
                display: "inline-flex",
                textDecoration: "none",
              }}
            >
              Start a conversation
            </Link>
          </div>
        </section>
      ) : (
        <section style={{ display: "grid", gap: 14 }}>
          {threads.map((thread) => (
            <ForumThreadRow key={thread.id} thread={thread} />
          ))}
        </section>
      )}
    </FamilyTopNavShell>
  );
}
