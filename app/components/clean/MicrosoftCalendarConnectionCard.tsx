"use client";

import { useEffect, useState } from "react";
import { trackMicrosoftCalendarEvent } from "@/lib/clean/calendar-integrations/microsoftAnalytics";

type State =
  | "loading"
  | "hidden"
  | "not_connected"
  | "active"
  | "needs_attention"
  | "error";

type Props = {
  familyId: string;
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
};

const primaryStyle: React.CSSProperties = {
  ...actionStyle,
  background: "#0f172a",
  borderColor: "#0f172a",
  color: "#ffffff",
};

async function responseBody(response: Response) {
  const body = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  if (!response.ok) {
    throw new Error("Microsoft Calendar could not be updated right now.");
  }
  return body;
}

export default function MicrosoftCalendarConnectionCard({
  familyId,
  canManage,
}: Props) {
  const [state, setState] = useState<State>(canManage ? "loading" : "hidden");
  const [pending, setPending] = useState<
    "connect" | "disconnect" | "retry" | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!canManage) return;
    const controller = new AbortController();
    const connectionResult = new URLSearchParams(window.location.search).get(
      "calendar",
    );
    if (connectionResult?.startsWith("microsoft-")) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("calendar");
      window.history.replaceState(
        {},
        "",
        `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`,
      );
    }
    void fetch(
      `/api/calendar-connections/microsoft?familyId=${encodeURIComponent(familyId)}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(responseBody)
      .then((body) => {
        const status = String(body.status ?? "not_connected");
        if (status === "unavailable") setState("hidden");
        else if (status === "active") {
          setState("active");
          if (connectionResult === "microsoft-connected") {
            setMessage(
              "Microsoft Outlook connected. Your learning plan is syncing.",
            );
            trackMicrosoftCalendarEvent(
              "microsoft_calendar_connection_succeeded",
              { outcome: "succeeded", route: "/my-settings" },
            );
          }
        } else if (status === "needs_attention") {
          setState("needs_attention");
        } else {
          setState("not_connected");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState("error");
          setError(
            "Microsoft Outlook status could not be loaded. You can try connecting again.",
          );
        }
      });

    if (connectionResult === "microsoft-error") {
      setError("Microsoft Outlook was not connected. Please try again.");
      trackMicrosoftCalendarEvent("microsoft_calendar_connection_failed", {
        outcome: "failed",
        route: "/my-settings",
      });
    }
    return () => controller.abort();
  }, [canManage, familyId]);

  async function connect() {
    if (pending) return;
    setPending("connect");
    setError(null);
    setMessage(null);
    trackMicrosoftCalendarEvent("microsoft_calendar_connection_started", {
      outcome: "succeeded",
      route: "/my-settings",
    });
    try {
      const body = await responseBody(
        await fetch("/api/calendar-connections/microsoft", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ familyId }),
        }),
      );
      const authorizationUrl = String(body.authorizationUrl ?? "");
      const target = new URL(authorizationUrl);
      if (target.origin !== "https://login.microsoftonline.com") {
        throw new Error("invalid_redirect");
      }
      window.location.assign(target.toString());
    } catch {
      setPending(null);
      setError("Microsoft Outlook could not be connected right now.");
      trackMicrosoftCalendarEvent("microsoft_calendar_connection_failed", {
        outcome: "failed",
        route: "/my-settings",
      });
    }
  }

  async function retry() {
    if (pending) return;
    setPending("retry");
    setError(null);
    setMessage(null);
    try {
      const body = await responseBody(
        await fetch("/api/calendar-connections/microsoft", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ familyId }),
        }),
      );
      const result = (body.result ?? {}) as Record<string, unknown>;
      if (Number(result.failed ?? 0) > 0) throw new Error("sync_failed");
      setState("active");
      setMessage("Microsoft Outlook sync retried.");
      trackMicrosoftCalendarEvent("microsoft_calendar_sync_succeeded", {
        outcome: "succeeded",
        route: "/my-settings",
      });
    } catch {
      setError(
        "Sync still needs attention. Reconnect Microsoft Outlook if this continues.",
      );
      trackMicrosoftCalendarEvent("microsoft_calendar_sync_failed", {
        outcome: "failed",
        route: "/my-settings",
      });
    } finally {
      setPending(null);
    }
  }

  async function disconnect() {
    if (pending) return;
    if (
      !window.confirm(
        "Disconnect Microsoft Outlook? The dedicated MyLearna calendar will be removed where Microsoft permits.",
      )
    ) {
      return;
    }
    setPending("disconnect");
    setError(null);
    setMessage(null);
    try {
      const body = await responseBody(
        await fetch("/api/calendar-connections/microsoft", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ familyId }),
        }),
      );
      setState("not_connected");
      setMessage(
        body.warningCode
          ? "Disconnected. Microsoft may retain the previous calendar if access was already revoked."
          : "Microsoft Outlook disconnected.",
      );
      trackMicrosoftCalendarEvent(
        "microsoft_calendar_connection_disconnected",
        { outcome: "succeeded", route: "/my-settings" },
      );
    } catch {
      setError("Microsoft Outlook could not be disconnected right now.");
    } finally {
      setPending(null);
    }
  }

  if (state === "hidden") return null;

  return (
    <section
      className="mylearna-calendar-connections-card"
      aria-labelledby="microsoft-calendar-title"
    >
      <div style={{ display: "grid", gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
          Calendar connections
        </div>
        <h2
          id="microsoft-calendar-title"
          style={{ margin: 0, color: "#0f172a" }}
        >
          Microsoft Outlook
        </h2>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
          See MyLearna learning plans in a dedicated Outlook calendar.
        </p>
      </div>

      {state === "loading" ? (
        <p role="status" style={{ margin: 0, color: "#64748b" }}>
          Checking Microsoft Outlook...
        </p>
      ) : state === "not_connected" || state === "error" ? (
        <button
          type="button"
          style={primaryStyle}
          disabled={Boolean(pending)}
          onClick={() => void connect()}
        >
          {pending === "connect" ? "Connecting..." : "Connect Microsoft"}
        </button>
      ) : (
        <>
          <strong
            style={{ color: state === "active" ? "#0f766e" : "#b45309" }}
          >
            {state === "active"
              ? "Microsoft Outlook connected"
              : "Microsoft Outlook needs attention"}
          </strong>
          <div className="mylearna-calendar-connections-actions">
            {state === "needs_attention" ? (
              <button
                type="button"
                style={primaryStyle}
                disabled={Boolean(pending)}
                onClick={() => void connect()}
              >
                {pending === "connect" ? "Connecting..." : "Reconnect Microsoft"}
              </button>
            ) : (
              <button
                type="button"
                style={primaryStyle}
                disabled={Boolean(pending)}
                onClick={() => void retry()}
              >
                {pending === "retry" ? "Retrying..." : "Retry sync"}
              </button>
            )}
            <button
              type="button"
              style={actionStyle}
              disabled={Boolean(pending)}
              onClick={() => void connect()}
            >
              Reconnect
            </button>
            <button
              type="button"
              style={actionStyle}
              disabled={Boolean(pending)}
              onClick={() => void disconnect()}
            >
              {pending === "disconnect" ? "Disconnecting..." : "Disconnect"}
            </button>
          </div>
        </>
      )}

      <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
        Microsoft Outlook receives planned learning titles and times only. Learner
        details, notes, evidence and Portfolio content are not included.
      </p>
      <p style={{ margin: 0, color: "#64748b", lineHeight: 1.6 }}>
        Your MyLearna Calendar remains your learning record. Connected calendars
        show a copy of your schedule.
      </p>
      {message ? (
        <p
          role="status"
          aria-live="polite"
          style={{ margin: 0, color: "#0f766e" }}
        >
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
