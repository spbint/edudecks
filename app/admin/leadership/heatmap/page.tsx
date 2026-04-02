const heatmapRows = useMemo<HeatmapStudentRow[]>(() => {
  const rows = scopedStudentIds.map((studentId) => {
    const s = studentMap.get(studentId);
    const o = overviewMap.get(studentId);
    const evidenceList = (evidenceMap.get(studentId) ?? []).slice().sort((a, b) =>
      safe(b.occurred_on || b.created_at).localeCompare(safe(a.occurred_on || a.created_at))
    );
    const interventionList = interventionMap.get(studentId) ?? [];

    const activeInterventions = interventionList.filter(
      (x) => !isClosedStatus(x.status) && !isPausedStatus(x.status)
    );

    const overdueReviews = activeInterventions.filter((x) => {
      const review = pickReviewDate(x);
      if (!review) return false;
      const d = daysSince(review);
      return d != null && d > 0;
    });

    const dueSoonReviews = activeInterventions.filter((x) => {
      const review = pickReviewDate(x);
      const d = daysUntil(review);
      return d != null && d >= 0 && d <= 14;
    });

    const totalEvidenceCount = evidenceList.length;
    const evidenceCount30 =
      Number(o?.evidence_count_30d ?? 0) ||
      evidenceList.filter((e) => {
        const d = daysSince(e.occurred_on || e.created_at);
        return d != null && d <= 30;
      }).length;

    const evidencePrev30d = evidenceList.filter((e) => {
      const d = daysSince(e.occurred_on || e.created_at);
      return d != null && d > 30 && d <= 60;
    }).length;

    const evidenceMomentumDelta = evidenceCount30 - evidencePrev30d;

    const lastEvidenceAt =
      o?.last_evidence_at ||
      evidenceList[0]?.occurred_on ||
      evidenceList[0]?.created_at ||
      null;

    const lastEvidenceDays = daysSince(lastEvidenceAt);
    const invisibleRisk = totalEvidenceCount === 0 || lastEvidenceDays == null || lastEvidenceDays > 45;

    const rawAttentionStatus = safe(o?.attention_status);
    const attentionStatus: HeatmapStudentRow["attentionStatus"] =
      rawAttentionStatus === "Attention"
        ? "Attention"
        : rawAttentionStatus === "Watch"
        ? "Watch"
        : "Ready";

    const areaGapCount = areas.reduce((sum, area) => {
      const count = evidenceList.filter((e) => guessArea(e.learning_area) === area).length;
      return sum + (count === 0 ? 1 : 0);
    }, 0);

    const authorityFragile =
      invisibleRisk || overdueReviews.length > 0 || areaGapCount >= 2 || evidenceCount30 === 0;

    let score = 0;
    if (attentionStatus === "Attention") score += 40;
    if (attentionStatus === "Watch") score += 20;
    if (invisibleRisk) score += 24;
    if (lastEvidenceDays != null && lastEvidenceDays > 30) score += 12;
    if (lastEvidenceDays != null && lastEvidenceDays > 45) score += 12;
    if (evidenceMomentumDelta < 0) score += 14;
    score += activeInterventions.length * 6;
    score += overdueReviews.length * 12;
    score += dueSoonReviews.length * 6;
    if (evidenceCount30 === 0) score += 14;
    if (s?.is_ilp) score += 8;
    if (authorityFragile) score += 10;

    const cells: HeatmapCell[] = areas.map((area) => {
      const areaEntries = evidenceList.filter((e) => guessArea(e.learning_area) === area);
      const freshAreaEntries = areaEntries.filter((e) => {
        const d = daysSince(e.occurred_on || e.created_at);
        return d != null && d <= 30;
      });
      const lastSeenAt = areaEntries[0]?.occurred_on || areaEntries[0]?.created_at || null;

      const studentCoverageScore =
        areaEntries.length === 0
          ? 0
          : Math.min(
              100,
              freshAreaEntries.length * 30 +
                (lastSeenAt && (daysSince(lastSeenAt) ?? 999) <= 30 ? 40 : 0) +
                Math.min(areaEntries.length, 3) * 10
            );

      let status: HeatmapCell["status"] = "Strong";
      if (areaEntries.length === 0) status = "Gap";
      else if (freshAreaEntries.length === 0 || (daysSince(lastSeenAt) ?? 999) > 45) status = "Watch";

      let riskScore = 0;
      if (status === "Gap") riskScore += 35;
      if (status === "Watch") riskScore += 18;
      if (attentionStatus === "Attention") riskScore += 10;
      if (invisibleRisk) riskScore += 10;
      if (overdueReviews.length > 0) riskScore += 8;
      if (evidenceMomentumDelta < 0) riskScore += 8;

      return {
        studentId,
        area,
        count: areaEntries.length,
        freshCount: freshAreaEntries.length,
        lastSeenAt,
        studentCoverageScore,
        status,
        riskScore,
      };
    });

    let forecastRisk: HeatmapStudentRow["forecastRisk"] = "Stable";
    if (
      evidenceMomentumDelta < 0 ||
      dueSoonReviews.length >= 2 ||
      overdueReviews.length > 0 ||
      authorityFragile
    ) {
      forecastRisk = "Watch";
    }
    if (
      (attentionStatus === "Attention" && evidenceMomentumDelta < 0) ||
      overdueReviews.length >= 2 ||
      invisibleRisk
    ) {
      forecastRisk = "Escalating";
    }

    const nextAction =
      safe(o?.next_action) ||
      (overdueReviews.length > 0
        ? "Review support plan"
        : invisibleRisk
        ? "Capture new evidence"
        : attentionStatus === "Attention"
        ? "Prioritise follow-up"
        : forecastRisk === "Escalating"
        ? "Leadership check-in"
        : "Maintain visibility");

    return {
      studentId,
      classId: s?.class_id ?? o?.class_id ?? null,
      studentName: safe(o?.student_name) || studentDisplayName(s),
      isILP: !!(o?.is_ilp ?? s?.is_ilp),
      attentionStatus,
      nextAction,
      openInterventions: Number(o?.open_interventions_count ?? activeInterventions.length) || activeInterventions.length,
      overdueReviews: Number(o?.overdue_reviews_count ?? overdueReviews.length) || overdueReviews.length,
      evidenceCount30d: evidenceCount30,
      evidencePrev30d,
      evidenceMomentumDelta,
      totalEvidenceCount,
      invisibleRisk,
      authorityFragile,
      forecastRisk,
      score,
      cells,
    };
  });

  return rows;
}, [scopedStudentIds, studentMap, overviewMap, evidenceMap, interventionMap, areas]);