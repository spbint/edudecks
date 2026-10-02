"use client";

import { useEffect, useRef, useState } from "react";
import { mountAssessmentProof } from "@/lib/clean/assessments/trusted-asset-proof/assessment-proof";
import type { ProofItem } from "@/lib/clean/assessments/trusted-asset-proof/types";
import "@/lib/clean/assessments/trusted-asset-proof/assessment-proof.css";

/** React owns mount/unmount; the preserved proof owns only this empty host's descendants. */
export default function TrustedAssetProof({ items }: { items: readonly ProofItem[] }) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    try {
      const controller = mountAssessmentProof(container.current, items);
      return () => controller.destroy();
    } catch {
      container.current.replaceChildren();
      setFailed(true);
    }
  }, [items]);
  return (
    <section aria-label="Staff-only six-asset technical proof">
      {failed ? <p role="alert">The sample could not start. No responses were saved. Return to Assessment Lab and try again.</p> : null}
      <div ref={container} data-asset-proof-host="true" />
    </section>
  );
}
