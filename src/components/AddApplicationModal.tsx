"use client";
import { logger } from "@/lib/logger";

import { useState } from "react";
import {
  ApplicationStatus,
  APPLICATION_STATUS_LABELS,
  CreateApplicationRequest,
  JobApplication,
  Priority,
  PRIORITY_COLORS,
} from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (app: JobApplication) => void;
  defaultCompany?: string;
  defaultJobTitle?: string;
  defaultJobUrl?: string;
  defaultMatchScore?: number;
}

export default function AddApplicationModal({
  isOpen,
  onClose,
  onCreated,
  defaultCompany = "",
  defaultJobTitle = "",
  defaultJobUrl = "",
  defaultMatchScore,
}: Props) {
  const [companyName, setCompanyName] = useState(defaultCompany);
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [jobUrl, setJobUrl] = useState(defaultJobUrl);
  const [status, setStatus] = useState<ApplicationStatus>("saved");
  const [priority, setPriority] = useState<Priority>("medium");
  const [location, setLocation] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [appliedAt, setAppliedAt] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!companyName.trim() || !jobTitle.trim()) {
      setError("Company name and job title are required.");
      return;
    }

    setIsSubmitting(true);

    const payload: CreateApplicationRequest = {
      companyName: companyName.trim(),
      jobTitle: jobTitle.trim(),
      status,
      priority,
    };
    if (jobUrl.trim()) payload.jobUrl = jobUrl.trim();
    if (location.trim()) payload.location = location.trim();
    if (salaryMin.trim()) payload.salaryMin = parseInt(salaryMin, 10);
    if (salaryMax.trim()) payload.salaryMax = parseInt(salaryMax, 10);
    if (contactName.trim()) payload.contactName = contactName.trim();
    if (contactEmail.trim()) payload.contactEmail = contactEmail.trim();
    if (appliedAt) payload.appliedAt = new Date(appliedAt).toISOString();
    if (deadlineAt) payload.deadlineAt = new Date(deadlineAt).toISOString();
    if (followUpAt) payload.followUpAt = new Date(followUpAt).toISOString();
    if (notes.trim()) payload.notes = notes.trim();
    if (defaultMatchScore !== undefined) payload.matchScore = defaultMatchScore;

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.success) {
        setError(data?.error || "Failed to create application.");
        return;
      }

      onCreated(data.data);
      handleClose();
    } catch (err) {
      logger.error("Add application failed", err);
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    setCompanyName("");
    setJobTitle("");
    setJobUrl("");
    setStatus("saved");
    setPriority("medium");
    setLocation("");
    setSalaryMin("");
    setSalaryMax("");
    setContactName("");
    setContactEmail("");
    setAppliedAt("");
    setDeadlineAt("");
    setFollowUpAt("");
    setNotes("");
    setError(null);
    onClose();
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--ink-muted)",
    marginBottom: 4,
    display: "block",
  };

  return (
    <div
      onClick={handleClose}
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
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--paper-card)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          maxWidth: 640,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 60px -15px var(--shadow-color)",
        }}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--ink)",
                }}
              >
                Add Job Application
              </h2>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--ink-muted)",
                  margin: "4px 0 0",
                }}
              >
                Track your application from saved to offer
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--ink-muted)",
                fontSize: 24,
                lineHeight: 1,
                padding: 4,
              }}
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 24px" }}>
            {/* Required fields */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label style={labelStyle}>Company name *</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Google"
                  className="premium-input"
                  required
                />
              </div>
              <div>
                <label style={labelStyle}>Job title *</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Product Designer"
                  className="premium-input"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Job URL</label>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://..."
                className="premium-input"
              />
            </div>

            {/* Status & Priority */}
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
                  <option value="low">🟢 Low</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="high">🔴 High</option>
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
                <label style={labelStyle}>Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Remote, San Francisco"
                  className="premium-input"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <label style={labelStyle}>Salary min</label>
                  <input
                    type="number"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(e.target.value)}
                    placeholder="e.g. 100000"
                    className="premium-input"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Salary max</label>
                  <input
                    type="number"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(e.target.value)}
                    placeholder="e.g. 150000"
                    className="premium-input"
                  />
                </div>
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
                <label style={labelStyle}>Contact name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Sarah (Recruiter)"
                  className="premium-input"
                />
              </div>
              <div>
                <label style={labelStyle}>Contact email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="recruiter@company.com"
                  className="premium-input"
                />
              </div>
            </div>

            {/* Dates */}
            <div
              style={{
                fontSize: 11,
                fontFamily: "DM Mono, monospace",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--ink-faint)",
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              Important dates (optional)
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <div>
                <label style={labelStyle}>Applied on</label>
                <input
                  type="date"
                  value={appliedAt}
                  onChange={(e) => setAppliedAt(e.target.value)}
                  className="premium-input"
                />
              </div>
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
                <label style={labelStyle}>Deadline</label>
                <input
                  type="date"
                  value={deadlineAt}
                  onChange={(e) => setDeadlineAt(e.target.value)}
                  className="premium-input"
                />
              </div>
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

            {defaultMatchScore !== undefined && (
              <div
                style={{
                  background: "var(--accent-bg)",
                  border: "1px solid var(--accent-border)",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  color: "var(--ink)",
                  marginBottom: 12,
                }}
              >
                💡 Match score <strong>{defaultMatchScore}</strong> from your Job Match analysis will be saved with this application.
              </div>
            )}

            {error && (
              <div
                style={{
                  background: "#fce8e8",
                  border: "1px solid rgba(122,32,32,0.3)",
                  color: "#7a2020",
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
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
              onClick={handleClose}
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
              {isSubmitting ? "Adding..." : "Add Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
