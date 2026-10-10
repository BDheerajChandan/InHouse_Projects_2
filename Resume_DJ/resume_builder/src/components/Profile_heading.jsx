// src/components/Profile_heading.jsx
import profileLinks from "../Config/profile_links.json";
import summaryData  from "../Config/1_summary.json";

export default function ProfileHeading() {
  return (
    <header className="resume-section profile-header" role="banner">

      {/* Name */}
      <h1 className="profile-name">B.Dheeraj Chandan</h1>

      {/* Contact — explicit labels for ATS parsing */}
      <p className="profile-contact value-text">
        Bhubaneswar, Odisha
        <span className="pipe"> | </span>
        <span>Email: chandandheerajbalivada@gmail.com</span>
        <span className="pipe"> | </span>
        <span>Phone: +91-7995987744</span>
      </p>

      {/* Profile links — LinkedIn on its own labelled line */}
      <ul className="profile-links" style={{ listStyle: "none", padding: 0 }}>
        {Object.entries(profileLinks).map(([platform, url]) => (
          <li key={platform} className="profile-link-item">
            <span className="key-text">{platform}: </span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="link-text"
            >
              {url}
            </a>
          </li>
        ))}
      </ul>

      {/* Professional Summary */}
      {summaryData?.summary && (
        <section
          className="resume-section"
          aria-label="Professional Summary"
          style={{ marginTop: "8px" }}
        >
          <h2 className="section-title">Professional Summary</h2>
          <p className="value-text summary-text">{summaryData.summary}</p>
        </section>
      )}

    </header>
  );
}