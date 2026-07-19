import { logger } from "@/lib/logger";
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ApplicationStatus,
  APPLICATION_STATUS_LABELS,
  JobApplication,
  Priority,
} from "@/types";

interface EditApplicationModalProps {
  application: JobApplication;
  onClose: () => void;
  onUpdated: (app: JobApplication) => void;
}

export default function EditApplicationModal({
  application,
  onClose,
  onUpdated,
}: EditApplicationModalProps) {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [priority, setPriority] = useState<Priority>(application.priority);
  const [notes, setNotes] = useState(application.notes || "");
  const [followUpAt, setFollowUpAt] = useState(
    application.follow_up_at ? application.follow_up_at.split("T")[0] : ""
  );
  const [contactName, setContactName] = useState(application.contact_name || "");
  const [contactEmail, setContactEmail] = useState(application.contact_email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const update: Record<string, unknown> = { status, priority, notes };
    if (followUpAt) update.follow_up_at = new Date(followUpAt).toISOString();
    else update.follow_up_at = null;
    if (contactName.trim()) update.contact_name = contactName.trim();
    else update.contact_name = null;
    if (contactEmail.trim()) update.contact_email = contactEmail.trim();
    else update.contact_email = null;

    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Failed to update");
        return;
      }
      onUpdated(data.data);
    } catch (err) {
      logger.error("Update application failed", err);
      setError("Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--ink-muted)",
    marginBottom: 4,
    display: "block",
  };

  return (
    <motion.div
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--modal-backdrop)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 32, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 16, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{
          background: "var(--paper-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          maxWidth: 500,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px -15px var(--shadow-color)",
        }}
      >
        <form onSubmit={handleSubmit}>
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
                color: "var(--ink)",
              }}
            >
              Edit Application
            </h2>
            <p
              style={{
                fontSize: 13,
                color: "var(--ink-muted)",
                margin: "4px 0 0",
              }}
            >
              {application.job_title} at {application.company_name}
            </p>
          </div>

          <div style={{ padding: "20px 24px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                  className="premium-input cursor-pointer"
                >
                  {Object.entries(APPLICATION_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className="premium-input cursor-pointer"
                >
                  <option value="low">◎ Low</option>
                  <option value="medium">◉ Medium</option>
                  <option value="high">● High</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label style={labelStyle}>Follow-up by</label>
                <input
                  type="date"
                  value={followUpAt}
                  onChange={(e) => setFollowUpAt(e.target.value)}
                  className="premium-input"
                />
              </div>
              <div>
                <label style={labelStyle}>Contact name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Sarah (Recruiter)"
                  className="premium-input"
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Contact email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="recruiter@company.com"
                className="premium-input"
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any context, follow-up tasks, or reminders..."
                className="premium-input min-h-[80px] resize-y"
              />
            </div>

            {error && (
              <div
                style={{
                  background: "#fce8e8",
                  border: "1px solid rgba(122,32,32,0.3)",
                  color: "#7a2020",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                color: "var(--ink-muted)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "9px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "Instrument Sans, sans-serif",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--paper-warm)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-gradient"
              style={{
                borderRadius: "var(--radius)",
                padding: "9px 22px",
                fontSize: 13,
                fontWeight: 600,
                cursor: isSubmitting ? "not-allowed" : "pointer",
                fontFamily: "Instrument Sans, sans-serif",
              }}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
