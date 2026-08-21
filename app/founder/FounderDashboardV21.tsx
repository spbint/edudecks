import type { ReactNode } from "react";
import Link from "next/link";
import type { FounderDashboardData } from "@/lib/clean/founder/founderDashboard";
import {
  buildFounderBehaviourIntelligence,
  type FounderBehaviourAction,
  type FounderBehaviourFamily,
} from "@/lib/clean/founder/founderBehaviour";
import FounderSignOutButton from "./FounderSignOutButton";
import styles from "./FounderDashboardV2.module.css";

const N = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });
const D = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 1 });
const P = new Intl.NumberFormat("en-AU", { style: "percent", maximumFractionDigits: 0 });

function when(value: string | null) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Hobart",
  }).format(date);
}

function Families({ items }: { items: FounderBehaviourFamily[] }) {
  if (!items.length) return <p className={styles.muted}>No families in this group.</p>;
  return <ol className={styles.timeline}>{items.map((family) => (
    <li key={family.userId}>
      <span><strong>{family.displayName}</strong>{family.email && family.email !== family.displayName ? ` · ${family.email}` : ""}</span>
      <time dateTime={family.lastActiveAt ?? family.joinedAt}>{when(family.lastActiveAt ?? family.joinedAt)}</time>
    </li>
  ))}</ol>;
}

function Actions({ items }: { items: FounderBehaviourAction[] }) {
  if (!items.length) return <p className={styles.muted}>No recent named learning actions are available to show.</p>;
  return <ol className={styles.timeline}>{items.map((action, index) => (
    <li key={`${action.userId}-${action.occurredAt}-${index}`}>
      <span><strong>{action.displayName}</strong> · {action.label}</span>
      <time dateTime={action.occurredAt}>{when(action.occurredAt)}</time>
    </li>
  ))}</ol>;
}

function Drill({ value, label, note, children }: { value: number | string; label: string; note: string; children: ReactNode }) {
  return <details className={`${styles.metricCard} ${styles.customerDetails}`}>
    <summary aria-label={`${label}: ${value}. Open details`}>
      <p className={styles.metricValue}>{typeof value === "number" ? N.format(value) : value}</p>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricNote}>{note} · click for who</p>
    </summary>
    <div className={styles.customerDetailBody} style={{ width: "100%", marginLeft: 0 }}>{children}</div>
  </details>;
}

function CustomerList({ data }: { data: FounderDashboardData }) {
  return <div className={styles.tablePanel}>{data.customers.length ? <div className={styles.tableScroll}>
    <table className={styles.table}>
      <thead><tr><th>Family</th><th>Joined</th><th>Last active</th><th>Active days</th><th>Most used</th><th>Status</th></tr></thead>
      <tbody>{data.customers.map((customer) => <tr key={customer.userId}>
        <td><details className={styles.customerDetails}><summary><span className={styles.customerName}>{customer.displayName}</span>{customer.familyDisplayName && customer.email ? <span className={styles.customerEmail}>{customer.email}</span> : null}</summary>
          <div className={styles.customerDetailBody}><strong>Recent activity</strong>{customer.recentActivity.length ? <ol className={styles.timeline}>{customer.recentActivity.map((activity, index) => <li key={`${activity.occurredAt}-${index}`}><span>{activity.label}</span><time dateTime={activity.occurredAt}>{when(activity.occurredAt)}</time></li>)}</ol> : <p className={styles.muted}>No in-product activity recorded in the current 30-day view.</p>}</div>
        </details></td>
        <td>{when(customer.joinedAt)}</td><td>{when(customer.lastActiveAt)}</td><td>{N.format(customer.activeDays30)} / 30</td><td>{customer.topArea ?? "Exploring"}</td><td>{customer.status}</td>
      </tr>)}</tbody>
    </table>
  </div> : <div className={styles.softEmpty}>No family accounts are available yet.</div>}</div>;
}

export default function FounderDashboardV21({ data }: { data: FounderDashboardData }) {
  const b = buildFounderBehaviourIntelligence(data);
  const drops = b.journeyDrops.filter((item) => item.count > 0);
  const topFeatureUsers = Math.max(1, ...data.featureUsage.map((feature) => feature.users));
  const acquisition = data.acquisitionToday ? Object.entries(data.acquisitionToday).filter((entry): entry is [string, number] => typeof entry[1] === "number" && entry[1] > 0) : [];

  return <main className={styles.page}><div className={styles.shell}>
    <header className={styles.header}><div><span className={styles.privatePill}>Private Founder view</span><h1>MyLearna Founder</h1><p className={styles.intro}>What is happening, who is using MyLearna, how families are behaving, and what needs attention.</p></div><div className={styles.headerActions}><Link href="/my-day" className={styles.secondaryAction}>Return to MyLearna</Link><FounderSignOutButton /></div></header>

    <section className={styles.section} aria-labelledby="today-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>What + who</p><h2 id="today-title">Today at MyLearna</h2></div><span className={styles.updated}>Updated {when(data.generatedAt)}</span></div>
      <div className={styles.metricsGrid}>
        <Drill value={data.today.newFamilies} label="New families" note="Joined today"><Families items={b.todayDetails.newFamilies} /></Drill>
        <Drill value={data.today.activeFamilies} label="Active families" note="Used MyLearna today"><Families items={b.todayDetails.activeFamilies} /></Drill>
        <Drill value={data.today.returningFamilies} label="Returning families" note="Came back today"><Families items={b.todayDetails.returningFamilies} /></Drill>
        <Drill value={data.today.meaningfulActions} label="Learning actions" note="Planning, capture, Portfolio or Reports"><Actions items={b.todayDetails.learningActions} />{b.todayDetails.learningActions.length < data.today.meaningfulActions ? <p className={styles.muted}>The headline is the full count; this shows the recent named actions retained in family timelines.</p> : null}</Drill>
      </div>
      <div className={styles.changeCard}><span className={styles.changeLabel}>What changed?</span><p>{data.whatChanged}</p></div>
    </section>

    <section className={styles.section} aria-labelledby="behaviour-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Behaviour intelligence</p><h2 id="behaviour-title">How families are behaving</h2></div><p className={styles.sectionHint}>Activity, retention, stickiness, lifecycle and paths synthesized from MyLearna’s real product events.</p></div>
      <div className={styles.changeCard}><span className={styles.changeLabel}>Founder read</span><p>{b.founderRead}</p></div>
      <div className={styles.metricsGrid}>
        <Drill value={b.engagement.activeLast7Days} label="Active this week" note="Used MyLearna in the last 7 days"><Families items={b.groups.activeLast7Days} /></Drill>
        <Drill value={b.engagement.repeatFamilies} label="Repeat-use families" note="Active on 2+ days in 30 days"><Families items={b.groups.repeatFamilies} /></Drill>
        <Drill value={b.engagement.regularFamilies} label="Regular-use families" note="Active on 3+ days in 30 days"><Families items={b.groups.regularFamilies} /></Drill>
        <Drill value={D.format(b.engagement.averageActiveDays)} label="Average active days" note="Among active 30-day families"><Families items={b.groups.activeLast30Days} /></Drill>
      </div>
      <div className={styles.twoColumn} style={{ marginTop: 16 }}>
        <section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.eyebrow}>Retention + lifecycle</p><h2>Are families forming a habit?</h2></div></div><div className={styles.returnGrid}><div><strong>{P.format(b.engagement.repeatRate)}</strong><span>of active 30-day families returned on 2+ days</span></div><div><strong>{N.format(b.groups.goingQuiet.length)}</strong><span>going quiet</span></div><div><strong>{N.format(b.groups.dormant.length)}</strong><span>dormant</span></div></div></section>
        <section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.eyebrow}>Paths</p><h2>What families do next</h2></div></div>{b.observedPaths.length ? <div className={styles.sourceList}>{b.observedPaths.map((path) => <details className={styles.customerDetails} key={`${path.from}-${path.to}`}><summary><strong>{path.from} → {path.to}</strong> · {path.families.length} {path.families.length === 1 ? "family" : "families"}</summary><div className={styles.customerDetailBody}><Families items={path.families} /></div></details>)}</div> : <div className={styles.softEmpty}>More multi-step activity is needed before a reliable next-step pattern appears.</div>}</section>
      </div>
    </section>

    <section className={styles.section} aria-labelledby="trend-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Trends</p><h2 id="trend-title">What is changing over time?</h2></div><p className={styles.sectionHint}>{data.trends.periodLabel}</p></div><div className={styles.changeCard}><span className={styles.changeLabel}>Founder read</span><p>{data.trends.summary}</p></div><div className={styles.metricsGrid}>{data.trends.items.map((item) => <article className={styles.metricCard} key={item.label}><p className={styles.metricValue}>{item.current === null ? "—" : N.format(item.current)}</p><p className={styles.metricLabel}>{item.label}</p><p className={styles.metricNote}>{item.status} · previous: {item.previous === null ? "—" : N.format(item.previous)}</p><p className={styles.metricNote}>{item.detail}</p></article>)}</div></section>

    <section className={styles.section} aria-labelledby="attention-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Why</p><h2 id="attention-title">Founder attention</h2></div></div><div className={styles.attentionGrid}>{data.attention.map((item, index) => <article key={`${item.title}-${index}`} className={`${styles.attentionCard} ${styles[`attention_${item.tone}`]}`}><p className={styles.attentionTitle}>{item.title}</p><p>{item.detail}</p></article>)}</div></section>

    <div className={styles.twoColumn}>
      <section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.eyebrow}>Funnel</p><h2>How families are moving</h2></div>{data.biggestDrop ? <span className={styles.callout}>Watch: {data.biggestDrop}</span> : null}</div><div className={styles.journeyList}>{data.journey.map((stage) => <div className={styles.journeyRow} key={stage.label}><div className={styles.journeyText}><span>{stage.label}</span><strong>{N.format(stage.count)}</strong></div><div className={styles.progressTrack}><span className={styles.progressFill} style={{ width: `${Math.max(0, Math.min(100, stage.percent * 100))}%` }} /></div><span className={styles.journeyPercent}>{P.format(stage.percent)}</span></div>)}</div>{drops.length ? <div className={styles.sourceList} style={{ marginTop: 18 }}>{drops.map((drop) => <details className={styles.customerDetails} key={`${drop.from}-${drop.to}`}><summary><strong>{drop.from} → {drop.to}</strong> · {drop.count} not yet through</summary><div className={styles.customerDetailBody}><Families items={drop.families} /></div></details>)}</div> : null}</section>
      <section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.eyebrow}>Where</p><h2>Where families spend their time</h2></div><span className={styles.panelNote}>Last 30 days</span></div>{data.featureUsage.length ? <div className={styles.featureList}>{data.featureUsage.map((feature) => <div className={styles.featureRow} key={feature.label}><div className={styles.featureHeading}><strong>{feature.label}</strong><span>{feature.users} {feature.users === 1 ? "family" : "families"} · {feature.actions} uses</span></div><div className={styles.featureTrack}><span className={styles.featureFill} style={{ width: `${(feature.users / topFeatureUsers) * 100}%` }} /></div></div>)}</div> : <div className={styles.softEmpty}>Product use will build here as families move through MyLearna.</div>}</section>
    </div>

    <section className={styles.section} aria-labelledby="people-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Who</p><h2 id="people-title">People</h2></div><p className={styles.sectionHint}>Real family accounts, not analytics IDs. Child names and learning content stay out of this view.</p></div><CustomerList data={data} /></section>

    <div className={styles.twoColumn}><section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.eyebrow}>When</p><h2>Are families coming back?</h2></div></div><div className={styles.returnGrid}><div><strong>{N.format(data.returnHealth.activeLast7Days)}</strong><span>active in the last 7 days</span></div><div><strong>{N.format(data.returnHealth.activeLast30Days)}</strong><span>active in the last 30 days</span></div><div><strong>{N.format(data.returnHealth.goingQuiet)}</strong><span>going quiet after earlier use</span></div></div></section>
      <section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.eyebrow}>Where from</p><h2>Where today’s families came from</h2></div></div>{acquisition.length ? <div className={styles.sourceList}>{acquisition.map(([channel, count]) => <div key={channel}><span>{channel}</span><strong>{N.format(count)}</strong></div>)}</div> : <div className={styles.softEmpty}>No attributed signups yet today.</div>}</section></div>

    {!data.productActivityAvailable ? <aside className={styles.connectionNote}>Customer information is live. Behaviour intelligence needs the private read-only activity connection before product activity can populate fully.</aside> : null}
  </div></main>;
}
