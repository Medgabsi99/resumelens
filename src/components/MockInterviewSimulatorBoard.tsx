"use client";

import { useState, useEffect, useRef } from "react";
import { type MockInterviewTranscriptEntry, type MockInterviewScorecard } from "@/lib/ai";
import ConfettiCannon from "@/components/ConfettiCannon";

interface Props {
  questions: string[];
  resumeText: string;
  jobDescription?: string;
  roleTitle: string;
  companyName: string;
  interviewType: string;
  difficulty: string;
  onClose: () => void;
}

const FILLER_WORDS = ["um", "uh", "like", "so", "actually", "basically", "you know"];

export default function MockInterviewSimulatorBoard({
  questions,
  resumeText,
  jobDescription = "",
  roleTitle,
  companyName,
  interviewType,
  difficulty,
  onClose,
}: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [transcripts, setTranscripts] = useState<MockInterviewTranscriptEntry[]>([]);
  const [answerText, setAnswerText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalError, setEvalError] = useState<string | null>(null);
  
  // Voice toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isSupportedSpeech, setIsSupportedSpeech] = useState(false);
  
  // Live coach trigger
  const [showHint, setShowHint] = useState(false);

  // Scorecard state
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ savedInDb: boolean; dbError?: string | null } | null>(null);
  const [scorecard, setScorecard] = useState<MockInterviewScorecard | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);

  const recognitionRef = useRef<any>(null);
  const isFinished = currentIdx >= questions.length;

  // ── Live Pacing & Metrics ────────────────────────────────
  const wordsCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;
  // Dynamic WPM rating (assuming standard speaking rate or simulated pacing indicator)
  const estimatedWpm = Math.round(wordsCount * 1.35); // simulated scale based on word density

  const getPacingRating = (wpm: number) => {
    if (wpm === 0) return "Not speaking yet";
    if (wpm < 85) return "Too Slow (Target: 95-140 WPM)";
    if (wpm > 145) return "Too Fast (Target: 95-140 WPM)";
    return "Ideal speaking pace";
  };

  const getPacingColor = (wpm: number) => {
    if (wpm === 0) return "text-ink-muted";
    if (wpm < 85 || wpm > 145) return "text-amber-400";
    return "text-emerald-400";
  };

  // Real-time counting of local filler words in current text area
  const currentFillerCounts = FILLER_WORDS.reduce((acc, word) => {
    const cleanAnswer = answerText.toLowerCase();
    const regex = new RegExp(`\\b${word}\\b`, "g");
    const matches = cleanAnswer.match(regex);
    acc[word] = matches ? matches.length : 0;
    return acc;
  }, {} as Record<string, number>);

  const totalCurrentFillers = Object.values(currentFillerCounts).reduce((a, b) => a + b, 0);

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

    window.speechSynthesis.cancel();
    const questionText = questions[currentIdx];
    const utterance = new SpeechSynthesisUtterance(questionText);
    utterance.rate = 1.05;
    
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
    utterance.rate = 1.05;
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
    setShowHint(false);

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
          question: questions[currentIdx],
          answer: answerText.trim(),
          jobDescription: jobDescription || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Evaluation failed");
      }

      const turnResult: MockInterviewTranscriptEntry = {
        question: questions[currentIdx],
        answer: answerText.trim(),
        score: data.evaluation.score,
        feedback: data.evaluation.feedback,
        starRating: data.evaluation.starRating,
        sampleAnswer: data.evaluation.sampleAnswer,
      };

      setTranscripts((prev) => [...prev, turnResult]);
      
      // Clear output text area and advance questions index
      setAnswerText("");
      setCurrentIdx((prev) => prev + 1);
    } catch (err: any) {
      console.error(err);
      setEvalError(err.message || "An error occurred during response grading.");
    } finally {
      setIsEvaluating(false);
    }
  };

  // ── Final Evaluation Compile & Save ───────────────────────
  useEffect(() => {
    if (isFinished && transcripts.length === questions.length && !scorecard) {
      triggerFinalScorecardCompilation();
    }
  }, [isFinished, transcripts]);

  const triggerFinalScorecardCompilation = async () => {
    setIsSaving(true);
    try {
      const saveRes = await fetch("/api/interviews/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleTitle,
          companyName,
          interviewType,
          difficulty,
          questions,
          transcripts,
        }),
      });

      const data = await saveRes.json();
      if (!saveRes.ok || !data.success) {
        throw new Error(data.error || "Compilation failed");
      }

      setScorecard(data.scorecard);
      // Fire confetti on milestone interview score
      if (data.scorecard?.overallScore >= 80) {
        setConfettiKey((k) => k + 1);
      }
      setSaveResult({
        savedInDb: data.savedInDb,
        dbError: data.dbError,
      });

      if (!data.savedInDb) {
        saveToLocalStorage(data.scorecard, transcripts);
      }
    } catch (err: any) {
      console.error("Scorecard compilation error:", err);
      setEvalError(err.message || "Failed to finalize interview report.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveToLocalStorage = (scorecardData: MockInterviewScorecard, transcriptLogs: MockInterviewTranscriptEntry[]) => {
    try {
      const local = localStorage.getItem("mock_interviews_local");
      const localHistory = local ? JSON.parse(local) : [];
      
      // Calculate local aggregate filler word stats
      const textAggregate = transcriptLogs.map((t) => t.answer).join(" ").toLowerCase();
      const fillerWordsCounts: Record<string, number> = {};
      FILLER_WORDS.forEach((word) => {
        const regex = new RegExp(`\\b${word}\\b`, "g");
        const matches = textAggregate.match(regex);
        fillerWordsCounts[word] = matches ? matches.length : 0;
      });

      const newItem = {
        id: "local_" + Date.now(),
        role_title: roleTitle,
        company_name: companyName,
        interview_type: interviewType,
        difficulty,
        questions,
        transcripts: transcriptLogs,
        overall_score: scorecardData.overallScore,
        star_mastery: scorecardData.starMastery,
        filler_words: fillerWordsCounts,
        created_at: new Date().toISOString(),
      };
      
      localStorage.setItem("mock_interviews_local", JSON.stringify([newItem, ...localHistory]));
    } catch (e) {
      console.error("Failed to fallback save local interview:", e);
    }
  };

  // ── Render ────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 overflow-y-auto backdrop-blur-md font-sans text-slate-100"
      style={{
        background: "rgba(10, 10, 12, 0.96)",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulseMic {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes barBounce {
          0%, 100% { transform: scaleY(0.25); }
          50% { transform: scaleY(1); }
        }
        .mic-visualizer-bar {
          width: 3.5px;
          height: 22px;
          background-color: #f87171;
          border-radius: 9px;
          transform-origin: bottom;
        }
      `}} />

      <div
        className="w-full max-w-5xl bg-[#121216] border border-[#2c2c38] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Board Top Nav Header */}
        <div className="flex items-center justify-between border-b border-[#2c2c38] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
              AI Interview Coach 🎙️
            </span>
            <span className="text-sm text-ink-muted">
              {roleTitle} at <strong className="text-ink">{companyName}</strong>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-ink-muted hover:text-ink transition cursor-pointer text-lg"
              title={isMuted ? "Unmute Coach voice" : "Mute Coach voice"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
            <button
              onClick={onClose}
              className="text-ink-muted hover:text-ink border border-border/50 hover:border-accent-border px-3 py-1 rounded-xl text-xs transition cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Core Workspace Layout */}
        {!isFinished ? (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
            
            {/* Left Column: Chat Dialogue Simulator */}
            <div className="lg:col-span-2 flex flex-col p-6 overflow-y-auto border-r border-[#2c2c38]/50 space-y-6">
              
              {/* Question bubble block */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-sm text-indigo-300">
                    AI
                  </div>
                  <div>
                    <span className="text-xs text-ink-muted font-bold block uppercase tracking-wider">Interviewer</span>
                    <span className="text-[10px] text-indigo-400 font-semibold block">Question {currentIdx + 1} of {questions.length}</span>
                  </div>
                </div>

                <div className="bg-[#181822] border border-[#2a2a38] rounded-xl p-5 relative shadow-md">
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-base font-medium leading-relaxed text-slate-100 pr-10">
                      {questions[currentIdx]}
                    </p>
                    <button
                      onClick={handleReplay}
                      className="absolute right-4 top-4 bg-[#2c2c3c] hover:bg-[#343447] text-indigo-300 border border-indigo-500/20 rounded-lg px-2.5 py-1 text-xs cursor-pointer transition flex items-center gap-1"
                    >
                      🗣️ Replay
                    </button>
                  </div>
                </div>
              </div>

              {/* Response Feed Area */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-ink-muted font-bold uppercase tracking-wider">
                    Your Response
                  </span>
                  
                  {isSupportedSpeech && (
                    <div className="flex items-center gap-3">
                      {isRecording && (
                        <div className="flex items-end gap-1 px-2 pb-0.5 h-6">
                          <div className="mic-visualizer-bar" style={{ animation: "barBounce 0.7s ease-in-out infinite alternate" }} />
                          <div className="mic-visualizer-bar" style={{ animation: "barBounce 0.5s ease-in-out infinite alternate 0.15s" }} />
                          <div className="mic-visualizer-bar" style={{ animation: "barBounce 0.9s ease-in-out infinite alternate 0.3s" }} />
                          <div className="mic-visualizer-bar" style={{ animation: "barBounce 0.6s ease-in-out infinite alternate 0.1s" }} />
                        </div>
                      )}
                      <button
                        onClick={toggleRecording}
                        style={{ animation: isRecording ? "pulseMic 1.5s infinite" : "none" }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer border transition ${
                          isRecording 
                            ? "bg-rose-500 border-rose-500 text-white" 
                            : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                        }`}
                      >
                        {isRecording ? "🔴 Stop Recording" : "🎙️ Speak Response"}
                      </button>
                    </div>
                  )}
                </div>

                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Record or type your response here. Try to frame your response with Situation, Task, Action, and Results (STAR)."
                  className="w-full flex-1 min-h-[160px] bg-[#181822] border border-[#2a2a3a] rounded-xl p-4 text-sm text-slate-100 outline-none focus:border-indigo-500 transition resize-none leading-relaxed"
                />

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer flex items-center gap-1"
                  >
                    💡 Get Coach Hint
                  </button>

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={isEvaluating || !answerText.trim()}
                    className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-md ${
                      isEvaluating || !answerText.trim()
                        ? "bg-[#282836] text-ink-muted cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-500 to-indigo-600 hover:scale-[1.01] text-white"
                    }`}
                  >
                    {isEvaluating ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-indigo-400/20 border-t-indigo-400 rounded-full animate-spin" />
                        <span>Evaluating response...</span>
                      </>
                    ) : (
                      <span>Submit & Continue ➔</span>
                    )}
                  </button>
                </div>

                {showHint && (
                  <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 leading-relaxed font-mono">
                    💡 <strong>Coach Tip:</strong> Try to explain the <em>Context/Situation</em> clearly first. Detail what <em>Actions</em> you took specifically using the key tools, and state the final metric/outcome (<em>Result</em>)!
                  </div>
                )}

                {evalError && (
                  <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl text-xs text-rose-400">
                    ⚠️ {evalError}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Live Metrics Sidebar */}
            <div className="p-6 bg-[#181822]/50 space-y-6 overflow-y-auto">
              
              {/* Speaking Pacing */}
              <div className="bg-[#181822] border border-[#2c2c38] rounded-xl p-4 space-y-3.5 shadow-md">
                <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-border/50 pb-2 flex justify-between">
                  <span>Pacing Tracker</span>
                  <span className="text-[10px] text-indigo-400 lowercase">Live</span>
                </h4>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-ink-muted">Estimated Pacing</span>
                  <span className={`text-2xl font-bold font-mono ${getPacingColor(estimatedWpm)}`}>
                    {estimatedWpm} WPM
                  </span>
                </div>
                <div className="text-[11px] text-ink-muted bg-paper border border-border p-2 rounded-lg leading-relaxed">
                  📢 <strong>Status:</strong> {getPacingRating(estimatedWpm)}
                </div>
              </div>

              {/* Filler Words */}
              <div className="bg-[#181822] border border-[#2c2c38] rounded-xl p-4 space-y-3.5 shadow-md">
                <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-border/50 pb-2 flex justify-between">
                  <span>Filler Word Counts</span>
                  <span className="text-[10px] text-indigo-400 lowercase">Real-time</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {Object.entries(currentFillerCounts).map(([word, count]) => (
                    <div key={word} className="flex justify-between p-1.5 bg-[#121216] border border-border/50 rounded-lg">
                      <span className="text-ink-muted font-mono">"{word}"</span>
                      <span className={`font-extrabold ${count > 1 ? 'text-amber-400' : 'text-emerald-400'}`}>{count}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-border/20">
                  <span className="text-ink-muted">Total Fillers Used</span>
                  <span className={`font-bold ${totalCurrentFillers > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {totalCurrentFillers}
                  </span>
                </div>
              </div>

              {/* STAR Framework Indicators */}
              <div className="bg-[#181822] border border-[#2c2c38] rounded-xl p-4 space-y-3.5 shadow-md">
                <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider border-b border-border/50 pb-2">
                  STAR Structural Analysis
                </h4>
                <p className="text-[10px] text-ink-muted leading-relaxed">
                  These checklist indicators update dynamically after every turn evaluation, scanning for narrative elements.
                </p>
                <div className="space-y-2.5 pt-1">
                  {[
                    { key: "S", label: "Situation", desc: "Outlining background & context" },
                    { key: "T", label: "Task", desc: "Explaining direct goals & responsibilities" },
                    { key: "A", label: "Action", desc: "Describing concrete steps taken" },
                    { key: "R", label: "Result", desc: "Providing metrics & key outcomes" },
                  ].map((star) => {
                    // Count how many times this STAR component was hit in previous transcripts
                    const hitCount = transcripts.filter(t => {
                      if (star.key === "S") return t.starRating.situation;
                      if (star.key === "T") return t.starRating.task;
                      if (star.key === "A") return t.starRating.action;
                      return t.starRating.result;
                    }).length;

                    return (
                      <div key={star.key} className="flex items-center gap-3 text-xs">
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center font-bold border ${
                          hitCount > 0 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                            : "bg-[#121216] border-[#2c2c38] text-ink-muted"
                        }`}>
                          {star.key}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-ink block leading-none">{star.label}</span>
                          <span className="text-[9px] text-ink-muted truncate block mt-0.5">{star.desc}</span>
                        </div>
                        {hitCount > 0 && (
                          <span className="text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded">
                            {hitCount}x
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* ── Final Scorecard & Summary Dashboard ───────────────── */
          <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
            
            {isSaving ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
                <span className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <h3 className="font-display text-lg font-bold text-ink mt-2">Compiling final interview scorecard...</h3>
                <p className="text-xs text-ink-muted">Evaluating communication logs, filler word densities, and grading pacing curves...</p>
              </div>
            ) : scorecard ? (
              <div className="space-y-6 animate-fade-in">
                {confettiKey > 0 && (
                  <ConfettiCannon score={scorecard.overallScore} trigger={confettiKey % 2 === 1} />
                )}

                {/* Scorecard banner */}
                <div className="bg-gradient-to-r from-indigo-500/10 to-emerald-500/10 border border-indigo-500/20 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-lg">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
                      🏆 Session Scorecard Compiled!
                    </h2>
                    <p className="text-xs text-ink-muted mt-1.5 max-w-xl">
                      Your performance transcript has been evaluated by the AI Coach. Detailed breakdown of metrics, communication strengths, and structured suggestions are listed below.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-[#181822] border border-border p-4 rounded-xl flex flex-col items-center min-w-[90px] shadow-sm">
                      <span className="text-[9px] text-ink-faint font-bold uppercase tracking-wider">Overall Score</span>
                      <span className="text-3xl font-extrabold text-indigo-400 mt-1">{scorecard.overallScore}%</span>
                    </div>
                    <div className="bg-[#181822] border border-border p-4 rounded-xl flex flex-col items-center min-w-[90px] shadow-sm">
                      <span className="text-[9px] text-ink-faint font-bold uppercase tracking-wider">STAR Mastery</span>
                      <span className="text-3xl font-extrabold text-emerald-400 mt-1">{scorecard.starMastery}%</span>
                    </div>
                  </div>
                </div>

                {saveResult && !saveResult.savedInDb && (
                  <div className="px-4 py-2 text-xs rounded-xl bg-slate-500/5 border border-slate-500/20 text-slate-400 flex justify-between items-center">
                    <span>💡 Workspace logged locally (Local Storage fallback active).</span>
                    <span className="bg-slate-500/10 text-slate-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-slate-500/20">
                      LOCAL FALLBACK
                    </span>
                  </div>
                )}

                {/* Grid stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left Column: Sentiment & Pacing */}
                  <div className="bg-[#181822] border border-[#2c2c38] rounded-xl p-5 space-y-4 shadow-md">
                    <h3 className="font-display text-xs font-bold text-ink border-b border-border pb-2.5 uppercase tracking-wider">
                      Sentiment & Pacing Breakdown
                    </h3>
                    
                    <div className="space-y-4 text-xs">
                      <div>
                        <div className="flex justify-between text-ink-muted mb-1.5">
                          <span>Communication Confidence</span>
                          <span className="font-bold text-indigo-400">{scorecard.sentimentSummary.confidence}%</span>
                        </div>
                        <div className="w-full bg-[#121216] h-2 rounded-full overflow-hidden border border-border/30">
                          <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${scorecard.sentimentSummary.confidence}%` }} />
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-2.5 bg-[#121216] border border-border/50 rounded-lg">
                        <span className="text-ink-muted">Speaking Pacing</span>
                        <span className="font-bold text-ink uppercase">{scorecard.sentimentSummary.pacing}</span>
                      </div>

                      <div className="flex justify-between items-center p-2.5 bg-[#121216] border border-border/50 rounded-lg">
                        <span className="text-ink-muted">Filler Words Density</span>
                        <span className="font-bold text-ink uppercase">{scorecard.sentimentSummary.fillerWordsUsage}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle/Right Columns: Strengths & Weaknesses */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Strengths */}
                    <div className="bg-[#181822] border border-[#2c2c38] rounded-xl p-5 space-y-3 shadow-md">
                      <h3 className="font-display text-xs font-bold text-emerald-400 border-b border-emerald-500/20 pb-2.5 uppercase tracking-wider">
                        Communication Strengths
                      </h3>
                      <ul className="space-y-2.5 text-xs text-ink-muted list-disc pl-4 leading-relaxed">
                        {scorecard.strengths.map((str, i) => (
                          <li key={i}>{str}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Areas to Improve */}
                    <div className="bg-[#181822] border border-[#2c2c38] rounded-xl p-5 space-y-3 shadow-md">
                      <h3 className="font-display text-xs font-bold text-rose-400 border-b border-rose-500/20 pb-2.5 uppercase tracking-wider">
                        Areas to Improve
                      </h3>
                      <ul className="space-y-2.5 text-xs text-ink-muted list-disc pl-4 leading-relaxed">
                        {scorecard.weaknesses.map((wk, i) => (
                          <li key={i}>{wk}</li>
                        ))}
                      </ul>
                    </div>

                  </div>

                </div>

                {/* Coach evaluation note */}
                <div className="bg-[#181822] border border-[#2c2c38] rounded-xl p-5 space-y-2 shadow-md">
                  <h3 className="font-display text-xs font-bold text-ink border-b border-border pb-2.5 uppercase tracking-wider">
                    Coach General Evaluation
                  </h3>
                  <p className="text-xs text-ink-muted leading-relaxed font-mono bg-[#121216] border border-border/50 p-4 rounded-xl">
                    {scorecard.feedback}
                  </p>
                </div>

                {/* Detailed dialogue logs */}
                <div className="space-y-3.5">
                  <h3 className="font-display text-sm font-bold text-ink border-b border-[#2c2c38] pb-2">
                    Session Transcript & Turn-by-Turn Feedback
                  </h3>

                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1.5">
                    {transcripts.map((entry, idx) => (
                      <div key={idx} className="bg-[#181822] border border-[#2c2c38] rounded-xl p-5 space-y-3 shadow-sm">
                        <div className="text-xs font-bold text-indigo-400">
                          Q{idx + 1}: {entry.question}
                        </div>
                        <div className="text-xs text-ink-muted bg-[#121216] p-3 rounded-lg border border-border/50 leading-relaxed italic">
                          " {entry.answer} "
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#2c2c38]/50 pt-2.5 text-xs">
                          <div>
                            <span className="text-[10px] text-ink-faint font-bold block uppercase tracking-wider mb-1">Turn Feedback (Score: {entry.score}/10)</span>
                            <p className="text-ink-muted leading-relaxed">{entry.feedback}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-ink-faint font-bold block uppercase tracking-wider mb-1">Optimized Response Suggestion</span>
                            <p className="text-emerald-400 leading-relaxed italic">"{entry.sampleAnswer}"</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-ink-muted">
                ⚠️ Failed to load or compile session scorecard report.
              </div>
            )}

            {/* Scorecard Footer controls */}
            {!isSaving && scorecard && (
              <div className="border-t border-[#2c2c38] pt-4 flex justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:scale-[1.01] transition shadow cursor-pointer text-white"
                >
                  Close & View History Dashboard ✕
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
