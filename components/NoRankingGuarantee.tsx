"use client";

export default function NoRankingGuarantee() {
  return (
    <aside style={{ border: "1px solid #ddd", borderRadius: 12, padding: 12 }}>
      <div style={{ fontWeight: 900, fontSize: 16 }}>No ranking guarantee</div>
      <div style={{ marginTop: 8, lineHeight: 1.5 }}>
        <b>We do not rank students.</b>
        <br />
        We provide growth and trend analytics at student and cohort level.
        <br />
        Where prioritisation is needed, we sort by support signals (missing data, regression, plateau),
        not by comparative attainment.
      </div>
    </aside>
  );
}
