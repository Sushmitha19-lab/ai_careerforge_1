import React, { useEffect, useState } from "react";
import catalog from "../data/catalog.json";
import { fetchJson } from "../utils/fetchJson";

function Companies({
  course,
  onBack,
  onSelectCompany,
}) {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!course?.id) {
      setNotice("No course selected.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    fetchJson(`/api/courses/${course.id}/companies`)
      .then((data) => {
        if (cancelled) {
          return;
        }
        const fallback = catalog.companiesByCourseId[String(course.id)] || [];
        setCompanies(Array.isArray(data) && data.length ? data : fallback);
        setNotice(
          Array.isArray(data) && data.length
            ? ""
            : "Live company list was empty. Showing the built-in list."
        );
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setCompanies(catalog.companiesByCourseId[String(course.id)] || []);
        setNotice("Live catalog is offline. Showing the built-in company list.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [course]);

  return (
    <div className="inner-page">

      {/* HEADER */}

      <header className="inner-header">

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Courses
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
          STEP 02 · COMPANY DISCOVERY
        </p>


        <h1 className="page-title">
          Companies for {course?.name || "your course"}
        </h1>


        <p className="page-subtitle">
          Choose a company to explore its interview
          process, round-by-round practice links, and mock.
        </p>


        {/* LOADING */}

        {loading && (
          <p
            style={{
              marginTop: "40px",
              color: "#7d858a",
            }}
          >
            Loading companies...
          </p>
        )}


        {/* ERROR */}

        {notice && (
          <p className="catalog-notice">
            {notice}
          </p>
        )}


        {!loading && (
          <div className="company-count">
            {companies.length} companies available
          </div>
        )}


        {!loading && (

          <div className="company-grid">

            {companies.map((company, index) => (

              <button
                className="company-card"
                key={company.id}
                onClick={() =>
                  onSelectCompany({
                    ...company,
                    courseId: course.id,
                    courseName: course.name,
                  })
                }
              >

                <div className="company-top">

                  <div className="company-logo">
                    {company.name?.charAt(0)}
                  </div>

                  <span>
                    {String(index + 1).padStart(2, "0")}
                  </span>

                </div>


                <h2>
                  {company.name}
                </h2>


                <p>
                  {company.industry ||
                    company.description ||
                    "Career opportunity"}
                </p>


                <strong>
                  Prepare for this company →
                </strong>

              </button>

            ))}

          </div>

        )}

      </main>

    </div>
  );
}

export default Companies;