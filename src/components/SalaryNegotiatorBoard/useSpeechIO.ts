import { useState, useEffect } from "react";

export function useSpeechIO() {
  const [isListening, setIsListening] = useState(false);
  const [useVoiceFeedback, setUseVoiceFeedback] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "en-US";
        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
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
    return () => window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
  }, []);

  const handleToggleListening = (setInputText: (fn: (prev: string) => string) => void) => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please try Chrome or Edge.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText((prev: string) => (prev ? `${prev} ${transcript}` : transcript));
      };
      recognition.start();
    }
  };

  const getRecruiterVoice = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter((v) => v.lang.startsWith("en"));
    if (enVoices.length === 0) return null;
    let voice = enVoices.find((v) => v.name.includes("Google") && v.lang.includes("US"));
    if (voice) return voice;
    voice = enVoices.find((v) => v.name.includes("Google"));
    if (voice) return voice;
    voice = enVoices.find((v) => v.name.includes("Microsoft") && v.lang.includes("US"));
    if (voice) return voice;
    voice = enVoices.find(
      (v) => v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("premium")
    );
    if (voice) return voice;
    voice = enVoices.find((v) => v.lang.startsWith("en-US"));
    if (voice) return voice;
    return enVoices[0];
  };

  const speakText = (text: string, force = false) => {
    if ((!useVoiceFeedback && !force) || typeof window === "undefined" || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const bestVoice = getRecruiterVoice();
      if (bestVoice) utterance.voice = bestVoice;
      utterance.rate = 0.98;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error("Speech synthesis failed:", err);
    }
  };

  return {
    isListening,
    useVoiceFeedback, setUseVoiceFeedback,
    handleToggleListening,
    speakText,
  };
}
