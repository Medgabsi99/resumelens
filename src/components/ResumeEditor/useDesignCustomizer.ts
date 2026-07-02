import { useState } from "react";
import { type ResumeCustomStyle } from "./types";

export function useDesignCustomizer() {
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customStyle, setCustomStyle] = useState<ResumeCustomStyle>({
    fontFamily: "serif",
    fontSize: "11pt",
    lineHeight: "1.6",
    padding: "56px 48px",
    primaryColor: "#1e3a8a",
  });

  return { showCustomizer, setShowCustomizer, customStyle, setCustomStyle };
}
