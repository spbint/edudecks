"use client";

import React, { useEffect, useState } from "react";
import {
  FAMILY_EVIDENCE_STORAGE_BUCKET,
} from "@/lib/familyEvidence";
import { supabase } from "@/lib/supabaseClient";
import type { EvidencePreviewImage } from "@/lib/clean/portfolio/evidencePresentation";

type EvidenceThumbnailProps = {
  image: EvidencePreviewImage | null;
  width?: number;
  height?: number;
  title?: string;
};

export default function EvidenceThumbnail({
  image,
  width = 152,
  height = 104,
  title,
}: EvidenceThumbnailProps) {
  const storagePath = image?.storagePath ?? null;
  const directUrl = image?.url ?? null;
  const [signedResult, setSignedResult] = useState<{
    storagePath: string;
    url: string | null;
    failed: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!storagePath) return () => {
      cancelled = true;
    };

    supabase.storage
      .from(FAMILY_EVIDENCE_STORAGE_BUCKET)
      .createSignedUrl(storagePath, 10 * 60)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          setSignedResult({ storagePath, url: null, failed: true });
          return;
        }
        setSignedResult({ storagePath, url: data.signedUrl, failed: false });
      })
      .catch(() => {
        if (!cancelled) setSignedResult({ storagePath, url: null, failed: true });
      });

    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  const resolvedUrl =
    directUrl ||
    (signedResult?.storagePath === storagePath && !signedResult.failed
      ? signedResult.url
      : null);
  const failed = Boolean(storagePath && signedResult?.storagePath === storagePath && signedResult.failed);
  if (!image || failed) return null;

  return (
    <div
      style={{
        width,
        display: "grid",
        gap: 6,
      }}
    >
      {resolvedUrl ? (
        <img
          src={resolvedUrl}
          alt={image.altText}
          loading="lazy"
          style={{
            width,
            height,
            objectFit: "cover",
            borderRadius: 12,
            border: "1px solid #dbe4ef",
            background: "#f8fafc",
            display: "block",
          }}
        />
      ) : (
        <div
          aria-label={image.altText}
          style={{
            width,
            height,
            borderRadius: 12,
            border: "1px solid #dbe4ef",
            background: "#f8fafc",
          }}
        />
      )}
      {title ? (
        <span style={{ color: "#64748b", fontSize: 12, lineHeight: 1.35 }}>
          {title}
        </span>
      ) : null}
    </div>
  );
}
