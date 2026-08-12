"use client";

import { useState, useMemo } from "react";
import {
  X,
  Mail,
  Send,
  Copy,
  Check,
  Sparkles,
  UserCheck,
  Building2,
  Briefcase,
  MessageSquare,
} from "lucide-react";
import { useToast } from "./ToastProvider";
import ModalErrorBoundary from "./ModalErrorBoundary";

interface Props {
  companyName: string;
  jobTitle: string;
  contactName?: string;
  onClose: () => void;
}

export type OutreachTarget = "recruiter" | "hiring_manager" | "executive";
export type OutreachTemplateType = "inmail" | "cold_email" | "followup";

function RecruiterOutreachContent({
  companyName,
  jobTitle,
  contactName = "Hiring Team",
  onClose,
}: Props) {
  const { success: toastSuccess } = useToast();
  const [targetType, setTargetType] = useState<OutreachTarget>("recruiter");
  const [templateType, setTemplateType] = useState<OutreachTemplateType>("inmail");
  const [copied, setCopied] = useState(false);
  const [outreachStatus, setOutreachStatus] = useState<"draft" | "sent" | "opened" | "replied">(
    "draft"
  );

  const handleUpdateStatus = (status: "draft" | "sent" | "opened" | "replied") => {
    setOutreachStatus(status);
    toastSuccess(`Outreach status updated to ${status.toUpperCase()}`, "CRM Status Saved");
  };

  // ── Outreach Message Templates Generator ───────────────────
  const messages = useMemo(() => {
    const contactDisplay = contactName || "Hiring Team";

    if (templateType === "inmail") {
      return {
        subject: `Quick Question — ${jobTitle} Role at ${companyName}`,
        body: `Hi ${contactDisplay},

I recently applied for the ${jobTitle} position at ${companyName} and wanted to reach out directly.

With a strong background in software engineering, system architecture, and delivering high-scalability applications, I'm confident my experience aligns well with the team's goals.

I'd love to connect briefly or share a quick overview of my recent projects. Thanks for your time!

Best regards,
[Your Name]`,
      };
    }

    if (templateType === "cold_email") {
      return {
        subject: `Application & Introduction — ${jobTitle} — [Your Name]`,
        body: `Dear ${contactDisplay},

I hope this email finds you well!

I recently submitted my application for the ${jobTitle} role at ${companyName}. Given ${companyName}'s current expansion and innovation roadmap, I wanted to reach out personally to express my strong interest in joining the team.

Key highlights from my background:
• Architected scalable web services serving 100k+ active users.
• Reduced system latency by 35% through query & cache optimizations.
• Led cross-functional sprint executions delivering core product features on schedule.

I have attached my tailored resume for your convenience. I would welcome the opportunity to discuss how my technical skills can contribute to ${companyName}'s success.

Thank you for your time and consideration!

Warm regards,
[Your Name]
[Your Phone Number] | [Your Portfolio / LinkedIn Link]`,
      };
    }

    return {
      subject: `Thank You — ${jobTitle} Interview — [Your Name]`,
      body: `Hi ${contactDisplay},

Thank you very much for your time during our interview today regarding the ${jobTitle} role at ${companyName}.

I really enjoyed our discussion about the upcoming technical roadmap and team culture. It further reinforced my enthusiasm for joining ${companyName} and helping drive key product milestones.

Please let me know if you need any additional information or work samples from my end. I look forward to the next steps!

Best,
[Your Name]`,
    };
  }, [companyName, jobTitle, contactName, templateType]);

  const handleCopyMessage = () => {
    const textToCopy = `Subject: ${messages.subject}\n\n${messages.body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toastSuccess("Outreach message copied to clipboard!", "Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10, 10, 12, 0.90)",
        backdropFilter: "blur(14px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflowY: "auto",
      }}
      className="print:hidden"
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          background: "var(--paper-card)",
          border: "1.5px solid var(--border)",
          borderRadius: "20px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(6, 182, 212, 0.15)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#06b6d4",
              }}
            >
              <Send size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "var(--ink)" }}>
                Recruiter Cold Email & Outreach CRM Architect
              </h3>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--ink-muted)" }}>
                Generate targeted LinkedIn InMails and recruiter outreach messages for {companyName}
                .
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              color: "var(--ink-muted)",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Type Selector */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button
            onClick={() => setTemplateType("inmail")}
            style={{
              background: templateType === "inmail" ? "var(--accent)" : "var(--paper)",
              color: templateType === "inmail" ? "white" : "var(--ink-muted)",
              border: `1.5px solid ${templateType === "inmail" ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: templateType === "inmail" ? 700 : 500,
              cursor: "pointer",
            }}
          >
            LinkedIn InMail (Short)
          </button>

          <button
            onClick={() => setTemplateType("cold_email")}
            style={{
              background: templateType === "cold_email" ? "var(--accent)" : "var(--paper)",
              color: templateType === "cold_email" ? "white" : "var(--ink-muted)",
              border: `1.5px solid ${templateType === "cold_email" ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: templateType === "cold_email" ? 700 : 500,
              cursor: "pointer",
            }}
          >
            Direct Recruiter Cold Email
          </button>

          <button
            onClick={() => setTemplateType("followup")}
            style={{
              background: templateType === "followup" ? "var(--accent)" : "var(--paper)",
              color: templateType === "followup" ? "white" : "var(--ink-muted)",
              border: `1.5px solid ${templateType === "followup" ? "var(--accent)" : "var(--border)"}`,
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "12px",
              fontWeight: templateType === "followup" ? 700 : 500,
              cursor: "pointer",
            }}
          >
            Post-Interview Thank You
          </button>
        </div>

        {/* Message Content Container */}
        <div
          style={{
            background: "#0d1117",
            border: "1px solid #30363d",
            borderRadius: "12px",
            padding: "16px",
            color: "#e6edf3",
            fontSize: "13px",
            lineHeight: "1.6",
          }}
        >
          <div
            style={{
              marginBottom: "12px",
              paddingBottom: "8px",
              borderBottom: "1px solid #21262d",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#8b949e",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Subject Line:
            </span>
            <div
              style={{ fontWeight: 700, color: "#58a6ff", fontSize: "13.5px", marginTop: "2px" }}
            >
              {messages.subject}
            </div>
          </div>

          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "inherit",
              margin: 0,
              color: "#c9d1d9",
            }}
          >
            {messages.body}
          </pre>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            width: "100%",
          }}
        >
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[10px] font-mono font-bold uppercase text-[var(--ink-faint)]">
              CRM Status:
            </span>
            {(["draft", "sent", "opened", "replied"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleUpdateStatus(st)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                  outreachStatus === st
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-[var(--paper)] border border-[var(--border)] text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyMessage}
            style={{
              background: copied ? "#10b981" : "var(--accent)",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
              fontSize: "12.5px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 14px rgba(139, 92, 246, 0.35)",
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            <span>{copied ? "Message Copied!" : "Copy Outreach Message"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RecruiterOutreachModal(props: Props) {
  return (
    <ModalErrorBoundary modalTitle="Recruiter Outreach Error" onClose={props.onClose}>
      <RecruiterOutreachContent {...props} />
    </ModalErrorBoundary>
  );
}
