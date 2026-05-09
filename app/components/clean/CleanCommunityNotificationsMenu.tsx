"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  COMMUNITY_NOTIFICATIONS_NOT_AVAILABLE_MESSAGE,
  listCommunityNotifications,
  markAllCommunityNotificationsRead,
  markCommunityNotificationRead,
} from "@/lib/clean/community/client";
import type { CommunityNotificationItem } from "@/lib/clean/community/types";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function formatNotificationTime(value: string | null) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Recently";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round(
    (startOfToday.getTime() - startOfTarget.getTime()) / (24 * 60 * 60 * 1000),
  );
  const timeLabel = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (dayDiff === 0) {
    return `Today at ${timeLabel}`;
  }

  if (dayDiff === 1) {
    return `Yesterday at ${timeLabel}`;
  }

  return `${date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })} at ${timeLabel}`;
}

export default function CleanCommunityNotificationsMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<CommunityNotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.readAt).length,
    [notifications],
  );

  async function loadNotifications() {
    setLoading(true);
    setError(null);

    try {
      const nextNotifications = await listCommunityNotifications(12);
      setNotifications(nextNotifications);
    } catch (nextError) {
      setNotifications([]);
      setError(
        safe((nextError as { message?: unknown })?.message) ||
          "We could not load community notifications just now.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadNotifications();
  }, [open]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleNotificationClick(notification: CommunityNotificationItem) {
    if (!notification.readAt) {
      setBusyId(notification.id);

      try {
        const updated = await markCommunityNotificationRead(notification.id);
        setNotifications((current) =>
          current.map((item) => (item.id === updated.id ? { ...item, readAt: updated.readAt } : item)),
        );
      } catch (nextError) {
        setError(
          safe((nextError as { message?: unknown })?.message) ||
            "We could not open this notification just now.",
        );
      } finally {
        setBusyId(null);
      }
    }

    setOpen(false);
    router.push(notification.href);
  }

  async function handleMarkAllRead() {
    setMarkingAll(true);
    setError(null);

    try {
      await markAllCommunityNotificationsRead();
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((item) => (item.readAt ? item : { ...item, readAt })),
      );
    } catch (nextError) {
      setError(
        safe((nextError as { message?: unknown })?.message) ||
          "We could not mark your notifications as read.",
      );
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div ref={menuRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          borderRadius: 999,
          border: unreadCount ? "1px solid #bfdbfe" : "1px solid #dbeafe",
          background: unreadCount ? "#eff6ff" : "#ffffff",
          color: unreadCount ? "#1d4ed8" : "#334155",
          padding: "8px 12px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Notifications
        {unreadCount ? (
          <span
            aria-label={`${unreadCount} unread notifications`}
            style={{
              minWidth: 20,
              height: 20,
              padding: "0 6px",
              borderRadius: 999,
              background: "#1d4ed8",
              color: "#ffffff",
              fontSize: 11,
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          aria-label="Community notifications"
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 10px)",
            width: 320,
            maxWidth: "calc(100vw - 24px)",
            border: "1px solid #e2e8f0",
            borderRadius: 18,
            background: "#ffffff",
            boxShadow: "0 20px 40px rgba(15,23,42,0.12)",
            padding: 12,
            display: "grid",
            gap: 12,
            zIndex: 60,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "grid", gap: 2 }}>
              <span style={{ color: "#0f172a", fontSize: 15, fontWeight: 800 }}>
                Notifications
              </span>
              <span style={{ color: "#64748b", fontSize: 12 }}>
                Community activity for your threads and replies
              </span>
            </div>

            {unreadCount ? (
              <button
                type="button"
                onClick={() => void handleMarkAllRead()}
                disabled={markingAll}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#1d4ed8",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: markingAll ? "wait" : "pointer",
                  padding: 0,
                }}
              >
                {markingAll ? "Marking..." : "Mark all read"}
              </button>
            ) : null}
          </div>

          {error ? (
            <div
              role="alert"
              style={{
                borderRadius: 12,
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#991b1b",
                padding: "10px 12px",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {error === COMMUNITY_NOTIFICATIONS_NOT_AVAILABLE_MESSAGE
                ? COMMUNITY_NOTIFICATIONS_NOT_AVAILABLE_MESSAGE
                : error}
            </div>
          ) : null}

          {loading ? (
            <div style={{ color: "#64748b", fontSize: 13 }}>Loading notifications...</div>
          ) : notifications.length ? (
            <div style={{ display: "grid", gap: 8, maxHeight: 380, overflowY: "auto" }}>
              {notifications.map((notification) => {
                const unread = !notification.readAt;
                const isBusy = busyId === notification.id;

                return (
                  <button
                    key={notification.id}
                    type="button"
                    role="menuitem"
                    onClick={() => void handleNotificationClick(notification)}
                    disabled={isBusy}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      borderRadius: 14,
                      border: unread ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                      background: unread ? "#f8fbff" : "#ffffff",
                      padding: "12px 12px",
                      display: "grid",
                      gap: 6,
                      cursor: isBusy ? "wait" : "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 700 }}>
                        {notification.message}
                      </span>
                      {unread ? (
                        <span
                          aria-hidden="true"
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 999,
                            background: "#1d4ed8",
                            marginTop: 5,
                            flexShrink: 0,
                          }}
                        />
                      ) : null}
                    </div>

                    {notification.threadTitle ? (
                      <div style={{ color: "#334155", fontSize: 13, lineHeight: 1.5 }}>
                        {notification.threadTitle}
                      </div>
                    ) : null}

                    <div style={{ color: "#64748b", fontSize: 12 }}>
                      {formatNotificationTime(notification.createdAt)}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                border: "1px dashed #cbd5e1",
                borderRadius: 14,
                padding: 14,
                color: "#475569",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              No new community notifications yet.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
