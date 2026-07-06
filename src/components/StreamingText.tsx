"use client";

import { useEffect, useRef } from "react";

interface Props {
  /** The text content (grows as stream arrives) */
  text: string;
  /** Is the stream still actively flowing? Shows cursor if true */
  isStreaming: boolean;
  /** Optional CSS class on the container */
  className?: string;
  /** Optional inline style on the container */
  style?: React.CSSProperties;
}

/**
 * Converts a markdown-ish string into light HTML for display.
 * Handles: **bold**, *italic*, `code`, ## headings, - bullet lists, numbered lists.
 * No external dependency — pure string transforms, safe for streaming partial input.
 */
function markdownToHtml(raw: string): string {
  // Work line-by-line for structural elements, then apply inline styles
  const lines = raw.split("\n");
  const html: string[] = [];
  let inList = false;
  let inOL = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Close any open list if the current line is not a list item
    const isListItem = /^(\s*[-*+]|\s*\d+\.)\s/.test(line);
    const isOLItem = /^\s*\d+\.\s/.test(line);

    if (!isListItem && inList) {
      html.push("</ul>");
      inList = false;
    }
    if (!isOLItem && inOL) {
      html.push("</ol>");
      inOL = false;
    }

    // Headings
    if (/^#{3}\s/.test(line)) {
      html.push(`<h4 class="sl-h4">${inline(line.replace(/^#{3}\s/, ""))}</h4>`);
      continue;
    }
    if (/^#{2}\s/.test(line)) {
      html.push(`<h3 class="sl-h3">${inline(line.replace(/^#{2}\s/, ""))}</h3>`);
      continue;
    }
    if (/^#{1}\s/.test(line)) {
      html.push(`<h2 class="sl-h2">${inline(line.replace(/^#{1}\s/, ""))}</h2>`);
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      html.push(`<hr class="sl-hr" />`);
      continue;
    }

    // Ordered list item
    if (isOLItem) {
      if (!inOL) { html.push('<ol class="sl-ol">'); inOL = true; }
      html.push(`<li class="sl-li">${inline(line.replace(/^\s*\d+\.\s/, ""))}</li>`);
      continue;
    }

    // Unordered list item
    if (isListItem) {
      if (!inList) { html.push('<ul class="sl-ul">'); inList = true; }
      html.push(`<li class="sl-li">${inline(line.replace(/^(\s*[-*+])\s/, ""))}</li>`);
      continue;
    }

    // Empty line — paragraph break
    if (line.trim() === "") {
      html.push('<div class="sl-spacer" />');
      continue;
    }

    // Regular paragraph line
    html.push(`<p class="sl-p">${inline(line)}</p>`);
  }

  if (inList) html.push("</ul>");
  if (inOL) html.push("</ol>");

  return html.join("");
}

/** Apply inline markdown transforms: bold, italic, inline code */
function inline(text: string): string {
  return text
    // Escape bare HTML to avoid XSS from AI output
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // **bold**
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // *italic* or _italic_
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    // `inline code`
    .replace(/`([^`]+)`/g, '<code class="sl-code">$1</code>');
}

const STREAMING_CSS = `
.sl-streaming-container { font-family: 'Instrument Sans', system-ui, sans-serif; font-size: 14.5px; line-height: 1.75; color: var(--ink); }
.sl-h2 { font-family: 'DM Serif Display', serif; font-size: 20px; font-weight: 700; margin: 18px 0 6px; color: var(--ink); letter-spacing: -0.3px; }
.sl-h3 { font-family: 'DM Serif Display', serif; font-size: 17px; font-weight: 700; margin: 14px 0 4px; color: var(--ink); }
.sl-h4 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-muted); margin: 12px 0 4px; }
.sl-p  { margin: 0 0 4px; }
.sl-spacer { height: 10px; }
.sl-hr { border: none; border-top: 1px solid var(--border); margin: 16px 0; }
.sl-ul, .sl-ol { margin: 4px 0 8px 18px; padding: 0; }
.sl-li { margin: 3px 0; }
.sl-code { font-family: 'DM Mono', monospace; font-size: 12px; background: var(--accent-bg); color: var(--accent); padding: 1px 6px; border-radius: 4px; border: 1px solid var(--accent-border); }
@keyframes sl-cursor-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.sl-cursor { display: inline-block; width: 2px; height: 1.1em; background: var(--accent); border-radius: 1px; margin-left: 2px; vertical-align: text-bottom; animation: sl-cursor-blink 0.75s ease-in-out infinite; }
`;

export default function StreamingText({ text, isStreaming, className, style }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep container scrolled as content grows
  useEffect(() => {
    if (isStreaming && containerRef.current) {
      const el = containerRef.current;
      // Only auto-scroll if user is near the bottom
      const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      if (isNearBottom) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [text, isStreaming]);

  const renderedHtml = markdownToHtml(text);

  return (
    <>
      {/* Inject styles once — they're tiny and scoped with sl- prefix */}
      <style dangerouslySetInnerHTML={{ __html: STREAMING_CSS }} />
      <div
        ref={containerRef}
        className={`sl-streaming-container ${className || ""}`}
        style={style}
        // Safe: we control the markdown renderer and escape raw HTML
        dangerouslySetInnerHTML={{
          __html: renderedHtml + (isStreaming ? '<span class="sl-cursor" aria-hidden="true"></span>' : ""),
        }}
      />
    </>
  );
}
