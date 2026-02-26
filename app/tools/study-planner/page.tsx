"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Calendar,
  Target,
  BookOpen,
  Clock,
  Sparkles,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle,
  Brain,
  RotateCcw,
  Plus,
  X,
  GripVertical,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StudySession {
  id: string;
  day: string;
  subject: string;
  topic: string;
  duration: number; // minutes
  priority: "high" | "medium" | "low";
  completed: boolean;
  notes: string;
}

interface StudyPlan {
  id: string;
  title: string;
  goal: string;
  weeks: number;
  hoursPerDay: number;
  subjects: string[];
  sessions: StudySession[];
  createdAt: number;
  examDate?: string;
}

type AppState = "idle" | "loading" | "result";

// ─── Moon Logo ────────────────────────────────────────────────────────────────
function LunoraLogo({
  light = false,
  size = "md",
}: {
  light?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const svgSizes = { sm: 90, md: 120, lg: 140 };
  const textSizes = { sm: 40, md: 50, lg: 60 };
  const s = svgSizes[size];
  const ts = textSizes[size];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, userSelect: "none" }}>
      <svg viewBox="0 0 100 100" style={{ width: s, height: s, transform: "rotate(40deg)", flexShrink: 0 }}>
        <defs>
          <mask id={`lunora-mask-${light ? "light" : "dark"}`}>
            <rect width="100" height="100" fill="white" />
            <circle cx="57" cy="50" r="40" fill="black" />
          </mask>
        </defs>
        <circle
          cx="50" cy="50" r="42"
          fill={light ? "white" : "#203567"}
          mask={`url(#lunora-mask-${light ? "light" : "dark"})`}
        />
      </svg>
      <span style={{
        fontSize: ts, fontWeight: 300, letterSpacing: "0.12em",
        color: light ? "white" : "#1a1a1a",
        marginLeft: -60, marginTop: 6,
        fontFamily: "'DM Sans', sans-serif",
      }}>lunora</span>
    </div>
  );
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
const DB_NAME = "lunora_planner";
const DB_VERSION = 1;
const STORE = "plans";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function savePlanToDB(plan: StudyPlan) {
  const db = await openDB();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(plan);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function loadPlansFromDB(): Promise<StudyPlan[]> {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => res(req.result || []);
      req.onerror = () => rej(req.error);
    });
  } catch { return []; }
}

async function deletePlanFromDB(id: string) {
  const db = await openDB();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

// ─── PDF Export ───────────────────────────────────────────────────────────────
async function exportPlanToPDF(plan: StudyPlan) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const margin = 18;
  let y = 0;

  // Header background
  doc.setFillColor(32, 53, 103);
  doc.rect(0, 0, pageW, 42, "F");

  // Logo area
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("lunora", margin, 18);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 195, 230);
  doc.text("AI Study Planner", margin, 25);

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(plan.title, pageW - margin * 2 - 50);
  doc.text(titleLines, margin, 34);

  // Meta on right
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 195, 230);
  doc.text(`${plan.weeks} weeks`, pageW - margin, 22, { align: "right" });
  doc.text(`${plan.hoursPerDay}h/day`, pageW - margin, 28, { align: "right" });
  if (plan.examDate) doc.text(`Exam: ${plan.examDate}`, pageW - margin, 34, { align: "right" });

  y = 52;

  // Goal
  doc.setFillColor(240, 244, 255);
  doc.roundedRect(margin, y, pageW - margin * 2, 16, 3, 3, "F");
  doc.setTextColor(32, 53, 103);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("GOAL", margin + 5, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 80);
  const goalLines = doc.splitTextToSize(plan.goal, pageW - margin * 2 - 24);
  doc.text(goalLines[0] || plan.goal, margin + 22, y + 7);
  y += 24;

  // Subjects row
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 120);
  doc.text("SUBJECTS:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(32, 53, 103);
  doc.text(plan.subjects.join("  ·  "), margin + 22, y);
  y += 10;

  // Stats row
  const total = plan.sessions.length;
  const done = plan.sessions.filter(s => s.completed).length;
  const totalMins = plan.sessions.reduce((a, s) => a + s.duration, 0);
  const statsItems = [
    `${total} sessions`,
    `${Math.round(totalMins / 60 * 10) / 10}h planned`,
    `${done} completed`,
    `${total > 0 ? Math.round(done / total * 100) : 0}% done`,
  ];
  doc.setFontSize(8);
  statsItems.forEach((item, i) => {
    const x = margin + i * 46;
    doc.setFillColor(32, 53, 103);
    doc.roundedRect(x, y, 40, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(item, x + 20, y + 6.5, { align: "center" });
  });
  y += 18;

  // Group sessions by day
  const days = [...new Set(plan.sessions.map(s => s.day))];

  const priorityColors: Record<string, [number, number, number]> = {
    high: [220, 53, 69],
    medium: [255, 152, 0],
    low: [40, 167, 69],
  };

  for (const day of days) {
    const daySessions = plan.sessions.filter(s => s.day === day);

    // Check page space
    if (y > 260) {
      doc.addPage();
      y = 18;
    }

    // Day header
    doc.setFillColor(32, 53, 103, 0.08);
    doc.setFillColor(225, 230, 245);
    doc.rect(margin, y, pageW - margin * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(32, 53, 103);
    doc.text(day.toUpperCase(), margin + 4, y + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 130, 160);
    doc.text(`${daySessions.length} sessions`, pageW - margin - 4, y + 5.5, { align: "right" });
    y += 11;

    for (const session of daySessions) {
      if (y > 270) { doc.addPage(); y = 18; }

      const rowH = session.notes ? 14 : 10;
      const [r, g, b] = priorityColors[session.priority];

      // Priority stripe
      doc.setFillColor(r, g, b);
      doc.rect(margin, y, 2.5, rowH, "F");

      // Row bg
      doc.setFillColor(session.completed ? 245 : 252, session.completed ? 255 : 252, session.completed ? 245 : 252);
      doc.rect(margin + 2.5, y, pageW - margin * 2 - 2.5, rowH, "F");

      // Subject
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 50);
      doc.text(session.subject, margin + 6, y + 5);

      // Topic
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 100);
      const topicText = doc.splitTextToSize(session.topic, 80)[0];
      doc.text(topicText, margin + 6, y + (session.notes ? 10 : 5));
      if (!session.notes) {
        // side by side
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 100);
        doc.text(` — ${session.topic}`, margin + 6 + doc.getTextWidth(session.subject), y + 5);
      }

      // Duration
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.text(`${session.duration}min`, pageW - margin - 22, y + 5, { align: "right" });

      // Completed badge
      if (session.completed) {
        doc.setTextColor(40, 167, 69);
        doc.text("✓", pageW - margin - 4, y + 5, { align: "right" });
      }

      // Notes
      if (session.notes) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 160);
        const noteText = doc.splitTextToSize(session.notes, pageW - margin * 2 - 16)[0];
        doc.text(noteText, margin + 6, y + 10);
      }

      y += rowH + 2;
    }
    y += 4;
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 200);
  doc.text("Generated by Lunora AI Study Planner · lunora.app", pageW / 2, 290, { align: "center" });

  doc.save(`${plan.title.replace(/[^a-z0-9]/gi, "_")}_study_plan.pdf`);
}

// ─── Session Row Component ────────────────────────────────────────────────────
function SessionRow({
  session,
  onToggle,
  onDelete,
}: {
  session: StudySession;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const pColors = { high: "#dc3545", medium: "#fd7e14", low: "#28a745" };
  const pBg = { high: "#fff5f5", medium: "#fff8f0", low: "#f0fff4" };

  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      padding: "14px 16px",
      background: session.completed ? "#f8fff8" : "white",
      borderRadius: 12,
      border: `1.5px solid ${session.completed ? "#c3e6cb" : "#eef0f8"}`,
      transition: "all 0.2s",
      opacity: session.completed ? 0.75 : 1,
    }}>
      <div
        style={{
          width: 3,
          borderRadius: 4,
          background: pColors[session.priority],
          alignSelf: "stretch",
          flexShrink: 0,
          minHeight: 40,
        }}
      />
      <button
        onClick={onToggle}
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: `2px solid ${session.completed ? "#28a745" : "#ddd"}`,
          background: session.completed ? "#28a745" : "white",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
          transition: "all 0.2s",
        }}
      >
        {session.completed && <CheckCircle size={11} color="white" />}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 13, fontWeight: 700, color: "#1a1a1a",
            textDecoration: session.completed ? "line-through" : "none",
          }}>
            {session.subject}
          </span>
          <span style={{ fontSize: 12, color: "#888" }}>—</span>
          <span style={{
            fontSize: 12, color: "#555",
            textDecoration: session.completed ? "line-through" : "none",
          }}>
            {session.topic}
          </span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
            background: pBg[session.priority], color: pColors[session.priority],
            textTransform: "capitalize",
          }}>
            {session.priority}
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
          <span style={{ fontSize: 12, color: "#aaa", display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} /> {session.duration}min
          </span>
          {session.notes && (
            <span style={{ fontSize: 12, color: "#aaa", fontStyle: "italic" }}>
              {session.notes}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onDelete}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#ddd", padding: 4, display: "flex", alignItems: "center",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#e74c3c"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ddd"}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: "1px solid #eef0f8",
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between",
          alignItems: "center", padding: "18px 0", background: "none",
          border: "none", cursor: "pointer", textAlign: "left",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15, color: "#203567" }}>{q}</span>
        <span style={{ color: "#203567", transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "none" }}>
          <ChevronDown size={18} />
        </span>
      </button>
      <div style={{
        maxHeight: open ? 200 : 0, opacity: open ? 1 : 0,
        overflow: "hidden", transition: "max-height 0.35s ease, opacity 0.3s",
      }}>
        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.7, paddingBottom: 18 }}>{a}</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudyPlannerPage() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [savedPlans, setSavedPlans] = useState<StudyPlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [activeDay, setActiveDay] = useState<string | null>(null);

  // Form state
  const [goal, setGoal] = useState("");
  const [examDate, setExamDate] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [subjectInput, setSubjectInput] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<"easy" | "moderate" | "intensive">("moderate");

  useEffect(() => {
    loadPlansFromDB().then(setSavedPlans);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const addSubject = () => {
    const s = subjectInput.trim();
    if (s && !subjects.includes(s)) {
      setSubjects(prev => [...prev, s]);
      setSubjectInput("");
    }
  };

  const callGemini = async (): Promise<StudyPlan> => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY not set");

    const today = new Date();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const prompt = `You are an expert study coach and schedule optimizer. Create a detailed, realistic ${weeks}-week study plan.

STUDENT INPUT:
- Goal: "${goal}"
- Exam/Deadline date: "${examDate || "Not specified"}"
- Weeks available: ${weeks}
- Study hours per day: ${hoursPerDay}
- Subjects/Topics: ${subjects.join(", ")}
- Intensity preference: ${difficulty}

RULES:
1. Generate a comprehensive, day-by-day schedule for all ${weeks} weeks.
2. Each session should have a specific, actionable topic (not vague like "study math").
3. Distribute subjects intelligently — harder topics get morning slots, reviews near exam.
4. Include short review sessions and practice tests near the end.
5. Vary session lengths: 30, 45, 60, 90 minutes based on topic complexity.
6. Priority: "high" for core concepts, "medium" for practice, "low" for review/light topics.
7. Add helpful notes for key sessions (e.g., "Focus on past papers", "Use active recall").
8. Day format: "Week 1 - Monday", "Week 1 - Tuesday", etc.
9. Generate approximately ${Math.round(hoursPerDay * 7 * weeks * 0.85)} total hours of sessions.
10. Output ONLY valid raw JSON. No markdown, no backticks.

JSON SCHEMA:
{
  "title": "string (concise plan name)",
  "sessions": [
    {
      "day": "Week 1 - Monday",
      "subject": "string",
      "topic": "string (specific and actionable)",
      "duration": number (minutes: 30/45/60/90),
      "priority": "high" | "medium" | "low",
      "notes": "string (optional tip, max 60 chars, leave empty string if none)"
    }
  ]
}`;

    const models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"];
    let lastErr: any;

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.4, maxOutputTokens: 8192, responseMimeType: "application/json" },
            }),
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
        const parsed = JSON.parse(cleaned);

        const plan: StudyPlan = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          title: parsed.title || `${subjects[0] || "Study"} Plan`,
          goal,
          weeks,
          hoursPerDay,
          subjects,
          examDate,
          createdAt: Date.now(),
          sessions: (parsed.sessions || []).map((s: any, i: number) => ({
            id: `${i}-${Math.random().toString(36).slice(2)}`,
            day: s.day || "Week 1 - Monday",
            subject: s.subject || "",
            topic: s.topic || "",
            duration: s.duration || 60,
            priority: s.priority || "medium",
            completed: false,
            notes: s.notes || "",
          })),
        };
        return plan;
      } catch (e) {
        lastErr = e;
        console.warn(`Model ${model} failed:`, e);
      }
    }
    throw new Error(`All models failed: ${lastErr?.message}`);
  };

  const generate = async () => {
    if (!goal.trim()) { setError("Please enter your study goal."); return; }
    if (subjects.length === 0) { setError("Add at least one subject."); return; }

    setError("");
    setAppState("loading");
    try {
      setProgress("Building your personalized schedule...");
      const plan = await callGemini();
      setProgress("Saving to your library...");
      await savePlanToDB(plan);
      const updated = await loadPlansFromDB();
      setSavedPlans(updated);
      setCurrentPlan(plan);
      const days = [...new Set(plan.sessions.map(s => s.day))];
      setActiveDay(days[0] || null);
      setAppState("result");
      setProgress("");
      setTimeout(() => {
        document.getElementById("planner-result")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
      setAppState("idle");
      setProgress("");
    }
  };

  const toggleSession = async (planId: string, sessionId: string) => {
    setSavedPlans(prev => {
      const updated = prev.map(p => {
        if (p.id !== planId) return p;
        return {
          ...p,
          sessions: p.sessions.map(s =>
            s.id === sessionId ? { ...s, completed: !s.completed } : s
          ),
        };
      });
      const plan = updated.find(p => p.id === planId);
      if (plan) savePlanToDB(plan);
      return updated;
    });
    if (currentPlan?.id === planId) {
      setCurrentPlan(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          sessions: prev.sessions.map(s =>
            s.id === sessionId ? { ...s, completed: !s.completed } : s
          ),
        };
        savePlanToDB(updated);
        return updated;
      });
    }
  };

  const deleteSession = async (planId: string, sessionId: string) => {
    const update = (p: StudyPlan) => ({
      ...p,
      sessions: p.sessions.filter(s => s.id !== sessionId),
    });
    setSavedPlans(prev => {
      const updated = prev.map(p => p.id === planId ? update(p) : p);
      const plan = updated.find(p => p.id === planId);
      if (plan) savePlanToDB(plan);
      return updated;
    });
    if (currentPlan?.id === planId) {
      setCurrentPlan(prev => {
        if (!prev) return prev;
        const updated = update(prev);
        savePlanToDB(updated);
        return updated;
      });
    }
  };

  const deletePlan = async (id: string) => {
    await deletePlanFromDB(id);
    const updated = await loadPlansFromDB();
    setSavedPlans(updated);
    if (currentPlan?.id === id) {
      setCurrentPlan(null);
      setAppState("idle");
    }
  };

  const plan = currentPlan;
  const days = plan ? [...new Set(plan.sessions.map(s => s.day))] : [];
  const dayGroups = activeDay
    ? plan?.sessions.filter(s => s.day === activeDay) || []
    : [];

  const completed = plan?.sessions.filter(s => s.completed).length || 0;
  const total = plan?.sessions.length || 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const totalMins = plan?.sessions.reduce((a, s) => a + s.duration, 0) || 0;

  const faqs = [
    { q: "Is this study planner really free?", a: "100% free. No signup, no account needed. Just fill in your details and get a full AI-generated plan instantly." },
    { q: "How does the AI build my schedule?", a: "Gemini AI analyzes your goal, subjects, available time, and deadline to create a smart, realistic day-by-day plan with specific topics and session lengths." },
    { q: "Can I edit my study plan?", a: "Yes! You can delete individual sessions, mark them complete, and re-generate the plan anytime with different settings." },
    { q: "Where is my plan saved?", a: "All plans are saved locally in your browser using IndexedDB. They persist across sessions and are completely private to your device." },
    { q: "Can I export my study plan?", a: "Yes! Click 'Export PDF' to download a beautifully formatted PDF of your full study plan — great for printing or sharing." },
    { q: "How is Lunora different from this tool?", a: "This planner helps you schedule your study. Lunora is the full AI learning system — generate 1,000+ quiz questions, get flashcards, summaries, track mastery per topic, and build your complete learning library." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>

      {/* ── Global Styles ─────────────────────────────────────────────────── */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: #203567; color: white; }

        .btn-primary {
          background: #203567; color: white; border: none;
          border-radius: 100px; padding: 14px 32px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          transition: background .2s, transform .15s, box-shadow .2s;
          font-family: 'DM Sans', sans-serif;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-primary:hover { background: #162a54; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(32,53,103,.3); }
        .btn-primary:active { transform: scale(.97); }
        .btn-primary:disabled { opacity: .6; cursor: not-allowed; transform: none; }

        .btn-ghost {
          background: transparent; color: #555;
          border: 1.5px solid #ddd; border-radius: 100px;
          padding: 11px 22px; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: border-color .2s, color .2s;
          font-family: 'DM Sans', sans-serif;
          display: inline-flex; align-items: center; gap: 7px;
        }
        .btn-ghost:hover { border-color: #203567; color: #203567; }

        .tag-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 14px; border-radius: 100px;
          background: rgba(32,53,103,.07); border: 1px solid rgba(32,53,103,.12);
          font-size: 11px; font-weight: 700; color: #203567;
          letter-spacing: .08em; text-transform: uppercase;
          font-family: 'DM Sans', sans-serif;
        }

        input[type="text"], input[type="date"], input[type="number"], select, textarea {
          width: 100%; padding: 12px 16px;
          border: 1.5px solid #e8eaf0; border-radius: 12px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          color: #1a1a1a; background: white;
          transition: border-color .2s, box-shadow .2s; outline: none;
        }
        input:focus, select:focus, textarea:focus {
          border-color: #203567;
          box-shadow: 0 0 0 3px rgba(32,53,103,.08);
        }
        label {
          display: block; font-size: 12px; font-weight: 700;
          color: #888; letter-spacing: .06em; text-transform: uppercase;
          margin-bottom: 6px;
        }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media(max-width: 600px) { .form-row { grid-template-columns: 1fr; } }

        .day-tab {
          padding: 8px 16px; border-radius: 8px;
          font-size: 12px; font-weight: 600;
          cursor: pointer; border: 1.5px solid #eef0f8;
          background: white; color: #888;
          font-family: 'DM Sans', sans-serif;
          transition: all .2s; white-space: nowrap;
        }
        .day-tab:hover { border-color: #203567; color: #203567; }
        .day-tab.active {
          background: #203567; color: white;
          border-color: #203567;
        }

        .plan-card {
          background: white; border-radius: 16px;
          padding: 20px; border: 1.5px solid #eef0f8;
          transition: transform .25s, box-shadow .25s;
        }
        .plan-card:hover { transform: translateY(-3px); box-shadow: 0 12px 40px rgba(32,53,103,.1); }

        .progress-bar {
          height: 6px; border-radius: 100px;
          background: #eef0f8; overflow: hidden;
        }
        .progress-fill {
          height: 100%; border-radius: 100px;
          background: linear-gradient(90deg, #203567, #4a7cc7);
          transition: width .6s ease;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin 0.7s linear infinite; }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeSlideUp .5s ease forwards; }

        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
        }

        .day-tabs-wrap {
          display: flex; gap: 8px; flex-wrap: wrap;
          overflow-x: auto; padding-bottom: 4px;
        }
        .day-tabs-wrap::-webkit-scrollbar { height: 4px; }
        .day-tabs-wrap::-webkit-scrollbar-thumb { background: #e8eaf0; border-radius: 4px; }

        .hide-mobile { display: none !important; }
        @media(min-width: 769px) { .hide-mobile { display: flex !important; } }

        .stat-box {
          padding: 16px 20px; border-radius: 14px;
          border: 1.5px solid #eef0f8; text-align: center;
          background: white;
        }
      `}</style>

      {/* ── NAV ───────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,.95)" : "white",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(32,53,103,.08)" : "1px solid transparent",
        transition: "all .3s",
      }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto", padding: "0 24px",
          height: 120, display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          <LunoraLogo size="sm" />
          <div className="hide-mobile" style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {[["#how-it-works", "How it works"], ["#saved", "My Plans"], ["#faq", "FAQ"]].map(([href, label]) => (
              <a key={href} href={href} style={{ fontSize: 14, fontWeight: 500, color: "#555", textDecoration: "none" }}
                onMouseEnter={e => (e.target as HTMLAnchorElement).style.color = "#203567"}
                onMouseLeave={e => (e.target as HTMLAnchorElement).style.color = "#555"}
              >{label}</a>
            ))}
          </div>
          <Link href="/main" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ padding: "9px 20px", fontSize: 13 }}>
              <ExternalLink size={13} /> Open Lunora App
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 100, paddingBottom: 40, padding: "100px 24px 48px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 50 }}>
            <div className="tag-pill"><Sparkles size={11} />Free AI Tool</div>
          </div>
          <h1 style={{
            fontSize: "clamp(38px, 6vw, 68px)",
            fontWeight: 800, lineHeight: 1.08,
            letterSpacing: "-0.03em", color: "#1a1a1a",
            fontFamily: "'DM Sans', sans-serif", marginBottom: 8,
          }}>
            AI Study{" "}
            <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#203567" }}>
              Planner
            </span>
          </h1>
          <p style={{ fontSize: 18, color: "#666", lineHeight: 1.7, maxWidth: 520, margin: "16px auto 0", fontWeight: 400 }}>
            Tell us your goal, subjects, and deadline. Get a smart, day-by-day study schedule — free, instant, exportable to PDF.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", marginTop: 20 }}>
            {["No signup needed", "Exports to PDF", "Saves in browser"].map((t, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888" }}>
                <CheckCircle size={13} color="#28a745" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── GENERATOR FORM ────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{
          maxWidth: 700, margin: "0 auto",
          background: "white", borderRadius: 24,
          border: "1.5px solid #eef0f8",
          boxShadow: "0 8px 40px rgba(32,53,103,.08)",
          padding: "clamp(24px, 4vw, 40px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(32,53,103,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={17} color="#203567" />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-.01em" }}>Create your study plan</h2>
              <p style={{ fontSize: 13, color: "#aaa", marginTop: 1 }}>Fill in the details and let AI do the rest</p>
            </div>
          </div>

          {/* Goal */}
          <div style={{ marginBottom: 18 }}>
            <label>Your study goal *</label>
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="e.g. Pass the AWS Solutions Architect exam, ace my biology finals, learn JavaScript fundamentals..."
              rows={3}
              style={{ resize: "none" }}
            />
          </div>

          {/* Subjects */}
          <div style={{ marginBottom: 18 }}>
            <label>Subjects / Topics *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={subjectInput}
                onChange={e => setSubjectInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSubject(); } }}
                placeholder="e.g. Mathematics, Chapter 3..."
              />
              <button
                onClick={addSubject}
                className="btn-primary"
                style={{ padding: "12px 18px", borderRadius: 12, flexShrink: 0 }}
              >
                <Plus size={16} />
              </button>
            </div>
            {subjects.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {subjects.map((s, i) => (
                  <span key={i} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 12px", borderRadius: 100,
                    background: "rgba(32,53,103,.07)", border: "1px solid rgba(32,53,103,.12)",
                    fontSize: 13, fontWeight: 600, color: "#203567",
                  }}>
                    {s}
                    <button
                      onClick={() => setSubjects(prev => prev.filter((_, j) => j !== i))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#203567", padding: 0, display: "flex", lineHeight: 1 }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="form-row" style={{ marginBottom: 18 }}>
            <div>
              <label>Exam / Deadline date</label>
              <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
            </div>
            <div>
              <label>Study weeks</label>
              <select value={weeks} onChange={e => setWeeks(Number(e.target.value))}>
                {[1, 2, 3, 4, 6, 8, 10, 12].map(w => (
                  <option key={w} value={w}>{w} week{w > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: 18 }}>
            <div>
              <label>Hours per day</label>
              <select value={hoursPerDay} onChange={e => setHoursPerDay(Number(e.target.value))}>
                {[0.5, 1, 1.5, 2, 3, 4, 5, 6].map(h => (
                  <option key={h} value={h}>{h}h/day</option>
                ))}
              </select>
            </div>
            <div>
              <label>Study intensity</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}>
                <option value="easy">Relaxed — spaced out</option>
                <option value="moderate">Balanced — steady pace</option>
                <option value="intensive">Intensive — exam crunch</option>
              </select>
            </div>
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: "12px 16px",
              background: "#fff0f0", border: "1px solid #ffd0d0",
              borderRadius: 10, fontSize: 14, color: "#c00",
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            className="btn-primary"
            onClick={generate}
            disabled={appState === "loading"}
            style={{ width: "100%", padding: "16px", fontSize: 16 }}
          >
            {appState === "loading" ? (
              <>
                <span style={{
                  width: 18, height: 18,
                  border: "2.5px solid rgba(255,255,255,.4)",
                  borderTopColor: "white", borderRadius: "50%",
                  display: "inline-block", flexShrink: 0,
                }} className="spinner" />
                {progress || "Generating your plan..."}
              </>
            ) : (
              <><Sparkles size={16} /> Generate My Study Plan</>
            )}
          </button>
        </div>
      </section>

      {/* ── RESULT ────────────────────────────────────────────────────────── */}
      {appState === "result" && plan && (
        <section id="planner-result" style={{ padding: "0 24px 80px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>

            {/* Plan header */}
            <div style={{
              background: "#203567", borderRadius: 20, padding: "28px 32px",
              marginBottom: 24, display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", flexWrap: "wrap", gap: 16,
            }}>
              <div>
                <div className="tag-pill" style={{ background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)", color: "white", marginBottom: 8 }}>
                  <CheckCircle size={10} /> Plan Ready
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "white", letterSpacing: "-.02em", marginBottom: 4 }}>
                  {plan.title}
                </h2>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,.6)", lineHeight: 1.5, maxWidth: 400 }}>
                  {plan.goal}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => exportPlanToPDF(plan)}
                  className="btn-primary"
                  style={{ background: "white", color: "#203567", padding: "10px 20px", fontSize: 13 }}
                >
                  <Download size={14} /> Export PDF
                </button>
                <button
                  onClick={() => { setCurrentPlan(null); setAppState("idle"); }}
                  style={{
                    background: "rgba(255,255,255,.12)", color: "white",
                    border: "1.5px solid rgba(255,255,255,.25)",
                    borderRadius: 100, padding: "10px 20px", fontSize: 13,
                    fontWeight: 600, cursor: "pointer", display: "flex",
                    alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <RotateCcw size={13} /> New Plan
                </button>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total Sessions", value: total },
                { label: "Total Hours", value: `${Math.round(totalMins / 60 * 10) / 10}h` },
                { label: "Completed", value: `${completed}/${total}` },
                { label: "Progress", value: `${pct}%` },
              ].map((s, i) => (
                <div key={i} className="stat-box">
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#203567" }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#555" }}>Overall progress</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#203567" }}>{pct}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {/* Day tabs */}
            <div className="day-tabs-wrap" style={{ marginBottom: 20 }}>
              {days.map(day => (
                <button
                  key={day}
                  className={`day-tab${activeDay === day ? " active" : ""}`}
                  onClick={() => setActiveDay(day)}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Sessions for active day */}
            {activeDay && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a" }}>{activeDay}</h3>
                  <span style={{ fontSize: 13, color: "#aaa" }}>
                    {dayGroups.filter(s => s.completed).length}/{dayGroups.length} done
                    · {dayGroups.reduce((a, s) => a + s.duration, 0)}min
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {dayGroups.map(session => (
                    <SessionRow
                      key={session.id}
                      session={session}
                      onToggle={() => toggleSession(plan.id, session.id)}
                      onDelete={() => deleteSession(plan.id, session.id)}
                    />
                  ))}
                  {dayGroups.length === 0 && (
                    <div style={{ textAlign: "center", padding: "32px", color: "#ccc", fontSize: 14 }}>
                      All sessions cleared for this day
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── SAVED PLANS ───────────────────────────────────────────────────── */}
      {savedPlans.length > 0 && (
        <section id="saved" style={{ padding: "0 24px 80px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-.02em", marginBottom: 6 }}>
              Your Plans
            </h2>
            <p style={{ fontSize: 14, color: "#aaa", marginBottom: 24 }}>
              Saved in your browser · {savedPlans.length} plan{savedPlans.length !== 1 ? "s" : ""}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {[...savedPlans].sort((a, b) => b.createdAt - a.createdAt).map(p => {
                const done = p.sessions.filter(s => s.completed).length;
                const tot = p.sessions.length;
                const pct = tot > 0 ? Math.round(done / tot * 100) : 0;
                return (
                  <div key={p.id} className="plan-card">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(32,53,103,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Target size={18} color="#203567" />
                      </div>
                      <button onClick={() => deletePlan(p.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ddd", padding: 4, display: "flex", alignItems: "center" }}
                        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#e74c3c"}
                        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ddd"}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", marginBottom: 4, lineHeight: 1.3 }}>{p.title}</h3>
                    <p style={{ fontSize: 12, color: "#aaa", marginBottom: 12 }}>
                      {tot} sessions · {p.weeks}w · {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                    <div className="progress-bar" style={{ marginBottom: 8 }}>
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <p style={{ fontSize: 12, color: "#aaa", marginBottom: 14 }}>{pct}% complete</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => {
                          setCurrentPlan(p);
                          const d = [...new Set(p.sessions.map(s => s.day))];
                          setActiveDay(d[0] || null);
                          setAppState("result");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        style={{
                          flex: 1, padding: "9px", border: "1.5px solid #eef0f8",
                          borderRadius: 10, background: "white", cursor: "pointer",
                          fontSize: 13, fontWeight: 600, color: "#555",
                          fontFamily: "'DM Sans', sans-serif",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        }}
                      >
                        <BookOpen size={13} /> View
                      </button>
                      <button
                        onClick={() => exportPlanToPDF(p)}
                        className="btn-primary"
                        style={{ flex: 1, padding: "9px", fontSize: 13 }}
                      >
                        <Download size={13} /> PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: "80px 24px", background: "#f8f9fd" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div className="tag-pill">Simple Process</div>
          </div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-.025em", marginBottom: 12 }}>
            How it works
          </h2>
          <p style={{ fontSize: 16, color: "#777", maxWidth: 440, margin: "0 auto 52px" }}>
            Go from scattered notes to a structured, actionable plan in under 30 seconds.
          </p>
          <div className="steps-grid">
            {[
              { icon: <Target size={28} color="#203567" />, step: "01", title: "Set your goal", desc: "Tell us what you want to achieve — an exam, a certification, or just mastering a skill." },
              { icon: <BookOpen size={28} color="#203567" />, step: "02", title: "Add your subjects", desc: "List the topics you need to cover. Add as many as you need — we'll organize them intelligently." },
              { icon: <Sparkles size={28} color="#203567" />, step: "03", title: "AI builds your plan", desc: "Gemini AI creates a smart day-by-day schedule with sessions, priorities, and realistic timings." },
              { icon: <Download size={28} color="#203567" />, step: "04", title: "Export & follow", desc: "Download your plan as a PDF, track progress by marking sessions complete, and stay on course." },
            ].map((s, i) => (
              <div key={i} style={{ background: "white", borderRadius: 20, padding: 28, border: "1.5px solid #eef0f8", textAlign: "left" }}>
                <div style={{ marginBottom: 12, opacity: 0.7 }}>{s.icon}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: ".1em", opacity: .5 }}>STEP {s.step}</span>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", margin: "6px 0 8px" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "#777", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LUNORA PROMO ──────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <LunoraLogo light size="sm" />
          </div>
          <h2 style={{ fontSize: 34, fontWeight: 800, color: "white", letterSpacing: "-.025em", marginBottom: 16, lineHeight: 1.25 }}>
            Want the full learning experience?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,.65)", lineHeight: 1.7, marginBottom: 12 }}>
            This planner helps you schedule your study. <strong style={{ color: "white" }}>Lunora</strong> is the complete AI study system — generate 1,000+ quiz questions from any material, get instant flashcards, summaries, and track your mastery down to each subtopic.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
            {[
              [<Sparkles size={13} />, "Unlimited quiz questions"],
              [<Brain size={13} />, "Deep-dive learning aids"],
              [<CheckCircle size={13} />, "Full attempt history"],
            ].map(([icon, label], i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "rgba(255,255,255,.55)" }}>
                {icon as React.ReactNode} {label as string}
              </span>
            ))}
          </div>
          <Link href="/main" style={{ textDecoration: "none" }}>
            <button
              style={{
                background: "white", color: "#203567", border: "none",
                borderRadius: 100, padding: "16px 40px", fontSize: 16,
                fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                transition: "transform .2s, box-shadow .2s",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(0,0,0,.3)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
            >
              Try Lunora AI Quiz — Free <ExternalLink size={15} />
            </button>
          </Link>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-.025em", textAlign: "center", marginBottom: 48 }}>
            Frequently asked questions
          </h2>
          {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#16254a", padding: "40px 24px" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 16,
        }}>
          <LunoraLogo light size="sm" />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.35)" }}>© 2026 Lunora. All rights reserved.</p>
          <div style={{ display: "flex", gap: 24 }}>
            <Link href="/privacy-policy" style={{ fontSize: 13, color: "rgba(255,255,255,.45)", textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms-and-conditions" style={{ fontSize: 13, color: "rgba(255,255,255,.45)", textDecoration: "none" }}>Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}