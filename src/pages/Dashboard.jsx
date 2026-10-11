import React from "react";

function Dashboard({
  student,
  onSelectCourse,
  onPractice,
  onExploreCompanies,
  onPrepare,
  onProgress,
  onLogout,
}) {
  const name = student?.name || "Student";

  return (
    <div className="careerforge">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brand-mark">
            C
          </div>

          <div>
            <h2>CareerForge</h2>
            <span>career preparation</span>
          </div>

        </div>


        <div className="menu-title">
          WORKSPACE
        </div>


        <nav className="sidebar-menu">

          <button className="menu-item active">
            <span>⌂</span>
            Overview
          </button>


          <button
            className="menu-item"
            onClick={onSelectCourse}
          >
            <span>↗</span>
            My Career Path
          </button>


          <button
            className="menu-item"
            onClick={onExploreCompanies}
          >
            <span>◇</span>
            Companies
          </button>


          <button
            className="menu-item"
            onClick={onPractice}
          >
            <span>◉</span>
            Practice
          </button>


          <button
            className="menu-item"
            onClick={onPrepare}
          >
            <span>▤</span>
            Guide
          </button>


          <button
            className="menu-item"
            onClick={onProgress}
          >
            <span>◌</span>
            SkillBridge
          </button>

        </nav>


        <div className="sidebar-bottom">

          <button
            className="menu-item"
            onClick={onLogout}
          >
            <span>↪</span>
            Logout
          </button>


          <div className="student-mini">

            <div className="student-avatar">
              {name.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{name}</strong>
              <small>Student</small>
            </div>

          </div>

        </div>

      </aside>


      {/* MAIN AREA */}

      <main className="main-area">


        {/* TOP BAR */}

        <header className="topbar">

          <div>
            <span className="breadcrumb">
              Overview
            </span>
          </div>


          <div className="top-actions">

            <span className="top-email">
              {student?.email}
            </span>

            <div className="top-profile">
              {name.charAt(0).toUpperCase()}
            </div>

          </div>

        </header>


        {/* CONTENT */}

        <div className="content">


          {/* INTRO */}

          <section className="intro">

            <div>

              <p className="eyebrow">
                YOUR CAREER WORKSPACE
              </p>


              <h1>
                Build your path.
                <br />
                <em>Prepare with purpose.</em>
              </h1>


              <p className="intro-text">
                CareerForge is an adaptive ML platform for
                personalized placement preparation: 10 courses,
                10 companies each, four interview rounds of 15 questions,
                SkillBridge maps, and Career Compass hiring signals.
              </p>

            </div>


            <div className="date-card">

              <span>
                YOUR NEXT STEP
              </span>


              <strong>
                Choose your career domain
              </strong>


              <small>
                Start by selecting a course.
              </small>

            </div>

          </section>


          {/* CAREER PATH */}

          <section className="path-card">

            <div className="path-header">

              <div>

                <p className="section-label">
                  CURRENT PATH
                </p>

                <h2>
                  Your career journey
                </h2>

              </div>


              <span className="path-status">
                Ready to begin
              </span>

            </div>


            <div className="career-path">


              <div className="path-node current">

                <div className="node-circle">
                  01
                </div>

                <strong>
                  Course
                </strong>

                <span>
                  Choose your domain
                </span>

              </div>


              <div className="path-connector" />


              <div className="path-node">

                <div className="node-circle">
                  02
                </div>

                <strong>
                  Skills
                </strong>

                <span>
                  Build your strengths
                </span>

              </div>


              <div className="path-connector" />


              <div className="path-node">

                <div className="node-circle">
                  03
                </div>

                <strong>
                  Company
                </strong>

                <span>
                  Set your target
                </span>

              </div>


              <div className="path-connector" />


              <div className="path-node">

                <div className="node-circle">
                  04
                </div>

                <strong>
                  Interview
                </strong>

                <span>
                  Practice & improve
                </span>

              </div>

            </div>

          </section>


          {/* QUICK ACTIONS */}

          <div className="section-title">

            <div>

              <p className="section-label">
                PREPARATION
              </p>

              <h2>
                Start your journey
              </h2>

            </div>

          </div>


          <section className="action-grid">


            {/* CHOOSE COURSE */}

            <article className="action-card interview-card">

              <div className="card-number">
                01
              </div>


              <div className="card-icon">
                ◉
              </div>


              <h3>
                Choose a Course
              </h3>


              <p>
                Select the career domain you
                want to prepare for.
              </p>


              <button
                onClick={onSelectCourse}
              >
                Explore courses →
              </button>

            </article>


            {/* EXPLORE COMPANIES */}

            <article className="action-card">

              <div className="card-number">
                02
              </div>


              <div className="card-icon">
                ◇
              </div>


              <h3>
                Explore Companies
              </h3>


              <p>
                Discover top companies and
                understand the skills they look for.
              </p>


              <button
                onClick={onExploreCompanies}
              >
                Find companies →
              </button>

            </article>


            {/* PREPARE & PRACTICE */}

            <article className="action-card">

              <div className="card-number">
                03
              </div>


              <div className="card-icon">
                ▤
              </div>


              <h3>
                Practice rounds
              </h3>


              <p>
                Aptitude, coding, technical, and HR
                links for each course and company.
              </p>


              <button
                onClick={onPractice}
              >
                Open practice →
              </button>

            </article>


            <article className="action-card">

              <div className="card-number">
                04
              </div>


              <div className="card-icon">
                ◎
              </div>


              <h3>
                SkillBridge & Compass
              </h3>


              <p>
                Prerequisite maps, week-wise coding,
                and the company requirement detector.
              </p>


              <button
                onClick={onProgress}
              >
                Open Career Compass →
              </button>

            </article>

          </section>


          {/* TARGET COMPANY */}

          <section className="target-section">


            <div className="section-title">

              <div>

                <p className="section-label">
                  YOUR GOAL
                </p>

                <h2>
                  Start by choosing a course
                </h2>

              </div>

            </div>


            <div className="target-box">


              <div className="target-symbol">
                +
              </div>


              <div className="target-text">

                <span>
                  STEP 01
                </span>


                <h3>
                  Where do you want to build your career?
                </h3>


                <p>
                  Choose a course to discover suitable
                  companies and create a preparation path.
                </p>

              </div>


              <button
                className="outline-button"
                onClick={onSelectCourse}
              >
                Choose course →
              </button>

            </div>

          </section>


          {/* FOOTER */}

          <footer>

            <span>
              CareerForge
            </span>

            <span>
              Forge skills. Shape your future.
            </span>

          </footer>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;