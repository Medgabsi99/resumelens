import React from "react";

interface EmptyStateProps {
  onAdd: () => void;
}

export default function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-6 glass-card bg-paper-card border border-border rounded-2xl shadow-premium max-w-xl mx-auto">
      <div className="text-5xl mb-6">📋</div>
      <h3 className="text-xl font-bold text-ink mb-2">
        No job applications yet
      </h3>
      <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto mb-8">
        Organize your job search. Add your first application to track status, deadlines, notes, and never miss a follow-up.
      </p>
      <button
        onClick={onAdd}
        className="btn-gradient px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer shadow-premium"
      >
        + Add Your First Application
      </button>
    </div>
  );
}
