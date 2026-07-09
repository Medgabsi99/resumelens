import React from "react";
import { Document, Page, Font } from "@react-pdf/renderer";

// Register Google Fonts using direct stable gstatic TTF links
Font.register({
  family: "Inter",
  fonts: [
    {
      src: "/fonts/inter-regular.ttf",
      fontWeight: 400,
    },
    {
      src: "/fonts/inter-bold.ttf",
      fontWeight: 700,
    },
  ],
});

Font.register({
  family: "Lora",
  fonts: [
    {
      src: "/fonts/lora-regular.ttf",
      fontWeight: 400,
    },
    {
      src: "/fonts/lora-bold.ttf",
      fontWeight: 700,
    },
    {
      src: "/fonts/lora-italic.ttf",
      fontWeight: 400,
      fontStyle: "italic",
    },
  ],
});

interface Props {
  children?: React.ReactNode;
  title?: string;
  backgroundColor?: string;
}

export default function DocumentWrapper({
  children,
  title,
  backgroundColor = "#ffffff",
}: Props) {
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
