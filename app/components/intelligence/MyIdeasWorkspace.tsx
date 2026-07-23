"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthUser } from "@/app/components/AuthUserProvider";
import {
  V2Card,
  V2PageHeader,
  v2Tokens,
} from "@/app/components/clean/design-v2/MyLearnaAppShellV2";
import { validateSourceUrl } from "@/lib/intelligence/validation";
import {
  defaultIdeasService,
  type CreateIdeaInput,
  type IdeasService,
} from "@/lib/intelligence/ideas/service";
import { IdeasRepositoryError } from "@/lib/intelligence/ideas/repository";
import type { Idea } from "@/lib/intelligence/types";

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: `1px solid ${v2Tokens.border}`,
  borderRadius: 11,
  padding: "11px 12px",
  background: "#ffffff",
  color: v2Tokens.navy,
  font: "inherit",
};

const primaryButtonStyle: React.CSSProperties = {
  minHeight: 44,
  border: `1px solid ${v2Tokens.purple}`,
  borderRadius: 12,
  padding: "10px 16px",
  background: v2Tokens.purple,
  color: "#ffffff",
  font: "inherit",
  fontWeight: 750,
  cursor: "pointer",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently saved";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ideaUrl(idea: Idea) {
  return idea.sources[0]?.url || "";
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof IdeasRepositoryError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export default function MyIdeasWorkspace({
  service = defaultIdeasService,
}: {
  service?: IdeasService;
}) {
  const { user, loading: authLoading } = useAuthUser();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [persistenceError, setPersistenceError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const userId = user?.id ?? "";
  const formId = useMemo(() => "my-ideas-add-form", []);

  const loadIdeas = useCallback(async () => {
    if (!userId) {
      setIdeas([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");
    try {
      const nextIdeas = await service.listForUser(userId);
      setIdeas(nextIdeas);
    } catch (error) {
      setLoadError(errorMessage(error, "We could not load your ideas."));
    } finally {
      setLoading(false);
    }
  }, [service, userId]);

  useEffect(() => {
    void loadIdeas();
  }, [loadIdeas]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");
    setPersistenceError("");
    setSuccessMessage("");

    if (!userId) {
      setPersistenceError("Your signed-in session is not ready yet.");
      return;
    }

    const validation = validateSourceUrl(url);
    if (!validation.valid) {
      setValidationError(validation.message);
      return;
    }

    const input: CreateIdeaInput = {
      url,
      title: title.trim() || null,
    };

    setSubmitting(true);
    try {
      const created = await service.createForUser(userId, input);
      setIdeas((current) => [created, ...current]);
      setUrl("");
      setTitle("");
      setSuccessMessage("Your idea was saved.");
    } catch (error) {
      setPersistenceError(errorMessage(error, "We could not save your idea."));
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div style={{ display: "grid", gap: 18 }}>
        <V2PageHeader
          eyebrow="My Ideas"
          title="Save ideas for later"
          subtitle="Keep useful links in one calm place. URL analysis and plan generation will arrive in later milestones."
        />
        <V2Card>
          <p style={{ margin: 0, color: v2Tokens.slate }}>Loading your saved ideas...</p>
        </V2Card>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <V2PageHeader
        eyebrow="My Ideas"
        title="Save ideas for later"
        subtitle="Keep useful links in one calm place. We will add URL preview and plan generation in later milestones."
      />

      {successMessage ? (
        <div
          role="status"
          style={{
            border: "1px solid #bbf7d0",
            borderRadius: 14,
            background: v2Tokens.mint,
            color: "#166534",
            padding: 14,
            fontWeight: 650,
          }}
        >
          {successMessage}
        </div>
      ) : null}

      {loadError ? (
        <div
          role="alert"
          style={{
            border: "1px solid #fecdd3",
            borderRadius: 14,
            background: v2Tokens.softRed,
            color: "#9f1239",
            padding: 14,
          }}
        >
          {loadError}
        </div>
      ) : null}

      <V2Card>
        <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: v2Tokens.navy, fontSize: 20 }}>Add an idea</h2>
          <p style={{ margin: 0, color: v2Tokens.slate, lineHeight: 1.55 }}>
            Save the link now. Nothing will be fetched or analysed yet.
          </p>
        </div>

        <form id={formId} onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 7, color: v2Tokens.navy, fontWeight: 700 }}>
            URL
            <input
              aria-describedby="my-ideas-url-help"
              aria-label="Idea URL"
              autoComplete="url"
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://example.com/article"
              style={inputStyle}
            />
          </label>
          <span id="my-ideas-url-help" style={{ marginTop: -7, color: v2Tokens.slate, fontSize: 13 }}>
            Use an HTTP or HTTPS link.
          </span>

          <label style={{ display: "grid", gap: 7, color: v2Tokens.navy, fontWeight: 700 }}>
            Your title <span style={{ color: v2Tokens.slate, fontWeight: 500 }}>(optional)</span>
            <input
              aria-label="Optional idea title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Backyard weather station"
              style={inputStyle}
            />
          </label>

          {validationError ? (
            <div role="alert" style={{ color: "#9f1239", fontSize: 14, fontWeight: 650 }}>
              {validationError}
            </div>
          ) : null}
          {persistenceError ? (
            <div role="alert" style={{ color: "#9f1239", fontSize: 14, lineHeight: 1.5 }}>
              {persistenceError}
            </div>
          ) : null}

          <div>
            <button type="submit" disabled={submitting} style={{ ...primaryButtonStyle, opacity: submitting ? 0.65 : 1 }}>
              {submitting ? "Saving..." : "Save idea"}
            </button>
          </div>
        </form>
      </V2Card>

      <V2Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, color: v2Tokens.navy, fontSize: 20 }}>Saved ideas</h2>
            <p style={{ margin: "6px 0 0", color: v2Tokens.slate }}>
              {ideas.length} saved {ideas.length === 1 ? "idea" : "ideas"}
            </p>
          </div>
        </div>

        {!ideas.length ? (
          <div
            style={{
              marginTop: 16,
              border: `1px dashed ${v2Tokens.border}`,
              borderRadius: 14,
              padding: 18,
              color: v2Tokens.slate,
              background: "#fbfcfe",
            }}
          >
            No ideas saved yet. Add your first link above.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            {ideas.map((idea) => {
              const sourceUrl = ideaUrl(idea);
              return (
                <article
                  key={idea.id}
                  style={{
                    border: `1px solid ${v2Tokens.border}`,
                    borderRadius: 14,
                    padding: 14,
                    display: "grid",
                    gap: 7,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <strong style={{ color: v2Tokens.navy }}>{idea.title || "Saved idea"}</strong>
                    <span style={{ color: v2Tokens.slate, fontSize: 13 }}>{formatDate(idea.createdAt)}</span>
                  </div>
                  {sourceUrl ? (
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: v2Tokens.purple, overflowWrap: "anywhere", fontSize: 14 }}
                    >
                      {sourceUrl}
                    </a>
                  ) : null}
                  <span style={{ color: v2Tokens.slate, fontSize: 13 }}>Active</span>
                </article>
              );
            })}
          </div>
        )}
      </V2Card>
    </div>
  );
}
