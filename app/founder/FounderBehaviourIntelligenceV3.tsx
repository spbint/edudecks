import Link from "next/link";
import FounderSignOutButton from "./FounderSignOutButton";
import type {
  FounderBehaviourV3,
  FounderConfidence,
  FounderMetricV3,
} from "@/lib/clean/founder/founderBehaviourV3";
import styles from "./FounderBehaviourIntelligenceV3.module.css";

const N = new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 });
const P = new Intl.NumberFormat("en-AU", { style: "percent", maximumFractionDigits: 1 });

function Badge({ value }: { value: FounderConfidence }) {
  const className = value === "high" ? styles.badgeHigh : value === "directional" ? styles.badgeDirectional : styles.badgeInsufficient;
  return <span className={className}>{value === "high" ? "High confidence" : value === "directional" ? "Directional" : "Insufficient data"}</span>;
}

function value(metric: FounderMetricV3) {
  if (metric.value === null) return "—";
  return metric.label.toLowerCase().includes("share") ? P.format(metric.value) : N.format(metric.value);
}

function Metrics({ items }: { items: FounderMetricV3[] }) {
  return <div className={styles.metricGrid}>{items.map((metric) => <article className={styles.metric} key={metric.label}>
    <div className={styles.metricMeta}><span className={styles.eyebrow}>{metric.label}</span><Badge value={metric.confidence} /></div>
    <strong>{value(metric)}</strong><p>{metric.note}</p>
  </article>)}</div>;
}

function Breakdown({ items }: { items: Array<{ label: string; actors: number; events: number }> }) {
  if (!items.length) return <div className={styles.empty}>Insufficient observed activity in this window.</div>;
  return <div className={styles.list}>{items.map((item) => <div className={styles.listRow} key={item.label}><span>{item.label}</span><strong>{N.format(item.actors)} actors · {N.format(item.events)} events</strong></div>)}</div>;
}

function Section({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return <section className={styles.section}><div className={styles.sectionHeading}><div><span className={styles.eyebrow}>{eyebrow}</span><h2>{title}</h2></div><p>{description}</p></div>{children}</section>;
}

function query(range: number, includeInternal: boolean, includeSuspicious: boolean) {
  return `/founder?range=${range}${includeInternal ? "&internal=include" : ""}${includeSuspicious ? "" : "&suspicious=exclude"}`;
}

export default function FounderBehaviourIntelligenceV3({ data }: { data: FounderBehaviourV3 }) {
  return <main className={styles.page}><div className={styles.shell}>
    <header className={styles.hero}>
      <div className={styles.heroTop}><span className={styles.private}>Private Founder view · Behaviour Intelligence v3</span><div className={styles.controlGroup}><Link className={styles.back} href="/my-day">Return to MyLearna</Link><FounderSignOutButton /></div></div>
      <h1>Understand what families do next.</h1>
      <p>Privacy-safe acquisition, activation, product behaviour, Capture, retention and friction intelligence. Counts are anonymous and caveated where identity or sample quality is weak.</p>
      <div className={styles.toolbar}>
        <div className={styles.controlGroup}>{([7, 30, 90] as const).map((range) => <Link key={range} className={data.rangeDays === range ? styles.controlActive : styles.control} href={query(range, data.includeInternal, data.includeSuspicious)}>{range} days</Link>)}</div>
        <div className={styles.controlGroup}><Link className={!data.includeInternal ? styles.controlActive : styles.control} href={query(data.rangeDays, false, data.includeSuspicious)}>Exclude internal/test</Link><Link className={data.includeInternal ? styles.controlActive : styles.control} href={query(data.rangeDays, true, data.includeSuspicious)}>Include internal/test</Link></div>
        <div className={styles.controlGroup}><Link className={data.includeSuspicious ? styles.controlActive : styles.control} href={query(data.rangeDays, data.includeInternal, true)}>Include suspicious/unknown</Link><Link className={!data.includeSuspicious ? styles.controlActive : styles.control} href={query(data.rangeDays, data.includeInternal, false)}>Exclude suspicious/unknown</Link></div>
      </div>
    </header>

    {!data.posthogAvailable ? <div className={styles.empty}>The private PostHog query connection is unavailable. No behavioural precision is implied.</div> : null}

    <Section eyebrow="Executive behaviour summary" title="Founder summary" description={`Last ${data.rangeDays} days · ${data.includeInternal ? "internal/test included" : "internal/test excluded"} · ${data.includeSuspicious ? "suspicious/unknown included" : "suspicious/unknown excluded"}`}><div className={styles.summaryGrid}>{data.summary.map((metric) => <article className={styles.metric} key={metric.label}><span className={styles.eyebrow}>{metric.label}</span><strong>{value(metric)}</strong><div className={styles.metricMeta}><Badge value={metric.confidence} /></div><p>{metric.note}</p></article>)}</div></Section>

    <Section eyebrow="Automatic interpretation" title="Founder signals" description="Evidence, caveat and a suggested investigation — never unsupported causation.">{data.signals.length ? <div className={styles.signalGrid}>{data.signals.map((signal) => <article className={styles.signal} key={`${signal.journey}-${signal.headline}`}><div className={styles.signalMeta}><span className={styles.eyebrow}>{signal.journey}</span><Badge value={signal.confidence} /></div><h3>{signal.headline}</h3><p>{signal.evidence}</p><small><strong>Investigate:</strong> {signal.investigation}</small></article>)}</div> : <div className={styles.empty}>No defensible signal meets the current evidence threshold.</div>}</Section>

    <div className={styles.twoColumn}><section className={styles.panel}><span className={styles.eyebrow}>Acquisition</span><h3>Returning visitor intelligence</h3><Metrics items={data.returning} /></section><section className={styles.panel}><span className={styles.eyebrow}>Activation</span><h3>Time to first value</h3><Metrics items={data.activation} /><p className={styles.note}>Profile, learner and planning setup timestamps are shown as missing instrumentation rather than inferred.</p></section></div>

    <Section eyebrow="Cross-journey view" title="Journey funnel" description="Progression is actor-linked only. Public-to-auth steps remain directional when identity stitching is incomplete."><div className={styles.funnel}>{data.funnel.map((step) => <div className={styles.funnelRow} key={step.label}><strong>{step.label}</strong><span>{step.actors} actors</span><span>{step.events} events</span><span>{step.progression === null ? "—" : `${P.format(step.progression)} progress`}</span><Badge value={step.confidence} /></div>)}</div></Section>

    <Section eyebrow="Behavioural sequences" title="Product paths" description="Feature-level transitions; repeated adjacent events are collapsed."><Breakdown items={data.paths} /></Section>

    <Section eyebrow="Evidence workflow" title="Capture behaviour" description="Standard, Quick Capture, source surface, attachments, saves and Portfolio handoff."><Metrics items={data.capture} /><div className={styles.twoColumn}><div><h3>Capture modes</h3><Breakdown items={data.captureModes} /></div><div><h3>Source surfaces</h3><Breakdown items={data.captureSources} /></div></div></Section>

    <div className={styles.twoColumn}><section className={styles.panel}><span className={styles.eyebrow}>Media</span><h3>Camera & uploads</h3><Metrics items={data.media} /><details className={styles.details}><summary>Attachment picker intent</summary><div className={styles.detailsBody}><Breakdown items={data.attachmentSources} /></div></details></section><section className={styles.panel}><span className={styles.eyebrow}>Devices</span><h3>Mobile & PWA behaviour</h3><Metrics items={data.mobile} /><p className={styles.note}>Phone browser activity is never labelled as installed PWA activity.</p></section></div>

    <Section eyebrow="Connected value" title="Portfolio & Reports" description="Capture-to-Portfolio-to-Report outcomes, including public report consumption."><Metrics items={data.portfolioReports} /></Section>

    <div className={styles.twoColumn}><section className={styles.panel}><span className={styles.eyebrow}>Repeat value</span><h3>Retention</h3><Metrics items={data.retention} /></section><section className={styles.panel}><span className={styles.eyebrow}>Comparison</span><h3>Behavioural cohorts</h3><div className={styles.list}>{data.cohorts.map((cohort) => <div className={styles.qualityItem} key={cohort.label}><div className={styles.metricMeta}><strong>{cohort.label}</strong><Badge value={cohort.confidence} /></div><p>{cohort.value === null ? "Insufficient sample" : P.format(cohort.value)} · n={cohort.sample}</p><p>{cohort.note}</p></div>)}</div></section></div>

    <Section eyebrow="Where people struggle" title="Friction intelligence" description="Failure and abandonment proxies; no claim that telemetry proves user intent."><Metrics items={data.friction} /></Section>

    <Section eyebrow="Trust before precision" title="Data quality" description="What can and cannot safely be concluded."><div className={styles.quality}>{data.dataQuality.map((item) => <article className={styles.qualityItem} key={item.label}><div className={styles.metricMeta}><strong>{item.label}</strong><Badge value={item.confidence} /></div><p>{item.detail}</p></article>)}</div></Section>

    <details className={`${styles.section} ${styles.detailed}`}>
      <summary>
        <span><span className={styles.eyebrow}>Secondary exploration</span><strong>Detailed behavioural analytics</strong></span>
        <span className={styles.note}>Privacy-safe aggregate drilldowns</span>
      </summary>
      <div className={styles.detailsBody}>
        <p className={styles.privacyNote}>{data.detailed.privacyNote}</p>
        <div className={styles.twoColumn}>
          <div><h3>Aggregate feature usage</h3><Breakdown items={data.detailed.featureUsage} /></div>
          <div><h3>Coarse area usage</h3><Breakdown items={data.detailed.areaUsage} /></div>
          <div><h3>Entry behaviour</h3><Breakdown items={data.detailed.entryBehaviour} /></div>
          <div><h3>Recent aggregate activity</h3><Breakdown items={data.detailed.recentActivity} /></div>
          <div><h3>Activity distribution</h3><Metrics items={data.detailed.activityDistribution} /></div>
          <div><h3>Coarse device mix</h3><Breakdown items={data.detailed.deviceMix} /></div>
        </div>
        <div className={styles.detailedConversions}><h3>Aggregate conversion observations</h3><Metrics items={data.detailed.conversionObservations} /></div>
      </div>
    </details>

    <footer className={styles.footer}>Generated {new Date(data.generatedAt).toLocaleString("en-AU", { timeZone: "Australia/Hobart" })} · No raw IDs, email addresses, IP addresses or precise locations are displayed.</footer>
  </div></main>;
}
