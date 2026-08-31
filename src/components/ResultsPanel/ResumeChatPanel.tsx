"use client";

import React from "react";
import { MessageSquare, User, Sparkles, Send } from "lucide-react";
import styles from "../ResultsPanel.module.css";
import Section from "./Section";
import StreamingText from "@/components/StreamingText";
import { useResumeChat } from "./useResumeChat";

interface Props {
  resumeText?: string;
  jobDescription?: string;
  targetRole?: string;
}

export default function ResumeChatPanel({ resumeText, jobDescription, targetRole }: Props) {
  const { chatInput, setChatInput, chatHistory, isChatting, chatScrollRef, handleChatSubmit } =
    useResumeChat(resumeText, jobDescription, targetRole);

  return (
    <div
      className="print:hidden px-4 sm:px-[30px] pt-8 sm:pt-12 pb-12 mt-6 sm:mt-8 border-t border-border/40"
      id="chat-section"
    >
      <Section
        title={
          <span className="flex items-center gap-1.5">
            <MessageSquare size={16} />
            <span>Chat with your Resume</span>
          </span>
        }
        delay={7}
      >
        <div className={styles.chatBox}>
          <div
            ref={chatScrollRef}
            className={styles.chatScroll}
            style={{
              background: chatHistory.length === 0 ? "var(--paper-warm)" : "var(--paper)",
            }}
          >
            {chatHistory.length === 0 ? (
              <div className="text-center text-ink-muted text-xs py-8">
                <p className="mb-6 text-sm">
                  Have a specific question about your resume? Ask the AI below or try one of these
                  quick starts:
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                  {[
                    "How can I rewrite my summary to sound more confident?",
                    "What are the biggest keyword gaps for this role?",
                    "Suggest 3 strong action verbs to replace weak ones.",
                    "How can I format this to make it more readable?",
                  ].map((promptText) => (
                    <button
                      key={promptText}
                      onClick={() => handleChatSubmit(promptText)}
                      disabled={isChatting}
                      className={styles.chatQuickStart}
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              chatHistory.map((msg, i) => {
                const isLastAI = msg.role === "ai" && i === chatHistory.length - 1;
                const stillStreaming = isLastAI && isChatting;
                return (
                  <div
                    key={i}
                    className={msg.role === "user" ? styles.userMessageRow : styles.aiMessageRow}
                  >
                    <div className={msg.role === "user" ? styles.userAvatar : styles.aiAvatar}>
                      {msg.role === "user" ? <User size={13} /> : <Sparkles size={13} />}
                    </div>
                    <div className={msg.role === "user" ? styles.userBubble : styles.aiBubble}>
                      {msg.role === "ai" ? (
                        <StreamingText
                          text={msg.text}
                          isStreaming={stillStreaming}
                          style={{ fontSize: "13.5px", lineHeight: "1.6" }}
                        />
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {/* Show typing indicator while waiting for the first token */}
            {isChatting && chatHistory[chatHistory.length - 1]?.role !== "ai" && (
              <div className={styles.aiMessageRow}>
                <div className={styles.aiAvatar}>
                  <Sparkles size={13} />
                </div>
                <div className={styles.typingIndicator}>
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                  <span className={styles.typingDot} />
                </div>
              </div>
            )}
          </div>

          <div className={styles.chatInputRow}>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleChatSubmit();
                }}
                placeholder="Ask a question about your resume..."
                disabled={isChatting || !resumeText}
                className={styles.input}
              />
              <button
                onClick={() => handleChatSubmit()}
                disabled={isChatting || !chatInput.trim() || !resumeText}
                className={styles.sendBtn}
                aria-label="Send message"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
