import { useState, useRef, useEffect } from "react";
import { readSSEStream } from "@/lib/sse";

export function useResumeChat(resumeText?: string, jobDescription?: string, targetRole?: string) {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatHistory, isChatting]);

  async function handleChatSubmit(overrideMsg?: string) {
    const activeMsg = overrideMsg !== undefined ? overrideMsg : chatInput;
    if (!activeMsg.trim() || !resumeText) return;

    const userMsg = activeMsg.trim();
    if (overrideMsg === undefined) {
      setChatInput("");
    }

    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsChatting(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          resumeText,
          jobDescription,
          targetRole,
          history: chatHistory.map((h) => ({
            role: h.role === "ai" ? "assistant" : "user",
            content: h.text,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Sorry, I encountered an error. Please try again.");
      }

      // Add a placeholder message for the AI response
      setChatHistory((prev) => [...prev, { role: "ai", text: "" }]);

      await readSSEStream(res, (accumulatedText) => {
        setChatHistory((prev) => {
          const nextHistory = [...prev];
          if (nextHistory.length > 0) {
            const lastIdx = nextHistory.length - 1;
            if (nextHistory[lastIdx].role === "ai") {
              nextHistory[lastIdx] = { ...nextHistory[lastIdx], text: accumulatedText };
            }
          }
          return nextHistory;
        });
      });
    } catch (err: unknown) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: "ai",
          text: (err as Error).message || "Network error. Please try again.",
        },
      ]);
    } finally {
      setIsChatting(false);
    }
  }

  return {
    chatInput,
    setChatInput,
    chatHistory,
    isChatting,
    chatScrollRef,
    handleChatSubmit,
  };
}
export default useResumeChat;
