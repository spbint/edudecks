"use client";

import { useEffect, useState } from "react";
import { trackAppleCalendarEvent } from "@/lib/clean/calendar-integrations/analytics";
import { toWebcalUrl } from "@/lib/clean/calendar-integrations/urls";

type AppleConnectionState = "loading" | "not_connected" | "active" | "unavailable";

type Props = {
  familyId: string;
  userId: string | null;
  canManage: boolean;
};

const actionStyle: React.CSSProperties = {
  minHeight: 44,
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#ffffff",
  color: "#0f172a",
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const primaryActionStyle: React.CSSProperties = {
  ...actionStyle,
  borderColor: "#0f172a",
  background: "#0f172a",
  color: "#ffffff",
};

async function readResponse(response: Response) {
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(
      String(body.error ?? "Apple Calendar could not be updated right now."),
    );
  }
  return body;
}

export default function AppleCalendarConnectionCard({
  familyId,
  userId,
  canManage,
}: Props) {
  const [connectionState, setConnectionState] = useState<AppleConnectionState>(
    canManage ? "loading" : "not_connected",
  );
  const [feedUrl, setFeedUrl] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"create" | "rotate" | "revoke" | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const webcalUrl = feedUrl ? toWebcalUrl(feedUrl) : null;

  useEffect(() => {
    if (!canManage) return;
    const controller = new AbortController();
    setConnectionState("loading");
    setFeedUrl(null);

    void fetch(
      `/api/calendar-connections/apple?familyId=${encodeURIComponent(familyId)}`,
      {
        cache: "no-store",
        signal: controller.signal,
      },
    )
      .then(readResponse)
      .then((body) => {
        setConnectionState(body.status === "active" ? "active" : "not_connected");
      })
      .catch((nextError) => {
        if (controller.signal.aborted) return;
        setConnectionState("unavailable");
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Apple Calendar could not be loaded right now.",
        );
      });

    return () => controller.abort();
  }, [canManage, familyId]);

  async function mutate(method: "POST" | "PATCH" | "DELETE", action: "create" | "rotate" | "revoke") {
    if (pendingAction) return;
    setPendingAction(action);
    setMessage(null);
    setError(null);

    try {
      const body = await readResponse(
        await fetch("/api/calendar-connections/apple", {
          method,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ familyId }),
        }),
      );

      if (action === "revoke") {
        setConnectionState("not_connected");
        setFeedUrl(null);
        setMessage("Apple Calendar link revoked.");
        trackAppleCalendarEvent(
          "apple_calendar_feed_revoked",
          { outcome: "succeeded", route: "/my-settings" },
          userId,
        );
      } else {
        const nextFeedUrl = String(body.feedUrl ?? "").trim();
        if (!nextFeedUrl) throw new Error("A new calendar link was not returned.");
        setConnectionState("active");
        setFeedUrl(nextFeedUrl);
        setMessage(
          action === "create"
            ? "MyLearna calendar ready."
            : "Calendar link rotated. Use the new link in Apple Calendar.",
        );
        trackAppleCalendarEvent(
          action === "create"
            ? "apple_calendar_feed_created"
            : "apple_calendar_feed_rotated",
          { outcome: "succeeded", route: "/my-settings" },
          userId,
        );
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Apple Calendar could not be updated right now.",
      );
      trackAppleCalendarEvent(
        action === "create"
          ? "apple_calendar_feed_created"
          : action === "rotate"
            ? "apple_calendar_feed_rotated"
            : "apple_calendar_feed_revoked",
        { outcome: "failed", route: "/my-settings" },
        userId,
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function copyLink() {
    if (!feedUrl) return;
    try {
      await navigator.clipboard.writeText(feedUrl);
      setMessage("Calendar link copied.");
      setError(null);
    } catch {
      setError("Copy was unavailable. Use Add to Apple Calendar or rotate the link and try again.");
    }
  }

  const actionsDisabled = Boolean(pendingAction);

  return (
    <section className="mylearna-calendar-connections-card" aria-labelledby="calendar-connections-title">
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
          Calendar connections
        </div>
        <h2 id="calendar-connections-title" style={{ margin: 0, color: "#0f172a" }}>
          Apple Calendar
        </h2>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          Keep MyLearna learning plans in Apple Calendar.
        </p>
      </div>

      {!canManage ? (
        <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
          A family owner or parent can manage this calendar connection.
        </p>
      ) : connectionState === "loading" ? (
        <p role="status" style={{ margin: 0, color: "#64748b" }}>
          Checking Apple Calendar…
        </p>
      ) : connectionState === "not_connected" || connectionState === "unavailable" ? (
        <button
          type="button"
          style={primaryActionStyle}
          disabled={actionsDisabled}
          aria-busy={pendingAction === "create"}
          onClick={() => void mutate("POST", "create")}
        >
          {pendingAction === "create" ? "Adding…" : "Add MyLearna calendar"}
        </button>
      ) : (
        <>
          <strong style={{ color: "#0f766e" }}>✓ MyLearna calendar ready</strong>
          <div className="mylearna-calendar-connections-actions">
            <a
              href={webcalUrl ?? undefined}
              aria-disabled={!webcalUrl}
              onClick={(event) => {
                if (!webcalUrl) event.preventDefault();
              }}
              style={{
                ...primaryActionStyle,
                opacity: webcalUrl ? 1 : 0.55,
                cursor: webcalUrl ? "pointer" : "not-allowed",
              }}
            >
              Add to Apple Calendar
            </a>
            <button
              type="button"
              style={actionStyle}
              disabled={!feedUrl || actionsDisabled}
              onClick={() => void copyLink()}
            >
              Copy calendar link
            </button>
            <button
              type="button"
              style={actionStyle}
              disabled={actionsDisabled}
              aria-busy={pendingAction === "rotate"}
              onClick={() => {
                if (
                  window.confirm(
                    "Rotate this link? The existing Apple Calendar link will stop working immediately.",
                  )
                ) {
                  void mutate("PATCH", "rotate");
                }
              }}
            >
              {pendingAction === "rotate" ? "Rotating…" : "Rotate link"}
            </button>
            <button
              type="button"
              style={actionStyle}
              disabled={actionsDisabled}
              aria-busy={pendingAction === "revoke"}
              onClick={() => {
                if (
                  window.confirm(
                    "Revoke this link? Apple Calendar will no longer be able to refresh it.",
                  )
                ) {
                  void mutate("DELETE", "revoke");
                }
              }}
            >
              {pendingAction === "revoke" ? "Revoking…" : "Revoke"}
            </button>
          </div>
          {!feedUrl ? (
            <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
              Rotate the link to receive a new one for Apple Calendar.
            </p>
          ) : null}
        </>
      )}

      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
        Apple Calendar receives planned learning titles and times only. Learner details,
        notes, evidence and Portfolio content are not included.
      </p>
      <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
        Apple controls how often subscribed calendars refresh.
      </p>
      {message ? (
        <p role="status" aria-live="polite" style={{ margin: 0, color: "#0f766e" }}>
          {message}
        </p>
      ) : null}
      {error ? (
        <p role="alert" style={{ margin: 0, color: "#b91c1c" }}>
          {error}
        </p>
      ) : null}
    </section>
  );
}
