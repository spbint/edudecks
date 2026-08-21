import Link from "next/link";
import type {
  FounderCustomerStatus,
  FounderDashboardData,
} from "@/lib/clean/founder/founderDashboard";
import FounderSignOutButton from "./FounderSignOutButton";
import styles from "./FounderDashboardV2.module.css";

const NUMBER = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });
const PERCENT = new Intl.NumberFormat("en-AU", { style: "percent", maximumFractionDigits: 0 });

function formatDate(value: string | null) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeZone: "Australia/Hobart",
  }).format(date);
}

function formatDateTime(value: string | null) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Hobart",
  }).format(date);
}

function statusClass(status: FounderCustomerStatus) {
  if (status === "Active") return `${styles.status} ${styles.statusActive}`;
  if (status === "New") return `${styles.status} ${styles.statusNew}`;
  if (status === "Going quiet") return `${styles.status} ${styles.statusAttention}`;
  if (status === "Dormant") return `${styles.status} ${styles.statusDormant}`;
  return `${styles.status} ${styles.statusNeutral}`;
}

function Metric({ value, label, note }: { value: number; label: string; note: string }) {
  return (
    <article className={styles.metricCard}>
      <p className={styles.metricValue}>{NUMBER.format(value)}</p>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricNote}>{note}</p>
    </article>
  );
}

function TrendMetric({ item }: { item: FounderDashboardData["trends"]["items"][number] }) {
  const current = item.current === null ? "—" : NUMBER.format(item.current);
  const previous = item.previous === null ? "—" : NUMBER.format(item.previous);
  return (
    <article className={styles.metricCard}>
      <p className={styles.metricValue}>{current}</p>
      <p className={styles.metricLabel}>{item.label}</p>
      <p className={styles.metricNote}>{item.status} · previous 7 days: {previous}</p>
      <p className={styles.metricNote}>{item.detail}</p>
    </article>
  );
}

function customerActivitySummary(data: FounderDashboardData["customers"][number]) {
  const parts = [
    data.myDayViews > 0 ? `My Day ${NUMBER.format(data.myDayViews)}` : null,
    data.calendarActions > 0 ? `plans ${NUMBER.format(data.calendarActions)}` : null,
    data.capturesSaved > 0 ? `captures ${NUMBER.format(data.capturesSaved)}` : null,
    data.portfolioViews > 0 ? `Portfolio ${NUMBER.format(data.portfolioViews)}` : null,
    data.reportViews > 0 ? `Reports ${NUMBER.format(data.reportViews)}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Still exploring";
}

export default function FounderDashboardV2({ data }: { data: FounderDashboardData }) {
  const topFeatureUsers = Math.max(1, ...data.featureUsage.map((feature) => feature.users));
  const acquisition = data.acquisitionToday
    ? Object.entries(data.acquisitionToday).filter(([, count]) => count > 0)
    : [];

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <span className={styles.privatePill}>Private Founder view</span>
            <h1>MyLearna Founder</h1>
            <p className={styles.intro}>What is happening, who is using MyLearna, and what needs attention.</p>
          </div>
          <div className={styles.headerActions}>
            <Link href="/my-day" className={styles.secondaryAction}>Return to MyLearna</Link>
            <FounderSignOutButton />
          </div>
        </header>

        <section className={styles.section} aria-labelledby="today-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>What</p>
              <h2 id="today-title">Today at MyLearna</h2>
            </div>
            <span className={styles.updated}>Updated {formatDateTime(data.generatedAt)}</span>
          </div>
          <div className={styles.metricsGrid}>
            <Metric value={data.today.newFamilies} label="New families" note="Joined today" />
            <Metric value={data.today.activeFamilies} label="Active families" note="Used MyLearna today" />
            <Metric value={data.today.returningFamilies} label="Returning families" note="Came back today" />
            <Metric value={data.today.meaningfulActions} label="Learning actions" note="Planning, capture, Portfolio or Reports" />
          </div>
          <div className={styles.changeCard}>
            <span className={styles.changeLabel}>What changed?</span>
            <p>{data.whatChanged}</p>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="trend-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Trend intelligence</p>
              <h2 id="trend-title">What is changing over time?</h2>
            </div>
            <p className={styles.sectionHint}>{data.trends.periodLabel}</p>
          </div>
          <div className={styles.changeCard}>
            <span className={styles.changeLabel}>Founder read</span>
            <p>{data.trends.summary}</p>
          </div>
          <div className={styles.metricsGrid}>
            {data.trends.items.map((item) => <TrendMetric key={item.label} item={item} />)}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="attention-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Why</p>
              <h2 id="attention-title">Founder attention</h2>
            </div>
            <p className={styles.sectionHint}>Plain-language signals, not assumptions about what families are thinking.</p>
          </div>
          <div className={styles.attentionGrid}>
            {data.attention.map((item, index) => (
              <article
                key={`${item.title}-${index}`}
                className={`${styles.attentionCard} ${styles[`attention_${item.tone}`]}`}
              >
                <p className={styles.attentionTitle}>{item.title}</p>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <div className={styles.twoColumn}>
          <section className={styles.panel} aria-labelledby="journey-title">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>How</p>
                <h2 id="journey-title">How families are moving</h2>
              </div>
              {data.biggestDrop ? <span className={styles.callout}>Watch: {data.biggestDrop}</span> : null}
            </div>
            <div className={styles.journeyList}>
              {data.journey.map((stage) => (
                <div className={styles.journeyRow} key={stage.label}>
                  <div className={styles.journeyText}>
                    <span>{stage.label}</span>
                    <strong>{NUMBER.format(stage.count)}</strong>
                  </div>
                  <div className={styles.progressTrack} aria-label={`${stage.label}: ${PERCENT.format(stage.percent)}`}>
                    <span className={styles.progressFill} style={{ width: `${Math.max(0, Math.min(100, stage.percent * 100))}%` }} />
                  </div>
                  <span className={styles.journeyPercent}>{PERCENT.format(stage.percent)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.panel} aria-labelledby="features-title">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Where</p>
                <h2 id="features-title">Where families spend their time</h2>
              </div>
              <span className={styles.panelNote}>Last 30 days</span>
            </div>
            {data.featureUsage.length > 0 ? (
              <div className={styles.featureList}>
                {data.featureUsage.map((feature) => (
                  <div className={styles.featureRow} key={feature.label}>
                    <div className={styles.featureHeading}>
                      <strong>{feature.label}</strong>
                      <span>{NUMBER.format(feature.users)} {feature.users === 1 ? "family" : "families"} · {NUMBER.format(feature.actions)} uses</span>
                    </div>
                    <div className={styles.featureTrack}>
                      <span className={styles.featureFill} style={{ width: `${(feature.users / topFeatureUsers) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.softEmpty}>Product use will build here as families move through MyLearna.</div>
            )}
          </section>
        </div>

        <section className={styles.section} aria-labelledby="people-title">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>Who</p>
              <h2 id="people-title">People</h2>
            </div>
            <p className={styles.sectionHint}>Real family accounts instead of analytics IDs. Child names and learning content stay out of this view.</p>
          </div>
          <div className={styles.tablePanel}>
            {data.customers.length > 0 ? (
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Family</th>
                      <th>Joined</th>
                      <th>Last active</th>
                      <th>Active days</th>
                      <th>Most used</th>
                      <th>What they have done</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers.map((customer) => (
                      <tr key={customer.userId}>
                        <td>
                          <details className={styles.customerDetails}>
                            <summary>
                              <span className={styles.customerName}>{customer.displayName}</span>
                              {customer.familyDisplayName && customer.email ? <span className={styles.customerEmail}>{customer.email}</span> : null}
                            </summary>
                            <div className={styles.customerDetailBody}>
                              <div className={styles.customerFacts}>
                                <span>{customer.learnerCount} {customer.learnerCount === 1 ? "learner" : "learners"}</span>
                                <span>{[customer.jurisdictionCode, customer.countryCode].filter(Boolean).join(", ") || "Location not set"}</span>
                              </div>
                              <strong>Recent activity</strong>
                              {customer.recentActivity.length > 0 ? (
                                <ol className={styles.timeline}>
                                  {customer.recentActivity.map((activity, index) => (
                                    <li key={`${activity.occurredAt}-${index}`}>
                                      <span>{activity.label}</span>
                                      <time dateTime={activity.occurredAt}>{formatDateTime(activity.occurredAt)}</time>
                                    </li>
                                  ))}
                                </ol>
                              ) : (
                                <p className={styles.muted}>No in-product activity recorded in the current 30-day view.</p>
                              )}
                            </div>
                          </details>
                        </td>
                        <td>{formatDate(customer.joinedAt)}</td>
                        <td>{formatDateTime(customer.lastActiveAt)}</td>
                        <td>{NUMBER.format(customer.activeDays30)} / 30</td>
                        <td>{customer.topArea ?? "Exploring"}</td>
                        <td className={styles.activitySummary}>{customerActivitySummary(customer)}</td>
                        <td><span className={statusClass(customer.status)}>{customer.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={styles.softEmpty}>No family accounts are available yet.</div>
            )}
          </div>
        </section>

        <div className={styles.twoColumn}>
          <section className={styles.panel} aria-labelledby="return-title">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>When</p>
                <h2 id="return-title">Are families coming back?</h2>
              </div>
            </div>
            <div className={styles.returnGrid}>
              <div><strong>{NUMBER.format(data.returnHealth.activeLast7Days)}</strong><span>active in the last 7 days</span></div>
              <div><strong>{NUMBER.format(data.returnHealth.activeLast30Days)}</strong><span>active in the last 30 days</span></div>
              <div><strong>{NUMBER.format(data.returnHealth.goingQuiet)}</strong><span>going quiet after earlier use</span></div>
            </div>
          </section>

          <section className={styles.panel} aria-labelledby="source-title">
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.eyebrow}>Where from</p>
                <h2 id="source-title">Where today’s families came from</h2>
              </div>
            </div>
            {acquisition.length > 0 ? (
              <div className={styles.sourceList}>
                {acquisition.map(([channel, count]) => (
                  <div key={channel}><span>{channel}</span><strong>{NUMBER.format(count)}</strong></div>
                ))}
              </div>
            ) : (
              <div className={styles.softEmpty}>No attributed signups yet today.</div>
            )}
          </section>
        </div>

        {!data.productActivityAvailable ? (
          <aside className={styles.connectionNote}>
            Customer and family information is live. The private product-activity feed still needs its read-only connection enabled before behaviour, journeys, feature use and product trends can populate fully.
          </aside>
        ) : null}
      </div>
    </main>
  );
}
