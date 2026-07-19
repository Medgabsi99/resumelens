import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen relative flex items-center justify-center p-6 bg-paper overflow-hidden">
      {/* Background decoration */}
      <div className="glow-blob animate-blob-1 top-[-100px] left-[10%] w-[400px] h-[400px]" />
      <div className="glow-blob animate-blob-2 bottom-[-100px] right-[10%] w-[400px] h-[400px]" style={{ animationDelay: "-4s", background: "radial-gradient(circle, var(--accent-border) 0%, transparent 70%)" }} />

      <div className="relative z-10 glass-card bg-paper-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-2xl hover:translate-y-0 hover:border-border">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />

        <div className="w-16 h-16 rounded-full bg-accent-bg flex items-center justify-center text-accent mx-auto mb-6 text-2xl font-mono border border-accent-border">
          404
        </div>

        <h1 className="font-display text-3xl font-bold tracking-tight text-ink mb-3">
          Page Not Found
        </h1>
        
        <p className="text-ink-muted text-sm mb-6 leading-relaxed">
          The page you are looking for doesn&apos;t exist, has been moved, or the URL might be incorrect.
        </p>

        <div className="flex justify-center">
          <Link
            href="/dashboard"
            className="btn-gradient px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 no-underline text-center flex items-center gap-2"
          >
            <LayoutDashboard size={14} /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
