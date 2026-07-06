import { logger } from "@/lib/logger";
import { useState, useEffect, useRef } from "react";
import {
  type NegotiationOffer,
  type NegotiationTurnResponse,
  type NegotiationScorecard,
  type RecruiterProfile,
} from "@/lib/ai";

export interface Message {
  role: "user" | "recruiter";
  content: string;
}

const RECRUITER_ARCHETYPES: Omit<RecruiterProfile, "hiddenCeilingBudget" | "concessionLimit">[] = [
  {
    name: "Stan Stubborn",
    avatar: "👨‍💼",
    personality: "Stubborn",
    description: "Stan is highly rigid, prefers adhering strictly to corporate benchmarks, and gets offended if you request too much above the base range.",
    flexibility: 0.08,
  },
  {
    name: "Fiona Friendly",
    avatar: "👩‍💼",
    personality: "Friendly",
    description: "Fiona is empathetic, collaborative, and wants you to succeed. She has a high budget limit and is easier to negotiate concessions with.",
    flexibility: 0.20,
  },
  {
    name: "Alan Analytical",
    avatar: "👨‍💻",
    personality: "Highly Analytical",
    description: "Alan respects precision and details. He makes granular concessions (precise dollars) and evaluates metrics and facts from your resume closely.",
    flexibility: 0.14,
  },
  {
    name: "Tina Tough",
    avatar: "👩‍🎤",
    personality: "Tough",
    description: "Tina is an aggressive negotiator with a strict stance. Pushing her too hard will immediately cause her to warn you or withdraw the offer entirely.",
    flexibility: 0.05,
  },
];

interface UseNegotiationSessionArgs {
  resumeText: string;
  roleTitle: string;
  companyName: string;
  scenario: string;
  initialOffer: NegotiationOffer;
}

export function useNegotiationSession({
  resumeText,
  roleTitle,
  companyName,
  scenario,
  initialOffer,
}: UseNegotiationSessionArgs) {
  const [recruiter, setRecruiter] = useState<RecruiterProfile | null>(null);
  const [messageHistory, setMessageHistory] = useState<Message[]>([]);
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

  // Initialization loader
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializingStep, setInitializingStep] = useState(0);

  const INITIALIZING_STEPS = [
    "Reviewing candidate qualifications...",
    "Analyzing baseline resume achievements...",
    "Determining budget ceilings and flexibility...",
    "Opening salary negotiation simulator...",
  ];

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Cycle through loader steps
  useEffect(() => {
    if (!isInitializing) return;
    const interval = setInterval(() => {
      setInitializingStep((prev) => {
        if (prev >= INITIALIZING_STEPS.length - 1) {
          clearInterval(interval);
          setIsInitializing(false);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [isInitializing]);

  // Initialize recruiter profile and opening message
  useEffect(() => {
    if (recruiter) return;
    const archetype = RECRUITER_ARCHETYPES[Math.floor(Math.random() * RECRUITER_ARCHETYPES.length)];
    const hiddenCeilingBudget = Math.round(initialOffer.base * (1 + archetype.flexibility));
    let concessionLimit = 5000;
    if (archetype.personality === "Friendly") concessionLimit = 12000;
    else if (archetype.personality === "Highly Analytical") concessionLimit = 7500;
    else if (archetype.personality === "Tough") concessionLimit = 4000;

    const fullProfile: RecruiterProfile = { ...archetype, hiddenCeilingBudget, concessionLimit };
    setRecruiter(fullProfile);
    setMessageHistory([
      {
        role: "recruiter",
        content: `Hello! I'm ${fullProfile.name}. I'm glad we could connect to discuss your compensation details for the ${roleTitle} position at ${companyName}. Based on our current budget, we'd like to extend an initial offer: a base salary of $${initialOffer.base.toLocaleString()} per year, a ${initialOffer.bonus}% target bonus, $${initialOffer.equity.toLocaleString()} in equity, and a sign-on bonus of $${initialOffer.signOn.toLocaleString()}. Let me know how this aligns with your expectations.`,
      },
    ]);
  }, [initialOffer, roleTitle, companyName, recruiter]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageHistory, isSubmitting]);

  // Financial calculations
  const calculateTotalValue = (off: NegotiationOffer) =>
    off.base + (off.base * (off.bonus / 100)) + off.equity + off.signOn;

  const initialTotal = calculateTotalValue(initialOffer);
  const currentTotal = calculateTotalValue(currentOffer);
  const netGain = Math.max(0, currentTotal - initialTotal);
  const baseRange = recruiter ? recruiter.hiddenCeilingBudget - initialOffer.base : 0;
  const currentDiff = currentOffer.base - initialOffer.base;
  const proximityPct = baseRange > 0 ? Math.min(100, Math.max(0, (currentDiff / baseRange) * 100)) : 0;

  // Utility
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
        feedback: { ...card, transcript: messageHistory },
        created_at: new Date().toISOString(),
      };
      localStorage.setItem("salary_negotiations_local", JSON.stringify([newItem, ...localHistory]));
    } catch (e) {
      logger.error("Failed to save to localStorage:", e);
    }
  };

  const handleConcludeNegotiation = async (
    finalVerdict: "accepted" | "rejected" | "walk_away",
    finalPkg?: NegotiationOffer
  ) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSavingStatus("saving");

    const resolvedPkg = finalPkg || currentOffer;
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
      { role: "recruiter", content: recruiterCloseText } as Message,
    ];

    setMessageHistory(updatedHistory);
    setIsConcluded(true);
    setVerdict(finalVerdict);

    try {
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
          recruiterProfile: recruiter,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to compile scorecard");

      setScorecard(data.scorecard);
      if (data.savedInDb) {
        setSavingStatus("saved");
        setSavedMethod("db");
      } else {
        saveToLocalStorage(data.scorecard, resolvedPkg, finalVerdict);
        setSavingStatus("saved");
        setSavedMethod("local");
      }
    } catch (err: any) {
      logger.error("Scorecard evaluation error:", err);
      const mockScorecard: NegotiationScorecard = {
        score: finalVerdict === "accepted" ? Math.min(100, Math.round(leverage)) : 40,
        tacticsUsed: ["Polite Advocacy", "Package Structuring"],
        strengths: ["Highlighted interest in team collaboration.", "Advocated for personal compensation value."],
        weaknesses: [
          "Could have cited more hard metrics from achievements.",
          ...(recruiter && resolvedPkg.base < recruiter.hiddenCeilingBudget - 10000
            ? ["Left money on the table: accepted an offer significantly below the recruiter's budget range."]
            : []),
        ],
        financialGain: netGain,
        coachesNote: recruiter && resolvedPkg.base < recruiter.hiddenCeilingBudget - 10000
          ? `The simulator encountered a network error compiling detailed AI metrics, but your mock session has been logged locally. You left some money on the table: your final base salary of $${resolvedPkg.base.toLocaleString()} is below the recruiter's budget of $${recruiter.hiddenCeilingBudget.toLocaleString()}. Try anchoring higher next time!`
          : "The simulator encountered a network error compiling detailed AI metrics, but your mock session has been logged locally. Practice anchoring your values around concrete projects next time!",
      };
      setScorecard(mockScorecard);
      saveToLocalStorage(mockScorecard, resolvedPkg, finalVerdict);
      setSavingStatus("saved");
      setSavedMethod("local");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitMessage = async (
    e: React.FormEvent | undefined,
    speakText: (text: string) => void
  ) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSubmitting || isConcluded || !recruiter) return;

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
          messageHistory: updatedHistory.slice(0, -1),
          userResponse: userMsg,
          recruiterProfile: recruiter,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Negotiation turn error");

      const turn: NegotiationTurnResponse = data.turn;
      setMessageHistory((prev) => [...prev, { role: "recruiter", content: turn.recruiterMessage }]);
      setCurrentOffer(turn.currentOffer);
      setSentiment(turn.sentiment);
      setLeverage(turn.leverage);
      setCoachFeedback(turn.coachFeedback);

      speakText(turn.recruiterMessage);

      if (turn.isConcluded && turn.conclusionVerdict !== "ongoing") {
        handleConcludeNegotiation(turn.conclusionVerdict, turn.currentOffer);
      }
    } catch (err: any) {
      logger.error(err);
      setErrorMsg(err.message || "Failed to reach recruiter. Make sure server is online.");
      setMessageHistory((prev) => prev.slice(0, -1));
      setInputText(userMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    recruiter,
    messageHistory,
    currentOffer,
    sentiment,
    leverage,
    coachFeedback,
    inputText, setInputText,
    isSubmitting,
    errorMsg,
    isConcluded,
    verdict,
    scorecard,
    savingStatus,
    savingError,
    savedMethod,
    isInitializing,
    initializingStep,
    INITIALIZING_STEPS,
    chatEndRef,
    // Calculated
    initialTotal,
    currentTotal,
    netGain,
    proximityPct,
    // Handlers
    handleSubmitMessage,
    handleConcludeNegotiation,
  };
}
