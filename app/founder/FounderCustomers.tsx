import type { FounderBehaviorData } from "@/lib/clean/founder/founderBehavior";
import type { FounderCustomerStatus, FounderCustomersData } from "@/lib/clean/founder/founderCustomers";
import styles from "./FounderCustomers.module.css";

const NUMBER_FORMATTER = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Hobart",
  }).format(date);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeZone: "Australia/Hobart",
  }).format(date);
}

function statusClass(status: FounderCustomerStatus) {
  if (status === "New") return `${styles.status} ${styles.statusNew}`;
  if (status === "Active") return `${styles.status} ${styles.statusActive}`;
  if (status === "Onboarding") return `${styles.status} ${styles.statusOnboarding}`;
  if (status === "At risk") return `${styles.status} ${styles.statusRisk}`;
  return `${styles.status} ${styles.statusInactive}`;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className={styles.metricCard}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>{NUMBER_FORMATTER.format(value)}</p>
    </article>
  );
}

export default function FounderCustomers({
  data,
  behavior,
}: {
  data: FounderCustomersData;
  behavior: FounderBehaviorData;
}) {
  const behaviorByUserId = new Map(behavior.customers.map((row) => [row.userId, row]));

  return (
    <section className={styles.section} aria-labelledby="founder-customers">
      <div className={styles.header}>
        <div>
          <h2 id="founder-customers">Users</h2>
          <p>Shopify-style customer view from MyLearna account, family and product-use data.</p>
        </div>
        <p>Child names and learning content are intentionally excluded.</p>
      </div>

      <div className={styles.metricGrid}>
        <Metric label="Customer accounts" value={data.totals.customers} />
        <Metric label="Profiles completed" value={data.totals.completedProfiles} />
        <Metric label="Learners added" value={data.totals.learners} />
        <Metric label="Active in last 7 days" value={data.totals.activeLast7Days} />
      </div>

      <div className={styles.tablePanel}>
        {data.customers.length > 0 ? (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Joined</th>
                  <th>Location</th>
                  <th>Learners</th>
                  <th>Profile</th>
                  <th>Last sign-in</th>
                  <th>Active days</th>
                  <th>Sign-ins</th>
                  <th>Product actions</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.customers.map((customer) => {
                  const location = [customer.jurisdictionCode, customer.countryCode]
                    .filter(Boolean)
                    .join(", ");
                  const usage = behaviorByUserId.get(customer.userId);
                  return (
                    <tr key={customer.userId}>
                      <td>
                        <span className={styles.customerName}>
                          {customer.familyDisplayName ?? "Profile not completed"}
                        </span>
                        <span className={styles.customerEmail}>{customer.email ?? "Email unavailable"}</span>
                      </td>
                      <td>{formatDate(customer.joinedAt)}</td>
                      <td className={location ? undefined : styles.muted}>{location || "Not set"}</td>
                      <td>{NUMBER_FORMATTER.format(customer.learnerCount)}</td>
                      <td>{customer.profileCompleted ? "Complete" : "Incomplete"}</td>
                      <td>{formatDateTime(customer.lastActiveAt)}</td>
                      <td className={!behavior.configured ? styles.muted : undefined}>
                        {behavior.configured ? NUMBER_FORMATTER.format(usage?.activeDays ?? 0) : "—"}
                      </td>
                      <td className={!behavior.configured ? styles.muted : undefined}>
                        {behavior.configured ? NUMBER_FORMATTER.format(usage?.signIns ?? 0) : "—"}
                      </td>
                      <td className={!behavior.configured ? styles.muted : undefined}>
                        {behavior.configured ? NUMBER_FORMATTER.format(usage?.actions ?? 0) : "—"}
                      </td>
                      <td>
                        <span className={statusClass(customer.status)}>{customer.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.empty}>No customer accounts are available yet.</div>
        )}
        <div className={styles.note}>
          Last sign-in comes from Supabase. Active days, sign-ins and product actions use the last {behavior.periodDays} days of privacy-safe PostHog product events when server reporting is configured.
        </div>
      </div>
    </section>
  );
}
