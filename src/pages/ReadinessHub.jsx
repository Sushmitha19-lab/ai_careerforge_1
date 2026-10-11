import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { COMPANY_SIGNALS, detectRequirementChanges, getCompanySignal } from "../data/companySignals";
import { codingWeeksForTrack } from "../data/codingWeeks";
import { allPracticeResources } from "../data/practiceResources";
import { SKILL_MAPS, getSkillMap } from "../data/skillMaps";
import { careersUrl, jobsUrl, linksForNode } from "../data/skillLinks";
import { TRACK_ROUNDS } from "../data/tracks";
import { trackFromCourse } from "../utils/adaptiveInterview";
import {
  buildWeekPlan,
  nodeStatus,
} from "../utils/explainSkills";
import { snapshotsFor } from "../utils/progressStore";

const TRACKS = [
  { id: "software", label: "Software" },
  { id: "ai", label: "Data & AI" },
  { id: "cloud", label: "Cloud" },
  { id: "security", label: "Security" },
  { id: "fullstack", label: "Full stack" },
  { id: "mobile", label: "Mobile" },
  { id: "analytics", label: "Analytics" },
  { id: "ux", label: "UI/UX" },
  { id: "qa", label: "QA" },
  { id: "database", label: "Database" },
];

function ResourceLinks({ links }) {
  if (!links?.length) {
    return null;
  }
  return (
    <div className="skill-links">
      {links.map((item) => (
        <a
          key={item.url}
          href={item.url}
          target="_blank"
          rel="noreferrer"
        >
          {item.title} ↗
        </a>
      ))}
    </div>
  );
}

function ReadinessHub({
  student,
  course,
  company,
  result,
  onBack,
  onPrepareCompany,
}) {
  const navigate = useNavigate();
  const defaultTrack = trackFromCourse(course);
  const [track, setTrack] = useState(defaultTrack);
  const [detected, setDetected] = useState(null);
  const map = SKILL_MAPS[track] || getSkillMap(course);
  const snapshots = snapshotsFor(student);
  const latest = snapshots[snapshots.length - 1];
  const scores = result?.explained?.scores || latest?.scores || {};
  const readiness =
    result?.explained?.readiness || latest?.readiness || result?.overall || 0;
  const weeks = useMemo(
    () => buildWeekPlan(map, scores),
    [map, scores]
  );
  const codingWeeks = useMemo(
    () => codingWeeksForTrack(track),
    [track]
  );
  const practiceLinks = useMemo(
    () => allPracticeResources(track),
    [track]
  );
  const roundNames = TRACK_ROUNDS[track] || TRACK_ROUNDS.software;
  const signal = detected || getCompanySignal(company);
  const rising = (signal?.changes || []).filter((item) => item.direction === "up");
  const displaySkills = (
    result?.explained?.skills ||
    latest?.skills ||
    []
  ).slice(0, 4);

  return (
    <div className="inner-page">
      <header className="inner-header">
        <button className="back-button" onClick={onBack}>
          ← Dashboard
        </button>
        <div className="mini-brand">
          <div className="brand-mark">C</div>
          <strong>CareerForge</strong>
        </div>
      </header>

      <main className="inner-content">
        <p className="eyebrow">SKILLBRIDGE · CAREER COMPASS</p>
        <h1 className="page-title">
          Prepare the path,
          <br />
          not just the topic.
        </h1>
        <p className="page-subtitle">
          SkillBridge is the prerequisite map — instead of “learn ML”,
          see Python → NumPy/Pandas → Stats → ML → DL. Career Compass
          is week-wise coding plus the company requirement detector.
        </p>

        <div className="readiness-shortcuts">
          <a href="/practice" onClick={(e) => { e.preventDefault(); navigate("/practice"); }}>
            Practice rounds & resources
          </a>
          <a href="/courses" onClick={(e) => { e.preventDefault(); navigate("/courses"); }}>
            Start a mock by course
          </a>
          <a href="/explore" onClick={(e) => { e.preventDefault(); navigate("/explore"); }}>
            Explore companies
          </a>
        </div>

        <section className="readiness-hero">
          <div>
            <p className="section-label">COMPANY READINESS</p>
            <strong>{readiness}%</strong>
            <small>
              {company?.name
                ? `Explainable score for ${company.name}`
                : "Complete a mock to personalize this number"}
            </small>
          </div>
          <ul>
            {(displaySkills.length
              ? displaySkills
              : [
                  { id: "python", label: "Python", strength: "not scored", score: 0 },
                  { id: "communication", label: "Communication", strength: "not scored", score: 0 },
                  { id: "dsa", label: "DSA", strength: "not scored", score: 0 },
                  { id: "aptitude", label: "Aptitude", strength: "not scored", score: 0 },
                ]
            ).map((skill) => (
              <li key={skill.id}>
                <span>{skill.label}</span>
                <em className={`strength-${skill.strength}`}>
                  {skill.strength} · {skill.score}%
                </em>
              </li>
            ))}
          </ul>
        </section>

        <div className="track-switch">
          {TRACKS.map((item) => (
            <button
              key={item.id}
              className={track === item.id ? "active" : ""}
              onClick={() => setTrack(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <section className="prep-panel">
          <p className="section-label">01 · SKILLBRIDGE MAP</p>
          <h2>{map.title}</h2>
          <p className="panel-lead">{map.headline}</p>

          <div className="skill-chain">
            {map.nodes.map((node, index) => {
              const status = nodeStatus(node, map, scores);
              return (
                <React.Fragment key={node.id}>
                  {index > 0 ? <div className="skill-arrow">→</div> : null}
                  <article className={`skill-node ${status}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{node.label}</strong>
                    <small>{status === "locked" ? "Locked" : status}</small>
                    <ResourceLinks links={linksForNode(track, node.id).slice(0, 1)} />
                  </article>
                </React.Fragment>
              );
            })}
          </div>

          <div className="skill-explainer">
            {map.nodes.map((node) => {
              const status = nodeStatus(node, map, scores);
              return (
                <article key={node.id} className={status}>
                  <h3>
                    {node.label}
                    {node.dependsOn.length ? (
                      <em> after {node.dependsOn.map((id) => map.nodes.find((item) => item.id === id)?.label).join(", ")}</em>
                    ) : (
                      <em> start here</em>
                    )}
                  </h3>
                  <p>{node.before}</p>
                  <ResourceLinks links={linksForNode(track, node.id)} />
                  <small>
                    {status === "locked"
                      ? `Do not start this yet. Unlock it by strengthening the previous node.`
                      : `Next this unlocks: ${node.nextUnlocks}`}
                  </small>
                </article>
              );
            })}
          </div>
        </section>

        <section className="prep-panel">
          <p className="section-label">ROUND PRACTICE LINKS</p>
          <h2>Resources for this track’s four rounds</h2>
          <p className="panel-lead">
            Same aptitude, coding, technical, and HR links used in Practice —
            grouped here so you can open them without leaving readiness.
          </p>
          <div className="resource-grid readiness-resource-grid">
            {practiceLinks.map((resource) => (
              <article className="resource-card" key={`${resource.roundId}-${resource.url}`}>
                <div className="resource-icon">↗</div>
                <span>
                  {(roundNames.find((item) => item.id === resource.roundId)?.name || resource.roundId).toUpperCase()}
                  {" · "}
                  {resource.type}
                </span>
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
          </div>
        </section>

        <section className="prep-panel">
          <p className="section-label">02 · WEEK-WISE CODING</p>
          <h2>{codingWeeks.length} weeks, one pattern at a time</h2>
          <p className="panel-lead">
            A coding progression for this track — not a random problem dump.
            Skill-unlock weeks from SkillBridge still sit below after a mock.
          </p>
          <div className="week-grid coding-weeks">
            {codingWeeks.map((item) => (
              <article key={item.week} className="week-card ready">
                <span>WEEK {item.week}</span>
                <h3>{item.title}</h3>
                <p>{item.focus}</p>
                    <ul className="problem-list">
                      {item.problems.map((problem) => (
                        <li key={problem.url}>
                          <a
                            className="resource-link"
                            href={problem.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {problem.name} →
                          </a>
                        </li>
                      ))}
                    </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="prep-panel">
          <p className="section-label">03 · WEEK-WISE READINESS</p>
          <h2>Five weeks, one dependency at a time</h2>
          <p className="panel-lead">
            Each week is the next unlocked skill — not a pile of
            unrelated topics. Scores update after every mock interview.
          </p>

          {snapshots.length > 0 ? (
            <div className="week-history">
              {snapshots.slice(-6).map((item) => (
                <div key={`${item.weekKey}-${item.date}`} className="week-history-bar">
                  <span>
                    Week of {item.weekKey}
                    {item.companyName ? ` · ${item.companyName}` : ""}
                  </span>
                  <div>
                    <i style={{ width: `${item.readiness || item.overall || 0}%` }} />
                  </div>
                  <strong>{item.readiness || item.overall || 0}%</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="panel-lead">
              No weekly history yet. Finish one mock interview and this
              chart will start from that week.
            </p>
          )}

          <div className="week-grid">
            {weeks.map((item) => (
              <article key={item.week} className={`week-card ${item.status}`}>
                <span>WEEK {item.week}</span>
                <h3>{item.node.label}</h3>
                <p>{item.focus}</p>
                <ResourceLinks links={linksForNode(track, item.node.id)} />
              </article>
            ))}
          </div>
        </section>

        <section className="prep-panel">
          <p className="section-label">04 · COMPANY REQUIREMENT DETECTOR</p>
          {signal ? (
            <>
              <h2>
                What changed for {signal.name}
              </h2>
              <p className="panel-lead">
                Prior cycle: {signal.priorCycle}
                {" "}Current cycle: {signal.currentCycle}
              </p>
              <ResourceLinks
                links={[
                  { title: `${signal.name} careers`, url: careersUrl(signal.name) },
                  { title: "Open jobs", url: jobsUrl(signal.name) },
                ]}
              />
              <button
                className="secondary-action detect-button"
                type="button"
                onClick={() => setDetected(detectRequirementChanges(company || { name: signal.name }))}
              >
                Run detector →
              </button>
              {detected ? (
                <p className="panel-lead">
                  Last run {new Date(detected.detectedAt).toLocaleString()} · {detected.source === "tracked-cycle" ? "Tracked hiring-cycle snapshot" : "Synthesized from typical campus filters"}
                </p>
              ) : null}

              {rising.length > 0 ? (
                <div className="change-banner">
                  {rising[0].detail}
                </div>
              ) : null}

              <div className="change-grid">
                {signal.changes.map((change) => (
                  <article key={change.skill} className={`change-card ${change.direction}`}>
                    <span>
                      {change.direction === "up"
                        ? "Increased"
                        : change.direction === "down"
                          ? "Decreased"
                          : "Steady"}
                    </span>
                    <h3>{change.skill}</h3>
                    <p>{change.detail}</p>
                    {signal.name ? (
                      <ResourceLinks
                        links={[
                          { title: `${signal.name} careers`, url: careersUrl(signal.name) },
                          { title: "Open jobs", url: jobsUrl(signal.name, change.skill) },
                        ]}
                      />
                    ) : null}
                  </article>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2>Hiring-cycle signals</h2>
              <p className="panel-lead">
                No tracked cycle for this employer yet. Pick a company
                from the list below, or start a mock after choosing one.
              </p>
              <div className="change-grid">
                {Object.values(COMPANY_SIGNALS).map((item) => (
                  <article key={item.name} className="change-card up">
                    <span>Tracked</span>
                    <h3>{item.name}</h3>
                    <p>{item.changes.find((change) => change.direction === "up")?.detail || item.currentCycle}</p>
                    <ResourceLinks
                      links={[
                        { title: `${item.name} careers`, url: careersUrl(item.name) },
                        { title: "Open jobs", url: jobsUrl(item.name) },
                      ]}
                    />
                  </article>
                ))}
              </div>
            </>
          )}

          {onPrepareCompany ? (
            <button className="primary-action change-cta" onClick={onPrepareCompany}>
              Prepare against current requirements →
            </button>
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default ReadinessHub;
