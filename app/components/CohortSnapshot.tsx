"use client";

type Props = {
  payload: any;
  loading?: boolean;
};

export default function CohortSnapshot({ payload, loading }: Props) {
  const grouped = payload?.distribution_grouped ?? [];
  const total = payload?.n_students_eligible ?? payload?.n_students_total ?? 0;

  if (loading) {
    return (
      <section style={card}>
        <h2 style={h2}>Cohort Snapshot</h2>
        <p style={{ opacity: 0.7 }}>Loading…</p>
      </section>
    );
  }

  if (!payload?.allowed) {
    return (
      <section style={card}>
        <h2 style={h2}>Cohort Snapshot</h2>
        <p style={{ color: "crimson" }}>Not allowed for this scope.</p>
      </section>
    );
  }

  return (
    <section style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h2 style={h2}>Cohort Snapshot</h2>
          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Eligible: <b>{total}</b> · Scope: <b>{payload?.scope}</b>
          </div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>
          Min group size: <b>{payload?.min_group_size}</b>
        </div>
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
        {grouped.map((g: any) => (
          <div key={g.attribute_group_id} style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <b>{g.name}</b>
              <span style={{ fontSize: 12, opacity: 0.75 }}>
                Rated: {g.n_rated} · Support: {g.n_support} · Developing: {g.n_developing} · At Std:{" "}
                {g.n_at_standard} · Above: {g.n_above}
              </span>
            </div>

            <StackedBar
              support={g.pct_support}
              developing={g.pct_developing}
              atStandard={g.pct_at_standard}
              above={g.pct_above}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function StackedBar({
  support,
  developing,
  atStandard,
  above,
}: {
  support: number;
  developing: number;
  atStandard: number;
  above: number;
}) {
  const s = clamp(support);
  const d = clamp(developing);
  const a = clamp(atStandard);
  const b = clamp(above);

  return (
    <div style={barWrap}>
      <div style={{ ...seg, width: `${s}%`, background: "#e74c3c" }} title={`Support ${s}%`} />
      <div style={{ ...seg, width: `${d}%`, background: "#f39c12" }} title={`Developing ${d}%`} />
      <div style={{ ...seg, width: `${a}%`, background: "#f1c40f" }} title={`At Standard ${a}%`} />
      <div style={{ ...seg, width: `${b}%`, background: "#2ecc71" }} title={`Above ${b}%`} />
    </div>
  );
}

function clamp(x: any) {
  const n = Number(x);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n * 100) / 100;
}

const card: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 14,
  background: "white",
};

const h2: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 900,
};

const barWrap: React.CSSProperties = {
  height: 14,
  borderRadius: 999,
  overflow: "hidden",
  background: "#f2f2f2",
  display: "flex",
};

const seg: React.CSSProperties = {
  height: "100%",
};
