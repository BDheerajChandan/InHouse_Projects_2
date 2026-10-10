// src/App.jsx
import { useRef } from "react";
import { generateResumePDF } from "./utils/generatePDF";

import ProfileHeading  from "./components/Profile_heading";
import WorkExperience  from "./components/Work_experience";
import Projects        from "./components/Projects";
import TechnicalSkills from "./components/Technical_skills";
import Education       from "./components/Education";
import Certifications  from "./components/Certifications";
import Achievements    from "./components/Achievements";

// Config imports — used ONLY by the PDF generator
import profileLinks    from "./Config/profile_links.json";
import summaryData     from "./Config/1_summary.json";
import workData        from "./Config/2_Work_Experience.json";
import projectsData    from "./Config/3_projects_links.json";
import skillsData      from "./Config/4_technical_skills.json";
import educationData   from "./Config/5_education.json";
import certData        from "./Config/6_certifications.json";
import achievements    from "./Config/7_achievements.json";

import "./index.css";

export default function App() {
  const resumeRef = useRef(null);

  const handleDownload = () => {
    generateResumePDF({
      name:            "B.Dheeraj Chandan",
      contact:         "Bhubaneswar, Odisha",
      phone:           "+91-7995987744",
      email:           "chandandheerajbalivada@gmail.com",
      links:           profileLinks,
      summary:         summaryData.summary,
      work:            workData,
      projects:        projectsData,
      skills:          skillsData,
      education:       educationData,
      certifications:  certData,
      achievements:    achievements,
    });
  };

  return (
    <div className="resume-page-wrapper">
      <div className="download-btn-wrapper">
        <button className="download-btn" onClick={handleDownload}>
          Download Resume (PDF)
        </button>
      </div>

      <div className="resume-container" ref={resumeRef}>
        <ProfileHeading />
        <WorkExperience />
        <Projects />
        <TechnicalSkills />
        <Education />
        <Certifications />
        <Achievements />
      </div>
    </div>
  );
}