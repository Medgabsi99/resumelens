import { useState, useEffect, useRef } from "react";
import { type NegotiationOffer, type NegotiationTurnResponse, type NegotiationScorecard, type RecruiterProfile } from "@/lib/ai";
import SpotlightCard from "@/components/SpotlightCard";

const playSynthSound = (type: "concession" | "warning" | "outcome") => {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const ctx = new AudioContextClass();
    
    if (type === "concession") {
      // Ascending chime: C5 to E5 to G5
      const now = ctx.currentTime;
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(0.12, start + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.start(start);
        osc.stop(start + duration);
      };
      playTone(523.25, now, 0.35); // C5
      playTone(659.25, now + 0.08, 0.35); // E5
      playTone(783.99, now + 0.16, 0.45); // G5
    } else if (type === "warning") {
      // Double low sawtooth beeps
      const now = ctx.currentTime;
      const playBeep = (start: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, start);
        gainNode.gain.setValueAtTime(0, start);
        gainNode.gain.linearRampToValueAtTime(0.06, start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
        osc.start(start);
        osc.stop(start + 0.18);
      };
      playBeep(now);
      playBeep(now + 0.22);
    } else if (type === "outcome") {
      // Majestic major chord
      const now = ctx.currentTime;
      const playTone = (freq: number, delay: number) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + delay);
        gainNode.gain.setValueAtTime(0, now + delay);
        gainNode.gain.linearRampToValueAtTime(0.05, now + delay + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + delay + 1.2);
        osc.start(now + delay);
        osc.stop(now + delay + 1.2);
      };
      playTone(261.63, 0); // C4
      playTone(329.63, 0.04); // E4
      playTone(392.00, 0.08); // G4
      playTone(523.25, 0.12); // C5
    }
  } catch (err) {
    console.warn("Failed to play synthesized sound:", err);
  }
};

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

export default function SalaryNegotiatorBoard({
  resumeText,
  roleTitle,
  companyName,
  scenario,
  initialOffer,
  onClose,
  onSaveScorecard,
}: Props) {
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
  const [completedTactics, setCompletedTactics] = useState<string[]>([]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialization/Convening Loader States
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializingStep, setInitializingStep] = useState(0);

  const INITIALIZING_STEPS = [
    "Reviewing candidate qualifications...",
    "Analyzing baseline resume achievements...",
    "Determining budget ceilings and flexibility...",
    "Opening salary negotiation simulator...",
  ];

  // Cycle through initializing steps
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

  // Scan conversation history for tactics
  useEffect(() => {
    const userMessages = messageHistory
      .filter((m) => m.role === "user")
      .map((m) => m.content.toLowerCase());

    const activeTactics: string[] = [];

    // Tactic 1: Resume Anchoring
    const hasResumeAnchoring = userMessages.some((msg) =>
      /\b(\d+%|\d+\s*percent|increased|reduced|saved|launched|led|achieved|revenue|metrics|stats)\b/.test(msg)
    );
    if (hasResumeAnchoring) activeTactics.push("Resume Anchoring");

    // Tactic 2: Alternative Offer
    const hasAlternativeLeverage = userMessages.some((msg) =>
      /\b(competing|other offer|another offer|competing process|interviewing with|parallel process|timeline)\b/.test(msg)
    );
    if (hasAlternativeLeverage) activeTactics.push("Alternative Offer");

    // Tactic 3: Total Comp Focus
    const hasTotalCompFocus = userMessages.some((msg) =>
      /\b(total compensation|total comp|equity|options|rsu|sign-on|sign on|bonus|package)\b/.test(msg)
    );
    if (hasTotalCompFocus) activeTactics.push("Total Comp Focus");

    // Tactic 4: Collaborative Tone
    const hasCollaborativeTone = userMessages.some((msg) =>
      /\b(excited|thrilled|appreciate|thank you|glad|collaborate|partnership|looking forward|excited to)\b/.test(msg)
    );
    if (hasCollaborativeTone) activeTactics.push("Collaborative Tone");

    // Tactic 5: Market Research
    const hasMarketResearch = userMessages.some((msg) =>
      /\b(market rate|market average|industry standard|salary research|salary survey|paysa|levels\.fyi|glassdoor|data suggests)\b/.test(msg)
    );
    if (hasMarketResearch) activeTactics.push("Market Research");

    setCompletedTactics(activeTactics);
  }, [messageHistory]);

  // Speech States
  const [isListening, setIsListening] = useState(false);
  const [useVoiceFeedback, setUseVoiceFeedback] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";

        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };
        rec.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };
        setRecognition(rec);
      }
    }
  }, []);

  // Pre-load speech synthesis voices
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const handleVoicesChanged = () => {};
    window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    window.speechSynthesis.getVoices();
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, []);

  const handleToggleListening = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const getRecruiterVoice = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter((v) => v.lang.startsWith("en"));
    if (enVoices.length === 0) return null;

    // 1. Google English US (often high quality Chrome native TTS)
    let voice = enVoices.find((v) => v.name.includes("Google") && v.lang.includes("US"));
    if (voice) return voice;

    // 2. Google English general
    voice = enVoices.find((v) => v.name.includes("Google"));
    if (voice) return voice;

    // 3. Look for Microsoft Zira / David or premium Windows TTS voices
    voice = enVoices.find((v) => v.name.includes("Microsoft") && v.lang.includes("US"));
    if (voice) return voice;

    // 4. Any voice containing "natural" or "premium"
    voice = enVoices.find(
      (v) =>
        v.name.toLowerCase().includes("natural") ||
        v.name.toLowerCase().includes("premium")
    );
    if (voice) return voice;

    // 5. Fallback en-US
    voice = enVoices.find((v) => v.lang.startsWith("en-US"));
    if (voice) return voice;

    return enVoices[0];
  };

  const speakText = (text: string, force = false) => {
    if ((!useVoiceFeedback && !force) || typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      
      const bestVoice = getRecruiterVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
      }
      
      // Slightly slower rate sounds more professional and natural
      utterance.rate = 0.98;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Speech synthesis failed:", err);
    }
  };

  // Initialize Recruiter Profile and initial greeting on mount
  useEffect(() => {
    if (recruiter) return;

    const archetype = RECRUITER_ARCHETYPES[Math.floor(Math.random() * RECRUITER_ARCHETYPES.length)];
    const hiddenCeilingBudget = Math.round(initialOffer.base * (1 + archetype.flexibility));
    
    let concessionLimit = 5000;
    if (archetype.personality === "Friendly") concessionLimit = 12000;
    else if (archetype.personality === "Highly Analytical") concessionLimit = 7500;
    else if (archetype.personality === "Tough") concessionLimit = 4000;

    const fullProfile: RecruiterProfile = {
      ...archetype,
      hiddenCeilingBudget,
      concessionLimit,
    };
    setRecruiter(fullProfile);

    setMessageHistory([
      {
        role: "recruiter",
        content: `Hello! I'm ${fullProfile.name}. I'm glad we could connect to discuss your compensation details for the ${roleTitle} position at ${companyName}. Based on our current budget, we'd like to extend an initial offer: a base salary of $${initialOffer.base.toLocaleString()} per year, a ${initialOffer.bonus}% target bonus, $${initialOffer.equity.toLocaleString()} in equity, and a sign-on bonus of $${initialOffer.signOn.toLocaleString()}. Let me know how this aligns with your expectations.`,
      },
    ]);
  }, [initialOffer, roleTitle, companyName, recruiter]);

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

  const baseRange = recruiter ? recruiter.hiddenCeilingBudget - initialOffer.base : 0;
  const currentDiff = currentOffer.base - initialOffer.base;
  const proximityPct = baseRange > 0 ? Math.min(100, Math.max(0, (currentDiff / baseRange) * 100)) : 0;

  // Play sound on concession increase
  const prevTotalRef = useRef(currentTotal);
  useEffect(() => {
    if (currentTotal > prevTotalRef.current && prevTotalRef.current > 0) {
      playSynthSound("concession");
    }
    prevTotalRef.current = currentTotal;
  }, [currentTotal]);

  // Play sound on critical proximity or offended sentiment
  const prevSentimentRef = useRef(sentiment);
  const prevProximityRef = useRef(proximityPct);
  useEffect(() => {
    const isCriticalNow = proximityPct >= 80 || sentiment === "offended";
    const wasCriticalBefore = prevProximityRef.current >= 80 || prevSentimentRef.current === "offended";

    if (isCriticalNow && !wasCriticalBefore) {
      playSynthSound("warning");
    }
    prevSentimentRef.current = sentiment;
    prevProximityRef.current = proximityPct;
  }, [sentiment, proximityPct]);

  // Play sound on simulation conclusion
  const prevConcludedRef = useRef(isConcluded);
  useEffect(() => {
    if (isConcluded && !prevConcludedRef.current) {
      playSynthSound("outcome");
    }
    prevConcludedRef.current = isConcluded;
  }, [isConcluded]);

  // Conclude negotiation flow
  const handleConcludeNegotiation = async (finalVerdict: "accepted" | "rejected" | "walk_away", finalPkg?: NegotiationOffer) => {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSavingStatus("saving");

    const resolvedPkg = finalPkg || currentOffer;
    
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
          recruiterProfile: recruiter,
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
        weaknesses: [
          "Could have cited more hard metrics from achievements.",
          ...(recruiter && resolvedPkg.base < recruiter.hiddenCeilingBudget - 10000
            ? ["Left money on the table: accepted an offer significantly below the recruiter's budget range."]
            : [])
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
        feedback: {
          ...card,
          transcript: messageHistory,
        },
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
          messageHistory: updatedHistory.slice(0, -1), // feed preceding history
          userResponse: userMsg,
          recruiterProfile: recruiter,
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

      // Trigger TTS
      speakText(turn.recruiterMessage);

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

  const getSentimentRing = (sent: string) => {
    switch (sent) {
      case "impressed":
        return "ring-2 ring-emerald-500/85 shadow-[0_0_10px_rgba(16,185,129,0.45)]";
      case "resistant":
        return "ring-2 ring-amber-500/85 shadow-[0_0_10px_rgba(245,158,11,0.45)]";
      case "offended":
        return "ring-2 ring-rose-500/85 shadow-[0_0_10px_rgba(244,63,94,0.45)]";
      default:
        return "ring-2 ring-indigo-500/40 shadow-[0_0_6px_rgba(99,102,241,0.2)]";
    }
  };

  const getRecruiterMoodText = (sent: string, name: string) => {
    switch (sent) {
      case "impressed":
        return `${name} is highly impressed and is leaning toward making favorable concessions.`;
      case "resistant":
        return `${name} is pushing back, arguing standard benchmark constraints. Emphasize achievements to build leverage.`;
      case "offended":
        return `⚠️ ${name} is offended by your demand. Proceed with caution — further aggressive demands could lose the offer.`;
      default:
        return `${name} is currently open to hearing your feedback. Present your case collaboratively.`;
    }
  };

  const getCoachSuggestions = (sent: string, proximity: number) => {
    if (sent === "offended") {
      return [
        "I understand your constraints and appreciate the budget limits. How can we optimize total value?",
        "I want to make sure this is a win-win fit. Let's review the base compensation metrics.",
      ];
    }
    if (proximity >= 80) {
      return [
        "Since the base salary is constrained, could we explore adjusting the sign-on bonus instead?",
        "Would there be flexibility in expanding the equity/RSU grants instead of base salary?",
      ];
    }
    if (sent === "impressed") {
      return [
        "Given the positive feedback, can we look at bringing the base salary to...",
        "Could we discuss adjusting the equity grants to align with industry averages?",
      ];
    }
    return [
      "I am very excited about the role. Based on my achievements in...",
      "Could we discuss bridging the gap with an adjusted sign-on bonus?",
    ];
  };

  const handleInjectSuggestion = (text: string) => {
    setInputText((prev) => {
      const clean = prev.trim();
      return clean ? `${clean} ${text}` : text;
    });
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const next = !useVoiceFeedback;
                setUseVoiceFeedback(next);
                if (!next && typeof window !== "undefined" && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
              }}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                useVoiceFeedback
                  ? "bg-accent/10 border-accent text-accent"
                  : "bg-paper border-border text-ink-muted hover:text-ink"
              }`}
            >
              <span>{useVoiceFeedback ? "🔊 Voice On" : "🔇 Voice Off"}</span>
            </button>
            <button
              onClick={onClose}
              className="text-ink-muted hover:text-ink hover:bg-paper-warm border border-border p-2 rounded-xl text-sm transition"
              title="Quit simulator"
            >
              ✕ Quit
            </button>
          </div>
        </div>

        {/* Workspace Body */}
        {isInitializing ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-paper p-12 text-center min-h-[350px] gap-4">
            <span className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <h3 className="font-display text-lg font-bold text-ink mt-2">
              {INITIALIZING_STEPS[initializingStep]}
            </h3>
            <p className="text-xs text-ink-muted">
              Prepping recruiter profile and configuring target ranges
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            
            {/* Main Chat Panel */}
            <div className="flex-1 flex flex-col bg-paper relative overflow-hidden h-full">
              
              {/* Scrollable feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messageHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in group`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm relative ${
                        msg.role === "user"
                          ? "bg-accent text-white rounded-br-none"
                          : "bg-paper-card border border-border text-ink rounded-bl-none"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold text-xs opacity-60">
                          {msg.role === "user" ? "You" : `${companyName} Recruiter`}
                        </span>
                        {msg.role === "recruiter" && (
                          <button
                            type="button"
                            onClick={() => speakText(msg.content, true)}
                            className="opacity-0 group-hover:opacity-100 transition text-[10px] bg-paper border border-border px-1.5 py-0.5 rounded ml-2 text-ink-muted hover:text-ink cursor-pointer"
                            title="Speak message"
                          >
                            🔊 Read
                          </button>
                        )}
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
                    <style dangerouslySetInnerHTML={{ __html: `
                      @keyframes eqPulse {
                        0% { transform: scaleY(0.3); }
                        100% { transform: scaleY(2.5); }
                      }
                    `}} />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleToggleListening}
                        className={`px-4 rounded-xl border transition flex items-center justify-center gap-2.5 cursor-pointer ${
                          isListening
                            ? "bg-rose-500/20 border-rose-500 text-rose-400 font-bold"
                            : "bg-paper border-border text-ink-muted hover:text-ink"
                        }`}
                        title={isListening ? "Stop Listening" : "Speak Counter-offer"}
                      >
                        {isListening ? (
                          <>
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            <svg className="w-8 h-4 flex items-center" viewBox="0 0 24 12" fill="none">
                              <line className="animate-[eqPulse_0.5s_infinite_alternate]" x1="2" y1="6" x2="2" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transformOrigin: 'center' }} />
                              <line className="animate-[eqPulse_0.6s_infinite_alternate_0.15s]" x1="7" y1="6" x2="7" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transformOrigin: 'center' }} />
                              <line className="animate-[eqPulse_0.4s_infinite_alternate_0.3s]" x1="12" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transformOrigin: 'center' }} />
                              <line className="animate-[eqPulse_0.7s_infinite_alternate_0.1s]" x1="17" y1="6" x2="17" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transformOrigin: 'center' }} />
                              <line className="animate-[eqPulse_0.5s_infinite_alternate_0.2s]" x1="22" y1="6" x2="22" y2="6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transformOrigin: 'center' }} />
                            </svg>
                          </>
                        ) : (
                          <>
                            <span>🎤 Speak</span>
                          </>
                        )}
                      </button>
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={isListening ? "Listening..." : "Type your counter-offer response... Highlight achievements, value metrics, and stack affinity."}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 bg-paper border border-border rounded-xl text-sm outline-none focus:border-accent text-ink transition"
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || !inputText.trim()}
                        className="bg-accent text-white px-5 rounded-xl text-sm font-semibold shadow hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 min-w-[90px]"
                      >
                        {isSubmitting ? (
                          <span className="w-4.5 h-4.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "🚀 Send"
                        )}
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
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-paper-card flex flex-col gap-4 p-4 overflow-y-auto">
              
              {/* Recruiter Profile Card */}
              {recruiter && (
                <SpotlightCard className="p-5 border border-border/60 space-y-3.5 bg-paper/50 shrink-0" glowColor="rgba(99, 102, 241, 0.12)">
                  <div className="flex items-center gap-3">
                    <div className={`text-3xl p-2 bg-paper border border-border rounded-xl shadow-inner select-none transition-all duration-500 ${getSentimentRing(sentiment)}`}>
                      {recruiter.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-ink">{recruiter.name}</h4>
                      <span className="text-[10px] bg-accent/15 text-accent border border-accent/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider block w-fit mt-0.5">
                        {recruiter.personality} Rep
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 border-t border-border/50 pt-2.5">
                    <div className="text-[9px] uppercase tracking-wider font-semibold text-ink-muted">Profile Description</div>
                    <p className="text-xs text-ink-muted leading-relaxed italic">
                      "{recruiter.description}"
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t border-border/50 pt-2.5">
                    <div className="text-[9px] uppercase tracking-wider font-semibold text-ink-muted">Current Mood</div>
                    <p className="text-xs text-ink font-medium leading-relaxed transition-all duration-300">
                      {getRecruiterMoodText(sentiment, recruiter.name)}
                    </p>
                  </div>
                </SpotlightCard>
              )}

              {/* Live Recruiter Status */}
              <SpotlightCard className="p-5 border border-border/60 space-y-4 bg-paper/50 shrink-0" glowColor="rgba(99, 102, 241, 0.12)">
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

                {/* Corporate Budget Cap Proximity Meter */}
                {recruiter && (
                  <div className="space-y-1.5 pt-2 border-t border-border/50">
                    <div className="flex justify-between text-xs">
                      <span className="text-ink-muted">Corporate Budget Cap Proximity</span>
                      <span className="font-bold text-ink text-[10px] uppercase tracking-wider">
                        {proximityPct >= 100 ? "⚠️ Cap Reached" : proximityPct >= 80 ? "Critical" : proximityPct >= 50 ? "Moderate" : "Safe Range"}
                      </span>
                    </div>
                    <div className="w-full bg-paper h-2 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full transition-all duration-500 ${
                          proximityPct >= 100
                            ? "bg-rose-600 animate-pulse"
                            : proximityPct >= 80
                            ? "bg-rose-500"
                            : proximityPct >= 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${proximityPct}%` }}
                      />
                    </div>
                    {proximityPct >= 80 && (
                      <div className="text-[10px] text-rose-400 font-medium leading-normal animate-pulse">
                        ⚠️ Recruiter is resisting further base salary increases. Pushing harder risks losing the offer!
                      </div>
                    )}
                  </div>
                )}
              </SpotlightCard>

              {/* Tactics Checklist */}
              <SpotlightCard className="p-5 border border-border/60 space-y-3.5 bg-paper/50 shrink-0" glowColor="rgba(99, 102, 241, 0.12)">
                <h3 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center justify-between">
                  <span>🎯 Tactic Checklist</span>
                  <span className="text-[10px] text-accent font-semibold">{completedTactics.length}/5 Used</span>
                </h3>
                <div className="space-y-2 text-xs">
                  {[
                    { name: "Resume Anchoring", desc: "Reference quantitative metrics or achievements." },
                    { name: "Alternative Offer", desc: "Leverage competing timelines or other options." },
                    { name: "Total Comp Focus", desc: "Discuss equity, bonuses, or sign-on terms." },
                    { name: "Collaborative Tone", desc: "Keep phrasings polite, professional, and positive." },
                    { name: "Market Research", desc: "Mention industry standards or data benchmarks." },
                  ].map((t) => {
                    const isDone = completedTactics.includes(t.name);
                    return (
                      <div key={t.name} className={`flex items-start gap-2.5 p-2 rounded-xl border transition ${isDone ? 'bg-emerald-500/5 border-emerald-500/20 text-ink' : 'bg-paper/30 border-border/40 text-ink-muted'}`}>
                        <span className="text-sm select-none">{isDone ? "✅" : "⭕"}</span>
                        <div>
                          <div className={`font-bold text-[11px] ${isDone ? 'text-emerald-500/80 line-through opacity-85' : 'text-ink'}`}>
                            {t.name}
                          </div>
                          <div className="text-[10px] opacity-75 leading-normal mt-0.5">{t.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SpotlightCard>

              {/* Compensation Tracker */}
              <SpotlightCard className="p-5 border border-border/60 space-y-4 bg-paper/50 shrink-0" glowColor="rgba(99, 102, 241, 0.12)">
                <h3 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider flex justify-between">
                  <span>Offer Package</span>
                  {netGain > 0 && (
                    <span className="text-emerald-400 font-bold tracking-normal text-[10px]">
                      +${netGain.toLocaleString()} Gain
                    </span>
                  )}
                </h3>
                
                {/* Dynamic Stacked Bar Comparison Chart */}
                <div className="space-y-3 border-b border-border/50 pb-3">
                  <div className="space-y-2">
                    {/* Current Offer Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-semibold">
                        <span className="text-ink">Current Package</span>
                        <span className="text-accent">${currentTotal.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-paper h-3.5 rounded-lg overflow-hidden flex shadow-inner border border-border/50">
                        {currentOffer.base > 0 && (
                          <div
                            className="h-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${(currentOffer.base / Math.max(initialTotal, currentTotal, 1)) * 100}%` }}
                            title={`Base Salary: $${currentOffer.base.toLocaleString()}`}
                          />
                        )}
                        {currentOffer.equity > 0 && (
                          <div
                            className="h-full bg-purple-500 transition-all duration-500 border-l border-white/10"
                            style={{ width: `${(currentOffer.equity / Math.max(initialTotal, currentTotal, 1)) * 100}%` }}
                            title={`Equity Value: $${currentOffer.equity.toLocaleString()}`}
                          />
                        )}
                        {currentOffer.signOn > 0 && (
                          <div
                            className="h-full bg-emerald-500 transition-all duration-500 border-l border-white/10"
                            style={{ width: `${(currentOffer.signOn / Math.max(initialTotal, currentTotal, 1)) * 100}%` }}
                            title={`Sign-on Bonus: $${currentOffer.signOn.toLocaleString()}`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Initial Offer Bar */}
                    <div className="space-y-1 opacity-70 hover:opacity-100 transition-opacity">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-ink-muted">Initial Offer</span>
                        <span className="font-semibold text-ink-muted">${initialTotal.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-paper h-2.5 rounded-md overflow-hidden flex shadow-inner border border-border/30">
                        {initialOffer.base > 0 && (
                          <div
                            className="h-full bg-indigo-500/60"
                            style={{ width: `${(initialOffer.base / Math.max(initialTotal, currentTotal, 1)) * 100}%` }}
                          />
                        )}
                        {initialOffer.equity > 0 && (
                          <div
                            className="h-full bg-purple-500/60 border-l border-white/10"
                            style={{ width: `${(initialOffer.equity / Math.max(initialTotal, currentTotal, 1)) * 100}%` }}
                          />
                        )}
                        {initialOffer.signOn > 0 && (
                          <div
                            className="h-full bg-emerald-500/60 border-l border-white/10"
                            style={{ width: `${(initialOffer.signOn / Math.max(initialTotal, currentTotal, 1)) * 100}%` }}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex gap-3 text-[9px] text-ink-muted justify-center pt-1">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-indigo-500 rounded-sm" />
                      <span>Base</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-purple-500 rounded-sm" />
                      <span>Equity</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-emerald-500 rounded-sm" />
                      <span>Sign-on</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { label: "Base Salary", val: currentOffer.base, orig: initialOffer.base, color: "bg-indigo-500" },
                    { label: "Equity Value", val: currentOffer.equity, orig: initialOffer.equity, color: "bg-purple-500" },
                    { label: "Sign-on Bonus", val: currentOffer.signOn, orig: initialOffer.signOn, color: "bg-emerald-500" },
                  ].map((item) => {
                    const gain = item.val - item.orig;
                    return (
                      <div key={item.label} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
                          <span className="text-ink-muted">{item.label}</span>
                        </div>
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
                  <div className="flex justify-between items-center text-xs border-t border-border/50 pt-2">
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
              </SpotlightCard>

              {/* Live AI Coach */}
              <SpotlightCard className="p-5 mb-4 space-y-4 bg-paper/50 border border-border/60 shrink-0" glowColor="rgba(99, 102, 241, 0.12)">
                <h3 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                  <span>💡 Live AI Coach</span>
                </h3>
                <div className="bg-accent/5 border border-accent/10 p-3 rounded-xl text-xs leading-relaxed text-ink-muted italic">
                  "{coachFeedback}"
                </div>
                
                {/* Suggestions List */}
                <div className="space-y-2 border-t border-border/50 pt-3">
                  <div className="text-[9px] uppercase tracking-wider font-semibold text-ink-muted">Suggested Phrasings (Click to inject)</div>
                  <div className="flex flex-col gap-2">
                    {getCoachSuggestions(sentiment, proximityPct).map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleInjectSuggestion(sug)}
                        disabled={isSubmitting || isConcluded}
                        className="text-left text-[10px] p-2 bg-paper hover:bg-paper-warm border border-border text-ink rounded-lg font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer leading-normal"
                      >
                        🗣️ "{sug}"
                      </button>
                    ))}
                  </div>
                </div>
              </SpotlightCard>

            </div>

          </div>
        )}

        {/* Scorecard Compiling Loader */}
        {isConcluded && !scorecard && (
          <div className="absolute inset-0 bg-black/85 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-sm text-center">
            <span className="w-10 h-10 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-4" />
            <h3 className="font-display text-lg font-bold text-ink mt-2">Compiling Scorecard...</h3>
            <p className="text-xs text-ink-muted mt-2 max-w-sm">
              Analyzing negotiation strategies, sentiment transitions, achievements highlighted, and final package value gains.
            </p>
          </div>
        )}

        {/* Scorecard Modal Overlay */}
        {isConcluded && scorecard && (
          <div className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-4 overflow-y-auto backdrop-blur-sm">
            <SpotlightCard className="w-full max-w-2xl bg-paper border border-border rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[85vh] overflow-y-auto animate-scale-up">
              
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

              {/* Recruiter Deal Parameters & Hidden Budget Gap */}
              {recruiter && (
                <div className="bg-paper-card border border-border p-5 rounded-xl space-y-3">
                  <h4 className="font-display text-xs font-bold text-ink-muted uppercase tracking-wider">
                    Recruiter Deal Parameters (Game Results)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-ink-muted">Recruiter ceiling budget (Hidden):</span>
                      <div className="font-bold text-sm text-ink">
                        ${recruiter.hiddenCeilingBudget.toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-ink-muted">Your final base salary:</span>
                      <div className="font-bold text-sm text-accent">
                        ${currentOffer.base.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {/* Proximity / Leaving money on the table evaluation */}
                  <div className="border-t border-border/50 pt-2.5 mt-2.5">
                    {currentOffer.base >= recruiter.hiddenCeilingBudget ? (
                      <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                        🏆 Outstanding! You maxed out the recruiter's budget ceiling of ${recruiter.hiddenCeilingBudget.toLocaleString()}!
                      </div>
                    ) : recruiter.hiddenCeilingBudget - currentOffer.base <= 5000 ? (
                      <div className="text-xs text-emerald-400/80 font-medium flex items-center gap-1.5">
                        ⭐ Great job! You got extremely close to their corporate budget limit (within $5,000).
                      </div>
                    ) : (
                      <div className="text-xs text-amber-400 font-medium flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 font-bold">💸 Money Left on the Table: ${Math.max(0, recruiter.hiddenCeilingBudget - currentOffer.base).toLocaleString()}</span>
                        <span className="text-[11px] text-ink-muted font-normal leading-relaxed">
                          The corporate limit was ${recruiter.hiddenCeilingBudget.toLocaleString()}. You could have pushed for a higher base salary. See the coach evaluation note below to improve your anchoring.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

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

            </SpotlightCard>
          </div>
        )}

      </div>
    </div>
  );
}
