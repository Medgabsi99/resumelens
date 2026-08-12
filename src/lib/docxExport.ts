/**
 * Word (.docx) export for resume text.
 * Generates a clean, ATS-friendly single-column Word document.
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
} from "docx";
import { saveAs } from "file-saver";
import type { ParsedResume } from "@/lib/parseResume";

function hr(): Paragraph {
  return new Paragraph({
    border: {
      bottom: { color: "AAAAAA", space: 1, style: BorderStyle.SINGLE, size: 6 },
    },
    spacing: { before: 100, after: 100 },
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 22,
        color: "1a1a2e",
        allCaps: true,
      }),
    ],
    spacing: { before: 240, after: 60 },
    border: {
      bottom: { color: "8b5cf6", style: BorderStyle.SINGLE, size: 8, space: 2 },
    },
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: text.replace(/^[-•*▪►]\s*/, ""), size: 20 })],
    bullet: { level: 0 },
    spacing: { after: 40 },
  });
}

function plain(
  text: string,
  opts: { bold?: boolean; italic?: boolean; size?: number; color?: string } = {}
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: opts.bold,
        italics: opts.italic,
        size: opts.size ?? 20,
        color: opts.color,
      }),
    ],
    spacing: { after: 40 },
  });
}

export async function downloadResumeDocx(data: ParsedResume, targetRole?: string): Promise<void> {
  const sections: Paragraph[] = [];

  // ── Header ──────────────────────────────────────────────
  sections.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.contact.name || "Your Name",
          bold: true,
          size: 36,
          color: "1a1a2e",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    })
  );

  if (targetRole) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: targetRole, bold: true, size: 22, color: "8b5cf6" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      })
    );
  }

  // Contact row
  const contactParts = [
    data.contact.email,
    data.contact.phone,
    data.contact.location,
    ...(data.contact.links || []),
  ].filter(Boolean);
  if (contactParts.length > 0) {
    sections.push(
      new Paragraph({
        children: [new TextRun({ text: contactParts.join("  |  "), size: 18, color: "555555" })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      })
    );
  }
  sections.push(hr());

  // ── Summary ──────────────────────────────────────────────
  if (data.summary) {
    sections.push(sectionHeading("Professional Summary"));
    sections.push(plain(data.summary, { size: 20 }));
    sections.push(hr());
  }

  // ── Experience ───────────────────────────────────────────
  if (data.experience && data.experience.length > 0) {
    sections.push(sectionHeading("Professional Experience"));
    for (const exp of data.experience) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: exp.title || "", bold: true, size: 22 }),
            new TextRun({ text: exp.dates ? `   ${exp.dates}` : "", size: 20, color: "8b5cf6" }),
          ],
          spacing: { before: 120, after: 20 },
        })
      );
      if (exp.company) {
        sections.push(plain(exp.company, { italic: true, color: "555555", size: 20 }));
      }
      for (const b of exp.bullets ?? []) {
        sections.push(bullet(b));
      }
    }
    sections.push(hr());
  }

  // ── Education ────────────────────────────────────────────
  if (data.education && data.education.length > 0) {
    sections.push(sectionHeading("Education"));
    for (const edu of data.education) {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: edu.degree || "", bold: true, size: 22 }),
            new TextRun({ text: edu.dates ? `   ${edu.dates}` : "", size: 20, color: "8b5cf6" }),
          ],
          spacing: { before: 80, after: 20 },
        })
      );
      if (edu.school) sections.push(plain(edu.school, { italic: true, color: "555555" }));
    }
    sections.push(hr());
  }

  // ── Skills ───────────────────────────────────────────────
  if (data.skills && data.skills.length > 0) {
    sections.push(sectionHeading("Skills"));
    sections.push(plain(data.skills.join(" · "), { size: 20 }));
    sections.push(hr());
  }

  // ── Certifications ───────────────────────────────────────
  if (data.certifications && data.certifications.length > 0) {
    sections.push(sectionHeading("Certifications"));
    for (const cert of data.certifications) {
      sections.push(bullet(cert));
    }
    sections.push(hr());
  }

  // ── Projects ─────────────────────────────────────────────
  if (data.projects && data.projects.length > 0) {
    sections.push(sectionHeading("Projects"));
    for (const proj of data.projects) {
      sections.push(plain(proj.name || "", { bold: true, size: 21 }));
      if (proj.description) sections.push(plain(proj.description, { size: 19, color: "444444" }));
    }
  }

  const doc = new Document({
    creator: "ResumeLens",
    title: `${data.contact.name || "Resume"} — ${targetRole || "Resume"}`,
    description: "ATS-Optimized Resume generated by ResumeLens",
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 20, color: "1a1a1a" },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 900, bottom: 720, left: 900 },
          },
        },
        children: sections,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${(data.contact.name || "Resume").replace(/\s+/g, "_")}-${(targetRole || "Resume").replace(/\s+/g, "_")}.docx`;
  saveAs(blob, filename);
}
