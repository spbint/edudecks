import styles from "./FounderBehaviourIntelligenceV3.module.css";

export default function FounderLoading() {
  return <main className={styles.page}>
    <div className={styles.routeLoading} role="status" aria-live="polite">
      <div className={styles.pendingCard}>
        <span className={styles.spinner} aria-hidden="true" />
        <strong>Updating Founder view…</strong>
        <span>Applying the selected population and time window.</span>
      </div>
    </div>
  </main>;
}
