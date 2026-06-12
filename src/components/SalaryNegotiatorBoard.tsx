"use client";

import { useState, useEffect, useRef } from "react";
import { type NegotiationOffer, type NegotiationTurnResponse, type NegotiationScorecard } from "@/lib/ai";

interface Props {
  resumeText: string;
  roleTitle: string;
  companyName: string;
  scenario: string;
  initialOffer: NegotiationOffer;
  onClose: () => void;
  onSaveScorecard?: (scorecard: NegotiationScorecard, finalOffer: NegotiationOffer, verdict: string) => Promise<{ savedInDb: boolean; dbError: string | null }>;
}

interface Message {
  role: "user" | "recruiter";
  content: string;
}

export default function SalaryNegotiatorBoard({
  resumeText,
  roleTitle,
  companyName,
  scenario,
  initialOffer,
  onClose,
  onSaveScorecard,
}: Props) {
  const [messageHistory, setMessageHistory] = useState<Message[]>([
    {
      role: "recruiter",
      content: `Hello! I'm glad we could connect to discuss your compensation details for the ${roleTitle} position at ${companyName}. Based on our current budget, we'd like to extend an initial offer: a base salary of $${initialOffer.base.toLocaleString()} per year, a ${initialOffer.bonus}% target bonus, $${initialOffer.equity.toLocaleString()} in equity, and a sign-on bonus of $${initialOffer.signOn.toLocaleString()}. Let me know how this aligns with your expectations.`,
    },
  ]);

  const [currentOffer, setCurrentOffer] = useState<NegotiationOffer>({ ...initialOffer });
  const [sentiment, setSentiment] = useState<"open" | "impressed" | "resistant" | "offended">("open");
  const [leverage, setLeverage] = useState<number>(50);
  const [coachFeedback, setCoachFeedback] = useState<string>(
    "Keep your tone collaborative, professional, and confident. Try to anchor your numbers using achievements or market research from your resume."
  );
  
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isConcluded, setIsConcluded] = useState(false);
  const [verdict, setVerdict] = useState<"accepted" | "rejected" | "walk_away" | "ongoing">("ongoing");
  const [scorecard, setScorecard] = useState<NegotiationScorecard | null>(null);
  
  const [savingStatus, setSavingStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [savingError, setSavingError] = useState<string | null>(null);
  const [savedMethod, setSavedMethod] = useState<"db" | "local" | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageHistory, isSubmitting]);

  // Financial calculations
  const calculateTotalValue = (off: NegotiationOffer) => {
    return off.base + (off.base * (off.bonus / 100)) + off.equity + off.signOn;
  };

  const initialTotal = calculateTotalValue(initialOffer);
  const currentTotal = calculateTotalValue(currentOffer);
  const netGain = Math.max(0, currentTotal - initialTotal);

  // Conclude negotiation flow
  const handleConcludeNegotiation = async (finalVerdict: "accepted" | "rejected" | "walk_away", finalPkg?: NegotiationOffer) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSavingStatus("saving");

    const resolvedPkg = finalPkg || currentOffer;
    const historyForEvaluation = [...messageHistory];
    
    // Add local closure text in chat feed
    let userCloseText = "";
    let recruiterCloseText = "";
    
    if (finalVerdict === "accepted") {
      userCloseText = "I accept this package. Thank you! I am looking forward to joining the team.";
      recruiterCloseText = "Fantastic! We are absolutely thrilled to welcome you on board. We will send over the formal paperwork shortly.";
    } else if (finalVerdict === "rejected") {
      userCloseText = "Unfortunately, I must decline this package. I appreciate the offer but the compensation does not match my expectations.";
      recruiterCloseText = "I understand. We are sorry we couldn't make this work. We wish you the best in your search.";
    } else {
      userCloseText = "[Walked Away]";
      recruiterCloseText = "Since we cannot bridge the gap on expectations, we will go ahead and withdraw our offer. Thank you for your time.";
    }

    const updatedHistory = [
      ...messageHistory,
      { role: "user", content: userCloseText } as Message,
      { role: "recruiter", content: recruiterCloseText } as Message
    ];

    setMessageHistory(updatedHistory);
    setIsConcluded(true);
    setVerdict(finalVerdict);

    try {
      // 1. Fetch scorecard from AI endpoint
      const res = await fetch("/api/negotiation/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          roleTitle,
          companyName,
          scenario,
          initialOffer,
          finalOffer: resolvedPkg,
          messageHistory: updatedHistory,
          verdict: finalVerdict,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to compile scorecard");
      }

      setScorecard(data.scorecard);

      // Check DB save status
      if (data.savedInDb) {
        setSavingStatus("saved");
        setSavedMethod("db");
      } else {
        // Fallback to local storage
        saveToLocalStorage(data.scorecard, resolvedPkg, finalVerdict);
        setSavingStatus("saved");
        setSavedMethod("local");
      }
    } catch (err: any) {
      console.error("Scorecard evaluation error:", err);
      // Local evaluation fallback if network/API dies
      const mockScorecard: NegotiationScorecard = {
        score: finalVerdict === "accepted" ? Math.min(100, Math.round(leverage)) : 40,
        tacticsUsed: ["Polite Advocacy", "Package Structuring"],
        strengths: ["Highlighted interest in team collaboration.", "Advocated for personal compensation value."],
        weaknesses: ["Could have cited more hard metrics from achievements."],
        financialGain: netGain,
        coachesNote: "The simulator encountered a network error compiling detailed AI metrics, but your mock session has been logged locally. Practice anchoring your values around concrete projects next time!",
      };
      
      setScorecard(mockScorecard);
      saveToLocalStorage(mockScorecard, resolvedPkg, finalVerdict);
      setSavingStatus("saved");
      setSavedMethod("local");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save to local storage helper
  const saveToLocalStorage = (card: NegotiationScorecard, pkg: NegotiationOffer, finalVerdict: string) => {
    try {
      const localHistory = JSON.parse(localStorage.getItem("salary_negotiations_local") || "[]");
      const newItem = {
        id: "local_" + Date.now(),
        role_title: roleTitle,
        company_name: companyName,
        scenario,
        initial_offer: initialOffer,
        final_offer: pkg,
        score: card.score,
        verdict: finalVerdict,
        feedback: card,
        created_at: new Date().toISOString(),
      };
      localStorage.setItem("salary_negotiations_local", JSON.stringify([newItem, ...localHistory]));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  };

  // Submit User Message
  const handleSubmitMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSubmitting || isConcluded) return;

    const userMsg = inputText.trim();
    setInputText("");
    setErrorMsg(null);
    setIsSubmitting(true);

    const updatedHistory: Message[] = [...messageHistory, { role: "user", content: userMsg }];
    setMessageHistory(updatedHistory);

    try {
      const res = await fetch("/api/negotiation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          roleTitle,
          companyName,
          scenario,
          initialOffer,
          currentOffer,
          messageHistory: updatedHistory.slice(0, -1), // feed preceding history
          userResponse: userMsg,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Negotiation turn error");
      }

      const turn: NegotiationTurnResponse = data.turn;

      // Update state from turn details
      setMessageHistory((prev) => [...prev, { role: "recruiter", content: turn.recruiterMessage }]);
      setCurrentOffer(turn.currentOffer);
      setSentiment(turn.sentiment);
      setLeverage(turn.leverage);
      setCoachFeedback(turn.coachFeedback);

      if (turn.isConcluded && turn.conclusionVerdict !== "ongoing") {
        handleConcludeNegotiation(turn.conclusionVerdict, turn.currentOffer);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to reach recruiter. Make sure server is online.");
      // Rollback last user message if API failed to process it
      setMessageHistory((prev) => prev.slice(0, -1));
      setInputText(userMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper color mappings
  const getSentimentBadge = (sent: string) => {
    switch (sent) {
      case "impressed":
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider">🌟 Impressed</span>;
      case "resistant":
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider">🤨 Resistant</span>;
      case "offended":
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider">😡 Offended</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider">😊 Open</span>;
    }
  };

  const getLeverageColor = (lev: number) => {
    if (lev >= 70) return "bg-emerald-500";
    if (lev >= 35) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 md:p-6 backdrop-blur-md overflow-hidden animate-fade-in text-slate-100">
      <div className="w-full max-w-6xl h-[92vh] bg-paper border border-border rounded-2xl flex flex-col shadow-2xl overflow-hidden font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-paper-card">
          <div className="flex items-center gap-3">
            <span className="bg-accent/15 text-accent border border-accent/20 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider">
              💰 Salary Negotiator Simulator
            </span>
            <h2 className="hidden md:inline-block font-display text-lg font-bold text-ink">
              {roleTitle} @ {companyName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-ink-muted hover:text-ink hover:bg-paper-warm border border-border p-2 rounded-xl text-sm transition"
            title="Quit simulator"
          >
            ✕ Quit
          </button>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          
          {/* Main Chat Panel */}
          <div className="flex-1 flex flex-col bg-paper relative overflow-hidden h-full">
            
            {/* Scrollable feed */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messageHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-accent text-white rounded-br-none"
                        : "bg-paper-card border border-border text-ink rounded-bl-none"
                    }`}
                  >
                    <div className="font-semibold text-xs opacity-60 mb-1">
                      {msg.role === "user" ? "You" : `${companyName} Recruiter`}
                    </div>
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {isSubmitting && !isConcluded && (
                <div className="flex justify-start">
                  <div className="bg-paper-card border border-border text-ink-muted rounded-2xl rounded-bl-none px-4 py-3 text-sm shadow-sm flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs italic ml-1">Recruiter is typing counter-proposal...</span>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="px-6 py-4 border-t border-border bg-paper-card">
              {!isConcluded ? (
                <form onSubmit={handleSubmitMessage} className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type your counter-offer response... Highlight achievements, value metrics, and stack affinity."
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 bg-paper border border-border rounded-xl text-sm outline-none focus:border-accent text-ink transition"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !inputText.trim()}
                      className="bg-accent text-white px-5 rounded-xl text-sm font-semibold shadow hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                      🚀 Send
                    </button>
                  </div>
                  
                  {errorMsg && (
                    <div className="text-rose-400 text-xs mt-1">⚠️ {errorMsg}</div>
                  )}

                  {/* Immediate Action Buttons */}
                  <div className="flex flex-wrap gap-2 justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => handleConcludeNegotiation("accepted")}
                      disabled={isSubmitting}
                      className="bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-600/20 transition cursor-pointer"
                    >
                      🤝 Accept Offer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConcludeNegotiation("rejected")}
                      disabled={isSubmitting}
                      className="bg-rose-600/10 text-rose-400 border border-rose-500/20 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-rose-600/20 transition cursor-pointer"
                    >
                      🛑 Decline Offer
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-2 text-sm text-ink-muted flex items-center justify-center gap-2">
                  <span>🏁 Simulator finished:</span>
                  <span className="font-bold capitalize text-ink">{verdict.replace("_", " ")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Panel */}
          <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-paper-card flex flex-col overflow-y-auto">
            
            {/* Live Recruiter Status */}
            <div className="p-5 border-b border-border space-y-4">
              <h3 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider">
                Recruiter Evaluation
              </h3>
              
              {/* Sentiment */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-muted">Recruiter Sentiment</span>
                {getSentimentBadge(sentiment)}
              </div>

              {/* Leverage Meter */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">Your Negotiation Leverage</span>
                  <span className="font-bold text-ink">{leverage}%</span>
                </div>
                <div className="w-full bg-paper h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getLeverageColor(leverage)}`}
                    style={{ width: `${leverage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Compensation Tracker */}
            <div className="p-5 border-b border-border space-y-4">
              <h3 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider flex justify-between">
                <span>Offer Package</span>
                {netGain > 0 && (
                  <span className="text-emerald-400 font-bold tracking-normal text-[10px]">
                    +${netGain.toLocaleString()} Gain
                  </span>
                )}
              </h3>
              
              <div className="space-y-2">
                {[
                  { label: "Base Salary", val: currentOffer.base, orig: initialOffer.base },
                  { label: "Equity Value", val: currentOffer.equity, orig: initialOffer.equity },
                  { label: "Sign-on Bonus", val: currentOffer.signOn, orig: initialOffer.signOn },
                ].map((item) => {
                  const gain = item.val - item.orig;
                  return (
                    <div key={item.label} className="flex justify-between items-center text-sm">
                      <span className="text-ink-muted">{item.label}</span>
                      <div className="text-right">
                        <span className="font-bold text-ink">${item.val.toLocaleString()}</span>
                        {gain > 0 && (
                          <div className="text-[10px] text-emerald-400 font-semibold leading-none mt-0.5">
                            +${gain.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Bonus */}
                <div className="flex justify-between items-center text-sm border-t border-border/50 pt-2">
                  <span className="text-ink-muted">Target Bonus</span>
                  <div className="text-right">
                    <span className="font-bold text-ink">{currentOffer.bonus}%</span>
                    {currentOffer.bonus > initialOffer.bonus && (
                      <div className="text-[10px] text-emerald-400 font-semibold leading-none mt-0.5">
                        +{currentOffer.bonus - initialOffer.bonus}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Other details */}
                {currentOffer.other && (
                  <div className="text-xs text-ink-muted bg-paper border border-border p-2 rounded-lg mt-2">
                    <span className="font-semibold text-[10px] text-ink block mb-0.5">Other Perks:</span>
                    {currentOffer.other}
                  </div>
                )}
              </div>
            </div>

            {/* Live AI Coach */}
            <div className="p-5 flex-1 space-y-3">
              <h3 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                <span>💡 Live AI Coach</span>
              </h3>
              <div className="bg-accent/5 border border-accent/10 p-3 rounded-xl text-xs leading-relaxed text-ink-muted italic">
                "{coachFeedback}"
              </div>
            </div>

          </div>

        </div>

        {/* Scorecard Modal Overlay */}
        {isConcluded && scorecard && (
          <div className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-paper border border-border rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto animate-scale-up">
              
              {/* Header */}
              <div className="text-center border-b border-border pb-5">
                <div className="text-4xl mb-2">🏁</div>
                <h3 className="font-display text-2xl font-bold text-ink">Salary Negotiation Scorecard</h3>
                <p className="text-ink-muted text-sm mt-1">
                  Outcome: <span className="font-semibold uppercase tracking-wider text-accent">{verdict}</span>
                </p>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Score */}
                <div className="bg-paper-card border border-border p-4 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">Score</span>
                  <span className="text-3xl font-extrabold text-accent mt-1">{scorecard.score}%</span>
                  <span className="text-[9px] text-ink-muted mt-0.5">Negotiation Skill</span>
                </div>

                {/* Financial Gain */}
                <div className="bg-paper-card border border-border p-4 rounded-xl flex flex-col items-center justify-center md:col-span-2">
                  <span className="text-[10px] text-ink-faint font-bold uppercase tracking-wider">Negotiated Package Value Gain</span>
                  <span className="text-3xl font-extrabold text-emerald-400 mt-1">
                    +${scorecard.financialGain.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-ink-muted mt-0.5">Incremental Annual Value Negotiated</span>
                </div>

              </div>

              {/* Tactics Badges */}
              {scorecard.tacticsUsed && scorecard.tacticsUsed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider">Tactics Employed</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {scorecard.tacticsUsed.map((tac) => (
                      <span
                        key={tac}
                        className="bg-accent/10 text-accent border border-accent/20 px-2.5 py-1 rounded-lg text-xs font-medium"
                      >
                        {tac}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider text-emerald-400">Strengths</h4>
                  <ul className="space-y-1.5 text-xs text-ink-muted list-disc pl-4">
                    {scorecard.strengths?.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider text-rose-400">Areas to Improve</h4>
                  <ul className="space-y-1.5 text-xs text-ink-muted list-disc pl-4">
                    {scorecard.weaknesses?.map((wk, i) => (
                      <li key={i}>{wk}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Coaches Note */}
              <div className="space-y-2">
                <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider">Coach Evaluation</h4>
                <p className="text-xs text-ink-muted leading-relaxed bg-paper-warm border border-border p-3.5 rounded-xl font-mono">
                  {scorecard.coachesNote}
                </p>
              </div>

              {/* Save Status */}
              <div className="flex justify-between items-center border-t border-border pt-4 text-[11px] text-ink-muted">
                <div>
                  {savingStatus === "saving" && <span>Saving simulation data...</span>}
                  {savingStatus === "saved" && (
                    <span className="text-emerald-400 font-medium">
                      ✓ Scorecard logged successfully to {savedMethod === "db" ? "user dashboard history" : "local storage fallback"}!
                    </span>
                  )}
                  {savingStatus === "error" && (
                    <span className="text-rose-400">⚠️ Failed to save: {savingError}</span>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="bg-accent hover:bg-accent/90 text-white font-semibold px-6 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Return to Negotiator Page ➔
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
