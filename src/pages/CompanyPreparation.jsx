import React from "react";

import { detectRequirementChanges } from "../data/companySignals";
import { resourcesForRound } from "../data/practiceResources";
import { roundsForCourse, trackFromCourse } from "../data/tracks";

function CompanyPreparation({
  course,
  company,
  onBack,
  onStartInterview,
}) {
  const track = trackFromCourse(course);
  const rounds = roundsForCourse(course);
  const signal = detectRequirementChanges(company);

  return (
    <div className="inner-page">
      <header className="inner-header">
        <button className="back-button" onClick={onBack}>
          ← Companies
        </button>
        <div className="mini-brand">
          <div className="brand-mark">C</div>
          <strong>CareerForge</strong>
        </div>
      </header>

      <main className="inner-content">
        <p className="eyebrow">STEP 03 · COMPANY PREPARATION</p>

        <div className="company-heading">
          <div>
            <span className="company-role">{course?.name}</span>
            <h1 className="page-title">{company?.name}</h1>
            <p className="page-subtitle">
              Preparation path for {company?.role}. Rounds follow this course,
              not a generic four-box template.
            </p>
          </div>
          <div className="target-badge">TARGET COMPANY</div>
        </div>

        <section className="preparation-card">
          <div className="prep-heading">
            <div>
              <p className="section-label">INTERVIEW PROCESS</p>
              <h2>Rounds as per {course?.name}</h2>
            </div>
          </div>
          <div className="rounds practice-round-strip">
            {rounds.map((round, index) => (
              <React.Fragment key={round.id}>
                {index > 0 ? <div className="round-line" /> : null}
                <div className="round">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{round.name}</strong>
                  <small>{round.blurb}</small>
                </div>
              </React.Fragment>
            ))}
          </div>
        </section>

        <section className="prep-panel change-inline">
          <p className="section-label">COMPANY REQUIREMENT DETECTOR</p>
          <h2>Hiring bar versus the prior cycle</h2>
          <p className="panel-lead">
            {signal.priorCycle} {signal.currentCycle}
          </p>
          {signal.changes.find((item) => item.direction === "up") ? (
            <div className="change-banner">
              {signal.changes.find((item) => item.direction === "up").detail}
            </div>
          ) : null}
          <div className="change-grid">
            {signal.changes.map((change) => (
              <article
                key={change.skill}
                className={`change-card ${change.direction}`}
              >
                <span>
                  {change.direction === "up"
                    ? `+${change.delta}`
                    : change.direction === "down"
                      ? `${change.delta}`
                      : "Steady"}
                </span>
                <h3>{change.skill}</h3>
                <p>{change.detail}</p>
              </article>
            ))}
          </div>
        </section>

        {rounds.map((round) => (
          <section key={round.id}>
            <div className="section-title">
              <p className="section-label">{round.name.toUpperCase()}</p>
              <h2>{round.blurb}</h2>
            </div>
            <section className="resource-grid">
              {resourcesForRound(track, round.id).map((resource) => (
                <article className="resource-card" key={resource.url}>
                  <div className="resource-icon">↗</div>
                  <span>{resource.type}</span>
                  <h3>{resource.title}</h3>
                  <p>{resource.blurb}</p>
                  <a
                    className="resource-link"
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open resource →
                  </a>
                </article>
              ))}
            </section>
          </section>
        ))}

        <section className="interview-start">
          <div>
            <p className="section-label">READY TO TEST YOURSELF?</p>
            <h2>Simulate the 4-round interview.</h2>
            <p>
              Each round has 15 adaptive questions (aptitude, coding, technical, HR)
              with camera, keywords, and voice accent plus fluency.
            </p>
          </div>
          <button className="primary-action" onClick={onStartInterview}>
            Start Mock Interview →
          </button>
        </section>
      </main>
    </div>
  );
}

export default CompanyPreparation;
