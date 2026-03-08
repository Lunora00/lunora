"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap, BarChart2, Brain, BookOpen,
  ChevronDown, Trash2, History,
  CheckCircle, Sparkles,
  Trophy, TrendingUp, Clock,
  ArrowRight, RotateCcw, Info, Plus, GraduationCap, Target,
} from "lucide-react";

// ─── Rutgers GPA Calculation ─────────────────────────────────────────────────
// Rutgers University uses a standard 4.0 scale
// A  = 4.0, B+ = 3.5, B = 3.0, C+ = 2.5, C = 2.0, D = 1.0, F = 0.0
// NOTE: Rutgers uses a simplified plus/minus scale — no A+, A-, B-, C-, D+, D-
// Rutgers grade scale:
//   A  = 4.0
//   B+ = 3.5
//   B  = 3.0
//   C+ = 2.5
//   C  = 2.0
//   D  = 1.0
//   F  = 0.0
//   P  = not counted (Pass)
//   NC = not counted (No Credit)
//   W  = not counted (Withdrawal)
// Cumulative GPA = Sum(grade_points × credit_hours) / Sum(credit_hours)
// Dean's List: semester GPA ≥ 3.5 (12+ credits attempted)
// Graduation honors:
//   Highest Honors (Summa): top 1% of graduating class, typically ≥ 3.9
//   High Honors (Magna):    next 5%, typically ≥ 3.7
//   Honors (Cum Laude):     next 10–15%, typically ≥ 3.5
// Good standing: cumulative GPA ≥ 2.0
// Academic probation: cumulative GPA < 2.0

const GRADE_POINTS: Record<string, number | null> = {
  "A":  4.0,
  "B+": 3.5,
  "B":  3.0,
  "C+": 2.5,
  "C":  2.0,
  "D":  1.0,
  "F":  0.0,
  "P":  null,
  "NC": null,
  "W":  null,
};

const GRADE_OPTIONS = ["A","B+","B","C+","C","D","F","P","NC","W"];

function getGPALabel(gpa: number): string {
  if (gpa >= 3.9) return "Highest Honors";
  if (gpa >= 3.7) return "High Honors";
  if (gpa >= 3.5) return "Dean's List";
  if (gpa >= 3.0) return "Good Standing";
  if (gpa >= 2.0) return "Satisfactory";
  if (gpa >= 1.0) return "Academic Warning";
  return "Academic Probation";
}
function getGPAColor(gpa: number): string {
  if (gpa >= 3.7) return "#cc0033";
  if (gpa >= 3.5) return "#1e5fa8";
  if (gpa >= 3.0) return "#2d6e9e";
  if (gpa >= 2.0) return "#8a6a00";
  if (gpa >= 1.0) return "#b84e00";
  return "#c83232";
}
function getGPABg(gpa: number): string {
  if (gpa >= 3.7) return "rgba(204,0,51,0.07)";
  if (gpa >= 3.5) return "rgba(30,95,168,0.07)";
  if (gpa >= 3.0) return "rgba(45,110,158,0.07)";
  if (gpa >= 2.0) return "rgba(138,106,0,0.07)";
  if (gpa >= 1.0) return "rgba(184,78,0,0.07)";
  return "rgba(200,50,50,0.07)";
}
function getGPAMessage(gpa: number): string {
  if (gpa >= 3.9) return "Outstanding — Highest Honors standing at Rutgers. You're among the top academic performers across all RU schools.";
  if (gpa >= 3.7) return "Excellent work. High Honors standing at Rutgers reflects genuine command of your coursework. Keep it up.";
  if (gpa >= 3.5) return "Dean's List territory. This GPA opens doors to competitive graduate programs, research positions, and Rutgers fellowships.";
  if (gpa >= 3.0) return "Solid academic standing. Push toward 3.5 to qualify for Dean's List recognition and strengthen your transcript.";
  if (gpa >= 2.0) return "You're meeting Rutgers' minimum standards. Target your weakest courses and build toward a stronger cumulative record.";
  if (gpa >= 1.0) return "Academic warning territory. Connect with your Rutgers academic advisor and the Learning Centers as soon as possible.";
  return "Immediate action needed. Contact your Rutgers academic dean's office and visit the Learning Centers today.";
}

interface Course { id: string; name: string; credits: number; grade: string; }
interface SavedAttempt {
  id: string; courses: Course[]; gpa: number;
  totalCredits: number; savedAt: number; label: string; semesterLabel: string;
}

const DB_NAME = "lunora_rutgers_gpa"; const DB_VERSION = 1; const STORE = "attempts";
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveAttempt(a: SavedAttempt): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(a);
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  } catch { /* silent */ }
}
async function loadAttempts(): Promise<SavedAttempt[]> {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => res(req.result || []); req.onerror = () => rej(req.error);
    });
  } catch { return []; }
}
async function deleteAttempt(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  } catch { /* silent */ }
}

function calcGPA(courses: Course[]): { gpa: number; totalCredits: number; totalPoints: number } {
  let totalCredits = 0; let totalPoints = 0;
  for (const c of courses) {
    const pts = GRADE_POINTS[c.grade];
    if (pts !== null && pts !== undefined) {
      totalCredits += c.credits;
      totalPoints += pts * c.credits;
    }
  }
  const gpa = totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 1000) / 1000 : 0;
  return { gpa, totalCredits, totalPoints };
}

function calcCumulativeGPA(prevGPA: number, prevCredits: number, newGPA: number, newCredits: number): number {
  const total = prevCredits + newCredits;
  if (total === 0) return 0;
  return Math.round(((prevGPA * prevCredits + newGPA * newCredits) / total) * 1000) / 1000;
}

function LunoraLogo({ light = false, size = "md" }: { light?: boolean; size?: "sm" | "md" | "lg" }) {
  const svgSizes = { sm: 90, md: 120, lg: 140 };
  const textSizes = { sm: 40, md: 50, lg: 60 };
  const s = svgSizes[size]; const ts = textSizes[size];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, userSelect: "none" }}>
      <svg viewBox="0 0 100 100" style={{ width: s, height: s, transform: "rotate(40deg)", flexShrink: 0 }}>
        <defs>
          <mask id={`lm-${light ? "l" : "d"}`}>
            <rect width="100" height="100" fill="white" />
            <circle cx="57" cy="50" r="40" fill="black" />
          </mask>
        </defs>
        <circle cx="50" cy="50" r="42" fill={light ? "white" : "#203567"} mask={`url(#lm-${light ? "l" : "d"})`} />
      </svg>
      <span style={{ fontSize: ts, fontWeight: 300, letterSpacing: "0.12em", color: light ? "white" : "#1a1a1a", marginLeft: -60, marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>lunora</span>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #eef0f8" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif" }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: "#203567", paddingRight: 16, lineHeight: 1.4 }}>{q}</span>
        <span style={{ color: "#203567", transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }}><ChevronDown size={18} /></span>
      </button>
      <div style={{ maxHeight: open ? 440 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "max-height 0.35s ease, opacity 0.3s" }}>
        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.75, paddingBottom: 20 }}>{a}</p>
      </div>
    </div>
  );
}

function GPAGauge({ gpa }: { gpa: number }) {
  const color = getGPAColor(gpa);
  const pct = gpa / 4.0;
  const r = 54; const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={140} height={100} viewBox="0 0 140 110">
        <circle cx="70" cy="80" r={r} fill="none" stroke="#eef0f8" strokeWidth={10}
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={circ * 0.125} strokeLinecap="round" transform="rotate(-225 70 80)" />
        <circle cx="70" cy="80" r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${circ * 0.75 * pct} ${circ * (1 - 0.75 * pct)}`}
          strokeDashoffset={circ * 0.125} strokeLinecap="round" transform="rotate(-225 70 80)"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
        <text x="70" y="74" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="DM Sans, sans-serif">{gpa.toFixed(2)}</text>
        <text x="70" y="92" textAnchor="middle" fill="#aaa" fontSize="10" fontFamily="DM Sans, sans-serif">out of 4.00</text>
      </svg>
    </div>
  );
}

function CourseRow({ course, onChange, onDelete, index }: {
  course: Course; onChange: (c: Course) => void; onDelete: () => void; index: number;
}) {
  const pts = GRADE_POINTS[course.grade];
  const contributed = pts !== null && pts !== undefined ? pts * course.credits : null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 110px 36px", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f3fa" }}>
      <input
        type="text"
        placeholder={`Course ${index + 1} (e.g. CALC 151)`}
        value={course.name}
        onChange={e => onChange({ ...course, name: e.target.value })}
        style={{ padding: "8px 12px", border: "1.5px solid #eef0f8", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#1a1a1a", outline: "none", background: "white", width: "100%" }}
      />
      <input
        type="number" min={1} max={12} value={course.credits}
        onChange={e => onChange({ ...course, credits: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })}
        style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #eef0f8", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#203567", textAlign: "center", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white" }}
      />
      <select
        value={course.grade}
        onChange={e => onChange({ ...course, grade: e.target.value })}
        style={{ padding: "8px 10px", border: "1.5px solid #eef0f8", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#203567", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white", cursor: "pointer", width: "100%" }}
      >
        {GRADE_OPTIONS.map(g => (
          <option key={g} value={g}>
            {g}{GRADE_POINTS[g] !== null && GRADE_POINTS[g] !== undefined ? ` (${GRADE_POINTS[g]?.toFixed(1)})` : " (no credit)"}
          </option>
        ))}
      </select>
      <button onClick={onDelete}
        style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "none", cursor: "pointer", color: "#ddd", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.2s" }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#c83232"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ddd"}>
        <Trash2 size={15} />
      </button>
      {contributed !== null && (
        <div style={{ gridColumn: "1 / -1", marginTop: -4, paddingBottom: 4 }}>
          <span style={{ fontSize: 11, color: "#aaa" }}>Grade points: <strong style={{ color: "#203567" }}>{contributed.toFixed(2)}</strong></span>
        </div>
      )}
    </div>
  );
}

function newCourse(): Course {
  return { id: Date.now().toString(36) + Math.random().toString(36).slice(2), name: "", credits: 3, grade: "A" };
}

export default function RutgersGPACalculator() {
  const [courses, setCourses] = useState<Course[]>([
    { ...newCourse(), name: "Course 1" },
    { ...newCourse(), name: "Course 2" },
    { ...newCourse(), name: "Course 3" },
    { ...newCourse(), name: "Course 4" },
  ]);
  const [semesterLabel, setSemesterLabel] = useState("Fall 2025");
  const [showCumulative, setShowCumulative] = useState(false);
  const [prevGPA, setPrevGPA] = useState(3.0);
  const [prevCredits, setPrevCredits] = useState(30);
  const [savedAttempts, setSavedAttempts] = useState<SavedAttempt[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { gpa, totalCredits, totalPoints } = calcGPA(courses);
  const cumulativeGPA = showCumulative ? calcCumulativeGPA(prevGPA, prevCredits, gpa, totalCredits) : gpa;
  const displayGPA = showCumulative ? cumulativeGPA : gpa;
  const gpaColor = getGPAColor(displayGPA);
  const gpaBg = getGPABg(displayGPA);

  useEffect(() => {
    loadAttempts().then(setSavedAttempts);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const addCourse = () => setCourses(prev => [...prev, newCourse()]);
  const updateCourse = (id: string, updated: Course) => setCourses(prev => prev.map(c => c.id === id ? updated : c));
  const deleteCourse = (id: string) => setCourses(prev => prev.filter(c => c.id !== id));
  const handleReset = () => setCourses(
    [newCourse(), newCourse(), newCourse(), newCourse()].map((c, i) => ({ ...c, name: `Course ${i + 1}` }))
  );
  const handleSave = async () => {
    const attempt: SavedAttempt = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      courses: [...courses], gpa: displayGPA, totalCredits, savedAt: Date.now(),
      label: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      semesterLabel,
    };
    await saveAttempt(attempt);
    setSavedAttempts(await loadAttempts());
    setJustSaved(true); setShowHistory(true);
    setTimeout(() => setJustSaved(false), 2200);
  };
  const handleDelete = async (id: string) => { await deleteAttempt(id); setSavedAttempts(await loadAttempts()); };
  const loadAttemptIntoCalc = (a: SavedAttempt) => {
    setCourses(a.courses); setSemesterLabel(a.semesterLabel);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const faqs = [
    {
      q: "How is GPA calculated at Rutgers University?",
      a: "Rutgers uses a simplified 4.0 grading scale that is different from most universities. Rather than a full plus/minus system, Rutgers awards: A = 4.0, B+ = 3.5, B = 3.0, C+ = 2.5, C = 2.0, D = 1.0, and F = 0.0. There is no A-, A+, B-, C-, D+, or D- at Rutgers. Your GPA is calculated by multiplying each grade's point value by the number of credits in that course, summing all those products, then dividing by the total letter-graded credits attempted. Pass (P), No Credit (NC), and Withdrawal (W) grades are excluded from GPA calculations.",
    },
    {
      q: "What makes Rutgers' grading scale different from other universities?",
      a: "Rutgers University uses a compressed grading scale compared to most universities. Most schools use a full plus/minus system with 13 possible letter grades from A+ down to F. Rutgers uses only 7 letter grades with grade point values: A (4.0), B+ (3.5), B (3.0), C+ (2.5), C (2.0), D (1.0), and F (0.0). The jump from B to B+ is 0.5 points, and the jump from C to C+ is also 0.5 points. This compressed scale means individual grades carry more weight, and there is no partial credit for high performance within a letter band below A.",
    },
    {
      q: "What GPA do I need for Dean's List at Rutgers?",
      a: "To be eligible for the Dean's List at Rutgers University, you generally need a semester GPA of 3.5 or higher while enrolled in at least 12 letter-graded credit hours. Requirements may vary slightly by school or college within Rutgers (Rutgers-New Brunswick, Rutgers-Newark, and Rutgers-Camden each have their own policies), so confirm the exact criteria with your specific college or school.",
    },
    {
      q: "What GPA is required for graduation honors at Rutgers?",
      a: "Rutgers awards graduation honors based on your cumulative GPA relative to your graduating class. Highest Honors (equivalent to Summa Cum Laude) is typically awarded to the top 1% of the graduating class. High Honors (Magna Cum Laude equivalent) goes to roughly the next 5%. Honors (Cum Laude equivalent) is awarded to approximately the next 10–15%. The exact GPA cutoffs shift each year depending on class performance, though a cumulative GPA of 3.9+ is typically needed for Highest Honors and 3.7+ for High Honors.",
    },
    {
      q: "What is the minimum GPA to stay in good academic standing at Rutgers?",
      a: "Rutgers requires a minimum cumulative GPA of 2.0 to remain in good academic standing. Students who fall below 2.0 may be placed on academic probation. Continued poor performance can result in academic suspension. Many individual programs at Rutgers — particularly engineering, nursing, pharmacy, and business — require a higher minimum GPA for continued enrollment in the major, often 2.5 or higher.",
    },
    {
      q: "How do P, NC, and W grades affect my Rutgers GPA?",
      a: "Pass (P), No Credit (NC), and Withdrawal (W) grades do not count toward your Rutgers GPA. P and NC grades are excluded from GPA calculations entirely, though they still count toward credit hours for degree progress purposes. A W (Withdrawal) also does not affect your GPA, but excessive withdrawals can affect your academic standing and financial aid eligibility, and may be noted on your transcript.",
    },
    {
      q: "How do I calculate my cumulative GPA at Rutgers across multiple semesters?",
      a: "To calculate your cumulative GPA at Rutgers, multiply each letter grade's point value by the credit hours for that course, sum those products across all letter-graded courses across every semester, then divide by the total letter-graded credit hours attempted. The Cumulative GPA toggle in this calculator lets you enter your prior Rutgers GPA and credit hours to see exactly how your current semester changes your overall standing.",
    },
    {
      q: "How can I raise my GPA at Rutgers quickly?",
      a: "The most effective approach depends on how many credit hours you've completed. Early in your time at Rutgers — under 60 credits — even one strong semester can meaningfully move your cumulative GPA. Later on, you need sustained high-semester GPAs to overcome earlier lower grades, since the growing credit base dilutes the impact of any single semester. Key strategies: retake courses where you earned a D or F if Rutgers' grade replacement policy allows it, prioritize high-credit courses where a grade improvement yields maximum GPA gains, and use tools like Lunora to generate targeted practice questions from your actual Rutgers course notes and readings so you're genuinely prepared for every exam — not just hopeful.",
    },
  ];

  const otherGPATools = [
    { name: "UTK GPA Calculator",                href: "/tools/gpa-calculator/utk-gpa-calculator" },
    { name: "Cumulative GPA Calculator ASU",      href: "/tools/gpa-calculator/cumulative-gpa-calculator-asu" },
    { name: "Cumulative GPA Calculator Berkeley", href: "/tools/gpa-calculator/cumulative-gpa-calculator-berkeley" },
    { name: "Purdue University GPA Calculator",   href: "/tools/gpa-calculator/purdue-gpa-calculator" },
    { name: "Cumulative GPA Calculator LSU",      href: "/tools/gpa-calculator/cumulative-gpa-calculator-lsu" },
    { name: "UIUC GPA Calculator",                href: "/tools/gpa-calculator/uiuc-gpa-calculator" },
    { name: "UT Austin GPA Calculator",           href: "/tools/gpa-calculator/ut-austin-gpa-calculator" },
    { name: "TAMU GPA Calculator",                href: "/tools/gpa-calculator/tamu-gpa-calculator" },
    { name: "UH GPA Calculator",                  href: "/tools/gpa-calculator/uh-gpa-calculator" },
    { name: "OSU GPA Calculator",                 href: "/tools/gpa-calculator/osu-gpa-calculator" },
    { name: "GPA Calculator Berkeley",            href: "/tools/gpa-calculator/gpa-calculator-berkeley" },
    { name: "UCSD GPA Calculator",                href: "/tools/gpa-calculator/ucsd-gpa-calculator" },
    { name: "IU GPA Calculator",                  href: "/tools/gpa-calculator/iu-gpa-calculator" },
    { name: "FSU GPA Calculator",                 href: "/tools/gpa-calculator/fsu-gpa-calculator" },
    { name: "UVM GPA Calculator",                 href: "/tools/gpa-calculator/uvm-gpa-calculator" },
    { name: "Clemson GPA Calculator",             href: "/tools/gpa-calculator/clemson-gpa-calculator" },
  ];

  const honorThresholds = [
    { label: "Highest Honors",   range: "≈ 3.90 – 4.00", color: "#cc0033" },
    { label: "High Honors",      range: "≈ 3.70 – 3.89", color: "#cc0033" },
    { label: "Dean's List",      range: "3.50 – 3.69",   color: "#1e5fa8" },
    { label: "Good Standing",    range: "3.00 – 3.49",   color: "#2d6e9e" },
    { label: "Satisfactory",     range: "2.00 – 2.99",   color: "#8a6a00" },
    { label: "Academic Warning", range: "1.00 – 1.99",   color: "#b84e00" },
    { label: "Probation Risk",   range: "0.00 – 0.99",   color: "#c83232" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400;1,9..40,700&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: #cc0033; color: white; }
        .nav-link { color: #555; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; font-family: 'DM Sans', sans-serif; position: relative; }
        .nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1.5px; background: #203567; transition: width 0.25s; }
        .nav-link:hover { color: #203567; } .nav-link:hover::after { width: 100%; }
        .btn-primary { background: #203567; color: white; border: none; border-radius: 100px; padding: 14px 32px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s, transform 0.15s, box-shadow 0.2s; font-family: 'DM Sans', sans-serif; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
        .btn-primary:hover { background: #162a54; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(32,53,103,0.3); }
        .tag-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; border-radius: 100px; background: rgba(32,53,103,0.07); border: 1px solid rgba(32,53,103,0.12); font-size: 11px; font-weight: 700; color: #203567; letter-spacing: 0.08em; text-transform: uppercase; font-family: 'DM Sans', sans-serif; }
        .score-card { border-radius: 20px; border: 1.5px solid #eef0f8; background: white; padding: 28px; transition: box-shadow 0.2s, transform 0.2s; }
        .score-card:hover { box-shadow: 0 8px 32px rgba(32,53,103,0.09); transform: translateY(-2px); }
        .calc-grid { display: grid; grid-template-columns: 1fr 380px; gap: 32px; max-width: 1100px; margin: 0 auto; align-items: start; }
        @media(max-width: 900px) { .calc-grid { grid-template-columns: 1fr; } }
        .hide-mobile { display: none !important; }
        @media(min-width: 769px) { .hide-mobile { display: flex !important; } }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .tool-card { padding: 14px 16px; border-radius: 14px; border: 1.5px solid #eef0f8; background: #fafbfd; transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s; cursor: pointer; text-decoration: none; display: block; }
        .tool-card:hover { border-color: rgba(32,53,103,0.25); box-shadow: 0 4px 20px rgba(32,53,103,0.08); transform: translateY(-2px); }
        .promo-grid { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
        @media(min-width: 768px) { .promo-grid { grid-template-columns: 1fr 1fr; } }
        select { appearance: none; -webkit-appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 28px !important; }
        .toggle-btn { padding: 8px 18px; border-radius: 100px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid #eef0f8; transition: all 0.2s; font-family: 'DM Sans', sans-serif; }
        .toggle-btn.active { background: #203567; color: white; border-color: #203567; }
        .toggle-btn:not(.active) { background: white; color: #888; }
        .grade-ref-row { display: flex; align-items: center; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f5f5f5; }
      `}</style>

      {/* Schema — WebApplication */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Rutgers GPA Calculator",
        "description": "Free Rutgers University GPA calculator. Uses Rutgers' unique grading scale (A, B+, B, C+, C, D, F) to calculate your semester GPA and cumulative GPA instantly.",
        "url": "https://lunora.app/tools/gpa-calculator/rutgers-gpa-calculator",
        "applicationCategory": "EducationApplication",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "author": { "@type": "Organization", "name": "Lunora", "url": "https://lunora.app" },
      }) }} />

      {/* Schema — FAQPage */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(f => ({
          "@type": "Question", "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a },
        })),
      }) }} />

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,1)", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(32,53,103,0.08)" : "1px solid transparent", transition: "all 0.3s ease" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 120, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}><LunoraLogo size="sm" /></Link>
          <div className="hide-mobile" style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <Link href="/#features" className="nav-link">Features</Link>
            <Link href="/#how-it-works" className="nav-link">How it works</Link>
            <Link href="/#faq" className="nav-link">FAQ</Link>
          </div>
          <Link href="/signin" className="btn-primary" style={{ padding: "10px 24px", fontSize: 14 }}>Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "160px 24px 56px", background: "linear-gradient(180deg,#f8f9fd 0%,#fff 100%)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div className="tag-pill"><Zap size={11} color="#203567" strokeWidth={2.5} />Free Tool · Rutgers</div>
          </div>
          <h1 style={{ fontSize: "clamp(30px,5vw,56px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>
            Rutgers{" "}
            <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#203567" }}>GPA Calculator</span>
          </h1>
          <p style={{ fontSize: 18, color: "#666", lineHeight: 1.7, maxWidth: 610, margin: "0 auto 20px" }}>
            Built for <strong style={{ color: "#1a1a1a" }}>Rutgers University's unique grading scale</strong> — A, B+, B, C+, C, D, F. Calculate your semester GPA and cumulative GPA instantly.
          </p>

          {/* Rutgers scale callout */}
          <div style={{ display: "inline-flex", flexWrap: "wrap", justifyContent: "center", gap: 8, background: "rgba(204,0,51,0.05)", border: "1px solid rgba(204,0,51,0.15)", borderRadius: 14, padding: "12px 20px", marginBottom: 20 }}>
            {[["A","4.0"],["B+","3.5"],["B","3.0"],["C+","2.5"],["C","2.0"],["D","1.0"],["F","0.0"]].map(([g, p]) => (
              <span key={g} style={{ fontSize: 12, fontWeight: 700, color: "#cc0033", background: "rgba(204,0,51,0.08)", padding: "3px 10px", borderRadius: 100 }}>{g} = {p}</span>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            {[
              { Icon: CheckCircle, text: "Rutgers grading scale" },
              { Icon: History,      text: "Saves your semesters"  },
              { Icon: Target,       text: "Cumulative GPA mode"   },
            ].map(({ Icon, text }, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888" }}>
                <Icon size={13} color="#28a745" strokeWidth={2} /> {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section style={{ padding: "0 24px 80px" }}>
        <div className="calc-grid">
          <div>
            {/* Semester Label + Mode Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <input
                type="text"
                placeholder="Semester (e.g. Fall 2025)"
                value={semesterLabel}
                onChange={e => setSemesterLabel(e.target.value)}
                style={{ padding: "8px 16px", border: "1.5px solid #eef0f8", borderRadius: 100, fontSize: 13, fontWeight: 600, color: "#203567", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white", minWidth: 180 }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button className={`toggle-btn${!showCumulative ? " active" : ""}`} onClick={() => setShowCumulative(false)}>Semester GPA</button>
                <button className={`toggle-btn${showCumulative ? " active" : ""}`} onClick={() => setShowCumulative(true)}>Cumulative GPA</button>
              </div>
            </div>

            {/* Course Table */}
            <div className="score-card" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BookOpen size={17} color="#203567" strokeWidth={2} />
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Your Courses — {semesterLabel}</h2>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>P, NC, and W grades are excluded from GPA calculations</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 110px 36px", gap: 10, paddingBottom: 8, borderBottom: "2px solid #eef0f8", marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", textTransform: "uppercase" }}>Course Name</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>Credits</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", textTransform: "uppercase" }}>Grade</span>
                <span />
              </div>

              {courses.map((c, i) => (
                <CourseRow key={c.id} course={c} index={i}
                  onChange={updated => updateCourse(c.id, updated)}
                  onDelete={() => deleteCourse(c.id)} />
              ))}

              <button onClick={addCourse}
                style={{ marginTop: 14, width: "100%", padding: "10px", border: "1.5px dashed #d0d8f0", borderRadius: 12, background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#203567", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(32,53,103,0.04)"}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}>
                <Plus size={14} strokeWidth={2.5} /> Add Course
              </button>

              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(32,53,103,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#888" }}>Total credit hours counted: <strong style={{ color: "#203567" }}>{totalCredits}</strong></span>
                <span style={{ fontSize: 12, color: "#888" }}>Total grade points: <strong style={{ color: "#203567" }}>{totalPoints.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Cumulative GPA Inputs */}
            {showCumulative && (
              <div className="score-card fade-up" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <TrendingUp size={17} color="#203567" strokeWidth={2} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Previous Academic Record</h2>
                    <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Enter your existing Rutgers GPA and credits to calculate your cumulative GPA</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Previous Cumulative GPA</label>
                    <input type="number" min={0} max={4} step={0.01} value={prevGPA}
                      onChange={e => setPrevGPA(Math.max(0, Math.min(4, Number(e.target.value) || 0)))}
                      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #eef0f8", borderRadius: 10, fontSize: 15, fontWeight: 700, color: "#203567", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Previous Credit Hours Earned</label>
                    <input type="number" min={0} max={300} value={prevCredits}
                      onChange={e => setPrevCredits(Math.max(0, Number(e.target.value) || 0))}
                      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #eef0f8", borderRadius: 10, fontSize: 15, fontWeight: 700, color: "#203567", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white" }} />
                  </div>
                </div>
                <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(32,53,103,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#888" }}>Total credits after this semester: <strong style={{ color: "#203567" }}>{prevCredits + totalCredits}</strong></span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#203567" }}>Cumulative GPA: {cumulativeGPA.toFixed(3)}</span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleReset}
                style={{ flex: 1, padding: "11px", border: "1.5px solid #eef0f8", borderRadius: 12, background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#888", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "border-color 0.2s, color 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#203567"; (e.currentTarget as HTMLButtonElement).style.color = "#203567"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#eef0f8"; (e.currentTarget as HTMLButtonElement).style.color = "#888"; }}>
                <RotateCcw size={13} strokeWidth={2} /> Reset all
              </button>
              <button onClick={handleSave} className="btn-primary" style={{ flex: 2, padding: "11px", fontSize: 13 }}>
                {justSaved ? <><CheckCircle size={14} />Saved!</> : <><History size={14} />Save this semester</>}
              </button>
            </div>
          </div>

          {/* Result Panel */}
          <div>
            <div style={{ borderRadius: 24, background: gpaBg, border: `2px solid ${gpaColor}22`, padding: "32px 28px", marginBottom: 20, textAlign: "center", position: "sticky", top: 140 }}>
              <div style={{ marginBottom: 8 }}><GPAGauge gpa={displayGPA} /></div>

              <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", padding: "18px 32px", borderRadius: 16, background: "white", border: `2px solid ${gpaColor}33`, marginBottom: 16, minWidth: 160 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{showCumulative ? "Cumulative GPA" : "Semester GPA"}</span>
                <span style={{ fontSize: 64, fontWeight: 800, color: gpaColor, lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}>{displayGPA.toFixed(2)}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: gpaColor, marginTop: 4 }}>{getGPALabel(displayGPA)}</span>
              </div>

              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.65, maxWidth: 280, margin: "0 auto 20px" }}>{getGPAMessage(displayGPA)}</p>

              {/* Honor Thresholds */}
              <div style={{ borderRadius: 14, border: "1.5px solid #eef0f8", overflow: "hidden", background: "white", marginBottom: 20 }}>
                <div style={{ padding: "12px 16px", background: "#f8f9fd", borderBottom: "1px solid #eef0f8" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: "0.08em", textTransform: "uppercase" }}>Rutgers Honor Thresholds</span>
                </div>
                {honorThresholds.map(({ label, range, color }) => {
                  const isActive = getGPALabel(displayGPA) === label;
                  return (
                    <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderBottom: "1px solid #f0f3fa", background: isActive ? getGPABg(displayGPA) : "transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "#555", fontWeight: isActive ? 700 : 400 }}>{label}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? color : "#bbb", fontFamily: "monospace" }}>{range}</span>
                    </div>
                  );
                })}
              </div>

              {/* Per-course breakdown */}
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>Course Breakdown</span>
                {courses.map((c, i) => {
                  const pts = GRADE_POINTS[c.grade];
                  const counted = pts !== null && pts !== undefined;
                  return (
                    <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>{c.name || `Course ${i + 1}`}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: counted ? "#203567" : "#ccc", flexShrink: 0, marginLeft: 6 }}>{c.grade}</span>
                        </div>
                        <div style={{ height: 5, background: "#eef0f8", borderRadius: 100, overflow: "hidden" }}>
                          <div style={{ height: "100%", background: counted ? "#203567" : "#eee", width: counted ? `${((pts as number) / 4.0) * 100}%` : "0%", borderRadius: 100, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: "#aaa", width: 38, textAlign: "right", flexShrink: 0 }}>{counted ? `${c.credits}cr` : "excl."}</span>
                    </div>
                  );
                })}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f3fa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{showCumulative ? "Cumulative GPA" : "Semester GPA"}</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: gpaColor }}>{displayGPA.toFixed(3)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Semesters */}
        {savedAttempts.length > 0 && (
          <div style={{ maxWidth: 1100, margin: "32px auto 0" }}>
            <button onClick={() => setShowHistory(h => !h)}
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <History size={15} color="#203567" strokeWidth={2} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>Saved Semesters</span>
              <span style={{ fontSize: 12, color: "#aaa", background: "#f0f3fa", padding: "2px 10px", borderRadius: 100, fontWeight: 600 }}>{savedAttempts.length}</span>
              <ChevronDown size={16} color="#888" style={{ transform: showHistory ? "rotate(180deg)" : "none", transition: "transform 0.25s" }} />
            </button>
            {showHistory && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }} className="fade-up">
                {[...savedAttempts].sort((a, b) => b.savedAt - a.savedAt).map(a => {
                  const c = getGPAColor(a.gpa);
                  return (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: "1.5px solid #eef0f8", background: "white" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: getGPABg(a.gpa), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 15, fontWeight: 800, color: c, lineHeight: 1 }}>{a.gpa.toFixed(2)}</span>
                        <span style={{ fontSize: 9, color: c, fontWeight: 600 }}>GPA</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{a.semesterLabel}</div>
                        <div style={{ fontSize: 12, color: "#aaa" }}>{a.courses.length} courses · {a.totalCredits} credits</div>
                        <div style={{ fontSize: 11, color: "#ccc", marginTop: 2 }}>{a.label}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => loadAttemptIntoCalc(a)} style={{ padding: "6px 12px", border: "1.5px solid #eef0f8", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#555", fontFamily: "'DM Sans', sans-serif" }}>Load</button>
                        <button onClick={() => handleDelete(a.id)} style={{ padding: 6, border: "none", background: "none", cursor: "pointer", color: "#ddd", display: "flex" }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#c83232"}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ddd"}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* HOW IT'S CALCULATED */}
      <section style={{ padding: "80px 24px", background: "#fafbfd" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div className="tag-pill"><Info size={11} strokeWidth={2.5} />Rutgers Grading Guide</div>
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.025em", marginBottom: 12 }}>How the Rutgers GPA is calculated</h2>
            <p style={{ fontSize: 16, color: "#777", maxWidth: 560, margin: "0 auto" }}>Rutgers uses a simplified 7-grade scale — no A-, B-, C-, D+, or D-. Each grade has a fixed point value weighted by credit hours.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}>
            {[
              {
                Icon: BarChart2, color: "#cc0033", title: "Rutgers Grade Scale", sub: "7 grades — no plus/minus below B",
                body: "A = 4.0 · B+ = 3.5 · B = 3.0 · C+ = 2.5 · C = 2.0 · D = 1.0 · F = 0.0. No A+, A-, B-, C-, D+, or D-. P, NC, and W grades are excluded from GPA calculations.",
                formula: "grade × credit_hours",
              },
              {
                Icon: BookOpen, color: "#4a7cc7", title: "Semester GPA", sub: "Per-semester calculation",
                body: "Multiply each course's grade points by its credit hours. Sum those products for all letter-graded courses this semester. Divide by total letter-graded credits attempted.",
                formula: "Σ(pts × credits) / Σcredits",
              },
              {
                Icon: TrendingUp, color: "#203567", title: "Cumulative GPA", sub: "Across all Rutgers semesters",
                body: "Combine grade-point products and credit hours from every semester at Rutgers. Cumulative GPA is the weighted average across all letter-graded coursework on your transcript.",
                formula: "(prev_pts + new_pts) / total",
              },
              {
                Icon: Trophy, color: "#cc0033", title: "Rutgers Honors", sub: "Class-relative distinction",
                body: "Unlike fixed cutoffs, Rutgers graduation honors (Highest Honors, High Honors, Honors) are awarded relative to class performance each year. Dean's List requires ≥ 3.5 each semester with 12+ credits.",
                formula: "cumulative GPA → honors",
              },
            ].map(({ Icon, color, title, sub, body, formula }, i) => (
              <div key={i} className="score-card" style={{ padding: "24px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={19} color={color} strokeWidth={1.75} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, opacity: 0.8 }}>{sub}</div>
                <p style={{ fontSize: 13, color: "#666", lineHeight: 1.65, marginBottom: 12 }}>{body}</p>
                <div style={{ padding: "6px 12px", background: `${color}08`, borderRadius: 8, fontFamily: "monospace", fontSize: 12, color, fontWeight: 700 }}>{formula}</div>
              </div>
            ))}
          </div>

          {/* Full grade reference table */}
          <div className="score-card" style={{ maxWidth: 480, margin: "0 auto", padding: "24px 28px" }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1a1a1a", marginBottom: 16 }}>Rutgers Grade Point Reference</div>
            {[
              { grade: "A",  pts: "4.0", note: "Excellent" },
              { grade: "B+", pts: "3.5", note: "Very Good" },
              { grade: "B",  pts: "3.0", note: "Good" },
              { grade: "C+", pts: "2.5", note: "Above Average" },
              { grade: "C",  pts: "2.0", note: "Satisfactory" },
              { grade: "D",  pts: "1.0", note: "Passing (minimal)" },
              { grade: "F",  pts: "0.0", note: "Failing" },
              { grade: "P",  pts: "—",   note: "Pass — excluded from GPA" },
              { grade: "NC", pts: "—",   note: "No Credit — excluded from GPA" },
              { grade: "W",  pts: "—",   note: "Withdrawal — excluded from GPA" },
            ].map(({ grade, pts, note }) => (
              <div key={grade} className="grade-ref-row">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 32, fontSize: 14, fontWeight: 800, color: pts === "—" ? "#ccc" : "#203567", fontFamily: "monospace" }}>{grade}</span>
                  <span style={{ fontSize: 13, color: "#888" }}>{note}</span>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: pts === "—" ? "#ccc" : "#cc0033", fontFamily: "monospace" }}>{pts}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMO */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }} className="promo-grid">
          <div>
            <div style={{ display: "flex", marginBottom: 20 }}><LunoraLogo light size="sm" /></div>
            <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 800, color: "white", lineHeight: 1.2, letterSpacing: "-0.025em", marginBottom: 16 }}>
              Now you know your GPA — time to{" "}
              <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>actually improve it.</span>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, marginBottom: 28 }}>
              Knowing your GPA is step one. Step two is doing something about it. Rutgers' compressed grading scale means the gap between a B and B+ — or a C and C+ — has an outsized impact on your GPA. Most Rutgers students study from static notes and passive reading — and then wonder why their exam grades don't match how much time they put in. Lunora lets you upload your actual course notes, syllabi, and textbook chapters to generate unlimited targeted practice questions, so you're drilling exactly what your professor will test and walking into every exam genuinely prepared.
            </p>
            <Link href="/signin" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", color: "#203567", fontWeight: 800, fontSize: 15, padding: "14px 32px", borderRadius: 100, textDecoration: "none" }}>
              Try Lunora for Free — No Credit Card <ArrowRight size={15} color="#203567" strokeWidth={2.5} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { Icon: Sparkles,    title: "Practice questions from your own Rutgers notes",   body: "Upload your lecture slides, syllabi, and readings from any Rutgers course. Lunora generates unlimited MCQ and short-answer questions from your actual material — not generic internet content." },
              { Icon: Brain,       title: "Active recall beats passive rereading every time",  body: "From CALC 151 to PSYCH 101 to CHEM 161 — Lunora adapts to any subject. Stop rereading and start actively recalling. The research is clear: active recall is the most effective study method." },
              { Icon: TrendingUp,  title: "Track mastery topic by topic",                     body: "See your accuracy by topic across every Rutgers course. Know exactly which concepts need another pass before your next exam so there are no surprises on test day." },
              { Icon: Clock,       title: "Short daily sessions that compound all semester",  body: "Even 15–20 minutes of targeted daily practice compounds dramatically over a Rutgers semester. Consistent short sessions beat weekend cramming every single time." },
            ].map(({ Icon, title, body }, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "16px 18px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={15} color="white" strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OTHER GPA CALCULATORS */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div className="tag-pill"><GraduationCap size={11} strokeWidth={2.5} />More GPA Calculators</div>
            </div>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.025em" }}>GPA calculators for other universities</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
            {otherGPATools.map(({ name, href }) => (
              <Link key={name} href={href} className="tool-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <GraduationCap size={13} color="#203567" strokeWidth={2} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>{name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: "80px 24px", background: "#fafbfd" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div className="tag-pill">FAQ</div>
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#203567", letterSpacing: "-0.025em" }}>Rutgers GPA Calculator FAQ</h2>
            <p style={{ fontSize: 15, color: "#8899bb", marginTop: 10 }}>Everything you need to know about how GPA works at Rutgers University.</p>
          </div>
          {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, color: "white", letterSpacing: "-0.025em", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>Stop guessing. Start studying smarter.</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", marginBottom: 36, lineHeight: 1.65 }}>Turn your Rutgers course notes into unlimited targeted practice questions. Track your mastery. Raise your GPA.</p>
          <Link href="/signin" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "white", color: "#203567", fontWeight: 800, fontSize: 16, padding: "16px 40px", borderRadius: 100, textDecoration: "none" }}>
            Start learning free <ArrowRight size={16} color="#203567" strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#16254a", padding: "48px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <LunoraLogo light size="sm" />
          <div style={{ display: "flex", gap: 28 }}>
            <Link href="/privacy-policy" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms-and-conditions" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Terms</Link>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>© 2026 Lunora. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}