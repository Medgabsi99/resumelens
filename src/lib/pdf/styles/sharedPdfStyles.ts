import { StyleSheet } from "@react-pdf/renderer";

export const colors = {
  navy: "#1e3a8a",
  oxblood: "#7f1d1d",
  indigo: "#4f46e5",
  darkZinc: "#09090b",
  zinc: "#27272a",
  lightZinc: "#71717a",
  lightGray: "#e2e8f0",
  textDark: "#1a1a1a",
  textMuted: "#4b5563",
  backgroundLight: "#f8fafc",
  borderLight: "#e2e8f0",
};

export const sharedPdfStyles = StyleSheet.create({
  // General layout helpers
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  rowItemLeft: {
    flex: 1,
    paddingRight: 10,
  },
  rowItemRight: {
    textAlign: "right",
    flexShrink: 0,
  },
  // Bullet points
  bulletContainer: {
    flexDirection: "row",
    marginBottom: 4,
    paddingLeft: 8,
  },
  bulletDot: {
    width: 10,
    fontSize: 9,
    lineHeight: 1.4,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.4,
  },
});
