import React from "react";
import { Link } from "react-router-dom";

import { RoundFeedbackPanel } from "../components/RoundFeedbackPanel";
import {
  emotionLabel,
  integrityLabel,
} from "../utils/summarizeBehavior";
import { QUESTIONS_PER_ROUND } from "../utils/adaptiveInterview";
import { buildRoundFeedback } from "../utils/roundFeedback";

function averageScore(items) {
  if (!items.length) {
    return 0;
  }
  return Math.round(
    items.reduce((sum, item) => sum + Number(item.score || 0), 0) / items.length
  );
}

function groupAnswersByRound(answers) {
  const groups = [];
  (answers || []).forEach((item) => {
    const name = item.roundName || item.type || "Round";
    const last = groups[groups.length - 1];
    if (!last || last.name !== name) {
      groups.push({ name, items: [item] });
    } else {
      last.items.push(item);
    }
  });
  return groups;
}

function feedbackForRound(result, group, groupIndex, course) {
  const saved = (result?.roundReports || []).find(
    (item) =>
      item.roundNumber === groupIndex + 1 || item.roundName === group.name
  );
  if (saved?.feedback) {
    return saved.feedback;
  }
  return buildRoundFeedback({
    answers: group.items,
    behavior: null,
    course,
    roundId: group.items[0]?.type || "technical",
  });
}

function Result({
  student,
  course,
  company,
  result,
  onDashboard,
  onRetry,
  onPrepPath,
}) {
  const overall = result?.overall || 0;
  const explained = result?.explained;
  const answerCount = result?.answers?.length || 0;
  const readinessScore = explained?.readiness ?? overall;
  const scoreSpread =
    answerCount > 0
      ? {
          min: Math.min(...result.answers.map((item) => Number(item.score || 0))),
          max: Math.max(...result.answers.map((item) => Number(item.score || 0))),
        }
      : null;
  const behavior = result?.behavior;
  const integrity = behavior?.integrity || "not_monitored";
  const conceptGaps = [
    ...new Set(
      (result?.answers || []).flatMap(
        (item) => item.missingKeywords || []
      )
    ),
  ].slice(0, 3);
  const voice = result?.voice;
  const skills = explained?.skills || [];

  return (
    <div className="result-page">

      <header className="inner-header">

        <div className="mini-brand">
          <div className="brand-mark">C</div>
          <strong>CareerForge</strong>
        </div>

        <span className="result-company">
          {company?.name}
        </span>

      </header>


      <main className="result-container">

        <div className="result-intro">

          <p className="eyebrow">
            INTERVIEW COMPLETE
          </p>

          <h1>
            Here's how you performed,
            <br />
            {student?.name || "Student"}.
          </h1>

          <p>
            Your mock interview for{" "}
            <strong>{company?.name}</strong>{" "}
            has been evaluated.
            {result?.savedId
              ? " This session was saved to your account."
              : result?.saveError
                ? ` Save warning: ${result.saveError}`
                : ""}
          </p>

          {result?.terminatedForMalpractice ? (
            <p className="behavior-note warning-note malpractice-end-note">
              This session ended early because the camera malpractice alert was
              dismissed {result.malpracticeDismissals || 3} times (multiple
              people in frame).
            </p>
          ) : null}

        </div>


        <section className="score-overview">

          <div className="overall-score">

            <span>
              OVERALL READINESS
            </span>

            <strong>
              {readinessScore}%
            </strong>

            <small>
              {answerCount > 0
                ? `Company-weighted readiness · ${answerCount} scored answers (session avg ${overall}%, range ${scoreSpread.min}–${scoreSpread.max}%)`
                : explained?.readiness
                  ? `Company readiness ${explained.readiness}%`
                  : overall >= 75
                    ? "Good preparation"
                    : "More preparation recommended"}
            </small>

          </div>


          <div className="score-list">

            <ScoreRow
              title="Technical"
              value={result?.technical || 0}
            />

            <ScoreRow
              title="Communication"
              value={result?.communication || 0}
            />

            <ScoreRow
              title="Problem Solving"
              value={result?.problemSolving || 0}
            />

          </div>

        </section>

        {explained?.chance ? (
          <section className="chance-card">
            <p className="section-label">PROBABILITY OF CHANCE</p>
            <div className="chance-row">
              <div>
                <strong>{explained.chance.chance}%</strong>
                <span>{explained.chance.band}</span>
              </div>
              <p>
                Estimated chance of advancing this four-round screen
                ({QUESTIONS_PER_ROUND} questions each) —
                not a job-offer prediction. It combines round scores,
                company readiness, camera integrity, and voice
                accent/fluency when those were used.
              </p>
            </div>
            <ul className="chance-why">
              {(explained.chance.why || []).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null}


        {skills.length > 0 ? (
          <section className="explain-skills">
            <p className="section-label">EXPLAINABLE READINESS</p>
            <h2>
              Why {explained.readiness}% for {company?.name || "this role"}
            </h2>
            <div className="explain-grid">
              {skills.map((skill) => (
                <article key={skill.id} className={`explain-card ${skill.strength}`}>
                  <span>{skill.label}</span>
                  <strong>{skill.strength}</strong>
                  <div className="score-bar">
                    <i style={{ width: `${skill.score}%` }} />
                  </div>
                  <small>{skill.score}% · {skill.hint}</small>
                </article>
              ))}
            </div>
            {!!explained?.reasons?.length && (
              <ul className="behavior-result-notes">
                {explained.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
          </section>
        ) : null}


        <section className={`behavior-result ${integrity}`}>

          <div className="behavior-result-intro">
            <p className="section-label">
              CAMERA BEHAVIOR
            </p>
            <h2>
              {behavior?.used
                ? emotionLabel(behavior.emotion)
                : "Not monitored"}
            </h2>
            <p>
              {behavior?.used
                ? `${integrityLabel(integrity)} · ${behavior.samples} camera checks`
                : "The camera was off, so confidence and malpractice were not estimated."}
            </p>
          </div>

          <div className="behavior-result-scores">
            <ScoreRow
              title="Confidence"
              value={behavior?.confidence || 0}
            />
            <ScoreRow
              title="Nervousness"
              value={behavior?.nervousness || 0}
            />
            <ScoreRow
              title="Cheating / malpractice risk"
              value={behavior?.cheatingRisk || 0}
            />
          </div>

          {behavior?.used && (
            <ul className="behavior-result-notes">
              {(behavior.notes.length
                ? behavior.notes
                : ["No malpractice signals were detected."]
              ).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}

        </section>


        <section className={`behavior-result ${voice?.used ? "" : "not_monitored"}`}>

          <div className="behavior-result-intro">
            <p className="section-label">
              VOICE ACCENT, FLUENCY AND ACCURACY
            </p>
            <h2>
              {voice?.used ? "Spoken delivery" : "Not scored"}
            </h2>
            <p>
              {voice?.used
                ? "Fluency is pace and fillers. Accuracy is on-topic content. Accent/clarity is how well speech recognition understood you."
                : "Voice analysis was not used. Start Voice Analysis during the interview to score accent, fluency, and accuracy."}
            </p>
          </div>

          <div className="behavior-result-scores">
            <ScoreRow
              title="Accent / clarity"
              value={voice?.accent || 0}
            />
            <ScoreRow
              title="Fluency"
              value={voice?.fluency || 0}
            />
            <ScoreRow
              title="Accuracy"
              value={voice?.accuracy || 0}
            />
          </div>

          {voice?.used && !!voice.notes?.length && (
            <ul className="behavior-result-notes">
              {voice.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}

        </section>


        <section className="interview-path">
          <p className="section-label">ADAPTIVE PATH</p>
          <h2>How the interview adapted</h2>
          {(result?.answers || []).length === 0 ? (
            <p className="path-why">
              No scored answers were recorded in this session.
            </p>
          ) : (
            groupAnswersByRound(result.answers).map((group, groupIndex) => {
              const feedback = feedbackForRound(
                result,
                group,
                groupIndex,
                course
              );
              return (
              <div className="path-round-group" key={`${group.name}-${groupIndex}`}>
                <div className="path-round-top">
                  <span>
                    Round {groupIndex + 1} · {group.name} · {group.items.length}{" "}
                    question{group.items.length === 1 ? "" : "s"}
                  </span>
                  <strong>{averageScore(group.items)}%</strong>
                </div>
                <RoundFeedbackPanel feedback={feedback} />
                {group.items.map((item, index) => (
                  <div className="path-round" key={item.questionId || `${group.name}-${index}`}>
                    <div className="path-round-top">
                      <span>
                        Q{index + 1}
                        {item.difficulty ? ` · ${item.difficulty}` : ""}
                        {item.scoreBand ? ` · ${item.scoreBand}` : ""}
                      </span>
                      <strong>{item.score || 0}%</strong>
                    </div>
                    <p>{item.question}</p>
                    {item.adaptiveReason ? (
                      <p className="path-why">{item.adaptiveReason}</p>
                    ) : null}
                  </div>
                ))}
              </div>
              );
            })
          )}
        </section>


        <section className="result-grid">

          <div className="result-card">

            <p className="section-label">
              AREAS TO IMPROVE
            </p>

            <h2>
              Focus on these next
            </h2>

            {conceptGaps.length > 0 ? (
              conceptGaps.map((gap) => (
                <div className="weak-area" key={gap}>
                  <span>{gap}</span>
                  <div>
                    <i style={{ width: `${Math.max(18, 100 - (overall || 0))}%` }} />
                  </div>
                </div>
              ))
            ) : explained?.weakest ? (
              <div className="weak-area">
                <span>
                  {explained.weakest.label} · {explained.weakest.strength} · {explained.weakest.score}%
                </span>
                <div>
                  <i style={{ width: `${Math.max(18, 100 - explained.weakest.score)}%` }} />
                </div>
              </div>
            ) : (
              <p className="path-why">
                No keyword gaps on this attempt. Use SkillBridge if you
                still want a week-wise plan.
              </p>
            )}

          </div>


          <div className="result-card recommendation">

            <p className="section-label">
              NEXT STEP
            </p>

            <h2>
              Strengthen your preparation
            </h2>

            <p>
              Follow the prerequisite map for the
              skills that scored moderate or weak —
              do not skip ahead to ML or system design.
            </p>

            <div className="round-resource-row result-next-links">
              <Link className="round-inline-link" to="/courses">
                Browse suggested courses →
              </Link>
              <Link className="round-inline-link" to="/practice">
                Practice this round type →
              </Link>
            </div>

            <button onClick={onPrepPath}>
              Open SkillBridge & week plan →
            </button>

          </div>

        </section>


        <div className="result-actions">

          <button
            className="secondary-action"
            onClick={onDashboard}
          >
            ← Back to Dashboard
          </button>

          <button
            className="primary-action"
            onClick={onRetry}
          >
            Try Interview Again →
          </button>

        </div>


        <footer>
          <span>CareerForge</span>
          <span>
            {course?.name} · {company?.name}
          </span>
        </footer>

      </main>

    </div>
  );
}


function ScoreRow({ title, value }) {
  return (
    <div className="score-row">

      <div className="score-row-top">

        <span>{title}</span>

        <strong>{value}%</strong>

      </div>

      <div className="score-bar">
        <i style={{ width: `${value}%` }} />
      </div>

    </div>
  );
}

export default Result;