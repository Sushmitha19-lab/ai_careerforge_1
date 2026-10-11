import React, { useEffect, useState } from "react";
import catalog from "../data/catalog.json";
import { COURSE_ICONS } from "../data/tracks";
import { fetchJson } from "../utils/fetchJson";

function CourseSelection({
  student,
  onBack,
  onSelectCourse,
}) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchJson("/api/courses")
      .then((data) => {
        if (cancelled) {
          return;
        }
        setCourses(Array.isArray(data) && data.length ? data : catalog.courses);
        setNotice(
          Array.isArray(data) && data.length
            ? ""
            : "Live catalog was empty. Showing the built-in course list."
        );
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setCourses(catalog.courses);
        setNotice("Live catalog is offline. Showing the built-in course list.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="inner-page">

      {/* HEADER */}

      <header className="inner-header">

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Dashboard
        </button>

        <div className="mini-brand">

          <div className="brand-mark">
            C
          </div>

          <strong>
            CareerForge
          </strong>

        </div>

      </header>


      {/* CONTENT */}

      <main className="inner-content">

        <p className="eyebrow">
          STEP 01 · CHOOSE YOUR PATH
        </p>


        <h1 className="page-title">
          What do you want to prepare for?
        </h1>


        <p className="page-subtitle">
          Hi {student?.name || "there"}. Select a career
          domain. Each path has 10 companies and four
          interview rounds.
        </p>


        {/* LOADING */}

        {loading && (
          <p style={{ marginTop: "40px", color: "#7d858a" }}>
            Loading courses...
          </p>
        )}


        {/* ERROR */}

        {notice && (
          <p className="catalog-notice">
            {notice}
          </p>
        )}


        {!loading && (

          <div className="course-grid ten-up">

            {courses.map((course, index) => (

              <button
                className="course-card"
                key={course.id}
                onClick={() => onSelectCourse(course)}
              >

                <span className="course-number">
                  {String(index + 1).padStart(2, "0")}
                </span>


                  <div className="course-icon">
                    {COURSE_ICONS[index] || "✦"}
                  </div>


                <span className="course-code">
                  COURSE
                </span>


                <h2>
                  {course.name}
                </h2>


                <p>
                  {course.description}
                </p>


                <strong>
                  Explore companies →
                </strong>

              </button>

            ))}

          </div>

        )}

      </main>

    </div>
  );
}

export default CourseSelection;