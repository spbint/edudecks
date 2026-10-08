"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  MathematicsLearningProfileAreaPresentation,
  MathematicsLearningProfilePresentationV1,
} from "@/lib/clean/educationalIntelligence/mathematicsLearningProfilePresentation";
import styles from "./MathematicsLearningProfile.module.css";

function downloadPdf(bytes: Uint8Array, filename: string) {
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
  const url = window.URL.createObjectURL(
    new Blob([buffer], { type: "application/pdf" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}

function NextLearning({ area }: { area: MathematicsLearningProfileAreaPresentation }) {
  return (
    <section className={styles.nextLearning} aria-label={`Next learning for ${area.areaName}`}>
      <h4 className={styles.detailHeading}>Recommended next learning</h4>
      <strong>{area.nextLearning.heading}</strong>
      <p className={styles.detailText}>{area.nextLearning.explanation}</p>
      {area.nextLearning.href && area.nextLearning.actionLabel ? (
        <Link
          href={area.nextLearning.href}
          prefetch={false}
          className={styles.continueLink}
        >
          {area.nextLearning.actionLabel}
        </Link>
      ) : null}
    </section>
  );
}

function AreaDetails({ area }: { area: MathematicsLearningProfileAreaPresentation }) {
  return (
    <details className={styles.detail}>
      <summary>
        <span>{area.areaName}</span>
        <span className={styles.detailStatus}>{area.statusLabel}</span>
      </summary>
      <div className={styles.detailBody}>
        <section className={styles.detailBlock}>
          <h4 className={styles.detailHeading}>Developmental interpretation</h4>
          <strong>{area.statusLabel}</strong>
          <p className={styles.detailText}>{area.statusExplanation}</p>
        </section>
        <section className={styles.detailBlock}>
          <h4 className={styles.detailHeading}>Useful learning position</h4>
          <strong>{area.learningPosition.heading}</strong>
          <p className={styles.detailText}>{area.learningPosition.explanation}</p>
        </section>
        <section className={styles.detailBlock}>
          <h4 className={styles.detailHeading}>Why MyLearna is saying this</h4>
          <strong>{area.evidence.sufficiencyLabel}</strong>
          <p className={styles.detailText}>{area.evidence.whyStatement}</p>
          {area.evidence.limitationStatement ? (
            <p className={styles.detailText}>{area.evidence.limitationStatement}</p>
          ) : null}
          <p className={styles.detailText}>{area.evidence.practicalConfirmationLabel}</p>
        </section>
        <NextLearning area={area} />
      </div>
    </details>
  );
}

function PrintDocument({ profile }: { profile: MathematicsLearningProfilePresentationV1 }) {
  return (
    <div className={styles.printDocument} aria-hidden="true">
      <section className={styles.printPage}>
        <span className={styles.eyebrow}>{profile.scope.shortLabel}</span>
        <h1>{profile.title}</h1>
        <p>{profile.scope.statement}</p>
        <div className={styles.metaGrid}>
          <div><strong>Learner</strong><br />{profile.learner.displayName}</div>
          <div><strong>Assessment date</strong><br />{profile.assessment.assessedDateLabel}</div>
          <div><strong>Attempt</strong><br />{profile.assessment.attemptLabel}</div>
        </div>
        <h2>{profile.overview.headline}</h2>
        <p>{profile.overview.explanation}</p>
        <p>{profile.overview.independenceStatement}</p>
        {profile.areas.map((area) => (
          <article key={area.continuumId} className={styles.printArea}>
            <h3>{area.areaName}</h3>
            <strong>{area.statusLabel}</strong>
            <p>{area.statusExplanation}</p>
          </article>
        ))}
      </section>
      <section className={styles.printPage}>
        <h2>Detailed learning profile</h2>
        {profile.areas.map((area) => (
          <article key={area.continuumId} className={styles.printArea}>
            <h3>{area.areaName} — {area.statusLabel}</h3>
            <p>{area.evidence.conciseStatement}</p>
            <p><strong>{area.learningPosition.heading}</strong></p>
            <p>{area.learningPosition.explanation}</p>
            {area.evidence.limitationStatement ? <p>{area.evidence.limitationStatement}</p> : null}
          </article>
        ))}
      </section>
      <section className={styles.printPage}>
        <h2>Recommended next learning</h2>
        {profile.areas.map((area) => (
          <article key={area.continuumId} className={styles.printArea}>
            <h3>{area.areaName}</h3>
            <p><strong>{area.nextLearning.heading}</strong></p>
            <p>{area.nextLearning.explanation}</p>
          </article>
        ))}
        <h2>{profile.evidenceGuide.heading}</h2>
        {profile.evidenceGuide.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p><strong>{profile.evidenceGuide.parentControlStatement}</strong></p>
      </section>
    </div>
  );
}

export default function MathematicsLearningProfile({
  profile,
}: {
  profile: MathematicsLearningProfilePresentationV1;
}) {
  const [downloadState, setDownloadState] = useState<
    "idle" | "working" | "complete" | "error"
  >("idle");

  const handleDownload = async () => {
    setDownloadState("working");
    try {
      const { buildMathematicsLearningProfilePdfFilename, generateMathematicsLearningProfilePdfBytes } =
        await import("@/lib/clean/outputs/mathematicsLearningProfilePdf");
      const bytes = await generateMathematicsLearningProfilePdfBytes(profile);
      downloadPdf(
        bytes,
        buildMathematicsLearningProfilePdfFilename(
          profile.learner.displayName,
          profile.assessment.assessedAt,
        ),
      );
      setDownloadState("complete");
    } catch {
      setDownloadState("error");
    }
  };

  return (
    <section
      className={styles.root}
      aria-labelledby="mathematics-learning-profile-title"
      data-mathematics-learning-profile
    >
      <div className={`${styles.shell} ${styles.screenDocument}`}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div>
              <span className={styles.eyebrow}>{profile.scope.shortLabel}</span>
              <h2 id="mathematics-learning-profile-title" className={styles.title}>
                {profile.title}
              </h2>
              <p className={styles.scope}>{profile.scope.statement}</p>
            </div>
            <div className={styles.actions} aria-label="Profile actions">
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => window.print()}
              >
                {profile.actions.printLabel}
              </button>
              <button
                type="button"
                className={styles.actionButton}
                disabled={downloadState === "working"}
                onClick={() => void handleDownload()}
              >
                {downloadState === "working" ? "Preparing PDF…" : profile.actions.downloadLabel}
              </button>
            </div>
          </div>
          {downloadState === "complete" ? (
            <p role="status" className={styles.message}>PDF downloaded to this browser.</p>
          ) : downloadState === "error" ? (
            <p role="alert" className={styles.message}>The PDF could not be prepared. You can still print this profile.</p>
          ) : null}
          <div className={styles.metaGrid} aria-label="Assessment details">
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Learner</span>
              <strong className={styles.metaValue}>{profile.learner.displayName}</strong>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Assessment date</span>
              <strong className={styles.metaValue}>{profile.assessment.assessedDateLabel}</strong>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Attempt</span>
              <strong className={styles.metaValue}>{profile.assessment.attemptLabel}</strong>
            </div>
          </div>
        </header>

        <section className={styles.overview} aria-labelledby="learning-profile-overview">
          <h3 id="learning-profile-overview" className={styles.sectionTitle}>
            {profile.overview.headline}
          </h3>
          <p className={styles.bodyCopy}>{profile.overview.explanation}</p>
          <p className={styles.bodyCopy}>{profile.overview.independenceStatement}</p>
        </section>
      </div>

      <section className={styles.screenDocument} aria-labelledby="five-area-profile">
        <h3 id="five-area-profile" className={styles.sectionTitle}>Five-area profile</h3>
        <div className={styles.areaGrid}>
          {profile.areas.map((area) => (
            <article
              key={area.continuumId}
              className={styles.areaCard}
              data-status={area.status}
            >
              <strong className={styles.areaName}>{area.areaName}</strong>
              <span className={styles.statusBadge}>{area.statusLabel}</span>
              <p className={styles.areaSummary}>{area.evidence.conciseStatement}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.screenDocument} aria-labelledby="profile-details">
        <h3 id="profile-details" className={styles.sectionTitle}>Explore each learning area</h3>
        <p className={styles.bodyCopy}>
          Open an area to see the evidence statement and recommended next learning.
        </p>
        <div className={styles.detailList}>
          {profile.areas.map((area) => <AreaDetails key={area.continuumId} area={area} />)}
        </div>
      </section>

      <aside className={`${styles.evidenceGuide} ${styles.screenDocument}`} aria-labelledby="evidence-guide-title">
        <h3 id="evidence-guide-title" className={styles.sectionTitle}>{profile.evidenceGuide.heading}</h3>
        {profile.evidenceGuide.paragraphs.map((paragraph) => (
          <p key={paragraph} className={styles.bodyCopy}>{paragraph}</p>
        ))}
        <p className={styles.bodyCopy}><strong>{profile.evidenceGuide.parentControlStatement}</strong></p>
      </aside>

      <PrintDocument profile={profile} />
    </section>
  );
}
