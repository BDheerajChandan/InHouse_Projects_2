// src/components/Education.jsx
import educationData from "../Config/5_education.json";

export default function Education() {
  const entries = Object.entries(educationData);
  if (!entries.length) return null;

  return (
    <section className="resume-section" aria-label="Education">
      <h2 className="section-title">Education</h2>

      {entries.map(([key, edu]) => (
        <article key={key} className="entry-block">
          <div className="entry-header">
            <span className="key-text">{edu["Degree"]}</span>
            <span className="separator"> | </span>
            <span className="value-text">{edu["Institution"]}</span>
            {edu["Location"] && (
              <>
                <span className="separator"> | </span>
                <span className="value-text">{edu["Location"]}</span>
              </>
            )}
          {/* </div>

          <div className="entry-meta"> */}
            {edu["From"] && edu["To"] && (
              <>
                <span className="key-text">| </span>
                <span className="value-text">{edu["From"]} – {edu["To"]}</span>
                &nbsp;&nbsp;
              </>
            )}
            {edu["CGPA"] && (
              <>
                <span className="key-text">CGPA: </span>
                <span className="value-text">{edu["CGPA"]}</span>
              </>
            )}
            {edu["Percentage"] && (
              <>
                <span className="key-text">Percentage: </span>
                <span className="value-text">{edu["Percentage"]}</span>
              </>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}