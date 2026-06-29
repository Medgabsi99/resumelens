import SharedEmptyState from "@/components/EmptyState";

interface EmptyStateProps {
  onAdd: () => void;
}

export default function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <SharedEmptyState
      illustration="applications"
      title="No job applications yet"
      description="Organize your job search. Add your first application to track status, deadlines, notes, and never miss a follow-up."
      ctaLabel="+ Add Your First Application"
      onCtaClick={onAdd}
      secondaryHref="/dashboard"
      secondaryLabel="View Dashboard"
    />
  );
}
