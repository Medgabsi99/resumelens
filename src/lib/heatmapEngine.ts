export interface FixationPoint {
  id: string;
  xPercent: number;
  yPercent: number;
  intensity: number; // 0.0 to 1.0
  radiusPx: number;
  label: string;
  textSnippet: string;
  type: "header" | "metric" | "title" | "education" | "skill" | "body";
  sequenceOrder: number;
  durationMs: number;
}

export interface HeatmapAnalysis {
  fixations: FixationPoint[];
  scannabilityScore: number; // 0 to 100
  fPatternScore: number;     // 0 to 100
  metricVisibilityScore: number; // 0 to 100
  topAttractors: { title: string; reason: string; intensity: number }[];
  blindSpots: { title: string; snippet: string; recommendation: string }[];
  summary: string;
}

/**
 * Parses raw resume text and calculates realistic 6-second recruiter eye-tracking
 * fixation coordinates, gaze sequence path, and scannability metrics based on F-pattern scanning studies.
 */
export function calculateHeatmapData(resumeText: string): HeatmapAnalysis {
  if (!resumeText || !resumeText.trim()) {
    return {
      fixations: [],
      scannabilityScore: 0,
      fPatternScore: 0,
      metricVisibilityScore: 0,
      topAttractors: [],
      blindSpots: [],
      summary: "No text available to generate eye-tracking simulation.",
    };
  }

  const lines = resumeText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const fixations: FixationPoint[] = [];
  const topAttractors: { title: string; reason: string; intensity: number }[] = [];
  const blindSpots: { title: string; snippet: string; recommendation: string }[] = [];

  const totalLines = Math.max(lines.length, 1);

  let sequenceCount = 1;
  let hasContactFixation = false;
  let metricCount = 0;
  let topThirdMetrics = 0;

  lines.forEach((line, index) => {
    // Relative vertical position (5% to 90%)
    const yPercent = Math.min(92, Math.max(6, Math.round((index / totalLines) * 85 + 6)));
    const isTopThird = index < Math.ceil(totalLines * 0.35);

    // 1. Check for Name / Contact Header (Line 0 to 2)
    if (index < 3 && !hasContactFixation && line.length < 60) {
      fixations.push({
        id: `fix-${index}-header`,
        xPercent: 20,
        yPercent: Math.min(yPercent, 10),
        intensity: 0.95,
        radiusPx: 65,
        label: "Contact Header & Candidate Identity",
        textSnippet: line.slice(0, 45),
        type: "header",
        sequenceOrder: sequenceCount++,
        durationMs: 800,
      });
      hasContactFixation = true;
      topAttractors.push({
        title: "Candidate Header & Name",
        reason: "Recruiters immediately anchor eyes on top candidate identity and contact header.",
        intensity: 0.95,
      });
      return;
    }

    // 2. Check for Job Role Titles / Section Titles
    const isSectionHeader = /^(EXPERIENCE|WORK EXPERIENCE|EDUCATION|PROJECTS|SKILLS|SUMMARY|TECHNICAL SKILLS|PROFILE)/i.test(line);
    const isJobTitle = /(engineer|developer|manager|architect|consultant|designer|lead|director|specialist|analyst|administrator|intern)\b/i.test(line);

    if (isSectionHeader || (isJobTitle && line.length < 80)) {
      const intensity = isTopThird ? 0.90 : 0.75;
      fixations.push({
        id: `fix-${index}-title`,
        xPercent: isSectionHeader ? 15 : 25,
        yPercent,
        intensity,
        radiusPx: 55,
        label: isSectionHeader ? `Section: ${line}` : `Role Title: ${line.slice(0, 30)}`,
        textSnippet: line.slice(0, 50),
        type: "title",
        sequenceOrder: sequenceCount++,
        durationMs: 650,
      });

      if (isJobTitle && isTopThird && topAttractors.length < 3) {
        topAttractors.push({
          title: `Role Anchor: ${line.slice(0, 30)}`,
          reason: "Clear role titles in the upper section immediately confirm job target fit.",
          intensity,
        });
      }
      return;
    }

    // 3. Check for Quantitative Impact Metrics ($, %, numbers like 70%, 10x, $500k, 25+, 100k)
    const metricMatches = line.match(/(\$\d+[\d,.]*[kMb]?|\b\d+%\b|\b\d+x\b|\b\d+[\d,.]*\s*(k|M|B|users|clients|percent|reduction|growth|increase)\b)/gi);

    if (metricMatches && metricMatches.length > 0) {
      metricCount += metricMatches.length;
      if (isTopThird) topThirdMetrics += metricMatches.length;

      const intensity = isTopThird ? 0.88 : 0.72;
      fixations.push({
        id: `fix-${index}-metric`,
        xPercent: Math.min(65, Math.max(20, Math.round((line.indexOf(metricMatches[0]) / line.length) * 70 + 15))),
        yPercent,
        intensity,
        radiusPx: 50,
        label: `Quantified Achievement: ${metricMatches[0]}`,
        textSnippet: line.slice(0, 60),
        type: "metric",
        sequenceOrder: sequenceCount++,
        durationMs: 550,
      });

      if (!isTopThird && blindSpots.length < 2 && index > Math.ceil(totalLines * 0.6)) {
        blindSpots.push({
          title: `Low-Visibility Metric: "${metricMatches[0]}"`,
          snippet: line.slice(0, 60) + "...",
          recommendation: "Move this high-impact metric higher into the upper third of your Experience section so recruiters catch it during the initial 6-second scan.",
        });
      }
      return;
    }

    // 4. Check for Education / Degrees
    if (/(bachelor|master|phd|b\.s|m\.s|degree|university|college|diploma)\b/i.test(line)) {
      fixations.push({
        id: `fix-${index}-edu`,
        xPercent: 30,
        yPercent,
        intensity: 0.65,
        radiusPx: 45,
        label: "Education Credential",
        textSnippet: line.slice(0, 50),
        type: "education",
        sequenceOrder: sequenceCount++,
        durationMs: 400,
      });
      return;
    }

    // 5. Flag long, dense paragraphs (> 150 chars) without metrics as blind spot risks
    if (line.length > 150 && !metricMatches && blindSpots.length < 2) {
      blindSpots.push({
        title: "Dense Text Block (Low Eye Retention)",
        snippet: line.slice(0, 70) + "...",
        recommendation: "Break long paragraphs into bullet points starting with bold action verbs and quantified impact metrics.",
      });
    }
  });

  // Calculate Scores
  const totalFixations = fixations.length;
  const topThirdFixations = fixations.filter((f) => f.yPercent < 45).length;
  const fPatternScore = totalFixations > 0 ? Math.min(100, Math.round((topThirdFixations / totalFixations) * 115)) : 50;
  const metricVisibilityScore = Math.min(100, Math.round(metricCount * 18 + topThirdMetrics * 10));
  const scannabilityScore = Math.min(100, Math.max(35, Math.round(fPatternScore * 0.5 + metricVisibilityScore * 0.5)));

  if (topAttractors.length === 0 && fixations.length > 0) {
    topAttractors.push({
      title: "Initial Top Section",
      reason: "Recruiters start scanning from the top-left area.",
      intensity: 0.8,
    });
  }

  return {
    fixations: fixations.slice(0, 12),
    scannabilityScore,
    fPatternScore,
    metricVisibilityScore,
    topAttractors: topAttractors.slice(0, 3),
    blindSpots: blindSpots.slice(0, 2),
    summary:
      scannabilityScore >= 80
        ? "Excellent 6-second scannability! Key metrics and job titles align with natural recruiter F-pattern scanning."
        : scannabilityScore >= 60
        ? "Good layout scannability. Moving key metrics into the upper third will increase initial recruiter impact."
        : "Low 6-second scannability. Heavy text density and buried metrics prevent recruiters from quickly capturing your value.",
  };
}
