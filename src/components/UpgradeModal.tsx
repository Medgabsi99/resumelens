import { X, Check } from "lucide-react";

interface Props {
  preview: { score: number; summary: string; strengths: string[] } | null;
  onClose: () => void;
}

export default function UpgradeModal({ preview, onClose }: Props) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md"
      style={{
        background: "var(--modal-backdrop)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-card bg-paper-card border border-border p-8 rounded-2xl relative shadow-premium max-w-xl w-full fade-up"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 40px var(--brand-glow)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close upgrade modal"
          className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-ink-faint hover:text-ink transition-colors duration-150 flex items-center justify-center"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-8">
          <div className="font-display text-2xl font-bold mb-2">Full Access Unlocked</div>
          <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto mb-4">
            All AI resume analysis, tailoring, and career optimization tools are 100% free and
            unlimited.
          </p>
          {preview && (
            <div className="mt-4">
              <div className="font-display text-5xl text-accent font-bold mb-2">
                {preview.score}
              </div>
              <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto mb-4">
                {preview.summary}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {preview.strengths.slice(0, 2).map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1"
                    style={{
                      background: "rgba(16, 185, 129, 0.08)",
                      color: "#10b981",
                      borderColor: "rgba(16, 185, 129, 0.2)",
                    }}
                  >
                    <Check size={11} />
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full btn-gradient py-3 rounded-xl text-sm font-bold cursor-pointer"
        >
          Continue with Full Report
        </button>
      </div>
    </div>
  );
}
