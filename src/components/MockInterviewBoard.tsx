"use client";
import { logger } from "@/lib/logger";

import { useState, useEffect, useRef } from "react";
import SpotlightCard from "./SpotlightCard";
import AudioSpectrumVisualizer from "./AudioSpectrumVisualizer";
import { type EvaluateResponse } from "@/lib/ai";
import StreamingText from "@/components/StreamingText";
import InterviewSummary from "./InterviewSummary";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Square,
  AlertTriangle,
  ArrowRight,
  Flag,
  ChevronRight,
} from "lucide-react";

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

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
  const [isFlashcardFlipped, setIsFlashcardFlipped] = useState(false);
  const [sessions, setSessions] = useState<QuestionSession[]>(
    questions.map((q) => ({ question: q, answer: "", evaluation: null }))
  );

  const [answerText, setAnswerText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isSupportedSpeech, setIsSupportedSpeech] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentSession = sessions[currentIdx];
  const isFinished = currentIdx >= sessions.length;

  // ── Speech Recognition Setup ─────────────────────────────
  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as WindowWithSpeechRecognition;
      const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;

      if (SpeechRecognitionAPI) {
        setIsSupportedSpeech(true);
        const rec = new SpeechRecognitionAPI();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: SpeechRecognitionEvent) => {
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

        rec.onerror = (err: SpeechRecognitionErrorEvent) => {
          logger.error("Speech recognition error:", { error: err.error });
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
    const enVoice =
      voices.find((v) => v.lang.startsWith("en-") && v.name.toLowerCase().includes("natural")) ||
      voices.find((v) => v.lang.startsWith("en-"));
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
  const toggleRecording = async () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        // Explicitly request mic permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        recognitionRef.current.start();
      } catch (err) {
        logger.error("Microphone permission denied:", err);
        setEvalError(
          "Microphone access was denied. Please allow microphone access in your browser settings and try again."
        );
      }
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
          idx === currentIdx ? { ...s, answer: answerText.trim(), evaluation: data.evaluation } : s
        )
      );
    } catch (err: unknown) {
      logger.error("Answer evaluation error:", err);
      setEvalError((err as Error).message || "An error occurred during evaluation.");
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
        padding: 12,
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
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          maxHeight: "90vh",
          overflowY: "auto",
          fontFamily: "Instrument Sans, sans-serif",
        }}
        className="sm:[padding:32px] sm:[gap:24px]"
      >
        {/* Style injection for speech animations */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
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
        `,
          }}
        />

        {/* ── Active Interview Panel ──────────────────────────── */}
        {!isFinished ? (
          <>
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
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
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Mic size={11} />
                  Live Interview Simulator
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
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={isMuted ? "Unmute TTS Reader" : "Mute TTS Reader"}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <button
                  onClick={onClose}
                  aria-label="Close interview panel"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#9ca3af",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Question Card */}
            <SpotlightCard
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
              <div
                style={{
                  display: "flex",
                  justifyItems: "center",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#ffffff",
                    lineHeight: 1.5,
                    margin: 0,
                    flex: 1,
                  }}
                >
                  {currentSession.question}
                </h3>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => setIsFlashcardFlipped(!isFlashcardFlipped)}
                    style={{
                      background: isFlashcardFlipped ? "rgba(139,92,246,0.25)" : "#282836",
                      color: isFlashcardFlipped ? "#c084fc" : "#a5b4fc",
                      border: "1px solid rgba(165,180,252,0.3)",
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
                    <span>{isFlashcardFlipped ? "Show Question" : "Flip STAR Tips 🎴"}</span>
                  </button>
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
                    <RotateCcw size={11} />
                    <span>Replay</span>
                  </button>
                </div>
              </div>

              {isFlashcardFlipped && (
                <div
                  style={{
                    background: "rgba(139,92,246,0.1)",
                    borderLeft: "3px solid #8b5cf6",
                    padding: "12px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#d8b4fe",
                    lineHeight: 1.6,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4, color: "#e9d5ff" }}>
                    💡 STAR Technique Study Flashcard:
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <li>
                      <strong>Situation:</strong> Set the context of your project or technical
                      challenge.
                    </li>
                    <li>
                      <strong>Task:</strong> State your specific goal or constraint.
                    </li>
                    <li>
                      <strong>Action:</strong> Detail the technologies (React, Node, SQL) and steps
                      you took.
                    </li>
                    <li>
                      <strong>Result:</strong> Share measurable outcomes (% speedup, users, scale).
                    </li>
                  </ul>
                </div>
              )}
            </SpotlightCard>

            {/* Answer & Recording Section */}
            {!currentSession.evaluation ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyItems: "center",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Your Response
                  </label>
                  {isSupportedSpeech && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isRecording && (
                        <div
                          style={{
                            display: "flex",
                            gap: 3,
                            alignItems: "flex-end",
                            height: 24,
                            paddingRight: 6,
                          }}
                        >
                          <div
                            className="visualizer-bar"
                            style={{ animation: "bounceBar 0.8s ease-in-out infinite alternate" }}
                          />
                          <div
                            className="visualizer-bar"
                            style={{
                              animation: "bounceBar 0.5s ease-in-out infinite alternate 0.2s",
                            }}
                          />
                          <div
                            className="visualizer-bar"
                            style={{
                              animation: "bounceBar 0.9s ease-in-out infinite alternate 0.4s",
                            }}
                          />
                          <div
                            className="visualizer-bar"
                            style={{
                              animation: "bounceBar 0.6s ease-in-out infinite alternate 0.1s",
                            }}
                          />
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
                        {isRecording ? (
                          <>
                            <Square size={11} />
                            <span>Stop Recording</span>
                          </>
                        ) : (
                          <>
                            <Mic size={11} />
                            <span>Speak Answer</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <AudioSpectrumVisualizer isRecording={isRecording} transcriptText={answerText} />

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
                      background:
                        isEvaluating || !answerText.trim()
                          ? "#2d2d38"
                          : "linear-gradient(135deg, #8b5cf6, #6366f1)",
                      color: isEvaluating || !answerText.trim() ? "#6b7280" : "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 28px",
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isEvaluating || !answerText.trim() ? "not-allowed" : "pointer",
                      width: "100%",
                      minHeight: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    {isEvaluating ? (
                      "Hiring Manager is evaluating..."
                    ) : (
                      <>
                        <span>Submit Answer & Grade</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
                {evalError && (
                  <div
                    style={{
                      color: "#f87171",
                      fontSize: 13,
                      textAlign: "center",
                      marginTop: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 5,
                    }}
                  >
                    <AlertTriangle size={13} />
                    <span>{evalError}</span>
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
                      const completed = (
                        currentSession.evaluation!.starRating as Record<string, boolean>
                      )[star.key];
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
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    Coach Feedback
                  </div>
                  <StreamingText
                    text={currentSession.evaluation.feedback}
                    isStreaming={false}
                    style={{ fontSize: "13.5px", color: "#d1d5db", lineHeight: "1.6" }}
                  />
                </div>

                {/* Sample Strong Answer */}
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 6,
                      fontWeight: 600,
                    }}
                  >
                    How to say it (Optimized Answer)
                  </div>
                  <div
                    style={{
                      background: "rgba(52, 211, 153, 0.05)",
                      border: "1px dashed rgba(52, 211, 153, 0.25)",
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <StreamingText
                      text={`"${currentSession.evaluation.sampleAnswer}"`}
                      isStreaming={false}
                      style={{
                        fontSize: "13px",
                        color: "#34d399",
                        fontStyle: "italic",
                        lineHeight: "1.55",
                      }}
                    />
                  </div>
                </div>

                {/* Footer action */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    borderTop: "1px solid #282836",
                    paddingTop: 16,
                  }}
                >
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
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {currentIdx + 1 === questions.length ? (
                      <>
                        <span>Finish Simulator</span>
                        <Flag size={13} />
                      </>
                    ) : (
                      <>
                        <span>Next Question</span>
                        <ChevronRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <InterviewSummary sessions={sessions} summary={summary} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
