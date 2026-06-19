"use client";

/**
 * Skeleton primitives — composable building blocks for loading states.
 * All components use the existing `.skeleton` class from globals.css
 * (shimmer gradient animation already defined there).
 *
 * Usage:
 *   <SkeletonLine width="60%" />
 *   <SkeletonBlock height={80} />
 *   <SkeletonCard rows={3} />
 *   <SkeletonTable rows={5} cols={4} />
 *   <SkeletonHistoryCard />
 *   <SkeletonStatRow />
 */

interface LineProps {
  width?: string | number;
  height?: number;
  className?: string;
}

/** A single shimmer line — mimics a text run */
export function SkeletonLine({ width = "100%", height = 13, className = "" }: LineProps) {
  return (
    <div
      className={`skeleton rounded ${className}`}
      style={{ width, height }}
    />
  );
}

interface BlockProps {
  height?: number;
  width?: string | number;
  radius?: number;
  className?: string;
}

/** A rectangular shimmer block — mimics an image or chart */
export function SkeletonBlock({
  height = 120,
  width = "100%",
  radius = 12,
  className = "",
}: BlockProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ height, width, borderRadius: radius }}
    />
  );
}

interface CircleProps {
  size?: number;
  className?: string;
}

/** A circular shimmer — mimics an avatar or score ring */
export function SkeletonCircle({ size = 40, className = "" }: CircleProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0 }}
    />
  );
}

interface CardProps {
  /** Number of text line rows inside the card */
  rows?: number;
  showAvatar?: boolean;
  className?: string;
}

/** A standard content card skeleton */
export function SkeletonCard({ rows = 3, showAvatar = false, className = "" }: CardProps) {
  return (
    <div
      className={`glass-card bg-paper-card border border-border rounded-xl p-4 flex flex-col gap-3 ${className}`}
    >
      {showAvatar && (
        <div className="flex items-center gap-3">
          <SkeletonCircle size={36} />
          <div className="flex flex-col gap-2 flex-1">
            <SkeletonLine width="55%" height={12} />
            <SkeletonLine width="35%" height={10} />
          </div>
        </div>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine
          key={i}
          width={i === rows - 1 ? "65%" : "100%"}
          height={i === 0 ? 14 : 12}
        />
      ))}
    </div>
  );
}

interface TableProps {
  rows?: number;
  cols?: number;
  className?: string;
}

/** A table skeleton — mimics rows of data in a table */
export function SkeletonTable({ rows = 4, cols = 4, className = "" }: TableProps) {
  const colWidths = ["40%", "15%", "20%", "15%", "10%"];
  return (
    <div className={`space-y-0 ${className}`}>
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-border mb-1">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width={colWidths[i] ?? "20%"} height={10} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-3.5 border-b border-border/50">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine
              key={c}
              width={c === 0 ? colWidths[0] : colWidths[c] ?? "20%"}
              height={c === 0 ? 13 : 11}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** History card skeleton — used in Interviews, Negotiator, Learning Paths history lists */
export function SkeletonHistoryCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-paper border border-border p-3.5 rounded-xl space-y-2.5 ${className}`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex flex-col gap-1.5 flex-1">
          <SkeletonLine width="58%" height={13} />
          <SkeletonLine width="38%" height={10} />
        </div>
        <SkeletonBlock width={44} height={22} radius={6} />
      </div>
      <div className="flex gap-1.5">
        <SkeletonBlock width={56} height={18} radius={4} />
        <SkeletonBlock width={70} height={18} radius={4} />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-border/50">
        <SkeletonLine width="30%" height={9} />
        <div className="flex gap-2">
          <SkeletonBlock width={42} height={16} radius={4} />
          <SkeletonBlock width={38} height={16} radius={4} />
        </div>
      </div>
    </div>
  );
}

/** Stat row skeleton — used for negotiator / learning path summary rows */
export function SkeletonStatRow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 py-3 border-b border-border/50 ${className}`}>
      <SkeletonCircle size={28} />
      <div className="flex flex-col gap-1.5 flex-1">
        <SkeletonLine width="45%" height={12} />
        <SkeletonLine width="28%" height={10} />
      </div>
      <SkeletonBlock width={52} height={22} radius={8} />
    </div>
  );
}

/** Full-page board skeleton — replaces the spinner on heavy boards */
export function SkeletonBoard({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-6 fade-up ${className}`}>
      {/* Header area */}
      <div className="flex justify-between items-center gap-4">
        <div className="space-y-2">
          <SkeletonLine width={220} height={32} />
          <SkeletonLine width={340} height={13} />
        </div>
        <SkeletonBlock width={140} height={42} radius={12} />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card bg-paper-card border border-border p-4 rounded-2xl space-y-3">
            <SkeletonLine width="50%" height={10} />
            <SkeletonLine width="35%" height={28} />
            <SkeletonLine width="65%" height={10} />
          </div>
        ))}
      </div>

      {/* Content area */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} rows={2} />
        ))}
      </div>
    </div>
  );
}
