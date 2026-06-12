"use client";

import { useState, useEffect, useRef } from "react";
import { type EvaluateResponse } from "@/lib/ai";

interface Props {
  questions: string[];
  resumeText: string;
  jobDescription?: string;
  onClose: () => void;
}

interface QuestionSession {
  question: string;
  answer: string;
  evaluation: EvaluateResponse | null;
}

const FILLER_WORDS = ["um", "uh", "like", "so", "actually", "basically", "you know"];

export default function MockInterviewBoard({
  questions,
  resumeText,
  jobDescription = "",
  onClose,
}: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessions, setSessions] = useState<QuestionSession[]>(
    questions.map((q) => ({ question: q, answer: "", evaluation: null }))
  );
  
  const [answerText, setAnswerText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isSupportedSpeech, setIsSupportedSpeech] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const currentSession = sessions[currentIdx];
  const isFinished = currentIdx >= sessions.length;

  // ── Speech Recognition Setup ─────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        setIsSupportedSpeech(true);
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            }
          }
          if (finalTranscript) {
            setAnswerText((prev) => {
              const cleanPrev = prev.trim();
              return cleanPrev ? `${cleanPrev} ${finalTranscript.trim()}` : finalTranscript.trim();
            });
          }
        };

        rec.onerror = (err: any) => {
          console.error("Speech recognition error:", err);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // ── Speech Synthesis: Read Question ───────────────────────
  useEffect(() => {
    if (isFinished || isMuted || typeof window === "undefined" || !window.speechSynthesis) return;

    // Speak the question out loud
    window.speechSynthesis.cancel();
    const questionText = questions[currentIdx];
    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.rate = 1.0;
    
    // Attempt to find a standard English voice
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(v => v.lang.startsWith("en-") && v.name.toLowerCase().includes("natural")) ||
                    voices.find(v => v.lang.startsWith("en-"));
    if (enVoice) utterance.voice = enVoice;

    window.speechSynthesis.speak(utterance);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [currentIdx, isFinished, isMuted, questions]);

  const handleReplay = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(questions[currentIdx]);
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // ── Toggle Mic Recording ──────────────────────────────────
  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  // ── Submit Current Answer for Evaluation ──────────────────
  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) return;

    setIsEvaluating(true);
    setEvalError(null);

    // Stop recording if active
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    try {
      const res = await fetch("/api/interviews/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          question: currentSession.question,
          answer: answerText.trim(),
          jobDescription: jobDescription || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Evaluation failed");
      }

      setSessions((prev) =>
        prev.map((s, idx) =>
          idx === currentIdx
            ? { ...s, answer: answerText.trim(), evaluation: data.evaluation }
            : s
        )
      );
    } catch (err: any) {
      console.error(err);
      setEvalError(err.message || "An error occurred during evaluation.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    setAnswerText("");
    setEvalError(null);
    setCurrentIdx((prev) => prev + 1);
  };

  // ── Session Metrics Computations ──────────────────────────
  const getSessionSummary = () => {
    let totalScore = 0;
    let starCount = 0;
    let textAggregate = "";

    sessions.forEach((s) => {
      if (s.evaluation) {
        totalScore += s.evaluation.score;
        if (s.evaluation.starRating.situation) starCount++;
        if (s.evaluation.starRating.task) starCount++;
        if (s.evaluation.starRating.action) starCount++;
        if (s.evaluation.starRating.result) starCount++;
      }
      textAggregate += " " + s.answer.toLowerCase();
    });

    const averageScore = sessions.length ? Math.round((totalScore / sessions.length) * 10) : 0; // scale to 100
    
    // Count fillers
    const fillerCounts: Record<string, number> = {};
    FILLER_WORDS.forEach((word) => {
      // Escape for regex matching
      const regex = new RegExp(`\\b${word}\\b`, "g");
      const matches = textAggregate.match(regex);
      fillerCounts[word] = matches ? matches.length : 0;
    });

    return {
      averageScore,
      starPercent: sessions.length ? Math.round((starCount / (sessions.length * 4)) * 100) : 0,
      fillerCounts,
    };
  };

  const summary = isFinished ? getSessionSummary() : null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(10, 10, 12, 0.95)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        overflowY: "auto",
        backdropFilter: "blur(12px)",
        color: "#f3f4f6",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 760,
          background: "#121216",
          border: "1px solid #23232a",
          borderRadius: 16,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          padding: 32,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          maxHeight: "90vh",
          overflowY: "auto",
          fontFamily: "Instrument Sans, sans-serif",
        }}
      >
        {/* Style injection for speech animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes pulseRecord {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
          @keyframes bounceBar {
            0%, 100% { transform: scaleY(0.3); }
            50% { transform: scaleY(1); }
          }
          .visualizer-bar {
            width: 3px;
            height: 24px;
            background-color: #ef4444;
            border-radius: 99px;
            transform-origin: bottom;
          }
        `}} />

        {/* ── Active Interview Panel ──────────────────────────── */}
        {!isFinished ? (
          <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    padding: "3px 8px",
                    background: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#a5b4fc",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  Live Interview Simulator 🎙️
                </span>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>
                  Question {currentIdx + 1} of {questions.length}
                </span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#9ca3af",
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                  title={isMuted ? "Unmute TTS Reader" : "Mute TTS Reader"}
                >
                  {isMuted ? "🔇" : "🔊"}
                </button>
                <button
                  onClick={onClose}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#9ca3af",
                    cursor: "pointer",
                    fontSize: 18,
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Question Card */}
            <div
              style={{
                background: "linear-gradient(135deg, #181822 0%, #13131a 100%)",
                border: "1.5px solid #282836",
                borderRadius: 12,
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#ffffff", lineHeight: 1.5, margin: 0 }}>
                  {currentSession.question}
                </h3>
                <button
                  onClick={handleReplay}
                  style={{
                    background: "#282836",
                    color: "#a5b4fc",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  🔊 Replay
                </button>
              </div>
            </div>

            {/* Answer & Recording Section */}
            {!currentSession.evaluation ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Your Response
                  </label>
                  {isSupportedSpeech && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isRecording && (
                        <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 24, paddingRight: 6 }}>
                          <div className="visualizer-bar" style={{ animation: "bounceBar 0.8s ease-in-out infinite alternate" }} />
                          <div className="visualizer-bar" style={{ animation: "bounceBar 0.5s ease-in-out infinite alternate 0.2s" }} />
                          <div className="visualizer-bar" style={{ animation: "bounceBar 0.9s ease-in-out infinite alternate 0.4s" }} />
                          <div className="visualizer-bar" style={{ animation: "bounceBar 0.6s ease-in-out infinite alternate 0.1s" }} />
                        </div>
                      )}
                      <button
                        onClick={toggleRecording}
                        style={{
                          background: isRecording ? "#ef4444" : "rgba(239, 68, 68, 0.15)",
                          color: isRecording ? "#ffffff" : "#f87171",
                          border: `1px solid ${isRecording ? "#ef4444" : "rgba(239, 68, 68, 0.3)"}`,
                          borderRadius: 8,
                          padding: "6px 14px",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          animation: isRecording ? "pulseRecord 1.5s infinite" : "none",
                        }}
                      >
                        {isRecording ? "🔴 Stop Recording" : "🎙️ Speak Answer"}
                      </button>
                    </div>
                  )}
                </div>

                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Click 'Speak Answer' to talk or type your answer directly here. Be specific, structure with the STAR method, and refer to experiences from your resume."
                  style={{
                    width: "100%",
                    minHeight: 140,
                    background: "#181822",
                    border: "1px solid #2c2c38",
                    borderRadius: 8,
                    padding: 14,
                    fontSize: 14,
                    color: "#f3f4f6",
                    outline: "none",
                    resize: "vertical",
                    lineHeight: 1.6,
                    boxSizing: "border-box",
                  }}
                />

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={isEvaluating || !answerText.trim()}
                    style={{
                      background: isEvaluating || !answerText.trim() ? "#2d2d38" : "linear-gradient(135deg, #8b5cf6, #6366f1)",
                      color: isEvaluating || !answerText.trim() ? "#6b7280" : "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 28px",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isEvaluating || !answerText.trim() ? "not-allowed" : "pointer",
                    }}
                  >
                    {isEvaluating ? "Hiring Manager is evaluating..." : "Submit Answer & Grade ➔"}
                  </button>
                </div>
                {evalError && (
                  <div style={{ color: "#f87171", fontSize: 13, textAlign: "center", marginTop: 8 }}>
                    ⚠ {evalError}
                  </div>
                )}
              </div>
            ) : (
              /* Question Grading Scorecard */
              <div
                style={{
                  background: "#171720",
                  border: "1px solid #282836",
                  borderRadius: 12,
                  padding: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                  animation: "fadeIn 0.3s ease",
                }}
              >
                {/* Score and STAR row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                    borderBottom: "1px solid #282836",
                    paddingBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        background: "rgba(99, 102, 241, 0.15)",
                        border: "2px solid #6366f1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 20,
                        fontWeight: 800,
                        color: "#a5b4fc",
                      }}
                    >
                      {currentSession.evaluation.score}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                        AI Scorecard
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>
                        Graded on structure & alignment
                      </div>
                    </div>
                  </div>

                  {/* STAR Checklist */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { key: "situation", label: "S" },
                      { key: "task", label: "T" },
                      { key: "action", label: "A" },
                      { key: "result", label: "R" },
                    ].map((star) => {
                      const completed = (currentSession.evaluation!.starRating as any)[star.key];
                      return (
                        <div
                          key={star.key}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: completed ? "rgba(16, 185, 129, 0.15)" : "#23232a",
                            border: `1.5px solid ${completed ? "#10b981" : "#374151"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 700,
                            color: completed ? "#34d399" : "#6b7280",
                          }}
                          title={`${star.label}: ${star.key.toUpperCase()} ${completed ? "detected" : "missing"}`}
                        >
                          {star.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, fontWeight: 600 }}>
                    Coach Feedback
                  </div>
                  <p style={{ fontSize: 13.5, color: "#d1d5db", lineHeight: 1.6, margin: 0 }}>
                    {currentSession.evaluation.feedback}
                  </p>
                </div>

                {/* Sample Strong Answer */}
                <div>
                  <div style={{ fontSize: 11, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, fontWeight: 600 }}>
                    How to say it (Optimized Answer)
                  </div>
                  <p style={{ fontSize: 13, color: "#34d399", background: "rgba(52, 211, 153, 0.05)", border: "1px dashed rgba(52, 211, 153, 0.25)", borderRadius: 8, padding: 12, lineHeight: 1.55, margin: 0, fontStyle: "italic" }}>
                    "{currentSession.evaluation.sampleAnswer}"
                  </p>
                </div>

                {/* Footer action */}
                <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #282836", paddingTop: 16 }}>
                  <button
                    onClick={handleNextQuestion}
                    style={{
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "white",
                      border: "none",
                      borderRadius: 8,
                      padding: "10px 24px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {currentIdx + 1 === questions.length ? "Finish Simulator 🏁" : "Next Question ➜"}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── Final Summary Dashboard ───────────────────────── */
          <>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #23232a", paddingBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0 }}>
                  Interview Performance Summary
                </h2>
                <p style={{ fontSize: 13, color: "#9ca3af", margin: "4px 0 0 0" }}>
                  Great job completing the mock session! Review your stats and transcripts below.
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#9ca3af",
                  cursor: "pointer",
                  fontSize: 22,
                }}
              >
                ✕
              </button>
            </div>

            {/* Scorecard row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              {/* Avg Score */}
              <div
                style={{
                  background: "#181822",
                  border: "1px solid #282836",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  Overall Match Score
                </div>
                <div style={{ fontSize: 48, fontWeight: 800, color: "#a5b4fc", lineHeight: 1 }}>
                  {summary?.averageScore}%
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  Hiring Bar Target: 80%+
                </div>
              </div>

              {/* STAR Utilization */}
              <div
                style={{
                  background: "#181822",
                  border: "1px solid #282836",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>
                  STAR Mastery
                </div>
                <div style={{ fontSize: 48, fontWeight: 800, color: "#34d399", lineHeight: 1 }}>
                  {summary?.starPercent}%
                </div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>
                  Bullets incorporating STAR details
                </div>
              </div>

              {/* Filler Words */}
              <div
                style={{
                  background: "#181822",
                  border: "1px solid #282836",
                  borderRadius: 12,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 12, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, textAlign: "center" }}>
                  Filler Word Usage
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {summary && Object.entries(summary.fillerCounts).map(([word, count]) => (
                    <div key={word} style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#9ca3af" }}>"{word}"</span>
                      <span style={{ fontWeight: 700, color: count > 2 ? "#f87171" : "#34d399" }}>
                        {count} {count === 1 ? "time" : "times"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Complete Q&A Transcript */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", margin: "12px 0 0 0" }}>
                Complete Q&A Transcript
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 280, overflowY: "auto", paddingRight: 6 }}>
                {sessions.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#15151b",
                      border: "1px solid #23232c",
                      borderRadius: 8,
                      padding: 16,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc", marginBottom: 6 }}>
                      Q{idx + 1}: {s.question}
                    </div>
                    <div style={{ fontSize: 12.5, color: "#d1d5db", background: "#1b1b24", padding: 10, borderRadius: 6, marginBottom: 8, border: "1px solid #23232d", whiteSpace: "pre-wrap" }}>
                      <strong>Your Answer:</strong> "{s.answer}"
                    </div>
                    {s.evaluation && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#9ca3af" }}>
                        <div>
                          <strong>Score:</strong> <span style={{ color: "#a5b4fc", fontWeight: 700 }}>{s.evaluation.score}/10</span> | <strong>Feedback:</strong> {s.evaluation.feedback}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #23232a", paddingTop: 16 }}>
              <button
                onClick={onClose}
                style={{
                  background: "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  padding: "12px 28px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Close Simulator ✕
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
