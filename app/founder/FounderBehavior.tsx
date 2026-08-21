import type { FounderBehaviorData } from "@/lib/clean/founder/founderBehavior";
import type { FounderCustomersData } from "@/lib/clean/founder/founderCustomers";
import styles from "./FounderBehavior.module.css";

const NUMBER = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });

type Milestone = {
  label: string;
  count: number;
  detail: string;
};

function Metric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className={styles.metricCard}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>{NUMBER.format(value)}</p>
      <p className={styles.metricDetail}>{detail}</p>
    </article>
  );
}

function activationMilestones(
  customers: FounderCustomersData,
  behavior: FounderBehaviorData,
): Milestone[] {
  const customerIds = new Set(customers.customers.map((customer) => customer.userId));
  const customerBehavior = behavior.customers.filter((row) => customerIds.has(row.userId));

  return [
    {
      label: "Customer account",
      count: customers.totals.customers,
      detail: "Signed up",
    },
    {
      label: "Profile complete",
      count: customers.totals.completedProfiles,
      detail: "Family setup completed",
    },
    {
      label: "Learner added",
      count: customers.customers.filter((customer) => customer.learnerCount > 0).length,
      detail: "At least one learner",
    },
    {
      label: "Calendar used",
      count: customerBehavior.filter((row) => row.calendarActions > 0).length,
      detail: `Within ${behavior.periodDays} days`,
    },
    {
      label: "My Day used",
      count: customerBehavior.filter((row) => row.myDayViews > 0).length,
      detail: `Within ${behavior.periodDays} days`,
    },
    {
      label: "Evidence created",
      count: customerBehavior.filter((row) => row.evidenceCreated > 0).length,
      detail: `Within ${behavior.periodDays} days`,
    },
    {
      label: "Returned",
      count: customerBehavior.filter((row) => row.activeDays >= 2).length,
      detail: "Active on 2+ days",
    },
  ];
}

export default function FounderBehavior({
  behavior,
  customers,
}: {
  behavior: FounderBehaviorData;
  customers: FounderCustomersData;
}) {
  if (!behavior.configured) {
    return (
      <section className={styles.section} aria-labelledby="founder-behaviour">
        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Analytics v2</span>
            <h2 id="founder-behaviour">Behaviour</h2>
            <p>Frequency, feature use, activation and return behaviour from PostHog.</p>
          </div>
        </div>
        <div className={styles.configCard}>
          <strong>Behaviour reporting is ready to connect.</strong>
          <p>
            Event collection is already live. Add server-only PostHog query credentials to the
            deployment to turn on this founder view; no customer-facing changes are required.
          </p>
          <code>POSTHOG_PERSONAL_API_KEY</code>
          <code>POSTHOG_PROJECT_ID</code>
          <code>POSTHOG_API_HOST</code>
        </div>
      </section>
    );
  }

  const customerIds = new Set(customers.customers.map((customer) => customer.userId));
  const customerBehavior = behavior.customers.filter((row) => customerIds.has(row.userId));
  const customerSignIns = customerBehavior.reduce((total, row) => total + row.signIns, 0);
  const customerActions = customerBehavior.reduce((total, row) => total + row.actions, 0);
  const returning = customerBehavior.filter((row) => row.activeDays >= 2).length;
  const milestones = activationMilestones(customers, behavior);
  const base = Math.max(customers.totals.customers, 1);
  const maxFeatureEvents = Math.max(...behavior.featureUsage.map((row) => row.events), 1);

  return (
    <section className={styles.section} aria-labelledby="founder-behaviour">
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Analytics v2</span>
          <h2 id="founder-behaviour">Behaviour</h2>
          <p>What customers are using and whether they are coming back.</p>
        </div>
        <span className={styles.periodPill}>Last {behavior.periodDays} days</span>
      </div>

      <div className={styles.metricGrid}>
        <Metric
          label="Active customers"
          value={customerBehavior.length}
          detail={`Used MyLearna in the last ${behavior.periodDays} days`}
        />
        <Metric label="Sign-ins" value={customerSignIns} detail="Customer sign-in events" />
        <Metric label="Product actions" value={customerActions} detail="Tracked product events" />
        <Metric label="Returning customers" value={returning} detail="Active on two or more days" />
      </div>

      <div className={styles.twoColumn}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Activation milestones</h3>
              <p>Where customer accounts have reached so far.</p>
            </div>
          </div>
          <ol className={styles.funnel}>
            {milestones.map((milestone) => {
              const percentage = Math.min(100, Math.round((milestone.count / base) * 100));
              return (
                <li className={styles.funnelRow} key={milestone.label}>
                  <div className={styles.funnelCopy}>
                    <div>
                      <strong>{milestone.label}</strong>
                      <span>{milestone.detail}</span>
                    </div>
                    <b>{NUMBER.format(milestone.count)}</b>
                  </div>
                  <div className={styles.track} aria-label={`${milestone.label}: ${percentage}%`}>
                    <span style={{ width: `${percentage}%` }} />
                  </div>
                  <small>{percentage}% of customer accounts</small>
                </li>
              );
            })}
          </ol>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3>Top features</h3>
              <p>MyLearna areas ranked by tracked use.</p>
            </div>
          </div>
          {behavior.featureUsage.length > 0 ? (
            <ol className={styles.features}>
              {behavior.featureUsage.map((row) => (
                <li className={styles.featureRow} key={row.feature}>
                  <div className={styles.featureCopy}>
                    <strong>{row.feature}</strong>
                    <span>
                      {NUMBER.format(row.events)} uses · {NUMBER.format(row.users)} users
                    </span>
                  </div>
                  <div className={styles.featureTrack} aria-hidden="true">
                    <span style={{ width: `${Math.max(4, (row.events / maxFeatureEvents) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>No product activity in this period.</p>
          )}
        </article>
      </div>

      <div className={styles.note}>
        “Returned” means activity on at least two separate days. MyLearna currently uses active days
        and sign-ins rather than claiming browser sessions that the existing event capture does not
        reliably identify.
      </div>
    </section>
  );
}
