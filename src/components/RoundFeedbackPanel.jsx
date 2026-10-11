import { Link } from "react-router-dom";

import { meterTone } from "../utils/roundFeedback";

function ScoreMeter({ title, value, invert }) {
  const score = typeof value === "number" ? value : 0;
  return (
    <div className="behavior-meter">
      <div className="score-row-top">
        <span>{title}</span>
        <strong>{score}%</strong>
      </div>
      <div className="score-bar">
        <i
          className={`meter-fill ${meterTone(score, invert)}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>
    </div>
  );
}

export function RoundFeedbackPanel({ feedback }) {
  if (!feedback) {
    return null;
  }

  const face = feedback.face;
  const voiceUsed =
    typeof feedback.voiceAccuracy === "number" ||
    typeof feedback.voiceFluency === "number";

  return (
    <div className="round-feedback">
      <div className="round-feedback-grid">
        <section className="round-feedback-block">
          <p className="section-label">ACCURACY</p>
          <h3>How this round scored</h3>
          <ScoreMeter title="Answer accuracy" value={feedback.answerAccuracy} />
          <ScoreMeter title="Keyword match" value={feedback.keywordAccuracy} />
          <ScoreMeter title="Answer pattern" value={feedback.patternAccuracy} />
          {voiceUsed ? (
            <>
              <ScoreMeter
                title="Voice accuracy"
                value={feedback.voiceAccuracy || 0}
              />
              <ScoreMeter
                title="Voice fluency"
                value={feedback.voiceFluency || 0}
              />
              {typeof feedback.voiceAccent === "number" ? (
                <ScoreMeter
                  title="Accent / clarity"
                  value={feedback.voiceAccent}
                />
              ) : null}
            </>
          ) : (
            <p className="behavior-note">
              Voice analysis was not used this round. Start Voice Analysis on
              a question to score spoken accuracy.
            </p>
          )}
          {!!feedback.weakKeywords?.length && (
            <p className="round-feedback-tags">
              {feedback.weakKeywords.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </p>
          )}
        </section>

        <section className="round-feedback-block">
          <p className="section-label">FACE DETECTION</p>
          {face ? (
            <>
              <h3>
                {face.used
                  ? `${face.integrityLabel} · ${face.emotion}`
                  : "Camera not used"}
              </h3>
              {face.used ? (
                <>
                  <ScoreMeter title="Confidence" value={face.confidence} />
                  <ScoreMeter
                    title="Nervousness"
                    value={face.nervousness}
                    invert
                  />
                  <ScoreMeter
                    title="Malpractice risk"
                    value={face.cheatingRisk}
                    invert
                  />
                  <p className="behavior-note">
                    {face.samples} camera samples this round
                    {face.noFace ? ` · no face ${face.noFace}×` : ""}
                    {face.lookingAway ? ` · looking away ${face.lookingAway}×` : ""}
                    {face.extraFaces ? ` · extra faces ${face.extraFaces}×` : ""}
                  </p>
                </>
              ) : (
                <p className="behavior-note warning-note">
                  {face.notes?.[0] ||
                    "Turn the camera on for YuNet face detection, emotion, and integrity."}
                </p>
              )}
              {face.used && !!face.notes?.length && (
                <ul className="behavior-flags">
                  {face.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <h3>Not stored for this round</h3>
              <p className="behavior-note">
                Face-detection samples are captured live during each round.
              </p>
            </>
          )}
        </section>
      </div>

      <section className="round-feedback-block round-courses">
        <p className="section-label">SUGGESTED COURSES</p>
        <h3>What to study next</h3>
        <div className="round-course-list">
          {(feedback.courses || []).map((item) => (
            <Link className="round-course-card" key={item.id} to={item.href || "/courses"}>
              <strong>{item.name}</strong>
              <p>{item.reason}</p>
            </Link>
          ))}
        </div>
        <div className="round-resource-row">
          <Link className="round-inline-link" to="/practice">
            Open practice links →
          </Link>
          <Link className="round-inline-link" to="/readiness">
            SkillBridge plan →
          </Link>
        </div>
        {!!feedback.resources?.length && (
          <ul className="round-resource-list">
            {feedback.resources.map((item) => (
              <li key={item.url}>
                <a href={item.url} target="_blank" rel="noreferrer">
                  {item.title}
                </a>
                <span>{item.blurb}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
