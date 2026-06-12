import { useState, useRef, useEffect } from "react";

export function useResumeChat(
  resumeText?: string,
  jobDescription?: string,
  targetRole?: string
) {
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
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
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setChatHistory((prev) => [...prev, { role: "ai", text: data.data }]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            role: "ai",
            text: "Sorry, I encountered an error. Please try again.",
          },
        ]);
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: "ai", text: "Network error. Please try again." },
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
