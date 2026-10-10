// src/components/Certifications.jsx
import certData from "../Config/6_certifications.json";

export default function Certifications() {
  const entries = Object.entries(certData);
  if (!entries.length) return null;

  return (
    <section className="resume-section" aria-label="Certifications">
      <h2 className="section-title">Certifications</h2>

      {entries.map(([key, cert]) => (
        <article key={key} className="entry-block">
          <div className="entry-header">
            <span className="key-text">{cert["Title"]}</span>
            {cert["Issuer"] && (
              <>
                <span className="separator"> | </span>
                <span className="value-text">{cert["Issuer"]}</span>
              </>
            )}
            {cert["Year"] && (
              <>
                <span className="separator"> | </span>
                <span className="value-text">{cert["Year"]}</span>
              </>
            )}
          </div>

          {cert["Link"] && (
            <div>
              <a
                href={cert["Link"]}
                target="_blank"
                rel="noopener noreferrer"
                className="link-text"
              >
                {cert["Link"]}
              </a>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}