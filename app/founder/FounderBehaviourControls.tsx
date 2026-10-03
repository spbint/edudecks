"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./FounderBehaviourIntelligenceV3.module.css";

function query(range: number, includeInternal: boolean, includeSuspicious: boolean) {
  return `/founder?range=${range}${includeInternal ? "&internal=include" : ""}${includeSuspicious ? "" : "&suspicious=exclude"}`;
}

function FilterLink({
  href,
  active,
  children,
  onNavigate,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onNavigate: () => void;
}) {
  return <Link className={active ? styles.controlActive : styles.control} href={href} onClick={active ? undefined : onNavigate}>{children}</Link>;
}

export default function FounderBehaviourControls({
  rangeDays,
  includeInternal,
  includeSuspicious,
}: {
  rangeDays: 7 | 30 | 90;
  includeInternal: boolean;
  includeSuspicious: boolean;
}) {
  const [pending, setPending] = useState(false);
  const conservative = !includeInternal && !includeSuspicious;
  const onNavigate = () => setPending(true);

  return <>
    <div className={styles.toolbar}>
      <div className={styles.controlGroup}>
        <FilterLink
          href={query(rangeDays, false, false)}
          active={conservative}
          onNavigate={onNavigate}
        >
          Conservative view
        </FilterLink>
      </div>
      <div className={styles.controlGroup}>
        {([7, 30, 90] as const).map((range) => <FilterLink
          key={range}
          active={rangeDays === range}
          href={query(range, includeInternal, includeSuspicious)}
          onNavigate={onNavigate}
        >
          {range} days
        </FilterLink>)}
      </div>
      <div className={styles.controlGroup}>
        <FilterLink
          active={!includeInternal}
          href={query(rangeDays, false, includeSuspicious)}
          onNavigate={onNavigate}
        >
          Exclude internal/test
        </FilterLink>
        <FilterLink
          active={includeInternal}
          href={query(rangeDays, true, includeSuspicious)}
          onNavigate={onNavigate}
        >
          Include internal/test
        </FilterLink>
      </div>
      <div className={styles.controlGroup}>
        <FilterLink
          active={includeSuspicious}
          href={query(rangeDays, includeInternal, true)}
          onNavigate={onNavigate}
        >
          Include suspicious/unknown
        </FilterLink>
        <FilterLink
          active={!includeSuspicious}
          href={query(rangeDays, includeInternal, false)}
          onNavigate={onNavigate}
        >
          Exclude suspicious/unknown
        </FilterLink>
      </div>
    </div>
    <p className={styles.filterNote}>Conservative view excludes confirmed internal/test accounts and the separately flagged suspicious/unknown comparison group.</p>
    {pending ? <div className={styles.pendingOverlay} role="status" aria-live="polite">
      <div className={styles.pendingCard}><span className={styles.spinner} aria-hidden="true" /><strong>Updating Founder view…</strong><span>Applying the selected population and time window.</span></div>
    </div> : null}
  </>;
}
