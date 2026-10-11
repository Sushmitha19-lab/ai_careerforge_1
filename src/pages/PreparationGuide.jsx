import React from "react";

const preparationSteps = [
  {
    number: "01",
    title: "Build your foundation",
    description:
      "Start with programming fundamentals and understand the concepts instead of memorising solutions.",
    points: [
      "Choose one programming language",
      "Strengthen syntax and logic",
      "Understand OOP fundamentals",
      "Practice basic problem solving",
    ],
  },
  {
    number: "02",
    title: "Strengthen problem solving",
    description:
      "Develop the ability to break a problem into smaller parts and arrive at an efficient solution.",
    points: [
      "Arrays and strings",
      "Linked lists and stacks",
      "Trees and graphs",
      "Searching and sorting",
    ],
  },
  {
    number: "03",
    title: "Prepare your core subjects",
    description:
      "Interviewers often evaluate how well you understand the fundamentals behind your degree.",
    points: [
      "Data Structures & Algorithms",
      "DBMS",
      "Operating Systems",
      "Computer Networks",
    ],
  },
  {
    number: "04",
    title: "Know your projects",
    description:
      "Be ready to explain what you built, why you built it and the decisions you made.",
    points: [
      "Explain the problem",
      "Explain your architecture",
      "Know your technologies",
      "Understand your own code",
    ],
  },
  {
    number: "05",
    title: "Improve communication",
    description:
      "A technically correct answer is stronger when you can explain your reasoning clearly.",
    points: [
      "Think before answering",
      "Structure your response",
      "Explain technical concepts simply",
      "Practice HR questions",
    ],
  },
  {
    number: "06",
    title: "Practice like an interview",
    description:
      "Move from learning to performing by solving questions under realistic interview conditions.",
    points: [
      "Set a time limit",
      "Speak while solving",
      "Attempt mock interviews",
      "Review mistakes afterwards",
    ],
  },
];

function PreparationGuide({ onBack }) {
  return (
    <div className="inner-page">

      <header className="inner-header">

        <button
          className="back-button"
          onClick={onBack}
        >
          ← Dashboard
        </button>

        <div className="mini-brand">
          <div className="brand-mark">C</div>
          <strong>CareerForge</strong>
        </div>

      </header>


      <main className="inner-content">

        <p className="eyebrow">
          PREPARE & PRACTICE
        </p>

        <h1 className="page-title">
          Prepare smarter, not just harder.
        </h1>

        <p className="page-subtitle">
          A practical preparation path to help you move
          from learning concepts to becoming interview-ready.
        </p>


        <div className="preparation-guide">

          {preparationSteps.map((step) => (

            <article
              className="guide-card"
              key={step.number}
            >

              <div className="guide-number">
                {step.number}
              </div>

              <div className="guide-content">

                <h2>
                  {step.title}
                </h2>

                <p>
                  {step.description}
                </p>


                <div className="guide-points">

                  {step.points.map((point) => (

                    <span key={point}>
                      <b>✓</b>
                      {point}
                    </span>

                  ))}

                </div>

              </div>

            </article>

          ))}

        </div>


        <section className="preparation-principle">

          <div>

            <p className="section-label">
              CAREERFORGE PRINCIPLE
            </p>

            <h2>
              Learn → Practice → Reflect → Improve
            </h2>

            <p>
              Preparation is not about completing as many
              questions as possible. Understand the concept,
              apply it, review your mistakes and repeat.
            </p>

          </div>

        </section>

      </main>

    </div>
  );
}

export default PreparationGuide;