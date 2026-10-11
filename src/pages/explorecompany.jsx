import React from "react";

import catalog from "../data/catalog.json";
import { detectRequirementChanges } from "../data/companySignals";

const companies = Object.values(catalog.companiesByCourseId)
  .flat()
  .reduce((list, company) => {
    if (list.some((item) => item.name === company.name)) {
      return list;
    }
    const signal = detectRequirementChanges(company);
    const rising = signal.changes
      .filter((item) => item.direction === "up")
      .slice(0, 5)
      .map((item) => item.skill);
    list.push({
      name: company.name,
      role: company.role,
      requirements: rising.length
        ? rising
        : [company.industry, company.description].filter(Boolean),
    });
    return list;
  }, []);

function ExploreCompanies({ onBack }) {
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
        <p className="eyebrow">COMPANY DISCOVERY</p>
        <h1 className="page-title">
          Know where you want to go.
        </h1>
        <p className="page-subtitle">
          Companies from all 10 CareerForge courses. Skills listed are
          what the requirement detector marked as rising versus the prior
          hiring cycle.
        </p>

        <div className="company-explore-grid">
          {companies.map((company, index) => (
            <article className="explore-company-card" key={company.name}>
              <div className="explore-company-top">
                <div className="explore-company-logo">
                  {company.name.charAt(0)}
                </div>
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h2>{company.name}</h2>
              <p className="company-role-text">{company.role}</p>
              <div className="requirement-title">RISING THIS CYCLE</div>
              <div className="requirement-list">
                {company.requirements.map((requirement) => (
                  <span key={requirement}>{requirement}</span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

export default ExploreCompanies;
