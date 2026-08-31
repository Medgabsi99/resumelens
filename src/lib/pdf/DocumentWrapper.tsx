import React from "react";
import { Document, Page, Font } from "@react-pdf/renderer";

// ── Disable hyphenation — prevents broken French/technical words in PDF ────────
Font.registerHyphenationCallback((word) => [word]);

// ── Inter (default sans-serif) ────────────────────────────────────────────────
Font.register({
  family: "Inter",
  fonts: [
    { src: "/fonts/inter-regular.ttf", fontWeight: 400 },
    { src: "/fonts/inter-bold.ttf", fontWeight: 700 },
  ],
});

// ── Lora (serif) ──────────────────────────────────────────────────────────────
Font.register({
  family: "Lora",
  fonts: [
    { src: "/fonts/lora-regular.ttf", fontWeight: 400 },
    { src: "/fonts/lora-bold.ttf", fontWeight: 700 },
    { src: "/fonts/lora-italic.ttf", fontWeight: 400, fontStyle: "italic" },
  ],
});

// ── Montserrat — proper static WOFF latin subset (pdfkit-compatible) ─────────
Font.register({
  family: "Montserrat",
  fonts: [
    { src: "/fonts/montserrat-regular.woff", fontWeight: 400 },
    { src: "/fonts/montserrat-bold.woff", fontWeight: 700 },
  ],
});

// ── Sans-serif aliases → Inter ────────────────────────────────────────────────
for (const alias of [
  "Roboto",
  "Open Sans",
  "Source Sans Pro",
  "Nunito",
  "Poppins",
  "Raleway",
  "Calibri",
  "Arial",
  "Helvetica",
]) {
  Font.register({
    family: alias,
    fonts: [
      { src: "/fonts/inter-regular.ttf", fontWeight: 400 },
      { src: "/fonts/inter-bold.ttf", fontWeight: 700 },
    ],
  });
}

// ── Serif aliases → Lora ──────────────────────────────────────────────────────
for (const alias of [
  "Georgia",
  "Playfair Display",
  "Merriweather",
  "EB Garamond",
  "Times New Roman",
  "Garamond",
  "Palatino",
]) {
  Font.register({
    family: alias,
    fonts: [
      { src: "/fonts/lora-regular.ttf", fontWeight: 400 },
      { src: "/fonts/lora-bold.ttf", fontWeight: 700 },
    ],
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  children?: React.ReactNode;
  title?: string;
  backgroundColor?: string;
}

export default function DocumentWrapper({ children, title, backgroundColor = "#ffffff" }: Props) {
  return (
    <Document title={title || "Resume"}>
      <Page
        size="A4"
        style={{
          padding: "14mm 18mm",
          backgroundColor,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </Page>
    </Document>
  );
}
