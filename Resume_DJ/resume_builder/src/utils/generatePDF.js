// src/utils/generatePDF.js
// Generates a fully text-based, ATS-readable PDF using jsPDF directly.
// NO html2canvas — every character is real selectable text in the PDF.

import jsPDF from "jspdf";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_W     = 210;   // A4 mm
const PAGE_H     = 297;
const MARGIN_L   = 14;
const MARGIN_R   = 14;
const MARGIN_T   = 14;
const MARGIN_B   = 14;
const CONTENT_W  = PAGE_W - MARGIN_L - MARGIN_R;

const FONT       = "helvetica"; // jsPDF built-in, ATS safe
const SIZE_NAME  = 16;
const SIZE_SEC   = 10;
const SIZE_KEY   = 9;
const SIZE_VAL   = 8;
const SIZE_SUM   = 8;

const LINE_H_KEY = 4.5;
const LINE_H_VAL = 4.2;
const LINE_H_SUM = 4.5;
const SEC_GAP    = 3;
const ENTRY_GAP  = 2.5;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function wrapText(doc, text, maxWidth, fontSize) {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(String(text), maxWidth);
}

class PDFWriter {
  constructor() {
    this.doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    this.y     = MARGIN_T;
    this.pageN = 1;
  }

  checkPage(needed = 6) {
    if (this.y + needed > PAGE_H - MARGIN_B) {
      this.doc.addPage();
      this.y = MARGIN_T;
      this.pageN++;
    }
  }

  // bold key + normal value on same line
  keyValue(key, value, indent = 0) {
    const x = MARGIN_L + indent;
    this.checkPage(LINE_H_KEY + 1);

    this.doc.setFont(FONT, "bold");
    this.doc.setFontSize(SIZE_KEY);
    const kw = this.doc.getTextWidth(key);
    this.doc.text(key, x, this.y);

    this.doc.setFont(FONT, "normal");
    this.doc.setFontSize(SIZE_VAL);
    const lines = wrapText(this.doc, value, CONTENT_W - indent - kw - 1, SIZE_VAL);
    lines.forEach((ln, i) => {
      if (i === 0) {
        this.doc.text(ln, x + kw + 1, this.y);
      } else {
        this.y += LINE_H_VAL;
        this.checkPage(LINE_H_VAL + 1);
        this.doc.text(ln, x + kw + 1, this.y);
      }
    });
    this.y += LINE_H_KEY;
  }

  // plain value text (wrapped)
  value(text, indent = 0, lineH = LINE_H_VAL) {
    const x = MARGIN_L + indent;
    this.doc.setFont(FONT, "normal");
    this.doc.setFontSize(SIZE_VAL);
    const lines = wrapText(this.doc, text, CONTENT_W - indent, SIZE_VAL);
    lines.forEach(ln => {
      this.checkPage(lineH + 1);
      this.doc.text(ln, x, this.y);
      this.y += lineH;
    });
  }

  // bold text (section title)
  sectionTitle(title) {
    this.y += 1;
    this.checkPage(8);
    this.doc.setFont(FONT, "bold");
    this.doc.setFontSize(SIZE_SEC);
    this.doc.text(title.toUpperCase(), MARGIN_L, this.y);
    this.y += 1.5;
    // underline
    this.doc.setDrawColor(30, 30, 30);
    this.doc.setLineWidth(0.4);
    this.doc.line(MARGIN_L, this.y, PAGE_W - MARGIN_R, this.y);
    this.y += SEC_GAP;
  }

  // bullet point
  bullet(text, indent = 4) {
    const x = MARGIN_L + indent;
    this.doc.setFont(FONT, "normal");
    this.doc.setFontSize(SIZE_VAL);
    const maxW = CONTENT_W - indent - 3;
    const lines = wrapText(this.doc, text, maxW, SIZE_VAL);
    lines.forEach((ln, i) => {
      this.checkPage(LINE_H_VAL + 1);
      if (i === 0) {
        this.doc.text("\u2022", x, this.y);
        this.doc.text(ln, x + 3, this.y);
      } else {
        this.doc.text(ln, x + 3, this.y);
      }
      this.y += LINE_H_VAL;
    });
  }

  // inline row: bold label | value | bold label | value ...
  inlineRow(pairs) {
    this.checkPage(LINE_H_KEY + 1);
    let x = MARGIN_L;
    pairs.forEach(({ key, val }, i) => {
      this.doc.setFont(FONT, "bold");
      this.doc.setFontSize(SIZE_KEY);
      this.doc.text(key, x, this.y);
      x += this.doc.getTextWidth(key) + 0.8;

      this.doc.setFont(FONT, "normal");
      this.doc.setFontSize(SIZE_VAL);
      this.doc.text(val, x, this.y);
      x += this.doc.getTextWidth(val) + 0.8;

      if (i < pairs.length - 1) {
        this.doc.setTextColor(100);
        this.doc.text("|", x, this.y);
        this.doc.setTextColor(0);
        x += this.doc.getTextWidth("|") + 0.8;
      }
    });
    this.y += LINE_H_KEY;
  }

  // link as italic underlined text
  link(label, url, indent = 0) {
    const x = MARGIN_L + indent;
    this.doc.setFont(FONT, "italic");
    this.doc.setFontSize(SIZE_VAL);
    this.doc.setTextColor(10, 10, 138);
    const lines = wrapText(this.doc, url, CONTENT_W - indent, SIZE_VAL);
    lines.forEach(ln => {
      this.checkPage(LINE_H_VAL + 1);
      if (label) {
        this.doc.setFont(FONT, "bold");
        this.doc.setFontSize(SIZE_KEY);
        this.doc.setTextColor(0);
        this.doc.text(label + " ", x, this.y);
        const lw = this.doc.getTextWidth(label + " ");
        this.doc.setFont(FONT, "italic");
        this.doc.setFontSize(SIZE_VAL);
        this.doc.setTextColor(10, 10, 138);
        this.doc.text(ln, x + lw, this.y);
      } else {
        this.doc.text(ln, x, this.y);
      }
      this.y += LINE_H_VAL;
    });
    this.doc.setTextColor(0);
  }

  gap(mm = ENTRY_GAP) { this.y += mm; }

  // save(filename) { this.doc.save(filename); }
  save() {
  const now = new Date();
  const day   = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year  = now.getFullYear();
  this.doc.save(`Dheeraj_Resume ${day}-${month}-${year}.pdf`);
}
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function generateResumePDF({
  name, contact, phone, email, links,
  summary, skills, work, projects, education, certifications, achievements
}) {
  const w = new PDFWriter();

  // ── Name ──────────────────────────────────────────────────────────────────
  w.doc.setFont(FONT, "bold");
  w.doc.setFontSize(SIZE_NAME);
  w.doc.text(name, MARGIN_L, w.y);
  w.y += 7;

  // ── Contact ───────────────────────────────────────────────────────────────
  w.doc.setFont(FONT, "normal");
  w.doc.setFontSize(SIZE_VAL);
  const contactLine = [contact, email, phone].filter(Boolean).join("  |  ");
  w.doc.text(contactLine, MARGIN_L, w.y);
  w.y += LINE_H_KEY;

  // ── Profile links ─────────────────────────────────────────────────────────
  Object.entries(links).forEach(([platform, url]) => {
    w.link(platform + ":", url);
  });
  w.gap(2);

  // ── Summary ───────────────────────────────────────────────────────────────
  if (summary) {
    w.sectionTitle("Professional Summary");
    w.doc.setFont(FONT, "normal");
    w.doc.setFontSize(SIZE_SUM);
    const lines = wrapText(w.doc, summary, CONTENT_W, SIZE_SUM);
    lines.forEach(ln => {
      w.checkPage(LINE_H_SUM + 1);
      w.doc.text(ln, MARGIN_L, w.y);
      w.y += LINE_H_SUM;
    });
    w.gap(1);
  }

  // ── Work Experience ───────────────────────────────────────────────────────
  if (work && Object.keys(work).length) {
    w.sectionTitle("Work Experience");
    Object.entries(work).forEach(([, co]) => {
      w.inlineRow([
        { key: co["Company Name"], val: "" },
        { key: "", val: co["Location"] },
        { key: "", val: co["Mode"] },
      ]);
      // redo simpler
      w.y -= LINE_H_KEY;
      w.checkPage(LINE_H_KEY + 1);
      w.doc.setFont(FONT, "bold");
      w.doc.setFontSize(SIZE_KEY);
      w.doc.text(co["Company Name"], MARGIN_L, w.y);
      const nw = w.doc.getTextWidth(co["Company Name"]);
      w.doc.setFont(FONT, "normal");
      w.doc.setFontSize(SIZE_VAL);
      w.doc.setTextColor(80);
      w.doc.text("  |  " + co["Location"] + "  |  " + co["Mode"], MARGIN_L + nw, w.y);
      w.doc.setTextColor(0);
      w.y += LINE_H_KEY;

      w.keyValue("Duration: ", co["From"] + " \u2013 " + co["To"]);
      (co["Description"] || []).forEach(pt => w.bullet(pt));
      w.gap(ENTRY_GAP);
    });
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  if (projects && Object.keys(projects).length) {
    w.sectionTitle("Projects");
    Object.entries(projects).forEach(([, proj]) => {
      w.checkPage(6);
      w.doc.setFont(FONT, "bold");
      w.doc.setFontSize(SIZE_KEY);
      w.doc.text(proj["Title"], MARGIN_L, w.y);
      if (proj["Year"]) {
        const tw = w.doc.getTextWidth(proj["Title"]);
        w.doc.setFont(FONT, "normal");
        w.doc.setFontSize(SIZE_VAL);
        w.doc.setTextColor(80);
        w.doc.text("  |  " + proj["Year"], MARGIN_L + tw, w.y);
        w.doc.setTextColor(0);
      }
      w.y += LINE_H_KEY;
      if (proj["Link"]) w.link("", proj["Link"]);
      if (proj["Description"]) w.value(proj["Description"]);
      w.gap(ENTRY_GAP);
    });
  }

  // ── Technical Skills ──────────────────────────────────────────────────────
  if (skills && Object.keys(skills).length) {
    w.sectionTitle("Technical Skills");
    Object.entries(skills).forEach(([cat, vals]) => {
      const v = Array.isArray(vals) ? vals.join(", ") : String(vals);
      w.keyValue(cat + ": ", v);
    });
    w.gap(1);
  }

  // ── Education ─────────────────────────────────────────────────────────────
  if (education && Object.keys(education).length) {
    w.sectionTitle("Education");
    Object.entries(education).forEach(([, edu]) => {
      w.checkPage(8);
      w.doc.setFont(FONT, "bold");
      w.doc.setFontSize(SIZE_KEY);
      w.doc.text(edu["Degree"], MARGIN_L, w.y);
      w.y += LINE_H_KEY;
      const meta = [edu["Institution"], edu["Location"]].filter(Boolean).join("  |  ");
      w.value(meta);
      const grade = edu["CGPA"]
        ? "CGPA: " + edu["CGPA"]
        : edu["Percentage"]
        ? "Percentage: " + edu["Percentage"]
        : "";
      w.keyValue("Duration: ", edu["From"] + " \u2013 " + edu["To"] + (grade ? "   " + grade : ""));
      w.gap(ENTRY_GAP);
    });
  }

  // ── Certifications ────────────────────────────────────────────────────────
  if (certifications && Object.keys(certifications).length) {
    w.sectionTitle("Certifications");
    Object.entries(certifications).forEach(([, cert]) => {
      w.checkPage(5);
      w.doc.setFont(FONT, "bold");
      w.doc.setFontSize(SIZE_KEY);
      const row = [cert["Title"], cert["Issuer"], cert["Year"]].filter(Boolean).join("  |  ");
      const lines = wrapText(w.doc, row, CONTENT_W, SIZE_KEY);
      lines.forEach(ln => {
        w.checkPage(LINE_H_KEY + 1);
        w.doc.text(ln, MARGIN_L, w.y);
        w.y += LINE_H_KEY;
      });
      if (cert["Link"]) w.link("", cert["Link"]);
      w.gap(1.5);
    });
  }

  // ── Achievements ──────────────────────────────────────────────────────────
  if (achievements && achievements.length) {
    w.sectionTitle("Achievements");
    achievements.forEach(a => w.bullet(a));
  }

  // w.save("Dheeraj_Chandan_Resume.pdf");
  w.save();

}