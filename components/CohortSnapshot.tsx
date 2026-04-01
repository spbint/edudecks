"use client";

type GroupDist = {
  attribute_group_id: string;
  name: string;
  n_rated: number;
  n_support: number;
  n_developing: number;
  n_at_standard: number;
  n_above: number;
};

function pct(n: number, total: number) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

function Segment({
  label,
  n,
  total,
  color,
}: {
  label: string;
  n: number;
  total: number;
  color: string;
}) {
  const p = pct(n, total);
  if (n <= 0) return null;

  return (
    <div
      title={`${label}: ${n} (${p}%)`}
      style={{
        width: `${p}%`,
        background: color,
        height: "100%",
      }}
    />
  );
}

export default function CohortSnapshot({ groups }: { groups: GroupDist[] }) {
  if (!groups || groups.length === 0) {
    return <div style={{ opacity: 0.7 }}>No cohort distribution data.</div>;
  }

  return (
    <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
      {/* Legend */}
      <div
        style={{
          border: "1px solid #eee",
          borderRadius: 10,
          padding: 10,
          background: "#fafafa",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Legend</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, background: "#e74c3c", borderRadius: 3 }} />
            Needs support (1–2)
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, background: "#f39c12", borderRadius: 3 }} />
            Monitor (3)
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, background: "#f1c40f", borderRadius: 3 }} />
            On track (4)
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 12, height: 12, background: "#2ecc71", borderRadius: 3 }} />
            Extending (5–6)
          </span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
          Tip: hover over a coloured segment to see counts and percentages.
        </div>
      </div>

      {/* Bars */}
      {groups.map((g) => {
        const total =
          (g.n_support || 0) +
          (g.n_developing || 0) +
          (g.n_at_standard || 0) +
          (g.n_above || 0);

        if (total === 0) {
          return (
            <div key={g.attribute_group_id} style={{ opacity: 0.7 }}>
              <div style={{ fontWeight: 800 }}>{g.name}</div>
              <div style={{ fontSize: 12 }}>No ratings yet.</div>
            </div>
          );
        }

        return (
          <div key={g.attribute_group_id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
              <div style={{ fontWeight: 800 }}>{g.name}</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                {total} rated
              </div>
            </div>

            <div
              style={{
                display: "flex",
                height: 20,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #ddd",
                marginTop: 6,
              }}
            >
              <Segment label="Needs support (1–2)" n={g.n_support} total={total} color="#e74c3c" />
              <Segment label="Monitor (3)" n={g.n_developing} total={total} color="#f39c12" />
              <Segment label="On track (4)" n={g.n_at_standard} total={total} color="#f1c40f" />
              <Segment label="Extending (5–6)" n={g.n_above} total={total} color="#2ecc71" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
