// ADD THIS SECTION INSIDE YOUR EXISTING FILE (DO NOT DELETE EVERYTHING)
// Replace your HERO + STATS section with this upgraded block

<section style={S.hero}>
  <div style={S.subtle}>Portfolio Share Command Centre</div>

  <h1 style={S.h1}>{studentDisplayName(student)}</h1>

  <div style={S.sub}>
    Secure sharing, access control, and visibility across parents,
    authorities, and external stakeholders.
  </div>

  {/* SHARE HEALTH */}
  <div style={{ ...S.grid4, marginTop: 16 }}>
    <div style={S.statCard}>
      <div style={S.statK}>Active Links</div>
      <div style={S.statV}>
        {links.filter((x) => !isExpired(x.expires_at)).length}
      </div>
      <div style={S.statS}>Currently accessible</div>
    </div>

    <div style={S.statCard}>
      <div style={S.statK}>Expired</div>
      <div style={S.statV}>
        {links.filter((x) => isExpired(x.expires_at)).length}
      </div>
      <div style={S.statS}>Need cleanup or renewal</div>
    </div>

    <div style={S.statCard}>
      <div style={S.statK}>Protected</div>
      <div style={S.statV}>
        {links.filter((x) => !!safe(x.password)).length}
      </div>
      <div style={S.statS}>Password secured</div>
    </div>

    <div style={S.statCard}>
      <div style={S.statK}>Risk Level</div>
      <div style={S.statV}>
        {links.length > 5 ? "Watch" : "Stable"}
      </div>
      <div style={S.statS}>
        {links.length > 5
          ? "High number of active links"
          : "Sharing under control"}
      </div>
    </div>
  </div>

  {/* GUIDANCE */}
  <div style={S.info}>
    {links.length === 0
      ? "No active share links. Safe to create your first controlled share."
      : links.length > 5
      ? "You have many active links. Consider reviewing or expiring older ones."
      : "Sharing looks well controlled."}
  </div>

  <div style={{ ...S.row, marginTop: 12 }}>
    <button
      style={S.btn}
      onClick={() =>
        router.push(`/admin/students/${encodeURIComponent(studentId)}`)
      }
    >
      ← Back to profile
    </button>

    <button
      style={S.btn}
      onClick={() =>
        router.push(`/admin/students/${encodeURIComponent(studentId)}/portfolio`)
      }
    >
      Portfolio
    </button>
  </div>
</section>