// src/components/Projects.jsx
import projectsData from "../Config/3_projects_links.json";

export default function Projects() {
  const entries = Object.entries(projectsData);
  if (!entries.length) return null;

  return (
    <section className="resume-section" aria-label="Projects">
      <h2 className="section-title">Projects</h2>

      {entries.map(([key, project]) => (
        <article
          key={key}
          className="entry-block"
          style={{ marginBottom: "10px" }}
        >
          <div className="entry-header">
            <span className="key-text">{project["Title"]}</span>
            {project["Year"] && (
              <>
                <span className="separator"> | </span>
                <span className="value-text">{project["Year"]}</span>
              </>
            )}
          </div>

          {project["Link"] && (
            // <div style={{ margin: 0, padding: 0 }}>
            <div
              style={{
                margin: 0,
                padding: 0,
                lineHeight: "1.1"
              }}
            >
              <a
                href={project["Link"]}
                target="_blank"
                rel="noopener noreferrer"
                className="link-text"
              >
                {project["Link"]}
              </a>
            </div>
          )}

          {project["Description"] && (
            // <p
            //   className="value-text"
            //   style={{
            //     margin: 0,
            //     padding: 0
            //   }}
            // >
            <p
              className="value-text"
              style={{
                margin: 0,
                padding: 0,
                lineHeight: "1.2"
              }}
            >
              {project["Description"]}
            </p>
          )}
        </article>
      ))}
    </section>
  );
}