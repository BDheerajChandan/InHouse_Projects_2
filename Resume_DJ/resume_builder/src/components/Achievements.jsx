// src/components/Achievements.jsx
import achievementsData from "../Config/7_achievements.json";

export default function Achievements() {
  const isArray = Array.isArray(achievementsData);
  const entries = isArray ? achievementsData : Object.entries(achievementsData);
  if (!entries.length) return null;

  return (
    <section className="resume-section" aria-label="Achievements">
      <h2 className="section-title">Achievements</h2>
      <ul className="description-list">
        {isArray
          ? entries.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))
          : entries.map(([key, ach]) => (
              <li key={key}>
                <span className="key-text">{ach["Title"]}: </span>
                <span className="value-text">{ach["Description"]}</span>
              </li>
            ))}
      </ul>
    </section>
  );
}