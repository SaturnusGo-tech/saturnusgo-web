// app/support/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  Mail,
  Phone,
  Paperclip,
  Trash2,
  Upload,
  Send,
  AlertTriangle,
  Info,
  CheckCircle2,
  Moon,
  Sun,
  Bug,
  Car,
  Hotel,
  Wallet,
  Sparkles,
  Ticket,
  Shield,
  MessageSquare,
  XCircle,
  FileText,
  Globe,
  Clock,
} from "lucide-react";

/* ===============================
   Background Grid (like Partners)
=============================== */
const BackgroundEffects = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div
      className="absolute inset-0 opacity-[0.015]"
      style={{
        backgroundImage: `
          linear-gradient(var(--grid) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
      }}
    />
  </div>
);

/* ===============================
   Theme Toggle (matches style)
=============================== */
function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isLight = mounted && resolvedTheme === "light";
  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className="theme-toggle"
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
      <span>{isLight ? "Dark" : "Light"}</span>
    </button>
  );
}

/* ===============================
   Utils
=============================== */
const LOGO =
  "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/logo.png";

const MAX_FILES = 5;
const MAX_TOTAL_MB = 20;
const ACCEPTED = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/json",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-gzip",
];

function formatBytes(bytes: number) {
  const kb = bytes / 1024;
  const mb = kb / 1024;
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  if (kb >= 1) return `${Math.ceil(kb)} KB`;
  return `${bytes} B`;
}

function makeTicketId() {
  return `SG-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

/* ===============================
   Types
=============================== */
type Category =
  | "rides"
  | "hotels"
  | "wallet"
  | "transfers"
  | "subscriptions"
  | "wishlists"
  | "events"
  | "account"
  | "privacy"
  | "partners"
  | "other";

type Severity = "low" | "normal" | "high" | "urgent";
type ContactMethod = "email" | "phone" | "telegram" | "whatsapp";

type Draft = {
  name: string;
  email: string;
  phone?: string;
  contactMethod: ContactMethod;
  category: Category;
  severity: Severity;
  subject: string;
  message: string;
  city?: string;
  region?: string;
  tripId?: string;
  bookingId?: string;
  transactionId?: string;
  ticketId?: string;
  attachLogs: boolean;
  consent: boolean;
};

/* ===============================
   Chips / helpers
=============================== */
const categoryMeta: {
  key: Category;
  label: string;
  icon: React.ComponentType<any>;
}[] = [
  { key: "rides", label: "Rides", icon: Car },
  { key: "hotels", label: "Hotels & SPA", icon: Hotel },
  { key: "wallet", label: "Wallet & Payments", icon: Wallet },
  { key: "transfers", label: "P2P Transfers", icon: Send },
  { key: "subscriptions", label: "Subscriptions", icon: Sparkles },
  { key: "wishlists", label: "Wishlists & AI", icon: MessageSquare },
  { key: "events", label: "Events & Tickets", icon: Ticket },
  { key: "account", label: "App / Account", icon: Bug },
  { key: "privacy", label: "Data & Privacy", icon: Shield },
  { key: "partners", label: "Partners", icon: FileText },
  { key: "other", label: "Other", icon: Info },
];

const suggestionsByCategory: Record<Category, string[]> = {
  rides: [
    "Price breakdown question",
    "Driver cancellation",
    "Trip routing issue",
    "Cash payment not accepted",
  ],
  hotels: [
    "Partial payment clarification",
    "Booking modification",
    "Receipt / invoice request",
    "Hotel details mismatch",
  ],
  wallet: [
    "Top-up not reflected",
    "Card charge clarification",
    "Refund timing",
    "Apple/Google Pay issue",
  ],
  transfers: [
    "Transfer pending",
    "Transfer failed",
    "Request money not delivered",
  ],
  subscriptions: [
    "Perks not applied",
    "Bonus accrual mismatch",
    "Plan downgrade/upgrade",
  ],
  wishlists: [
    "AI Weekend Planner result incorrect",
    "Saved Places visibility",
    "Wishlist sync",
  ],
  events: [
    "Ticket not delivered",
    "QR code not scanning",
    "Event cancellation",
  ],
  account: [
    "App crash on launch",
    "Login code not received",
    "Notifications issue",
  ],
  privacy: [
    "Data export request",
    "Data deletion request",
    "Privacy concern",
  ],
  partners: [
    "Integration support",
    "Partner portal access",
    "Reporting & analytics",
  ],
  other: ["General question", "Feedback", "Feature request"],
};

/* ===============================
   Main Page
=============================== */
export default function SupportCenterPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [online, setOnline] = useState(true);
  const [sending, setSending] = useState(false);
  const [justSentId, setJustSentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmitAt, setLastSubmitAt] = useState<number>(0);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const tone = mounted && resolvedTheme === "light" ? "light" : "dark";

  // Draft handling (autosave)
  const [draft, setDraft] = useState<Draft>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("supportDraft_v1");
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {}
      }
    }
    return {
      name: "",
      email: "",
      phone: "",
      contactMethod: "email",
      category: "rides",
      severity: "normal",
      subject: "",
      message: "",
      city: "",
      region: "",
      tripId: "",
      bookingId: "",
      transactionId: "",
      ticketId: "",
      attachLogs: false,
      consent: false,
    };
  });

  useEffect(() => {
    const id = setTimeout(() => {
      localStorage.setItem("supportDraft_v1", JSON.stringify(draft));
    }, 250);
    return () => clearTimeout(id);
  }, [draft]);

  const [files, setFiles] = useState<File[]>([]);
  const totalBytes = useMemo(
    () => files.reduce((sum, f) => sum + f.size, 0),
    [files]
  );

  function onFileAdd(incoming: FileList | File[]) {
    setError(null);
    const arr = Array.from(incoming);
    const all = [...files, ...arr];
    if (all.length > MAX_FILES) {
      setError(`Max ${MAX_FILES} files.`);
      return;
    }
    const total = all.reduce((s, f) => s + f.size, 0);
    if (total / 1024 / 1024 > MAX_TOTAL_MB) {
      setError(`Total size must be ≤ ${MAX_TOTAL_MB} MB.`);
      return;
    }
    const bad = arr.find((f) => !ACCEPTED.includes(f.type) && f.size > 0);
    if (bad) {
      setError("Unsupported file type.");
      return;
    }
    // dedupe by name+size
    const map = new Map<string, File>();
    for (const f of all) map.set(`${f.name}-${f.size}`, f);
    setFiles(Array.from(map.values()));
  }

  function removeFile(idx: number) {
    setFiles((x) => x.filter((_, i) => i !== idx));
  }

  const dragRef = useRef<HTMLLabelElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Debug info
  const debug = useMemo(() => {
    if (typeof window === "undefined") return {};
    return {
      ua: navigator.userAgent,
      lang: navigator.languages?.join(", ") || navigator.language,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      now: new Date().toString(),
      platform: (navigator as any).userAgentData?.platform || navigator.platform,
      screen: `${window.screen.width}x${window.screen.height}`,
    };
  }, [mounted]);

  // Validation
  const emailOk = /^\S+@\S+\.\S+$/.test(draft.email || "");
  const phoneOk =
    !draft.phone ||
    /^[+0-9()\-\s]{6,}$/.test(draft.phone); // optional, basic check
  const hasIdField =
    draft.category === "rides" ||
    draft.category === "hotels" ||
    draft.category === "wallet" ||
    draft.category === "events";
  const idFieldOk =
    draft.category !== "rides" ||
    (draft.category === "rides" && (draft.tripId || "").trim().length >= 5);
  const bookingOk =
    draft.category !== "hotels" ||
    (draft.category === "hotels" && (draft.bookingId || "").trim().length >= 5);
  const txnOk =
    draft.category !== "wallet" ||
    (draft.category === "wallet" &&
      (draft.transactionId || "").trim().length >= 4);
  const ticketOk =
    draft.category !== "events" ||
    (draft.category === "events" && (draft.ticketId || "").trim().length >= 4);

  const formValid =
    (draft.name || "").trim().length >= 2 &&
    emailOk &&
    phoneOk &&
    (draft.subject || "").trim().length >= 4 &&
    (draft.message || "").trim().length >= 10 &&
    idFieldOk &&
    bookingOk &&
    txnOk &&
    ticketOk &&
    draft.consent &&
    online;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // simple rate limit
    const now = Date.now();
    if (now - lastSubmitAt < 15000) {
      setError("Please wait a few seconds before sending again.");
      return;
    }

    if (!formValid) {
      setError("Please fill required fields correctly.");
      return;
    }

    setSending(true);

    // Simulate API call (UI only)
    await new Promise((r) => setTimeout(r, 1200));

    const ticket = makeTicketId();
    setLastSubmitAt(now);
    setJustSentId(ticket);
    setSending(false);

    // clear minimal but keep contact info for next time
    setFiles([]);
    setDraft((d) => ({
      ...d,
      subject: "",
      message: "",
      tripId: "",
      bookingId: "",
      transactionId: "",
      ticketId: "",
      consent: false,
    }));
    // keep draft saved
    localStorage.setItem("lastSupportTicketId", ticket);
  }

  const resolvedSuggestions = suggestionsByCategory[draft.category];

  return (
    <div className="support-program" data-tone={tone}>
      <BackgroundEffects />

      {/* Top Bar */}
      <header className="hero">
    

        <div className="hero-content">
          
          <h1 className="hero-title">
            Support Center <span className="hero-accent">— SaturnusGo</span>
          </h1>
          <p className="hero-sub">
            Get help with rides, hotels, payments, subscriptions, AI planner,
            events, and your account. We’re investor-stage — functionality rolls
            out gradually; this screen focuses on contact and case intake.
          </p>
        </div>
      </header>

      {/* Offline + Info banners */}
      <div className="wrap">
        {!online && (
          <div className="banner warn">
            <AlertTriangle size={16} />
            <span>Offline: sending is disabled until connection is restored.</span>
          </div>
        )}
        <div className="banner note">
          <Info size={16} />
          <span>
            For fastest resolution, include IDs (Trip / Booking / Transaction /
            Ticket) and relevant timestamps. Test data may appear while we are
            in staged rollout.
          </span>
        </div>
      </div>

      {/* Main layout */}
      <main className="wrap grid">
        {/* Left: Form */}
        <section className="card form-card">
          <form onSubmit={handleSubmit}>
            {/* Category pills */}
            <div className="pill-row">
              {categoryMeta.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  className={`pill ${draft.category === key ? "active" : ""}`}
                  onClick={() => setDraft((d) => ({ ...d, category: key }))}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Quick suggestions */}
            <div className="sugg-row">
              {resolvedSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="sugg"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      subject: d.subject ? d.subject : s,
                      message: d.message ? d.message : `${s} — details:\n`,
                    }))
                  }
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="grid-2">
              <div className="field">
                <label>Name*</label>
                <input
                  required
                  value={draft.name}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, name: e.target.value }))
                  }
                  placeholder="Your name"
                />
              </div>
              <div className="field">
                <label>Contact method*</label>
                <select
                  value={draft.contactMethod}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      contactMethod: e.target.value as ContactMethod,
                    }))
                  }
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="telegram">Telegram</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className={`field ${emailOk ? "" : "invalid"}`}>
                <label>Email*</label>
                <div className="input-icon">
                  <Mail size={14} />
                  <input
                    required
                    type="email"
                    value={draft.email}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, email: e.target.value }))
                    }
                    placeholder="name@example.com"
                  />
                </div>
              </div>
              <div className={`field ${phoneOk ? "" : "invalid"}`}>
                <label>Phone</label>
                <div className="input-icon">
                  <Phone size={14} />
                  <input
                    value={draft.phone || ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, phone: e.target.value }))
                    }
                    placeholder="+54 11 0000 0000"
                  />
                </div>
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Region / City</label>
                <div className="grid-2 tight">
                  <input
                    value={draft.region || ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, region: e.target.value }))
                    }
                    placeholder="Region/State"
                  />
                  <input
                    value={draft.city || ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, city: e.target.value }))
                    }
                    placeholder="City"
                  />
                </div>
              </div>
              <div className="field">
                <label>Severity*</label>
                <select
                  value={draft.severity}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, severity: e.target.value as Severity }))
                  }
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Context IDs (conditional) */}
            <AnimatePresence initial={false} mode="popLayout">
              {draft.category === "rides" && (
                <motion.div
                  className={`field ${idFieldOk ? "" : "invalid"}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <label>Trip ID*</label>
                  <input
                    value={draft.tripId || ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, tripId: e.target.value }))
                    }
                    placeholder="e.g., TRIP-XXXX"
                    required
                  />
                </motion.div>
              )}
              {draft.category === "hotels" && (
                <motion.div
                  className={`field ${bookingOk ? "" : "invalid"}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <label>Booking ID*</label>
                  <input
                    value={draft.bookingId || ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, bookingId: e.target.value }))
                    }
                    placeholder="e.g., BK-XXXX"
                    required
                  />
                </motion.div>
              )}
              {draft.category === "wallet" && (
                <motion.div
                  className={`field ${txnOk ? "" : "invalid"}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <label>Transaction ID*</label>
                  <input
                    value={draft.transactionId || ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, transactionId: e.target.value }))
                    }
                    placeholder="e.g., TXN-XXXX"
                    required
                  />
                </motion.div>
              )}
              {draft.category === "events" && (
                <motion.div
                  className={`field ${ticketOk ? "" : "invalid"}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <label>Ticket ID*</label>
                  <input
                    value={draft.ticketId || ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, ticketId: e.target.value }))
                    }
                    placeholder="e.g., EVT-XXXX"
                    required
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="field">
              <label>Subject*</label>
              <input
                required
                value={draft.subject}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, subject: e.target.value }))
                }
                placeholder="Short summary"
                maxLength={140}
              />
              <div className="hint">{draft.subject.length}/140</div>
            </div>

            <div className="field">
              <label>Message*</label>
              <textarea
                required
                rows={6}
                value={draft.message}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, message: e.target.value }))
                }
                placeholder="Describe the issue, steps to reproduce, expected behavior..."
                maxLength={4000}
              />
              <div className="hint">{draft.message.length}/4000</div>
            </div>

            {/* Attachments */}
            <div className="field">
              <label>Attachments (optional)</label>
              <label
                ref={dragRef}
                className={`drop ${dragOver ? "over" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  onFileAdd(e.dataTransfer.files);
                }}
              >
                <Upload size={16} />
                <span>
                  Drag & drop files here or{" "}
                  <strong>click to select (max {MAX_FILES}, {MAX_TOTAL_MB}MB)</strong>
                </span>
                <input
                  type="file"
                  multiple
                  accept={ACCEPTED.join(",")}
                  onChange={(e) => e.target.files && onFileAdd(e.target.files)}
                />
              </label>

              {files.length > 0 && (
                <ul className="file-list">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${f.size}-${i}`}>
                      <Paperclip size={14} />
                      <span title={f.name} className="fn">
                        {f.name}
                      </span>
                      <span className="fs">{formatBytes(f.size)}</span>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => removeFile(i)}
                        aria-label="Remove file"
                      >
                        <Trash2 size={14} />
                      </button>
                    </li>
                  ))}
                  <li className="totals">
                    <span>Total</span>
                    <span>{formatBytes(totalBytes)}</span>
                  </li>
                </ul>
              )}
            </div>

            {/* Flags */}
            <div className="grid-2">
              <label className="flag">
                <input
                  type="checkbox"
                  checked={draft.attachLogs}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, attachLogs: e.target.checked }))
                  }
                />
                <span>Attach basic device info</span>
              </label>
              <label className="flag">
                <input
                  type="checkbox"
                  checked={draft.consent}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, consent: e.target.checked }))
                  }
                />
                <span>I agree to be contacted regarding this request*</span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="error">
                <XCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <div className="actions">
              <button
                type="submit"
                disabled={!formValid || sending}
                className="btn primary"
              >
                {sending ? (
                  <span className="spinner" aria-hidden />
                ) : (
                  <Send size={16} />
                )}
                <span>{sending ? "Sending…" : "Send request"}</span>
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  localStorage.removeItem("supportDraft_v1");
                  setDraft((d) => ({
                    ...d,
                    subject: "",
                    message: "",
                    tripId: "",
                    bookingId: "",
                    transactionId: "",
                    ticketId: "",
                    consent: false,
                  }));
                  setFiles([]);
                }}
              >
                Clear draft
              </button>
            </div>

            {/* Success */}
            <AnimatePresence initial={false}>
              {justSentId && (
                <motion.div
                  className="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                >
                  <CheckCircle2 size={18} />
                  <div>
                    <strong>Request submitted.</strong>{" "}
                    <span>Ticket: {justSentId}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </section>

        {/* Right: Shortcuts & Info */}
        <aside className="card side">
          <h3 className="side-title">Contact shortcuts</h3>
          <div className="contact-grid">
            <Link href="mailto:founder@saturnusgo.com" className="contact-item">
              <Mail size={16} />
              <div>
                <div className="ci-title">Email</div>
                <div className="ci-sub">support@saturnusgo.app</div>
              </div>
            </Link>
            <a
              href="https://t.me/SaturnusgoSupportbot"
              target="_blank"
              rel="noreferrer"
              className="contact-item"
            >
              <MessageSquare size={16} />
              <div>
                <div className="ci-title">Telegram</div>
                <div className="ci-sub">@saturnusgo</div>
              </div>
            </a>
           
          </div>

          <div className="divider" />

          <h3 className="side-title">Helpful links</h3>
          <ul className="links">
            <li>
              <Link href="/faq">
                <Info size={14} />
                <span>FAQ</span>
              </Link>
            </li>
            <li>
              <Link href="/partners">
                <FileText size={14} />
                <span>Partners</span>
              </Link>
            </li>
            <li>
              <Link href="/partners/privacy">
                <Shield size={14} />
                <span>Privacy</span>
              </Link>
            </li>
            <li>
              <Link href="/status">
                <Globe size={14} />
                <span>Status (soon)</span>
              </Link>
            </li>
          </ul>

          <div className="divider" />

          <h3 className="side-title">Environment</h3>
          <ul className="env">
            <li>
              <span>Timezone</span>
              <code>{(debug as any).tz || "—"}</code>
            </li>
            <li>
              <span>Language</span>
              <code>{(debug as any).lang || "—"}</code>
            </li>
            <li>
              <span>Platform</span>
              <code>{(debug as any).platform || "—"}</code>
            </li>
            <li>
              <span>Screen</span>
              <code>{(debug as any).screen || "—"}</code>
            </li>
            <li className="muted">
              <Clock size={12} />
              <code>{(debug as any).now || "—"}</code>
            </li>
          </ul>
        </aside>
      </main>

      {/* Styles */}
      <style jsx global>{`
        /* ================================
           TOKENS — DARK (default)
        ==================================*/
        .support-program {
          --bg-0: #0a0b0d;
          --bg-1: #0f1115;
          --grid: rgba(255, 255, 255, 0.035);

          --txt: #e7e9ee;
          --txt-2: #c2c6cf;
          --txt-3: #9aa0a6;

          --white-02: rgba(255, 255, 255, 0.02);
          --white-06: rgba(255, 255, 255, 0.06);
          --white-08: rgba(255, 255, 255, 0.08);
          --white-12: rgba(255, 255, 255, 0.12);

          --primary: #646cff;
          --primary-hover: #5a63f0;

          --radius-md: 14px;
          --radius-lg: 20px;
          --radius-xl: 28px;

          --shadow-1: 0 10px 30px rgba(0, 0, 0, 0.28), 0 1px 0 rgba(255, 255, 255, 0.02) inset;
          --shadow-2: 0 24px 60px -20px rgba(0, 0, 0, 0.5);

          position: relative;
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 50%, var(--bg-0) 100%);
          color: var(--txt);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, system-ui, sans-serif;
        }

        /* ================================
           TOKENS — LIGHT
        ==================================*/
        .support-program[data-tone="light"],
        :global(html.light) .support-program {
          --bg-0: #f6f8fb;
          --bg-1: #ffffff;
          --grid: rgba(2, 6, 23, 0.06);

          --txt: #0f172a;
          --txt-2: #475569;
          --txt-3: #64748b;

          --white-02: rgba(2, 6, 23, 0.02);
          --white-06: rgba(2, 6, 23, 0.06);
          --white-08: rgba(2, 6, 23, 0.08);
          --white-12: rgba(2, 6, 23, 0.12);

          --shadow-1: 0 10px 30px rgba(2, 6, 23, 0.08), 0 1px 0 rgba(255, 255, 255, 1) inset;
          --shadow-2: 0 24px 60px -20px rgba(2, 6, 23, 0.18);

          background: linear-gradient(135deg, var(--bg-0) 0%, var(--bg-1) 50%, var(--bg-0) 100%);
          color: var(--txt);
        }

        /* ===== Hero ===== */
        .hero {
          position: relative;
          padding: clamp(36px, 6svh, 54px) 20px 18px;
        }
        .hero-bar {
          max-width: 1200px;
          margin: 0 auto 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: var(--white-08);
          border: 1px solid var(--white-12);
          border-radius: 999px;
          box-shadow: var(--shadow-1);
        }
        .brand img {
          width: 22px;
          height: 22px;
          object-fit: contain;
          border-radius: 4px;
        }
        .brand-name {
          font-weight: 800;
          letter-spacing: 0.02em;
          font-size: 13px;
          color: var(--txt);
        }
        /* === Support hero — match Partners/Reach (centered) === */
.support-program .hero {
  position: relative;
  min-height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 92px 24px 80px;      /* как на референсе */
  text-align: center;
}

.support-program .hero-content {
  max-width: 920px;
  width: 100%;
  margin: 0 auto;
  text-align: center;
}

/* Заголовок: размер/градиент/интерлиньяж — как на референсе */
.support-program .hero-title {
  font-size: clamp(44px, 7vw, 84px);
  font-weight: 850;
  letter-spacing: -0.02em;
  line-height: 1.06;
  margin: 0 0 16px;
  background: linear-gradient(to right, var(--txt), var(--txt-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Акцент куска заголовка */
.support-program .hero-accent { color: var(--primary); }

/* Сабтайтл: ширина/центр/кегль — как на референсе */
.support-program .hero-sub {
  font-size: 20px;
  line-height: 1.7;
  color: var(--txt-2);
  max-width: 760px;
  margin: 0 auto 0;
}

/* Мобильный баланс */
@media (max-width: 860px) {
  .support-program .hero {
    min-height: 70vh;
    padding: 72px 20px 56px;
  }
}


        .theme-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--white-08);
          border: 1px solid var(--white-12);
          border-radius: 999px;
          cursor: pointer;
          color: var(--txt);
          font-weight: 700;
          box-shadow: var(--shadow-1);
        }
        .theme-toggle:hover {
          background: var(--white-12);
        }

        .hero-content {
          max-width: 900px;
          margin: 22px auto 0;
          text-align: center;
        }
        .hero-logo {
          width: 92px;
          height: 92px;
          object-fit: contain;
          margin: 0 auto 12px;
          filter: saturate(1.05) contrast(1.02);
        }
        .hero-title {
          font-size: clamp(42px, 7vw, 78px);
          font-weight: 900;
          letter-spacing: -0.02em;
          line-height: 1.06;
          margin: 0 0 8px;
          background: linear-gradient(to right, var(--txt), var(--txt-2));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero-accent {
          color: var(--primary);
        }
        .hero-sub {
          font-size: clamp(16px, 2vw, 19px);
          line-height: 1.65;
          color: var(--txt-2);
          margin: 0 auto;
          max-width: 760px;
        }

        /* ===== Layout ===== */
        .wrap {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .banner {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: start;
          padding: 12px 14px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--white-12);
          margin: 10px 0;
        }
        .banner.warn {
          background: color-mix(in oklab, #f59e0b 10%, transparent);
          border-color: color-mix(in oklab, #f59e0b 40%, transparent);
          color: #f5b31a;
        }
        .banner.note {
          background: var(--white-06);
        }

        .grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 24px;
          margin: 18px auto 64px;
        }
        .card {
          background: var(--white-08);
          border: 1px solid var(--white-12);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-1);
        }
        .form-card {
          padding: 18px;
        }
        .side {
          padding: 18px;
          position: sticky;
          top: 16px;
          height: fit-content;
        }

        /* ===== Form ===== */
        .pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: var(--white-06);
          border: 1px solid var(--white-12);
          color: var(--txt-2);
          font-weight: 700;
          cursor: pointer;
        }
        .pill.active {
          color: #fff;
          background: var(--primary);
          border-color: var(--primary);
        }

        .sugg-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }
        .sugg {
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid var(--white-12);
          background: var(--white-02);
          color: var(--txt-3);
          font-size: 12px;
          cursor: pointer;
        }
        .sugg:hover {
          background: var(--white-06);
        }

        form .field {
          margin: 10px 0 12px;
        }
        .field label {
          display: block;
          font-weight: 800;
          color: var(--txt);
          margin-bottom: 6px;
          font-size: 13px;
          letter-spacing: 0.01em;
        }
        .field input,
        .field select,
        .field textarea {
          width: 100%;
          border-radius: 14px;
          border: 1px solid var(--white-12);
          background: var(--white-02);
          color: var(--txt);
          padding: 12px 12px;
          outline: none;
          transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
        }
        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--primary) 20%, transparent);
          background: var(--white-06);
        }
        .field.invalid input,
        .field.invalid textarea,
        .field.invalid select {
          border-color: color-mix(in oklab, #ef4444 45%, transparent);
        }
        .hint {
          font-size: 11px;
          color: var(--txt-3);
          margin-top: 6px;
        }

        .input-icon {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: 8px;
        }
        .input-icon svg {
          color: var(--txt-3);
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .grid-2.tight {
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        /* Dropzone */
        .drop {
          display: grid;
          grid-template-columns: auto 1fr;
          align-items: center;
          gap: 10px;
          border: 1px dashed var(--white-12);
          background: var(--white-02);
          padding: 12px;
          border-radius: var(--radius-lg);
          cursor: pointer;
          position: relative;
        }
        .drop input[type="file"] {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
        }
        .drop.over {
          border-color: var(--primary);
          background: var(--white-06);
        }

        .file-list {
          list-style: none;
          margin: 10px 0 0;
          padding: 0;
          border: 1px solid var(--white-12);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .file-list li {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          gap: 8px;
          align-items: center;
          padding: 8px 10px;
          border-bottom: 1px solid var(--white-12);
          background: var(--white-02);
        }
        .file-list li:last-child {
          border-bottom: none;
        }
        .file-list li.totals {
          grid-template-columns: 1fr auto;
          background: var(--white-06);
        }
        .file-list .fn {
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          color: var(--txt-2);
        }
        .file-list .fs {
          color: var(--txt-3);
          font-size: 12px;
        }
        .icon-btn {
          border: 1px solid var(--white-12);
          background: var(--white-02);
          color: var(--txt-3);
          border-radius: 10px;
          width: 28px;
          height: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .icon-btn:hover {
          background: var(--white-06);
          color: var(--txt);
        }

        /* Flags */
        .flag {
          display: inline-flex;
          gap: 10px;
          align-items: center;
          background: var(--white-06);
          border: 1px solid var(--white-12);
          border-radius: 12px;
          padding: 10px 12px;
          color: var(--txt-2);
          user-select: none;
        }

        /* Buttons */
        .actions {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-top: 12px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 14px;
          border: 1px solid var(--white-12);
          background: var(--white-06);
          color: var(--txt);
          font-weight: 800;
          cursor: pointer;
        }
        .btn.primary {
          background: var(--primary);
          border-color: var(--primary);
          color: #fff;
        }
        .btn.primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn.ghost:hover {
          background: var(--white-08);
        }

        .spinner {
          width: 14px;
          height: 14px;
          border-radius: 999px;
          border: 2px solid #fff;
          border-right-color: transparent;
          display: inline-block;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .error {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: start;
          margin-top: 10px;
          padding: 10px 12px;
          border: 1px solid color-mix(in oklab, #ef4444 45%, transparent);
          background: color-mix(in oklab, #ef4444 12%, transparent);
          border-radius: 12px;
          color: #f87171;
        }

        .success {
          margin-top: 12px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 10px;
          align-items: center;
          padding: 10px 12px;
          border: 1px solid color-mix(in oklab, #10b981 45%, transparent);
          background: color-mix(in oklab, #10b981 12%, transparent);
          border-radius: 12px;
          color: #10b981;
        }

        /* ===== Side ===== */
        .side-title {
          margin: 6px 0 10px;
          font-weight: 900;
          letter-spacing: 0.01em;
          background: linear-gradient(to right, var(--txt), var(--txt-2));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        .contact-item {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 12px;
          align-items: center;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid var(--white-12);
          background: var(--white-02);
          color: var(--txt);
          text-decoration: none;
        }
        .contact-item:hover {
          background: var(--white-06);
        }
        .ci-title {
          font-weight: 800;
        }
        .ci-sub {
          color: var(--txt-3);
          font-size: 12px;
        }
        .divider {
          height: 1px;
          background: var(--white-12);
          margin: 14px 0;
        }
        .links {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 8px;
        }
        .links a {
          display: inline-grid;
          grid-auto-flow: column;
          grid-auto-columns: auto 1fr;
          gap: 10px;
          align-items: center;
          color: var(--txt-2);
          text-decoration: none;
          padding: 6px 0;
        }
        .links a:hover {
          color: var(--txt);
        }
        .env {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 8px;
        }
        .env li {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
          color: var(--txt-2);
        }
        .env li.muted {
          grid-template-columns: auto 1fr;
          gap: 8px;
          color: var(--txt-3);
        }
        .env code {
          color: var(--txt-3);
          font-size: 12px;
          padding: 2px 6px;
          background: var(--white-06);
          border: 1px solid var(--white-12);
          border-radius: 8px;
        }

        /* ===== Responsive ===== */
        @media (max-width: 920px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .side {
            position: static;
          }
        }
        @media (max-width: 720px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
