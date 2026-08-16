import Link from "next/link";
import type { FounderCockpitData, FounderMetric } from "@/lib/clean/founder/founderData";
import styles from "./FounderCockpit.module.css";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });
const PERCENT_FORMATTER = new Intl.NumberFormat("en-AU", {
  style: "percent",
  maximumFractionDigits: 1,
});

function formatMetric(metric: FounderMetric) {
  if (metric.value === null) return null;
  if (metric.format === "currency") {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: metric.currencyCode ?? "AUD",
      maximumFractionDigits: 2,
    }).format(metric.value);
  }
  if (metric.format === "percent") return PERCENT_FORMATTER.format(metric.value);
  return NUMBER_FORMATTER.format(metric.value);
}

function MetricCard({ label, metric }: { label: string; metric: FounderMetric }) {
  const value = formatMetric(metric);
  return (
    <article className={styles.metricCard}>
      <div>
        <p className={styles.metricLabel}>{label}</p>
        {value === null ? (
          <p className={styles.metricUnavailable}>Not available yet</p>
        ) : (
          <p className={styles.metricValue}>{value}</p>
        )}
      </div>
      <div className={styles.metricMeta}>
        {metric.availability === "live" ? (
          <span className={styles.liveBadge}>Live</span>
        ) : (
          "Unavailable"
        )}
        {" / "}
        {metric.source}
      </div>
    </article>
  );
}

function DataRows({ rows }: { rows: Array<{ label: string; metric: FounderMetric }> }) {
  return (
    <ul className={styles.dataList}>
      {rows.map(({ label, metric }) => {
        const value = formatMetric(metric);
        return (
          <li className={styles.dataRow} key={label}>
            <span className={styles.dataRowLabel}>{label}</span>
            {value === null ? (
              <span className={styles.dataRowUnavailable}>Not available yet</span>
            ) : (
              <span className={styles.dataRowValue}>{value}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Hobart",
  }).format(date);
}

export default function FounderCockpit({ data }: { data: FounderCockpitData }) {
  const accountDataAvailable = data.today.signups.availability === "live";
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.hero}>
          <div className={styles.heroTop}>
            <span className={styles.privatePill}>Private overview</span>
            <Link className={styles.backLink} href="/my-day">
              Return to MyLearna
            </Link>
          </div>
          <div className={styles.heroCopy}>
            <h1>MyLearna Founder</h1>
            <p>
              A focused view of customer activity, product use and Marketplace performance - using
              real, privacy-safe signals only.
            </p>
            <div className={styles.timestamp}>
              Updated {formatTimestamp(data.generatedAt)} / Hobart time
            </div>
          </div>
        </header>

        <section className={styles.section} aria-labelledby="founder-today">
          <div className={styles.sectionHeader}>
            <h2 id="founder-today">Today</h2>
            <p>Account metrics use the current Hobart calendar day.</p>
          </div>
          <div className={styles.metricGrid}>
            <MetricCard label="Visitors" metric={data.today.visitors} />
            <MetricCard label="Signups" metric={data.today.signups} />
            <MetricCard label="Returning" metric={data.today.returning} />
            <MetricCard label="Orders" metric={data.today.orders} />
            <MetricCard label="Revenue" metric={data.today.revenue} />
          </div>
        </section>

        <div className={styles.twoColumn}>
          <section className={styles.panel} aria-labelledby="founder-live-now">
            <div className={styles.panelHeader}>
              <h2 id="founder-live-now">Live now</h2>
              <p>Current sessions and the areas they are using.</p>
            </div>
            <MetricCard label="Active users" metric={data.liveNow.activeUsers} />
            {data.liveNow.activeUsers.availability === "unavailable" ? (
              <div className={styles.emptyState}>
                Active users and current areas/pages are not available yet. They need a server-side
                PostHog query connection; product analytics capture continues normally without it.
              </div>
            ) : null}
          </section>

          <section className={styles.panel} aria-labelledby="founder-acquisition">
            <div className={styles.panelHeader}>
              <h2 id="founder-acquisition">Acquisition</h2>
              <p>Attributed signups today; raw sources and referrers are never displayed.</p>
            </div>
            <DataRows
              rows={Object.entries(data.acquisition).map(([label, metric]) => ({ label, metric }))}
            />
          </section>
        </div>

        <section className={styles.section} aria-labelledby="founder-marketplace">
          <div className={styles.sectionHeader}>
            <h2 id="founder-marketplace">Marketplace</h2>
            <p>Read-only performance; Storefront purchasing remains unchanged.</p>
          </div>
          <div className={styles.metricGrid}>
            <MetricCard label="Product views" metric={data.marketplace.productViews} />
            <MetricCard label="Add to carts" metric={data.marketplace.addToCarts} />
            <MetricCard label="Checkout starts" metric={data.marketplace.checkoutStarts} />
            <MetricCard label="Orders" metric={data.marketplace.orders} />
            <MetricCard label="Revenue" metric={data.marketplace.revenue} />
          </div>
        </section>

        <div className={styles.twoColumn}>
          <section className={styles.panel} aria-labelledby="founder-product-usage">
            <div className={styles.panelHeader}>
              <h2 id="founder-product-usage">Product usage</h2>
              <p>Privacy-safe page and feature events, when query access is available.</p>
            </div>
            <DataRows
              rows={Object.entries(data.productUsage).map(([label, metric]) => ({ label, metric }))}
            />
          </section>

          <section className={styles.panel} aria-labelledby="founder-retention">
            <div className={styles.panelHeader}>
              <h2 id="founder-retention">Retention</h2>
              <p>Account sign-ins are shown separately from product-event return rates.</p>
            </div>
            <DataRows
              rows={[
                { label: "Active this week", metric: data.retention.activeThisWeek },
                { label: "Returning families", metric: data.retention.returningFamilies },
                { label: "7-day return rate", metric: data.retention.sevenDayReturnRate },
              ]}
            />
          </section>
        </div>

        <section className={styles.panel} aria-labelledby="founder-recent-activity">
          <div className={styles.panelHeader}>
            <h2 id="founder-recent-activity">Recent activity</h2>
            <p>Anonymous operational events only - never names, emails or learning content.</p>
          </div>
          {data.recentActivity.length > 0 ? (
            <ol className={styles.activityList}>
              {data.recentActivity.map((activity, index) => (
                <li className={styles.activityItem} key={`${activity.occurredAt}-${index}`}>
                  <span className={styles.activityDot} aria-hidden="true" />
                  <div>
                    <p className={styles.activityTitle}>New signup</p>
                    <time className={styles.activityTime} dateTime={activity.occurredAt}>
                      {formatTimestamp(activity.occurredAt)}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.emptyState}>
              {accountDataAvailable ? "No signup activity yet." : "Not available yet."}
            </div>
          )}
        </section>

        <aside className={styles.sourceNote}>
          Supabase Auth supplies aggregate account activity. PostHog currently captures events but
          has no configured server reporting connection. Shopify Storefront data does not include
          order or revenue analytics, so unsupported metrics stay unavailable.
        </aside>
      </div>
    </main>
  );
}

