export default function Loading() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-paper overflow-hidden">
      {/* Background decoration */}
      <div className="glow-blob animate-blob-1 top-[-100px] left-[10%] w-[400px] h-[400px]" />
      <div className="glow-blob animate-blob-2 bottom-[-100px] right-[10%] w-[400px] h-[400px]" style={{ animationDelay: "-4s", background: "radial-gradient(circle, var(--accent-border) 0%, transparent 70%)" }} />

      <div className="relative z-10 glass-card bg-paper-card border border-border rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl hover:translate-y-0 hover:border-border">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />

        {/* Pulse loading animation using design tokens from globals.css */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          <div className="w-3.5 h-3.5 rounded-full bg-accent dot-1" />
          <div className="w-3.5 h-3.5 rounded-full bg-accent dot-2" />
          <div className="w-3.5 h-3.5 rounded-full bg-accent dot-3" />
        </div>

        <h2 className="font-display text-xl font-bold tracking-tight text-ink mb-1.5 animate-pulse">
          Loading ResumeLens
        </h2>
        
        <p className="text-ink-muted text-xs font-mono">
          preparing your workspace...
        </p>
      </div>
    </div>
  );
}
