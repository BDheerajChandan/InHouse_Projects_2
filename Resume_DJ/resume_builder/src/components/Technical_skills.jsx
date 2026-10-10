// src/components/Technical_skills.jsx
import skillsData from "../Config/4_technical_skills.json";

export default function TechnicalSkills() {
  const entries = Object.entries(skillsData);
  if (!entries.length) return null;

  return (
    <section className="resume-section" aria-label="Technical Skills">
      <h2 className="section-title">Technical Skills</h2>

      {entries.map(([category, skills]) => (
        <div key={category} className="entry-meta skill-row" style={{ lineHeight: "1.1" }}>
          <span className="key-text" style={{ lineHeight: "1.1" }}>{category}: </span>
          <span className="value-text" style={{ lineHeight: "1.1" }}>
            {Array.isArray(skills) ? skills.join(", ") : skills}
          </span>
        </div>
      ))}
    </section>
  );
}