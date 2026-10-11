"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getFamilyEvidenceReviewFixtures } from "@/lib/clean/educationalIntelligence/familyEvidenceReviewFixtures";
import type { FamilyEvidenceReviewArea } from "@/lib/clean/educationalIntelligence/familyEvidenceReviewPresentation";
import styles from "./FamilyEvidenceReview.module.css";

function AreaOverview({
  area,
  selected,
  onSelect,
}: {
  area: FamilyEvidenceReviewArea;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <article className={styles.areaCard} data-selected={selected || undefined}>
      <span className={styles.areaName}>{area.areaName}</span>
      <strong className={styles.status}>{area.currentView.statusLabel}</strong>
      <p className={styles.cardCopy}>
        {area.evidence.capturedEvidenceCount
          ? `${area.evidence.capturedEvidenceCount} captured ${area.evidence.capturedEvidenceCount === 1 ? "item" : "items"}`
          : "No captured evidence yet"}
      </p>
      <p className={styles.cardCopy}>
        {area.change.available ? "Recheck available" : "No recheck comparison yet"}
      </p>
      <p className={styles.nextSummary}>
        {area.nextLearning?.heading ?? "Collect useful evidence next"}
      </p>
      <button
        type="button"
        className={styles.viewButton}
        aria-pressed={selected}
        onClick={onSelect}
      >
        View evidence
      </button>
    </article>
  );
}

function EvidenceTimeline({ area }: { area: FamilyEvidenceReviewArea }) {
  if (!area.timeline.length) {
    return (
      <p className={styles.emptyState}>
        There is no assessment or captured evidence to show in this area yet.
      </p>
    );
  }
  return (
    <ol className={styles.timeline} aria-label={`Evidence timeline for ${area.areaName}`}>
      {area.timeline.map((event) => (
        <li
          key={event.eventId}
          className={styles.timelineItem}
          data-source-lane={event.sourceLane}
        >
          <div className={styles.timelineTopline}>
            <span className={styles.sourceBadge}>{event.sourceLabel}</span>
            <time dateTime={event.occurredAt}>{event.dateLabel}</time>
          </div>
          <strong>{event.title}</strong>
          <p>{event.detail}</p>
          {event.reviewLabel ? (
            <span className={styles.reviewState}>Review: {event.reviewLabel}</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function AreaDetail({ area }: { area: FamilyEvidenceReviewArea }) {
  const opensPathways = area.nextLearning?.handoffKind === "pathways-review";
  return (
    <section className={styles.detail} aria-labelledby={`family-evidence-${area.continuumId}`}>
      <header className={styles.detailHeader}>
        <span className={styles.eyebrow}>Learning area</span>
        <h2 id={`family-evidence-${area.continuumId}`}>{area.areaName}</h2>
        <p>
          Assessment evidence and family-captured evidence are shown separately so
          you can see what each source contributes.
        </p>
      </header>

      <div className={styles.detailGrid}>
        <section className={styles.sectionCard} aria-labelledby={`current-${area.continuumId}`}>
          <span className={styles.sectionEyebrow}>Structured assessment</span>
          <h3 id={`current-${area.continuumId}`}>Current learning view</h3>
          <strong className={styles.largeStatus}>{area.currentView.statusLabel}</strong>
          <p>{area.currentView.explanation}</p>
          <dl className={styles.facts}>
            <div>
              <dt>Evidence</dt>
              <dd>{area.currentView.evidenceSufficiencyLabel}</dd>
            </div>
            {area.currentView.assessedDateLabel ? (
              <div>
                <dt>Most recent check</dt>
                <dd>{area.currentView.assessedDateLabel}</dd>
              </div>
            ) : null}
          </dl>
          {area.currentView.practicalConfirmationLabel ? (
            <p className={styles.notice}>{area.currentView.practicalConfirmationLabel}</p>
          ) : null}
        </section>

        <section className={styles.sectionCard} aria-labelledby={`seen-${area.continuumId}`}>
          <span className={styles.sectionEyebrow}>Authentic family evidence</span>
          <h3 id={`seen-${area.continuumId}`}>What MyLearna has seen</h3>
          <p>{area.evidence.statement}</p>
          {area.evidence.capturedBySource.length ? (
            <ul className={styles.sourceList}>
              {area.evidence.capturedBySource.map((source) => (
                <li key={source.sourceLabel}>
                  <span>{source.sourceLabel}</span>
                  <strong>{source.count}</strong>
                </li>
              ))}
            </ul>
          ) : null}
          <p className={styles.boundary}>{area.evidence.captureBoundaryStatement}</p>
        </section>
      </div>

      <section className={styles.sectionCard} aria-labelledby={`timeline-${area.continuumId}`}>
        <span className={styles.sectionEyebrow}>All sources, in time order</span>
        <h3 id={`timeline-${area.continuumId}`}>Evidence timeline</h3>
        <EvidenceTimeline area={area} />
      </section>

      <div className={styles.detailGrid}>
        <section className={styles.sectionCard} aria-labelledby={`change-${area.continuumId}`}>
          <span className={styles.sectionEyebrow}>Structured checks only</span>
          <h3 id={`change-${area.continuumId}`}>Since the last check</h3>
          {area.change.available ? (
            <>
              <div className={styles.statusComparison}>
                <span>{area.change.previousStatusLabel}</span>
                <span aria-hidden="true">→</span>
                <span>{area.change.currentStatusLabel}</span>
              </div>
              <p>{area.change.whatChanged}</p>
              {area.change.evidenceExplanation ? (
                <p className={styles.subtle}>{area.change.evidenceExplanation}</p>
              ) : null}
            </>
          ) : (
            <p>{area.change.whatChanged}</p>
          )}
        </section>

        <section className={styles.sectionCard} aria-labelledby={`open-${area.continuumId}`}>
          <span className={styles.sectionEyebrow}>Honest uncertainty</span>
          <h3 id={`open-${area.continuumId}`}>What remains open</h3>
          {area.unknowns.hasOpenQuestions ? (
            <ul className={styles.openList}>
              {area.unknowns.statements.map((statement) => (
                <li key={statement}>{statement}</li>
              ))}
            </ul>
          ) : (
            <p>
              The current evidence is enough for this learning view. You can keep
              adding everyday examples as learning continues.
            </p>
          )}
        </section>
      </div>

      <section className={styles.nextLearning} aria-labelledby={`next-${area.continuumId}`}>
        <span className={styles.sectionEyebrow}>What to do next</span>
        <h3 id={`next-${area.continuumId}`}>
          {area.nextLearning?.heading ?? "Collect useful evidence next"}
        </h3>
        <p>
          {area.nextLearning?.explanation ??
            "A practical observation or later check can help before choosing a specific learning step."}
        </p>
        {opensPathways ? (
          <div className={styles.pathwaysContext}>
            <strong>Current assessment view: {area.currentView.statusLabel}</strong>
            <p>
              My Pathways opens the recommended next learning step for this area.
              That specific step may still say “Not checked yet” until it has been
              checked or worked on.
            </p>
          </div>
        ) : null}
        {area.nextLearning?.href && area.nextLearning.actionLabel ? (
          <Link href={area.nextLearning.href} prefetch={false} className={styles.continueLink}>
            {area.nextLearning.actionLabel}
          </Link>
        ) : null}
        <small>Opening My Pathways does not change the learner&apos;s pathway automatically.</small>
      </section>
    </section>
  );
}

export default function FamilyEvidenceReview() {
  const fixtures = useMemo(() => getFamilyEvidenceReviewFixtures(), []);
  const [fixtureId, setFixtureId] = useState("recheck-with-capture-between");
  const fixture = fixtures.find((candidate) => candidate.id === fixtureId) ?? fixtures[0]!;
  const [selectedAreaId, setSelectedAreaId] = useState(fixture.presentation.areas[0]!.continuumId);

  const selectedArea =
    fixture.presentation.areas.find((area) => area.continuumId === selectedAreaId) ??
    fixture.presentation.areas[0]!;

  return (
    <div className={styles.previewRoot}>
      <section className={styles.staffToolbar} aria-labelledby="family-evidence-review-example">
        <label>
          <strong id="family-evidence-review-example">Staff review example</strong>
          <select value={fixture.id} onChange={(event) => setFixtureId(event.target.value)}>
            {fixtures.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.label}
              </option>
            ))}
          </select>
        </label>
        <p>{fixture.description}</p>
      </section>

      <main className={styles.root} data-family-evidence-review>
        <header className={styles.hero}>
          <span className={styles.eyebrow}>{fixture.presentation.scope.label}</span>
          <h1>{fixture.presentation.title}</h1>
          <strong className={styles.learnerName}>
            Learning evidence for {fixture.presentation.learner.displayName}
          </strong>
          <p className={styles.lead}>{fixture.presentation.introduction}</p>
          <p className={styles.scope}>{fixture.presentation.scope.statement}</p>
          <aside
            className={styles.boundaryCallout}
            aria-label="Assessment and Capture evidence boundary"
          >
            <strong>Assessment and everyday learning evidence</strong>
            <p>{fixture.presentation.assessmentCaptureBoundary}</p>
          </aside>
        </header>

        <section aria-labelledby="family-evidence-overview" className={styles.overview}>
          <div>
            <span className={styles.eyebrow}>Five independent areas</span>
            <h2 id="family-evidence-overview">What MyLearna currently knows</h2>
            <p>
              Choose an area to see the assessment view, authentic evidence, open
              questions and next learning.
            </p>
          </div>
          <div className={styles.areaGrid}>
            {fixture.presentation.areas.map((area) => (
              <AreaOverview
                key={area.continuumId}
                area={area}
                selected={area.continuumId === selectedArea.continuumId}
                onSelect={() => setSelectedAreaId(area.continuumId)}
              />
            ))}
          </div>
        </section>

        <AreaDetail area={selectedArea} />
      </main>
    </div>
  );
}
