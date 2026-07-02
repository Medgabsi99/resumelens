"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import { createBrowserClient } from "@/lib/supabase";
import { useToast } from "@/components/ToastProvider";
import OnboardingTour, { resetOnboardingTour } from "@/components/OnboardingTour";

interface UserProfile {
  id: string;
  email: string;
  plan: "free" | "one_time" | "monthly";
  analyses_used: number;
  analyses_limit: number;
  stripe_customer_id: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Email form
  const [newEmail, setNewEmail] = useState("");
  const [updatingEmail, setUpdatingEmail] = useState(false);

  // Password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Billing states
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Deletion modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Tour replay
  const [tourReplayOpen, setTourReplayOpen] = useState(false);

  useEffect(() => {
    async function loadSettingsData() {
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) {
          router.push("/login");
          return;
        }

        setUserEmail(user.email || null);

        const { data: profileData, error: profileErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!profileErr && profileData) {
          setProfile(profileData as UserProfile);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettingsData();
  }, [supabase, router]);

  async function handleUpdateEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;

    setUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      toastSuccess(
        "Confirmation links have been sent to both your old and new email addresses.",
        "Email update initiated"
      );
      setNewEmail("");
    } catch (err: any) {
      toastError(err.message || "Failed to update email.", "Error updating email");
    } finally {
      setUpdatingEmail(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword.trim()) return;

    if (newPassword !== confirmPassword) {
      toastError("Passwords do not match.", "Validation error");
      return;
    }

    if (newPassword.length < 6) {
      toastError("Password must be at least 6 characters.", "Validation error");
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toastSuccess("Your password has been changed successfully.", "Password updated");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toastError(err.message || "Failed to update password.", "Error updating password");
    } finally {
      setUpdatingPassword(false);
    }
  }

  async function handleManageBilling() {
    if (!profile?.stripe_customer_id) {
      toastError("No billing customer profile found.", "Error");
      return;
    }

    setLoadingPortal(true);
    try {
      const res = await fetch("/api/create-portal-session", { method: "POST" });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to launch billing portal");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toastError(err.message || "Failed to open billing portal.", "Billing Portal Error");
    } finally {
      setLoadingPortal(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteText !== "delete my account") {
      toastError("Please type 'delete my account' to confirm.", "Confirmation error");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to delete account");
      }

      toastSuccess("Your account and all associated data have been deleted.", "Account Deleted");
      
      // Sign out client-side and redirect
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (err: any) {
      toastError(err.message || "Failed to delete account.", "Deletion Error");
      setDeleting(false);
    }
  }

  const getPlanLabel = (plan: string) => {
    switch (plan) {
      case "monthly":
        return "Pro Monthly Subscriber";
      case "one_time":
        return "Lifetime Access (Pro)";
      case "free":
      default:
        return "Free Plan";
    }
  };

  const getPlanBadgeStyles = (plan: string) => {
    switch (plan) {
      case "monthly":
        return { background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", border: "1px solid rgba(139, 92, 246, 0.2)" };
      case "one_time":
        return { background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" };
      case "free":
      default:
        return { background: "rgba(107, 114, 128, 0.1)", color: "#6b7280", border: "1px solid rgba(107, 114, 128, 0.2)" };
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-4">
        {/* Page Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", fontFamily: "Instrument Sans, sans-serif", letterSpacing: "-0.02em", margin: "0 0 6px 0" }}>
            Account Settings
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "var(--ink-muted)" }}>
            Update your account details, manage your billing plan, and update your security settings.
          </p>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ height: 180, background: "var(--paper-card)", borderRadius: 16, border: "1px solid var(--border)", animation: "pulse 1.5s infinite" }} />
            <div style={{ height: 180, background: "var(--paper-card)", borderRadius: 16, border: "1px solid var(--border)", animation: "pulse 1.5s infinite" }} />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            
            {/* PROFILE & SECURITY */}
            <div style={{
              background: "var(--paper-card)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px 0", color: "var(--ink)" }}>Profile Credentials</h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>Update your sign-in email address or change password.</p>
              </div>

              {/* Update Email Form */}
              <form onSubmit={handleUpdateEmail} style={{ display: "flex", flexDirection: "column", gap: 12, borderBottom: "1px solid var(--border)", paddingBottom: 24 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="current-email" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-muted)" }}>Current Email</label>
                  <input
                    id="current-email"
                    type="text"
                    disabled
                    value={userEmail || ""}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--paper-warm)",
                      color: "var(--ink-faint)",
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label htmlFor="new-email" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-muted)" }}>New Email</label>
                  <input
                    id="new-email"
                    type="email"
                    required
                    placeholder="Enter new email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--paper-card)",
                      color: "var(--ink)",
                      fontSize: 14,
                      outline: "none",
                      transition: "border 0.15s",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                    onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                  <button
                    type="submit"
                    disabled={updatingEmail || !newEmail.trim()}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      background: updatingEmail || !newEmail.trim() ? "var(--border)" : "var(--accent)",
                      color: "white",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: updatingEmail || !newEmail.trim() ? "not-allowed" : "pointer",
                      transition: "background 0.15s",
                    }}
                  >
                    {updatingEmail ? "Sending Links..." : "Update Email"}
                  </button>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "var(--ink-faint)", lineHeight: 1.4 }}>
                  💡 <em>Note:</em> Supabase sends verification links to both the old and new email addresses. The email will not change until both links are clicked.
                </p>
              </form>

              {/* Change Password Form */}
              <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label htmlFor="new-password" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-muted)" }}>New Password</label>
                    <input
                      id="new-password"
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--paper-card)",
                        color: "var(--ink)",
                        fontSize: 14,
                        outline: "none",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label htmlFor="confirm-password" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-muted)" }}>Confirm Password</label>
                    <input
                      id="confirm-password"
                      type="password"
                      required
                      placeholder="Re-type new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid var(--border)",
                        background: "var(--paper-card)",
                        color: "var(--ink)",
                        fontSize: 14,
                        outline: "none",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
                  <button
                    type="submit"
                    disabled={updatingPassword || !newPassword.trim()}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      background: updatingPassword || !newPassword.trim() ? "var(--border)" : "var(--accent)",
                      color: "white",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: updatingPassword || !newPassword.trim() ? "not-allowed" : "pointer",
                      transition: "background 0.15s",
                    }}
                  >
                    {updatingPassword ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </form>
            </div>

            {/* BILLING & PLANS */}
            <div style={{
              background: "var(--paper-card)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px 0", color: "var(--ink)" }}>Billing & Subscription</h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>View your plan details, download invoices, or cancel a subscription.</p>
              </div>

              {profile && (
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  background: "var(--paper-warm)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  flexWrap: "wrap",
                  gap: 12,
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>Current Plan</span>
                      <span style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        ...getPlanBadgeStyles(profile.plan)
                      }}>
                        {getPlanLabel(profile.plan)}
                      </span>
                    </div>
                    {profile.plan === "free" ? (
                      <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                        Includes 2 free resume reviews and ATS analysis scans.
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>
                        You have unlocked full access to all resume rewriter and template tools!
                      </span>
                    )}
                  </div>

                  <div style={{ flexShrink: 0 }}>
                    {profile.plan === "monthly" || profile.stripe_customer_id ? (
                      <button
                        onClick={handleManageBilling}
                        disabled={loadingPortal}
                        style={{
                          padding: "9px 16px",
                          borderRadius: 10,
                          background: "transparent",
                          color: "var(--accent)",
                          border: "1.5px solid var(--accent-border)",
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: loadingPortal ? "not-allowed" : "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--accent-bg)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {loadingPortal ? "Launching Portal..." : "Manage Billing & Cancel"}
                      </button>
                    ) : profile.plan === "free" ? (
                      <Link
                        href="/pricing"
                        style={{
                          padding: "9px 16px",
                          borderRadius: 10,
                          background: "var(--accent)",
                          color: "white",
                          border: "none",
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: "none",
                          display: "inline-block",
                          textAlign: "center",
                          transition: "background 0.15s",
                        }}
                      >
                        Upgrade to Pro ➔
                      </Link>
                    ) : null}
                  </div>
                </div>
              )}
            </div>

            {/* CHROME EXTENSION INTEGRATION */}
            <div style={{
              background: "var(--paper-card)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px 0", color: "var(--ink)", display: "flex", alignItems: "center", gap: 8 }}>
                    🔌 Chrome Extension Integration
                  </h2>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>
                    Analyze compatibility and track applications directly from LinkedIn, Indeed, Greenhouse, and Lever.
                  </p>
                </div>
                <span style={{
                  background: "rgba(139, 92, 246, 0.1)",
                  color: "#a78bfa",
                  border: "1px solid rgba(139, 92, 246, 0.2)",
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase"
                }}>
                  Developer Tool
                </span>
              </div>

              {/* Steps Layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, fontSize: 13 }} className="grid grid-cols-1 md:grid-cols-2">
                {/* Left col: value props */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "var(--ink)" }}>Key Capabilities:</h3>
                  <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 8, color: "var(--ink-muted)" }}>
                    <li>
                      🎯 <strong>Live Scraping</strong>: Instantly captures job roles, companies, and requirements from active tabs.
                    </li>
                    <li>
                      ⚖️ <strong>Direct Match Scoring</strong>: Compares candidate resume with listings using Gemini algorithms.
                    </li>
                    <li>
                      📬 <strong>Outreach Pitcher</strong>: Drafts customized recruiter cold-outreach templates on the fly.
                    </li>
                    <li>
                      📍 <strong>Board sync</strong>: Creates application tracker cards automatically.
                    </li>
                  </ul>
                </div>

                {/* Right col: Installation steps */}
                <div style={{
                  padding: 16,
                  background: "var(--paper-warm)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10
                }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "var(--ink)" }}>How to Install & Load:</h3>
                  <ol style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 6, color: "var(--ink-muted)", fontSize: 12, lineHeight: 1.4 }}>
                    <li>Open Chrome and navigate to <strong style={{ color: "var(--ink)", fontFamily: "monospace" }}>chrome://extensions/</strong></li>
                    <li>Toggle <strong>Developer mode</strong> in the top-right corner.</li>
                    <li>Click <strong>Load unpacked</strong> in the top-left menu.</li>
                    <li>Select the <code style={{ color: "var(--accent)", fontStyle: "italic" }}>chrome-extension</code> folder inside your local codebase directory.</li>
                    <li>Pin the extension, sign in to this web dashboard, and click the icon on any job posting page!</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* PREFERENCES */}
            <div style={{
              background: "var(--paper-card)",
              border: "1px solid var(--border)",
              borderRadius: 18,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px 0", color: "var(--ink)" }}>Preferences</h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>Personalization and onboarding options.</p>
              </div>

              <div style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "16px 20px",
                background: "var(--paper-warm)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                flexWrap: "wrap",
                gap: 12,
              }}>
                <div>
                  <p style={{ margin: "0 0 3px 0", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>
                    🎓 Onboarding Tour
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.4 }}>
                    Replay the 4-step feature walkthrough shown on first login.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetOnboardingTour();
                    setTourReplayOpen(true);
                  }}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 10,
                    background: "transparent",
                    color: "var(--accent)",
                    border: "1.5px solid var(--accent-border)",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent-bg)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  Replay Tour →
                </button>
              </div>
            </div>

            {/* DANGER ZONE */}
            <div style={{
              background: "var(--paper-card)",
              border: "1px dashed #ef4444",
              borderRadius: 18,
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 4px 0", color: "#ef4444" }}>Danger Zone</h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--ink-muted)" }}>Permanently delete your account. This is irreversible.</p>
              </div>

              <div style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                padding: "16px 20px",
                background: "rgba(239, 68, 68, 0.04)",
                border: "1px solid rgba(239, 68, 68, 0.1)",
                borderRadius: 12,
                flexWrap: "wrap",
                gap: 12,
              }}>
                <div style={{ flex: 1, paddingRight: 20 }}>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--ink)", fontWeight: 500, marginBottom: 4 }}>
                    Delete Account & Data
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--ink-muted)", lineHeight: 1.4 }}>
                    Your subscription will be canceled and all saved resumes, job tracker logs, analysis results, and portfolio pages will be deleted forever.
                  </p>
                </div>
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: 10,
                    background: "#ef4444",
                    color: "white",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#dc2626"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#ef4444"}
                >
                  Delete Account
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Account Deletion Confirmation Modal */}
      {deleteConfirmOpen && (
        <>
          <div
            onClick={() => !deleting && setDeleteConfirmOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(5px)",
              zIndex: 9998,
            }}
          />
          <div style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(460px, calc(100vw - 32px))",
            background: "var(--paper-card)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            borderRadius: 18,
            boxShadow: "0 32px 64px -16px rgba(0,0,0,0.45)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "Instrument Sans, system-ui, sans-serif",
            padding: 24,
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 10px 0", color: "#ef4444" }}>
              Are you absolutely sure?
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>
              This action cannot be undone. All saved data will be deleted immediately, and your subscription in Stripe will be canceled.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
              <label htmlFor="confirm-delete-text" style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-muted)" }}>
                Please type <strong style={{ color: "var(--ink)" }}>delete my account</strong> to confirm:
              </label>
              <input
                id="confirm-delete-text"
                type="text"
                disabled={deleting}
                placeholder="delete my account"
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--paper-card)",
                  color: "var(--ink)",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", justifySelf: "flex-end", gap: 12, justifyContent: "flex-end" }}>
              <button
                disabled={deleting}
                onClick={() => setDeleteConfirmOpen(false)}
                style={{
                  padding: "9px 16px",
                  borderRadius: 10,
                  background: "transparent",
                  color: "var(--ink-muted)",
                  border: "1.5px solid var(--border)",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                Cancel
              </button>
              <button
                disabled={deleting || deleteText !== "delete my account"}
                onClick={handleDeleteAccount}
                style={{
                  padding: "9px 16px",
                  borderRadius: 10,
                  background: deleting || deleteText !== "delete my account" ? "var(--border)" : "#ef4444",
                  color: "white",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: deleting || deleteText !== "delete my account" ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </>
      )}
      {/* Tour Replay Overlay */}
      {tourReplayOpen && (
        <OnboardingTour
          forceOpen={tourReplayOpen}
          onClose={() => setTourReplayOpen(false)}
        />
      )}
    </DashboardLayout>
  );
}
