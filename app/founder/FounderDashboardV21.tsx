"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { FounderDashboardData } from "@/lib/clean/founder/founderDashboard";
import {
  buildFounderBehaviourIntelligence,
  type FounderBehaviourAction,
  type FounderBehaviourFamily,
} from "@/lib/clean/founder/founderBehaviour";
import FounderActions from "./FounderActions";
import FounderSignOutButton from "./FounderSignOutButton";
import styles from "./FounderDashboardV2.module.css";
import v21 from "./FounderDashboardV21.module.css";

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

function Families({ items, showActiveDays = false }: { items: FounderBehaviourFamily[]; showActiveDays?: boolean }) {
  if (!items.length) return <p className={styles.muted}>No families in this group.</p>;
  return <ol className={styles.timeline}>{items.map((family) => (
    <li key={family.userId}>
      <span className={v21.familyLine}>
        <strong>{family.displayName}</strong>
        <span className={v21.familyMeta}>
          {family.email && family.email !== family.displayName ? `${family.email}` : ""}
          {showActiveDays ? `${family.email && family.email !== family.displayName ? " · " : ""}${N.format(family.activeDays30)} active ${family.activeDays30 === 1 ? "day" : "days"} / 30` : ""}
        </span>
      </span>
      <time dateTime={family.lastActiveAt ?? family.joinedAt}>{when(family.lastActiveAt ?? family.joinedAt)}</time>
    </li>
  ))}</ol>;
}

function Actions({ items }: { items: FounderBehaviourAction[] }) {
  if (!items.length) return <p className={styles.muted}>No learning actions are available for this period.</p>;
  return <ol className={styles.timeline}>{items.map((action, index) => (
    <li key={`${action.userId}-${action.occurredAt}-${index}`}>
      <span><strong>{action.displayName}</strong> · {action.label}</span>
      <time dateTime={action.occurredAt}>{when(action.occurredAt)}</time>
    </li>
  ))}</ol>;
}

function MetricButton({
  value,
  label,
  note,
  active,
  controls,
  onClick,
}: {
  value: number | string;
  label: string;
  note: string;
  active: boolean;
  controls: string;
  onClick: () => void;
}) {
  return <button
    type="button"
    className={`${styles.metricCard} ${v21.metricButton} ${active ? v21.metricButtonActive : ""}`}
    aria-expanded={active}
    aria-controls={controls}
    onClick={onClick}
  >
    <p className={styles.metricValue}>{typeof value === "number" ? N.format(value) : value}</p>
    <p className={styles.metricLabel}>{label}</p>
    <p className={styles.metricNote}>{note} · click for who</p>
  </button>;
}

function SharedDrill({ id, title, note, onClose, children }: { id: string; title: string; note: string; onClose: () => void; children: ReactNode }) {
  return <div id={id} className={v21.sharedDrill} role="region" aria-label={title}>
    <div className={v21.sharedDrillHeader}>
      <div><h3>{title}</h3><p>{note}</p></div>
      <button type="button" className={v21.sharedDrillClose} aria-label={`Close ${title}`} onClick={onClose}>×</button>
    </div>
    {children}
  </div>;
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

function AuthFunnel({ data }: { data: FounderDashboardData }) {
  const [range, setRange] = useState<7 | 30>(7);
  const funnel = range === 30 ? (data.authFunnel30 ?? data.authFunnel) : data.authFunnel;
  if (!funnel) return null;
  const account = funnel.accountOutcomes;
  const detailed = funnel.detailed;
  return <section className={styles.section} aria-labelledby="auth-funnel-title">
    <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Entry health</p><h2 id="auth-funnel-title">Sign-in funnel</h2></div><div className={v21.authRange} role="group" aria-label="Auth funnel range"><button className={v21.authRangeButton} type="button" aria-pressed={range === 7} onClick={() => setRange(7)}>Last 7 days</button><button className={v21.authRangeButton} type="button" aria-pressed={range === 30} onClick={() => setRange(30)}>30 days</button></div></div>
    <div className={`${styles.metricsGrid} ${v21.authMetricsGrid}`}>
      {[['Created', account?.created], ['Confirmed', account?.confirmed], ['Signed in', account?.signedIn], ['Family setup', account?.familySetup], ['Learner added', account?.learnerAdded], ['Planning/Capture', account?.planningStarted], ['Evidence saved', account?.evidenceSaved]].map(([label, value]) => <article className={styles.metricCard} key={label as string}><p className={styles.metricValue}>{typeof value === 'number' ? N.format(value) : 'Unavailable'}</p><p className={styles.metricLabel}>{label as string}</p><p className={styles.metricNote}>Supabase account outcome</p></article>)}
    </div>
    <div className={styles.changeCard}><span className={styles.changeLabel}>Detailed auth steps</span><p>{funnel.coverageMessage}</p>{detailed && funnel.earliestTrackedAuthEventAt ? <p>Challenge sent {detailed.challengeSent} · Verified {detailed.verificationSucceeded} · Session ready {detailed.sessionReady} · Entered MyLearna {detailed.productEntry}</p> : null}</div>
    <div className={styles.changeCard}><span className={styles.changeLabel}>Entry checks</span>{funnel.flags.filter((flag) => flag.id.includes("unconfirmed")).length ? <p>{funnel.flags.filter((flag) => flag.id.includes("unconfirmed")).length} account{funnel.flags.filter((flag) => flag.id.includes("unconfirmed")).length === 1 ? '' : 's'} ha{funnel.flags.filter((flag) => flag.id.includes("unconfirmed")).length === 1 ? 's' : 've'} not confirmed email.</p> : null}{funnel.flags.filter((flag) => flag.id.includes("no-signin")).length ? <p>{funnel.flags.filter((flag) => flag.id.includes("no-signin")).length} confirmed account{funnel.flags.filter((flag) => flag.id.includes("no-signin")).length === 1 ? '' : 's'} ha{funnel.flags.filter((flag) => flag.id.includes("no-signin")).length === 1 ? 's' : 've'} not entered MyLearna.</p> : null}{!funnel.flags.length ? <p>No sign-in entry issues currently need attention.</p> : null}</div>
    {funnel.signals.length ? <div className={styles.changeCard}><span className={styles.changeLabel}>Signals</span>{funnel.signals.map((signal) => <p key={signal.id}>{signal.title}: {signal.summary}</p>)}</div> : null}
  </section>;
}

export default function FounderDashboardV21({ data }: { data: FounderDashboardData }) {
  const b = buildFounderBehaviourIntelligence(data);
  const [todayDrill, setTodayDrill] = useState<"new" | "active" | "returning" | "actions" | null>(null);
  const [behaviourDrill, setBehaviourDrill] = useState<"week" | "repeat" | "regular" | "average" | null>(null);
  const [habitDrill, setHabitDrill] = useState<"repeat" | "quiet" | "dormant" | null>(null);
  const drops = b.journeyDrops.filter((item) => item.count > 0);
  const topFeatureUsers = Math.max(1, ...data.featureUsage.map((feature) => feature.users));
  const acquisition = data.acquisitionToday ? Object.entries(data.acquisitionToday).filter((entry): entry is [string, number] => typeof entry[1] === "number" && entry[1] > 0) : [];

  const toggleToday = (key: NonNullable<typeof todayDrill>) => setTodayDrill((current) => current === key ? null : key);
  const toggleBehaviour = (key: NonNullable<typeof behaviourDrill>) => setBehaviourDrill((current) => current === key ? null : key);
  const toggleHabit = (key: NonNullable<typeof habitDrill>) => setHabitDrill((current) => current === key ? null : key);

  return <main className={styles.page}><div className={styles.shell}>
    <header className={styles.header}><div><span className={styles.privatePill}>Private Founder view</span><h1>MyLearna Founder</h1><p className={styles.intro}>What is happening, who is using MyLearna, how families are behaving, and what needs attention.</p></div><div className={styles.headerActions}><Link href="/my-day" className={styles.secondaryAction}>Return to MyLearna</Link><FounderSignOutButton /></div></header>

    <AuthFunnel data={data} />
    <section className={styles.section} aria-labelledby="today-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>What + who</p><h2 id="today-title">Today at MyLearna</h2></div><span className={styles.updated}>Updated {when(data.generatedAt)}</span></div>
      <div className={styles.metricsGrid}>
        <MetricButton value={data.today.newFamilies} label="New families" note="Joined today" active={todayDrill === "new"} controls="today-drill" onClick={() => toggleToday("new")} />
        <MetricButton value={data.today.activeFamilies} label="Active families" note="Used MyLearna today" active={todayDrill === "active"} controls="today-drill" onClick={() => toggleToday("active")} />
        <MetricButton value={data.today.returningFamilies} label="Returning families" note="Came back today" active={todayDrill === "returning"} controls="today-drill" onClick={() => toggleToday("returning")} />
        <MetricButton value={data.today.meaningfulActions} label="Learning actions" note="Planning, capture, Portfolio or Reports" active={todayDrill === "actions"} controls="today-drill" onClick={() => toggleToday("actions")} />
      </div>
      {todayDrill === "new" ? <SharedDrill id="today-drill" title={`New families today — ${N.format(data.today.newFamilies)}`} note="Exactly who joined today." onClose={() => setTodayDrill(null)}><Families items={b.todayDetails.newFamilies} /></SharedDrill> : null}
      {todayDrill === "active" ? <SharedDrill id="today-drill" title={`Active families today — ${N.format(data.today.activeFamilies)}`} note="Exactly who used MyLearna today, with their 30-day activity frequency." onClose={() => setTodayDrill(null)}><Families items={b.todayDetails.activeFamilies} showActiveDays /></SharedDrill> : null}
      {todayDrill === "returning" ? <SharedDrill id="today-drill" title={`Returning families today — ${N.format(data.today.returningFamilies)}`} note="Families active today who joined before today." onClose={() => setTodayDrill(null)}><Families items={b.todayDetails.returningFamilies} showActiveDays /></SharedDrill> : null}
      {todayDrill === "actions" ? <SharedDrill id="today-drill" title={`Learning actions today — ${N.format(data.today.meaningfulActions)}`} note="The complete named action list behind the headline count." onClose={() => setTodayDrill(null)}><Actions items={b.todayDetails.learningActions} /></SharedDrill> : null}
      <div className={styles.changeCard}><span className={styles.changeLabel}>What changed?</span><p>{data.whatChanged}</p></div>
    </section>

    <FounderActions data={data} />

    <section className={styles.section} aria-labelledby="behaviour-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Behaviour intelligence</p><h2 id="behaviour-title">How families are behaving</h2></div><p className={styles.sectionHint}>Activity, retention, stickiness, lifecycle and paths synthesized from MyLearna’s real product events.</p></div>
      <div className={styles.changeCard}><span className={styles.changeLabel}>Founder read</span><p>{b.founderRead}</p></div>
      <div className={styles.metricsGrid}>
        <MetricButton value={b.engagement.activeLast7Days} label="Active this week" note="Used MyLearna in the last 7 days" active={behaviourDrill === "week"} controls="behaviour-drill" onClick={() => toggleBehaviour("week")} />
        <MetricButton value={b.engagement.repeatFamilies} label="Repeat-use families" note="Active on 2+ days in 30 days" active={behaviourDrill === "repeat"} controls="behaviour-drill" onClick={() => toggleBehaviour("repeat")} />
        <MetricButton value={b.engagement.regularFamilies} label="Regular-use families" note="Active on 3+ days in 30 days" active={behaviourDrill === "regular"} controls="behaviour-drill" onClick={() => toggleBehaviour("regular")} />
        <MetricButton value={D.format(b.engagement.averageActiveDays)} label="Average active days" note="Among active 30-day families" active={behaviourDrill === "average"} controls="behaviour-drill" onClick={() => toggleBehaviour("average")} />
      </div>
      {behaviourDrill === "week" ? <SharedDrill id="behaviour-drill" title={`Active this week — ${N.format(b.engagement.activeLast7Days)}`} note="Families with product activity in the last seven days." onClose={() => setBehaviourDrill(null)}><Families items={b.groups.activeLast7Days} showActiveDays /></SharedDrill> : null}
      {behaviourDrill === "repeat" ? <SharedDrill id="behaviour-drill" title={`Repeat-use families — ${N.format(b.engagement.repeatFamilies)}`} note="Families active on at least two separate days in the current 30-day window." onClose={() => setBehaviourDrill(null)}><Families items={b.groups.repeatFamilies} showActiveDays /></SharedDrill> : null}
      {behaviourDrill === "regular" ? <SharedDrill id="behaviour-drill" title={`Regular-use families — ${N.format(b.engagement.regularFamilies)}`} note="Families active on at least three separate days in the current 30-day window." onClose={() => setBehaviourDrill(null)}><Families items={b.groups.regularFamilies} showActiveDays /></SharedDrill> : null}
      {behaviourDrill === "average" ? <SharedDrill id="behaviour-drill" title={`Average active days — ${D.format(b.engagement.averageActiveDays)}`} note="The family-level active-day counts that make up this average." onClose={() => setBehaviourDrill(null)}><Families items={b.groups.activeLast30Days} showActiveDays /></SharedDrill> : null}

      <div className={styles.twoColumn} style={{ marginTop: 16 }}>
        <section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.eyebrow}>Retention + lifecycle</p><h2>Are families forming a habit?</h2></div></div><div className={styles.returnGrid}>
          <button type="button" className={`${v21.habitButton} ${habitDrill === "repeat" ? v21.habitButtonActive : ""}`} aria-expanded={habitDrill === "repeat"} aria-controls="habit-drill" onClick={() => toggleHabit("repeat")}><strong>{P.format(b.engagement.repeatRate)}</strong><span>of active 30-day families returned on 2+ days</span></button>
          <button type="button" className={`${v21.habitButton} ${habitDrill === "quiet" ? v21.habitButtonActive : ""}`} aria-expanded={habitDrill === "quiet"} aria-controls="habit-drill" onClick={() => toggleHabit("quiet")}><strong>{N.format(b.groups.goingQuiet.length)}</strong><span>going quiet</span></button>
          <button type="button" className={`${v21.habitButton} ${habitDrill === "dormant" ? v21.habitButtonActive : ""}`} aria-expanded={habitDrill === "dormant"} aria-controls="habit-drill" onClick={() => toggleHabit("dormant")}><strong>{N.format(b.groups.dormant.length)}</strong><span>dormant</span></button>
        </div>
          {habitDrill === "repeat" ? <SharedDrill id="habit-drill" title={`Returned on 2+ days — ${P.format(b.engagement.repeatRate)}`} note="The families behind the repeat-use rate." onClose={() => setHabitDrill(null)}><Families items={b.groups.repeatFamilies} showActiveDays /></SharedDrill> : null}
          {habitDrill === "quiet" ? <SharedDrill id="habit-drill" title={`Going quiet — ${N.format(b.groups.goingQuiet.length)}`} note="Previously active families with more than a week since their latest activity." onClose={() => setHabitDrill(null)}><Families items={b.groups.goingQuiet} showActiveDays /></SharedDrill> : null}
          {habitDrill === "dormant" ? <SharedDrill id="habit-drill" title={`Dormant — ${N.format(b.groups.dormant.length)}`} note="Families with more than 30 days since their latest recorded activity." onClose={() => setHabitDrill(null)}><Families items={b.groups.dormant} showActiveDays /></SharedDrill> : null}
        </section>
        <section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.eyebrow}>Paths</p><h2>What families do next</h2></div></div>{b.observedPaths.length ? <div className={styles.sourceList}>{b.observedPaths.map((path) => <details className={styles.customerDetails} key={`${path.from}-${path.to}`}><summary className={v21.pathSummary}><strong>{path.from} → {path.to}</strong><span className={v21.pathMeta}>{N.format(path.count)} observed {path.count === 1 ? "transition" : "transitions"} · {path.families.length} {path.families.length === 1 ? "family" : "families"}</span></summary><div className={styles.customerDetailBody}><Families items={path.families} showActiveDays /></div></details>)}</div> : <div className={styles.softEmpty}>More multi-step activity is needed before a reliable next-step pattern appears.</div>}</section>
      </div>
    </section>

    <section className={styles.section} aria-labelledby="trend-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Trends</p><h2 id="trend-title">What is changing over time?</h2></div><p className={styles.sectionHint}>{data.trends.periodLabel}</p></div><div className={styles.changeCard}><span className={styles.changeLabel}>Founder read</span><p>{data.trends.summary}</p></div><div className={styles.metricsGrid}>{data.trends.items.map((item) => <article className={styles.metricCard} key={item.label}><p className={styles.metricValue}>{item.current === null ? "—" : N.format(item.current)}</p><p className={styles.metricLabel}>{item.label}</p><p className={styles.metricNote}>{item.status} · previous: {item.previous === null ? "—" : N.format(item.previous)}</p><p className={styles.metricNote}>{item.detail}</p></article>)}</div></section>

    <section className={styles.section} aria-labelledby="attention-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Why</p><h2 id="attention-title">Founder attention</h2></div></div><div className={styles.attentionGrid}>{data.attention.map((item, index) => <article key={`${item.title}-${index}`} className={`${styles.attentionCard} ${styles[`attention_${item.tone}`]}`}><p className={styles.attentionTitle}>{item.title}</p><p>{item.detail}</p></article>)}</div></section>

    <div className={styles.twoColumn}>
      <section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.eyebrow}>Funnel</p><h2>How families are moving</h2></div>{data.biggestDrop ? <span className={styles.callout}>Watch: {data.biggestDrop}</span> : null}</div><div className={styles.journeyList}>{data.journey.map((stage) => <div className={styles.journeyRow} key={stage.label}><div className={styles.journeyText}><span>{stage.label}</span><strong>{N.format(stage.count)}</strong></div><div className={styles.progressTrack}><span className={styles.progressFill} style={{ width: `${Math.max(0, Math.min(100, stage.percent * 100))}%` }} /></div><span className={styles.journeyPercent}>{P.format(stage.percent)}</span></div>)}</div>{drops.length ? <div className={styles.sourceList} style={{ marginTop: 18 }}>{drops.map((drop) => <details className={styles.customerDetails} key={`${drop.from}-${drop.to}`}><summary><strong>{drop.from} → {drop.to}</strong> · {drop.count} not yet through</summary><div className={styles.customerDetailBody}><Families items={drop.families} showActiveDays /></div></details>)}</div> : null}</section>
      <section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.eyebrow}>Where</p><h2>Where families spend their time</h2></div><span className={styles.panelNote}>Last 30 days</span></div>{data.featureUsage.length ? <div className={styles.featureList}>{data.featureUsage.map((feature) => <div className={styles.featureRow} key={feature.label}><div className={styles.featureHeading}><strong>{feature.label}</strong><span>{feature.users} {feature.users === 1 ? "family" : "families"} · {feature.actions} uses</span></div><div className={styles.featureTrack}><span className={styles.featureFill} style={{ width: `${(feature.users / topFeatureUsers) * 100}%` }} /></div></div>)}</div> : <div className={styles.softEmpty}>Product use will build here as families move through MyLearna.</div>}</section>
    </div>

    <section className={styles.section} aria-labelledby="people-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Who</p><h2 id="people-title">People</h2></div><p className={styles.sectionHint}>Real family accounts, not analytics IDs. Child names and learning content stay out of this view.</p></div><CustomerList data={data} /></section>

    <div className={styles.twoColumn}><section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.eyebrow}>When</p><h2>Are families coming back?</h2></div></div><div className={styles.returnGrid}><div><strong>{N.format(data.returnHealth.activeLast7Days)}</strong><span>active in the last 7 days</span></div><div><strong>{N.format(data.returnHealth.activeLast30Days)}</strong><span>active in the last 30 days</span></div><div><strong>{N.format(data.returnHealth.goingQuiet)}</strong><span>going quiet after earlier use</span></div></div></section>
      <section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.eyebrow}>Where from</p><h2>Where today’s families came from</h2></div></div>{acquisition.length ? <div className={styles.sourceList}>{acquisition.map(([channel, count]) => <div key={channel}><span>{channel}</span><strong>{N.format(count)}</strong></div>)}</div> : <div className={styles.softEmpty}>No attributed signups yet today.</div>}</section></div>

    {!data.productActivityAvailable ? <aside className={styles.connectionNote}>Customer information is live. Behaviour intelligence needs the private read-only activity connection before product activity can populate fully.</aside> : null}
  </div></main>;
}
