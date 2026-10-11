import React, { useState } from "react";

import catalog from "../data/catalog.json";
import { codingWeeksForTrack } from "../data/codingWeeks";
import { resourcesForRound } from "../data/practiceResources";
import { COURSE_ICONS, roundsForCourse, trackFromCourse } from "../data/tracks";

function Practice({ student, onBack, onStartMock }) {
  const [course, setCourse] = useState(null);
  const [company, setCompany] = useState(null);
  const courses = catalog.courses;
  const companies = course
    ? catalog.companiesByCourseId[String(course.id)] || []
    : [];
  const track = trackFromCourse(course);
  const rounds = course ? roundsForCourse(course) : [];
  const weeks = course ? codingWeeksForTrack(track) : [];

  return (
    <div className="inner-page">
      <header className="inner-header">
        <button
          className="back-button"
          onClick={() => {
            if (company) {
              setCompany(null);
              return;
            }
            if (course) {
              setCourse(null);
              return;
            }
            onBack();
          }}
        >
          {company || course ? "← Back" : "← Dashboard"}
        </button>
        <div className="mini-brand">
          <div className="brand-mark">C</div>
          <strong>CareerForge</strong>
        </div>
      </header>

      <main className="inner-content">
        {!course ? (
          <>
            <p className="eyebrow">PRACTICE · 10 COURSES</p>
            <h1 className="page-title">
              Practice by course,
              <br />
              then by company.
            </h1>
            <p className="page-subtitle">
              Hi {student?.name || "there"}. Pick a domain. Each course has 10
              companies and four interview rounds with live practice links.
            </p>
            <div className="course-grid ten-up">
              {courses.map((item, index) => (
                <button
                  className="course-card"
                  key={item.id}
                  onClick={() => setCourse(item)}
                >
                  <span className="course-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="course-icon">
                    {COURSE_ICONS[index] || "✦"}
                  </div>
                  <span className="course-code">COURSE</span>
                  <h2>{item.name}</h2>
                  <p>{item.description}</p>
                  <strong>10 companies →</strong>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {course && !company ? (
          <>
            <p className="eyebrow">PRACTICE · 10 COMPANIES</p>
            <h1 className="page-title">
              Companies for {course.name}
            </h1>
            <p className="page-subtitle">
              Choose a company to open aptitude, coding, technical, and HR
              resources for this course — then start a 4-round mock (15 questions
              each round) when ready.
            </p>
            <div className="company-count">{companies.length} companies</div>
            <div className="company-grid">
              {companies.map((item, index) => (
                <button
                  className="company-card"
                  key={item.id}
                  onClick={() => setCompany(item)}
                >
                  <div className="company-top">
                    <div className="company-logo">{item.name?.charAt(0)}</div>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h2>{item.name}</h2>
                  <p>{item.role || item.industry}</p>
                  <strong>Open practice rounds →</strong>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {course && company ? (
          <>
            <p className="eyebrow">PRACTICE · ROUNDS</p>
            <h1 className="page-title">
              {company.name}
            </h1>
            <p className="page-subtitle">
              {course.name} · {company.role}. Resources are grouped the way this
              course interviews: {rounds.map((item) => item.name).join(", ")}.
            </p>

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

            {rounds.map((round) => (
              <section className="prep-panel" key={round.id}>
                <p className="section-label">
                  {round.name.toUpperCase()} RESOURCES
                </p>
                <h2>{round.blurb}</h2>
                <div className="resource-grid">
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
                </div>
              </section>
            ))}

            <section className="prep-panel">
              <p className="section-label">WEEK-WISE CODING</p>
              <h2>A progression, not a random problem dump</h2>
              <div className="week-grid coding-weeks">
                {weeks.map((item) => (
                  <article className="week-card ready" key={item.week}>
                    <span>WEEK {item.week}</span>
                    <h3>{item.title}</h3>
                    <p>{item.focus}</p>
                    <ul className="problem-list">
                      {item.problems.map((problem) => (
                        <li key={problem.url}>
                          <a href={problem.url} target="_blank" rel="noreferrer">
                            {problem.name}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section className="interview-start">
              <div>
                <p className="section-label">READY TO TEST YOURSELF?</p>
                <h2>Four adaptive rounds</h2>
                <p>
                  Camera emotion, keyword matching, and voice accent plus
                  fluency — then a chance-of-advance score and weak areas.
                </p>
              </div>
              <button
                className="primary-action"
                onClick={() => onStartMock(course, company)}
              >
                Start Mock Interview →
              </button>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default Practice;
