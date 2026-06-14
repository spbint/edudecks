"use client";

import Script from "next/script";

const H5P_RESIZER_SCRIPT_ID = "h5p-resizer-script";
const H5P_RESIZER_SCRIPT_SRC =
  "https://h5p.org/sites/all/modules/h5p/library/js/h5p-resizer.js";

type H5PActivityFrameProps = {
  title: string;
  embedUrl?: string | null;
};

export default function H5PActivityFrame({ title, embedUrl }: H5PActivityFrameProps) {
  if (!embedUrl) {
    return (
      <div
        style={{
          minHeight: 280,
          border: "1px solid #E7EAF2",
          borderRadius: 18,
          background: "#F8FAFC",
          color: "#5B6478",
          display: "grid",
          placeItems: "center",
          padding: 24,
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        H5P Arithmetic Quiz embed will appear here when configured.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div
        style={{
          border: "1px solid #E7EAF2",
          borderRadius: 18,
          background: "#FFFFFF",
          boxShadow: "0 8px 24px rgba(23, 32, 75, 0.06)",
          overflow: "hidden",
        }}
      >
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          style={{
            width: "100%",
            minHeight: 420,
            border: 0,
            display: "block",
          }}
        />
      </div>
      <Script id={H5P_RESIZER_SCRIPT_ID} src={H5P_RESIZER_SCRIPT_SRC} strategy="afterInteractive" />
    </div>
  );
}
