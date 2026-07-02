import { useState, useEffect } from "react";
import { type Message } from "./useNegotiationSession";

export function useTacticTracker(messageHistory: Message[]) {
  const [completedTactics, setCompletedTactics] = useState<string[]>([]);

  useEffect(() => {
    const userMessages = messageHistory
      .filter((m) => m.role === "user")
      .map((m) => m.content.toLowerCase());

    const activeTactics: string[] = [];

    if (userMessages.some((msg) =>
      /\b(\d+%|\d+\s*percent|increased|reduced|saved|launched|led|achieved|revenue|metrics|stats)\b/.test(msg)
    )) activeTactics.push("Resume Anchoring");

    if (userMessages.some((msg) =>
      /\b(competing|other offer|another offer|competing process|interviewing with|parallel process|timeline)\b/.test(msg)
    )) activeTactics.push("Alternative Offer");

    if (userMessages.some((msg) =>
      /\b(total compensation|total comp|equity|options|rsu|sign-on|sign on|bonus|package)\b/.test(msg)
    )) activeTactics.push("Total Comp Focus");

    if (userMessages.some((msg) =>
      /\b(excited|thrilled|appreciate|thank you|glad|collaborate|partnership|looking forward|excited to)\b/.test(msg)
    )) activeTactics.push("Collaborative Tone");

    if (userMessages.some((msg) =>
      /\b(market rate|market average|industry standard|salary research|salary survey|paysa|levels\.fyi|glassdoor|data suggests)\b/.test(msg)
    )) activeTactics.push("Market Research");

    setCompletedTactics(activeTactics);
  }, [messageHistory]);

  return { completedTactics };
}
