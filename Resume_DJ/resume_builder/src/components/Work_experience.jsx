// src/components/Work_experience.jsx
import workData from "../Config/2_Work_Experience.json";

export default function WorkExperience() {
  const entries = Object.entries(workData);
  if (!entries.length) return null;

  return (
    <section className="resume-section" aria-label="Work Experience">
      <h2 className="section-title">Work Experience</h2>

      {entries.map(([key, company]) => (
        <article key={key} className="entry-block">
          <div className="entry-header">
            <span className="key-text">{company["Company Name"]}</span>
            <span className="separator"> | </span>
            <span className="value-text">{company["Location"]}</span>
            <span className="separator"> | </span>
            <span className="value-text">{company["Mode"]}</span>
          </div>

          <div className="entry-meta">
            <span className="key-text">Duration: </span>
            <span className="value-text">{company["From"]} – {company["To"]}</span>
          </div>

          {Array.isArray(company["Description"]) && company["Description"].length > 0 && (
            <ul className="description-list" aria-label="Responsibilities">
              {company["Description"].map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </section>
  );
}