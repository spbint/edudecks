"use client";

import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  getPageIntroVideoEmbedUrl,
  type PageIntroVideoConfig,
} from "@/lib/clean/pageIntroVideos";
import { useGuidance } from "@/app/components/clean/guidance/GuidanceProvider";

type CleanPageIntroVideoProps = {
  className?: string;
  config?: PageIntroVideoConfig;
  configs?: PageIntroVideoConfig[];
  promptDescription?: string;
  promptKey?: string;
  promptTitle?: string;
  variant?: "card" | "compact" | "inline";
};

const COLORS = {
  navy: "#0f172a",
  slate: "#475569",
  muted: "#64748b",
  blue: "#2563eb",
  blueSoft: "#eff6ff",
  blueBorder: "#bfdbfe",
  line: "#e2e8f0",
};

const STORAGE_VERSION_KEY = "mylearna.pageIntroVideo.storageVersion";
const STORAGE_CHANGE_EVENT = "mylearna-page-intro-video-storage";

function dismissedKey(pageKey: string) {
  return `mylearna.pageIntroVideo.dismissed.${pageKey}`;
}

function watchedKey(pageKey: string) {
  return `mylearna.pageIntroVideo.watched.${pageKey}`;
}

function safeLocalStorageGet(key: string) {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function safeLocalStorageSet(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, "true");
    const currentVersion = Number(window.localStorage.getItem(STORAGE_VERSION_KEY) || "0");
    window.localStorage.setItem(STORAGE_VERSION_KEY, String(currentVersion + 1));
    window.dispatchEvent(new Event(STORAGE_CHANGE_EVENT));
  } catch {
    // localStorage can be unavailable in private or restricted browser modes.
  }
}

function subscribeToLocalStorage(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(STORAGE_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORAGE_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getLocalStorageSnapshot() {
  if (typeof window === "undefined") return "0";
  try {
    return window.localStorage.getItem(STORAGE_VERSION_KEY) || "0";
  } catch {
    return "0";
  }
}

function getAvailableConfigs(configs: PageIntroVideoConfig[]) {
  return configs.filter((item) => item.youtubeId.trim());
}

export default function CleanPageIntroVideo({
  className,
  config,
  configs,
  promptDescription,
  promptKey,
  promptTitle,
  variant = "compact",
}: CleanPageIntroVideoProps) {
  const { enabled, hydrated, setupStatus } = useGuidance();
  const availableConfigs = useMemo(
    () => getAvailableConfigs(configs ?? (config ? [config] : [])),
    [config, configs],
  );
  const storageVersion = useSyncExternalStore(
    subscribeToLocalStorage,
    getLocalStorageSnapshot,
    () => "0",
  );
  const [openConfig, setOpenConfig] = useState<PageIntroVideoConfig | null>(null);

  const resolvedPromptKey = promptKey || availableConfigs[0]?.pageKey || "";
  const promptDismissed = Boolean(resolvedPromptKey) && safeLocalStorageGet(dismissedKey(resolvedPromptKey));
  const anyWatched = availableConfigs.some((item) => safeLocalStorageGet(watchedKey(item.pageKey)));
  const showPrompt =
    availableConfigs.length > 0 && Boolean(resolvedPromptKey) && !promptDismissed && !anyWatched;

  void storageVersion;

  useEffect(() => {
    if (!openConfig) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenConfig(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openConfig]);

  if (!availableConfigs.length) return null;
  if (hydrated && enabled && setupStatus === "active") return null;

  function markDismissed() {
    if (!resolvedPromptKey) return;
    safeLocalStorageSet(dismissedKey(resolvedPromptKey));
  }

  function openVideo(nextConfig: PageIntroVideoConfig) {
    safeLocalStorageSet(watchedKey(nextConfig.pageKey));
    setOpenConfig(nextConfig);
  }

  const isCard = variant === "card";
  const containerStyle: React.CSSProperties = {
    border: `1px solid ${isCard ? COLORS.blueBorder : COLORS.line}`,
    borderRadius: isCard ? 18 : 14,
    background: isCard ? "#ffffff" : COLORS.blueSoft,
    padding: isCard ? 16 : 12,
    display: "grid",
    gap: 10,
    boxShadow: isCard ? "0 10px 24px rgba(15,23,42,0.04)" : "none",
  };

  const manualButtonLabel = availableConfigs.length > 1 ? "Watch guide" : availableConfigs[0].shortTitle;

  return (
    <>
      <section className={className} style={containerStyle} aria-label="Page video guide">
        {showPrompt ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ color: COLORS.navy, fontWeight: 900 }}>
              {promptTitle || `New to ${availableConfigs[0].shortTitle.replace(" guide", "")}?`}
            </div>
            <p style={{ margin: 0, color: COLORS.slate, lineHeight: 1.55, fontSize: 14 }}>
              {promptDescription || availableConfigs[0].description}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {availableConfigs.map((item) => (
                <button key={item.pageKey} type="button" onClick={() => openVideo(item)} style={primaryButtonStyle}>
                  {item.shortTitle}
                </button>
              ))}
              <button type="button" onClick={markDismissed} style={secondaryButtonStyle}>
                Not now
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ color: COLORS.muted, fontSize: 13, fontWeight: 700 }}>
              Need a quick reminder?
            </span>
            {availableConfigs.length === 1 ? (
              <button type="button" onClick={() => openVideo(availableConfigs[0])} style={linkButtonStyle}>
                {manualButtonLabel}
              </button>
            ) : (
              availableConfigs.map((item) => (
                <button key={item.pageKey} type="button" onClick={() => openVideo(item)} style={linkButtonStyle}>
                  {item.shortTitle}
                </button>
              ))
            )}
          </div>
        )}
      </section>

      {openConfig ? (
        <VideoModal config={openConfig} onClose={() => setOpenConfig(null)} />
      ) : null}
    </>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  border: `1px solid ${COLORS.blue}`,
  borderRadius: 999,
  background: COLORS.blue,
  color: "#ffffff",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 800,
  padding: "8px 12px",
};

const secondaryButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  border: "1px solid #cbd5e1",
  background: "#ffffff",
  color: COLORS.navy,
};

const linkButtonStyle: React.CSSProperties = {
  border: "1px solid #bfdbfe",
  borderRadius: 999,
  background: "#ffffff",
  color: "#1d4ed8",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 800,
  padding: "7px 10px",
};

function VideoModal({
  config,
  onClose,
}: {
  config: PageIntroVideoConfig;
  onClose: () => void;
}) {
  const embedUrl = getPageIntroVideoEmbedUrl(config);
  if (!embedUrl) return null;

  return (
    <div
      role="presentation"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(15,23,42,0.58)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={config.title}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: "min(920px, 100%)",
          borderRadius: 20,
          background: "#ffffff",
          boxShadow: "0 30px 80px rgba(15,23,42,0.32)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "space-between",
            alignItems: "flex-start",
            padding: 18,
            borderBottom: `1px solid ${COLORS.line}`,
          }}
        >
          <div style={{ display: "grid", gap: 6 }}>
            <h2 style={{ margin: 0, color: COLORS.navy, fontSize: 22 }}>{config.title}</h2>
            <p style={{ margin: 0, color: COLORS.slate, lineHeight: 1.55, fontSize: 14 }}>
              {config.description}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close video guide" style={closeButtonStyle}>
            X
          </button>
        </div>
        <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#020617" }}>
          <iframe
            title={config.title}
            src={embedUrl}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
}

const closeButtonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 999,
  background: "#ffffff",
  color: COLORS.navy,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 900,
  height: 34,
  width: 34,
};
