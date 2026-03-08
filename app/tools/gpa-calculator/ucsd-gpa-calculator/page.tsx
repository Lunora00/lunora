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

// ─── UC San Diego GPA Calculation ─────────────────────────────────────────────
// UCSD uses a standard 4.0 scale
// A+ = 4.0, A = 4.0, A- = 3.7
// B+ = 3.3, B = 3.0, B- = 2.7
// C+ = 2.3, C = 2.0, C- = 1.7
// D  = 1.0  (UCSD does not award D+ or D-)
// F  = 0.0
// P/NP (Pass/No Pass), W (withdrawal), I (incomplete) = not counted toward GPA
// Cumulative GPA = Sum(grade_points × units) / Sum(units)
// Provost Honors: semester GPA ≥ 3.5 with 12+ graded units
// Academic standing: Good ≥ 2.0; Probation < 2.0

const GRADE_POINTS: Record<string, number | null> = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D":  1.0,
  "F":  0.0,
  "P": null, "NP": null, "W": null, "I": null,
};

const GRADE_OPTIONS = ["A+","A","A-","B+","B","B-","C+","C","C-","D","F","P","NP","W","I"];

function getGPALabel(gpa: number): string {
  if (gpa >= 3.9) return "Provost Honors";
  if (gpa >= 3.7) return "High Distinction";
  if (gpa >= 3.5) return "Distinction";
  if (gpa >= 3.0) return "Good Standing";
  if (gpa >= 2.0) return "Satisfactory";
  if (gpa >= 1.0) return "Academic Warning";
  return "Academic Probation";
}
function getGPAColor(gpa: number): string {
  if (gpa >= 3.7) return "#1a6e3c";
  if (gpa >= 3.5) return "#1e5fa8";
  if (gpa >= 3.0) return "#2d6e9e";
  if (gpa >= 2.0) return "#8a6a00";
  if (gpa >= 1.0) return "#b84e00";
  return "#c83232";
}
function getGPABg(gpa: number): string {
  if (gpa >= 3.7) return "rgba(26,110,60,0.07)";
  if (gpa >= 3.5) return "rgba(30,95,168,0.07)";
  if (gpa >= 3.0) return "rgba(45,110,158,0.07)";
  if (gpa >= 2.0) return "rgba(138,106,0,0.07)";
  if (gpa >= 1.0) return "rgba(184,78,0,0.07)";
  return "rgba(200,50,50,0.07)";
}
function getGPAMessage(gpa: number): string {
  if (gpa >= 3.9) return "Provost Honors — the highest semester distinction UCSD awards. You're performing at the very top of one of the most rigorous UC campuses. Exceptional work.";
  if (gpa >= 3.7) return "Outstanding standing at UC San Diego. This GPA opens doors to elite graduate programs, research opportunities, and competitive fellowships.";
  if (gpa >= 3.5) return "Distinction territory at UCSD. This reflects genuine academic excellence at one of the world's top research universities.";
  if (gpa >= 3.0) return "Solid academic standing at UCSD. Push toward 3.5 to earn Distinction honors and strengthen your graduate school and career prospects.";
  if (gpa >= 2.0) return "You're meeting UCSD's minimum requirements. Identify your weakest courses and build a targeted improvement plan this quarter.";
  if (gpa >= 1.0) return "Academic warning territory. Use UCSD's Triton tutoring resources and advisor support now — early action makes the biggest difference.";
  return "Immediate intervention needed. Visit UCSD's Academic Support resources and connect with your college advisor as soon as possible.";
}

interface Course { id: string; name: string; credits: number; grade: string; }
interface SavedAttempt { id: string; courses: Course[]; gpa: number; totalCredits: number; savedAt: number; label: string; semesterLabel: string; }

const DB_NAME = "lunora_ucsd_gpa"; const DB_VERSION = 1; const STORE = "attempts";
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
  const svgSizes = { sm: 90, md: 120, lg: 140 }; const textSizes = { sm: 40, md: 50, lg: 60 };
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
      <div style={{ maxHeight: open ? 480 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "max-height 0.35s ease, opacity 0.3s" }}>
        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.75, paddingBottom: 20 }}>{a}</p>
      </div>
    </div>
  );
}

function GPAGauge({ gpa }: { gpa: number }) {
  const color = getGPAColor(gpa);
  const pct = Math.min(gpa / 4.0, 1);
  const r = 54; const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={140} height={100} viewBox="0 0 140 110">
        <circle cx="70" cy="80" r={r} fill="none" stroke="#eef0f8" strokeWidth={10} strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={circ * 0.125} strokeLinecap="round" transform="rotate(-225 70 80)" />
        <circle cx="70" cy="80" r={r} fill="none" stroke={color} strokeWidth={10} strokeDasharray={`${circ * 0.75 * pct} ${circ * (1 - 0.75 * pct)}`} strokeDashoffset={circ * 0.125} strokeLinecap="round" transform="rotate(-225 70 80)" style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
        <text x="70" y="74" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="DM Sans, sans-serif">{gpa.toFixed(2)}</text>
        <text x="70" y="92" textAnchor="middle" fill="#aaa" fontSize="10" fontFamily="DM Sans, sans-serif">out of 4.00</text>
      </svg>
    </div>
  );
}

function CourseRow({ course, onChange, onDelete, index }: { course: Course; onChange: (c: Course) => void; onDelete: () => void; index: number; }) {
  const pts = GRADE_POINTS[course.grade];
  const contributed = pts !== null && pts !== undefined ? pts * course.credits : null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 120px 36px", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f3fa" }}>
      <input type="text" placeholder={`Course ${index + 1} (e.g. CHEM 6A)`} value={course.name}
        onChange={e => onChange({ ...course, name: e.target.value })}
        style={{ padding: "8px 12px", border: "1.5px solid #eef0f8", borderRadius: 10, fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#1a1a1a", outline: "none", background: "white", width: "100%" }} />
      <input type="number" min={1} max={12} value={course.credits}
        onChange={e => onChange({ ...course, credits: Math.max(1, Math.min(12, Number(e.target.value) || 1)) })}
        style={{ width: "100%", padding: "8px 12px", border: "1.5px solid #eef0f8", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#203567", textAlign: "center", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white" }} />
      <select value={course.grade} onChange={e => onChange({ ...course, grade: e.target.value })}
        style={{ padding: "8px 10px", border: "1.5px solid #eef0f8", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#203567", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white", cursor: "pointer", width: "100%" }}>
        {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}{GRADE_POINTS[g] !== null && GRADE_POINTS[g] !== undefined ? ` (${GRADE_POINTS[g]?.toFixed(1)})` : " (excluded)"}</option>)}
      </select>
      <button onClick={onDelete} style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "none", cursor: "pointer", color: "#ddd", display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.2s" }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#c83232"}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ddd"}>
        <Trash2 size={15} />
      </button>
      {contributed !== null && (
        <div style={{ gridColumn: "1 / -1", marginTop: -4, paddingBottom: 4 }}>
          <span style={{ fontSize: 11, color: "#aaa" }}>Grade points contributed: <strong style={{ color: "#203567" }}>{contributed.toFixed(2)}</strong></span>
        </div>
      )}
    </div>
  );
}

function newCourse(): Course {
  return { id: Date.now().toString(36) + Math.random().toString(36).slice(2), name: "", credits: 4, grade: "A" };
}

export default function UCSDGPACalculator() {
  const [courses, setCourses] = useState<Course[]>([
    { ...newCourse(), name: "Course 1" },
    { ...newCourse(), name: "Course 2" },
    { ...newCourse(), name: "Course 3" },
    { ...newCourse(), name: "Course 4" },
  ]);
  const [semesterLabel, setSemesterLabel] = useState("Spring 2026");
  const [showCumulative, setShowCumulative] = useState(false);
  const [prevGPA, setPrevGPA] = useState(3.0);
  const [prevCredits, setPrevCredits] = useState(48);
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
  const handleReset = () => setCourses([0,1,2,3].map(i => ({ ...newCourse(), name: `Course ${i + 1}` })));

  const handleSave = async () => {
    const attempt: SavedAttempt = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), courses: [...courses], gpa: displayGPA, totalCredits, savedAt: Date.now(), label: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }), semesterLabel };
    await saveAttempt(attempt); setSavedAttempts(await loadAttempts()); setJustSaved(true); setShowHistory(true); setTimeout(() => setJustSaved(false), 2200);
  };
  const handleDelete = async (id: string) => { await deleteAttempt(id); setSavedAttempts(await loadAttempts()); };
  const loadAttemptIntoCalc = (a: SavedAttempt) => { setCourses(a.courses); setSemesterLabel(a.semesterLabel); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const faqs = [
    {
      q: "How is GPA calculated at UC San Diego?",
      a: "UC San Diego calculates GPA by dividing total grade points earned by total units attempted with a letter grade. For each course you multiply the grade point value by units — A/A+ = 4.0, A- = 3.7, B+ = 3.3, B = 3.0, and so on down to F = 0.0. Note that UCSD does not award D+ or D- grades — only a single D (1.0). P/NP (Pass/No Pass), W (withdrawal), and I (incomplete) grades are excluded from GPA. UCSD moved from quarters to semesters in Fall 2023.",
    },
    {
      q: "What is Provost Honors at UCSD?",
      a: "Provost Honors is UC San Diego's highest semester academic distinction, awarded to students who earn a semester GPA of 3.5 or above while completing at least 12 graded units in that term. Each of UCSD's six undergraduate colleges (Revelle, Muir, Marshall, Warren, Roosevelt, and Sixth) awards Provost Honors independently. The honor appears on your academic transcript and is a strong signal for graduate school applications and competitive employment.",
    },
    {
      q: "What cumulative GPA do I need for graduation honors at UCSD?",
      a: "UC San Diego awards Latin honors at graduation based on cumulative GPA. Cum Laude requires a GPA of 3.5 to 3.74. Magna Cum Laude is awarded for a GPA of 3.75 to 3.89. Summa Cum Laude — the highest graduation honor at UCSD — requires a cumulative GPA of 3.90 or above. You must also complete a minimum number of units at UCSD to be eligible. Check with your college advising office for the most current thresholds.",
    },
    {
      q: "Does UCSD award D+ or D- grades?",
      a: "No — UC San Diego uses a simplified D grade (1.0 quality points) without plus or minus modifiers. This is one of the key differences from many other UC campuses and universities. There is no D+ (1.3) or D- (0.7) at UCSD. A D still counts toward credit hours attempted and pulls your GPA down. This calculator reflects UCSD's actual grade scale correctly — you won't find D+ or D- in the dropdown.",
    },
    {
      q: "How does UCSD's Pass/No Pass option affect my GPA?",
      a: "Courses taken under Pass/No Pass at UC San Diego are completely excluded from your GPA calculation. A P grade earns credit but adds no grade points; an NP grade adds no grade points and no credit. UCSD typically allows students to take a limited number of units P/NP, and most major and college requirements must be completed for a letter grade. Using P/NP strategically in electives can protect your GPA while you explore broader interests.",
    },
    {
      q: "Did UCSD switch from quarters to semesters?",
      a: "Yes — UC San Diego officially transitioned from a quarter system to a semester system beginning Fall 2023. This was a major academic calendar change affecting course numbering, unit values, and how academic progress is measured. If you completed coursework under the quarter system, those quarter units are converted to semester units on your transcript. This calculator is designed for UCSD's current semester system. If you have older quarter-system coursework, check with the registrar for how those credits are reflected in your official cumulative GPA.",
    },
    {
      q: "What is the minimum GPA to stay in good academic standing at UCSD?",
      a: "UC San Diego requires a minimum cumulative GPA of 2.0 to remain in good academic standing. Students who fall below 2.0 are placed on academic probation. Continued GPA deficiency can lead to academic disqualification. Many UCSD colleges and departments — particularly the Jacobs School of Engineering and the School of Biological Sciences — have higher continuation GPA requirements for their specific programs, so check with your department advisor.",
    },
    {
      q: "How do I calculate my cumulative GPA across multiple semesters at UCSD?",
      a: "To calculate your UCSD cumulative GPA, sum the grade-point products (grade points × units) from every letter-graded semester, then divide by total letter-graded units attempted. The Cumulative GPA mode in this calculator simplifies this — enter your current GPA and total units from previous semesters, add this semester's courses, and your updated cumulative GPA appears instantly.",
    },
    {
      q: "How can I raise my GPA at UC San Diego?",
      a: "Raising your GPA at UCSD is particularly demanding given the university's rigorous STEM programs and competitive curves in gateway courses like CHEM 6A, MATH 20A, and BILD 1. The highest-leverage strategies are: retaking courses under UCSD's repeat policy (check eligibility with your college), using P/NP for exploratory courses to protect your GPA, attacking prerequisites early before upper-division work stacks up, and replacing passive studying with active recall practice. Lunora lets you generate targeted practice questions directly from your UCSD course materials so you build genuine mastery before every exam.",
    },
    {
      q: "Which UCSD college should I consider for GPA and academic support?",
      a: "UCSD's six undergraduate colleges — Revelle, Muir, Marshall, Warren, Roosevelt (formerly FDR), and Sixth — each have different general education requirements that can affect how many required courses sit outside your major, which in turn affects your GPA. Revelle has the most demanding science requirements; Muir offers the most flexibility. Regardless of college, all UCSD students have access to the Triton Testing Center, Subject Tutoring through Teaching + Learning Commons, and college-specific academic advising — resources that can meaningfully support GPA improvement.",
    },
  ];

  const otherGPATools = [
    { name: "ASU Cumulative GPA Calculator",        href: "/tools/gpa-calculator/cumulative-gpa-calculator-asu" },
    { name: "OSU GPA Calculator",                   href: "/tools/gpa-calculator/osu-gpa-calculator" },
    { name: "GPA Calculator Berkeley",              href: "/tools/gpa-calculator/gpa-calculator-berkeley" },
    { name: "Cumulative GPA Calculator Berkeley",   href: "/tools/gpa-calculator/cumulative-gpa-calculator-berkeley" },
    { name: "UTK GPA Calculator",                   href: "/tools/gpa-calculator/utk-gpa-calculator" },
    { name: "Purdue University GPA Calculator",     href: "/tools/gpa-calculator/purdue-gpa-calculator" },
    { name: "Cumulative GPA Calculator LSU",        href: "/tools/gpa-calculator/cumulative-gpa-calculator-lsu" },
    { name: "Rutgers GPA Calculator",               href: "/tools/gpa-calculator/rutgers-gpa-calculator" },
    { name: "UIUC GPA Calculator",                  href: "/tools/gpa-calculator/uiuc-gpa-calculator" },
    { name: "UT Austin GPA Calculator",             href: "/tools/gpa-calculator/ut-austin-gpa-calculator" },
    { name: "TAMU GPA Calculator",                  href: "/tools/gpa-calculator/tamu-gpa-calculator" },
    { name: "UH GPA Calculator",                    href: "/tools/gpa-calculator/uh-gpa-calculator" },
    { name: "IU GPA Calculator",                    href: "/tools/gpa-calculator/iu-gpa-calculator" },
    { name: "FSU GPA Calculator",                   href: "/tools/gpa-calculator/fsu-gpa-calculator" },
    { name: "UVM GPA Calculator",                   href: "/tools/gpa-calculator/uvm-gpa-calculator" },
    { name: "Clemson GPA Calculator",               href: "/tools/gpa-calculator/clemson-gpa-calculator" },
  ];

  const apTools = [
    { name: "AP Environmental Science Score Calculator", href: "/tools/ap-environmental-science-score-calculator" },
    { name: "AP Biology Score Calculator",               href: "/tools/ap-biology-score-calculator" },
    { name: "AP Chemistry Score Calculator",             href: "/tools/ap-chemistry-score-calculator" },
    { name: "AP Physics 1 Score Calculator",             href: "/tools/ap-physics-1-score-calculator" },
    { name: "AP Physics 2 Score Calculator",             href: "/tools/ap-physics-2-score-calculator" },
    { name: "AP Calculus AB Score Calculator",           href: "/tools/ap-calculus-ab-score-calculator" },
    { name: "AP Calculus BC Score Calculator",           href: "/tools/ap-calculus-bc-score-calculator" },
    { name: "AP Statistics Score Calculator",            href: "/tools/ap-statistics-score-calculator" },
    { name: "AP US History Score Calculator",            href: "/tools/ap-us-history-score-calculator" },
    { name: "AP Macroeconomics Score Calculator",        href: "/tools/ap-macroeconomics-score-calculator" },
    { name: "AP English Language Score Calculator",      href: "/tools/ap-english-language-score-calculator" },
    { name: "AP Human Geography Score Calculator",       href: "/tools/ap-human-geography-score-calculator" },
    { name: "AP Physics C Mechanics Score Calculator",   href: "/tools/ap-physics-c-mechanics-score-calculator" },
  ];

  const honorThresholds = [
    { label: "Summa Cum Laude",    range: "3.90 – 4.00", color: "#1a6e3c" },
    { label: "Magna Cum Laude",    range: "3.75 – 3.89", color: "#1a6e3c" },
    { label: "Cum Laude",          range: "3.50 – 3.74", color: "#1e5fa8" },
    { label: "Provost Honors",     range: "3.50+ / sem", color: "#2d6e9e" },
    { label: "Good Standing",      range: "2.00 – 3.49", color: "#2d6e9e" },
    { label: "Academic Probation", range: "0.00 – 1.99", color: "#c83232" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400;1,9..40,700&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: #203567; color: white; }
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
      `}</style>

      {/* Schema.org */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebApplication", "name": "UCSD GPA Calculator", "description": "Free UC San Diego GPA calculator. Enter your courses, units, and grades to instantly calculate your UCSD semester GPA and cumulative GPA. Supports UCSD's official grading scale including A+, P/NP, and no D+/D- grades.", "url": "https://lunora.app/tools/gpa-calculator/ucsd-gpa-calculator", "applicationCategory": "EducationApplication", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }, "author": { "@type": "Organization", "name": "Lunora", "url": "https://lunora.app" } }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } })) }) }} />

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
            <div className="tag-pill"><Zap size={11} color="#203567" strokeWidth={2.5} />Free Tool · UC San Diego</div>
          </div>
          <h1 style={{ fontSize: "clamp(30px,5vw,56px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>
            UCSD{" "}
            <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#203567" }}>GPA Calculator</span>
          </h1>
          <p style={{ fontSize: 18, color: "#666", lineHeight: 1.7, maxWidth: 620, margin: "0 auto 20px" }}>
            Calculate your <strong style={{ color: "#1a1a1a" }}>UC San Diego</strong> semester GPA and cumulative GPA instantly. Built for UCSD's exact grading scale — including A+, no D+/D−, P/NP exclusions, and the new semester system.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            {[{ Icon: CheckCircle, text: "UCSD scale — no D+ or D−" }, { Icon: History, text: "Saves your semesters" }, { Icon: Target, text: "Cumulative GPA mode" }].map(({ Icon, text }, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888" }}><Icon size={13} color="#28a745" strokeWidth={2} /> {text}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section style={{ padding: "0 24px 80px" }}>
        <div className="calc-grid">
          <div>
            {/* Controls Row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <input type="text" placeholder="Quarter/Semester (e.g. Spring 2026)" value={semesterLabel} onChange={e => setSemesterLabel(e.target.value)}
                style={{ padding: "8px 16px", border: "1.5px solid #eef0f8", borderRadius: 100, fontSize: 13, fontWeight: 600, color: "#203567", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white", minWidth: 240 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button className={`toggle-btn${!showCumulative ? " active" : ""}`} onClick={() => setShowCumulative(false)}>Semester GPA</button>
                <button className={`toggle-btn${showCumulative ? " active" : ""}`} onClick={() => setShowCumulative(true)}>Cumulative GPA</button>
              </div>
            </div>

            {/* Course Table */}
            <div className="score-card" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BookOpen size={17} color="#203567" strokeWidth={2} /></div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Your UCSD Courses — {semesterLabel}</h2>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>P/NP, W, and I grades are automatically excluded · No D+ or D− at UCSD</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 120px 36px", gap: 10, paddingBottom: 8, borderBottom: "2px solid #eef0f8", marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", textTransform: "uppercase" }}>Course Name</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "center" }}>Units</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.06em", textTransform: "uppercase" }}>Grade</span>
                <span />
              </div>

              {courses.map((c, i) => (
                <CourseRow key={c.id} course={c} index={i} onChange={updated => updateCourse(c.id, updated)} onDelete={() => deleteCourse(c.id)} />
              ))}

              <button onClick={addCourse} style={{ marginTop: 14, width: "100%", padding: "10px", border: "1.5px dashed #d0d8f0", borderRadius: 12, background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#203567", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "rgba(32,53,103,0.04)"}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}>
                <Plus size={14} strokeWidth={2.5} /> Add Course
              </button>

              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(32,53,103,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 12, color: "#888" }}>Units counted toward GPA: <strong style={{ color: "#203567" }}>{totalCredits}</strong></span>
                <span style={{ fontSize: 12, color: "#888" }}>Total grade points: <strong style={{ color: "#203567" }}>{totalPoints.toFixed(2)}</strong></span>
              </div>
            </div>

            {/* Cumulative Mode */}
            {showCumulative && (
              <div className="score-card fade-up" style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><TrendingUp size={17} color="#203567" strokeWidth={2} /></div>
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Previous Academic Record at UCSD</h2>
                    <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>Enter your GPA and units from all previous terms</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Previous Cumulative GPA</label>
                    <input type="number" min={0} max={4} step={0.001} value={prevGPA} onChange={e => setPrevGPA(Math.max(0, Math.min(4, Number(e.target.value) || 0)))}
                      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #eef0f8", borderRadius: 10, fontSize: 15, fontWeight: 700, color: "#203567", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Previous Units Attempted</label>
                    <input type="number" min={0} max={400} value={prevCredits} onChange={e => setPrevCredits(Math.max(0, Number(e.target.value) || 0))}
                      style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #eef0f8", borderRadius: 10, fontSize: 15, fontWeight: 700, color: "#203567", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white" }} />
                  </div>
                </div>
                <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(32,53,103,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#888" }}>Total units after this term: <strong style={{ color: "#203567" }}>{prevCredits + totalCredits}</strong></span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#203567" }}>New Cumulative GPA: {cumulativeGPA.toFixed(3)}</span>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={handleReset} style={{ flex: 1, padding: "11px", border: "1.5px solid #eef0f8", borderRadius: 12, background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#888", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "border-color 0.2s, color 0.2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#203567"; (e.currentTarget as HTMLButtonElement).style.color = "#203567"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#eef0f8"; (e.currentTarget as HTMLButtonElement).style.color = "#888"; }}>
                <RotateCcw size={13} strokeWidth={2} /> Reset all
              </button>
              <button onClick={handleSave} className="btn-primary" style={{ flex: 2, padding: "11px", fontSize: 13 }}>
                {justSaved ? <><CheckCircle size={14} />Saved!</> : <><History size={14} />Save this term</>}
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

              {/* Thresholds */}
              <div style={{ borderRadius: 14, border: "1.5px solid #eef0f8", overflow: "hidden", background: "white", marginBottom: 20 }}>
                <div style={{ padding: "12px 16px", background: "#f8f9fd", borderBottom: "1px solid #eef0f8" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: "0.08em", textTransform: "uppercase" }}>UCSD Honor Thresholds</span>
                </div>
                {honorThresholds.map(({ label, range, color }) => {
                  const isActive = getGPALabel(displayGPA) === label || (label === "Provost Honors" && displayGPA >= 3.5);
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

              {/* Course Breakdown */}
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
                      <span style={{ fontSize: 11, color: "#aaa", width: 42, textAlign: "right", flexShrink: 0 }}>{counted ? `${c.credits}u` : "excl."}</span>
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

        {/* Saved Terms */}
        {savedAttempts.length > 0 && (
          <div style={{ maxWidth: 1100, margin: "32px auto 0" }}>
            <button onClick={() => setShowHistory(h => !h)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}><History size={15} color="#203567" strokeWidth={2} /></div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>Saved Terms</span>
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
                        <div style={{ fontSize: 12, color: "#aaa" }}>{a.courses.length} courses · {a.totalCredits} units</div>
                        <div style={{ fontSize: 11, color: "#ccc", marginTop: 2 }}>{a.label}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => loadAttemptIntoCalc(a)} style={{ padding: "6px 12px", border: "1.5px solid #eef0f8", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#555", fontFamily: "'DM Sans', sans-serif" }}>Load</button>
                        <button onClick={() => handleDelete(a.id)} style={{ padding: 6, border: "none", background: "none", cursor: "pointer", color: "#ddd", display: "flex" }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#c83232"}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ddd"}><Trash2 size={14} /></button>
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
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><div className="tag-pill"><Info size={11} strokeWidth={2.5} />UCSD Grading Guide</div></div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.025em", marginBottom: 12 }}>How UC San Diego GPA is calculated</h2>
            <p style={{ fontSize: 16, color: "#777", maxWidth: 580, margin: "0 auto" }}>UCSD uses a 4.0 scale with F for failing grades and no D+/D− modifiers. P/NP and W grades are fully excluded from your GPA.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {[
              { Icon: BarChart2, color: "#203567", title: "UCSD Grade Scale", sub: "4.0 max · No D+/D−", body: "A+/A = 4.0 · A- = 3.7 · B+ = 3.3 · B = 3.0 · B- = 2.7 · C+ = 2.3 · C = 2.0 · C- = 1.7 · D = 1.0 · F = 0.0. Note: UCSD does not award D+ or D−. P, NP, W, and I grades are excluded.", formula: "grade_pts × units" },
              { Icon: BookOpen, color: "#4a7cc7", title: "Semester GPA", sub: "Single term", body: "For each letter-graded course, multiply grade points by units. Sum those products, then divide by total graded units attempted that semester. Introduced with the Fall 2023 semester conversion.", formula: "Σ(pts × units) / Σunits" },
              { Icon: TrendingUp, color: "#1a6e3c", title: "Cumulative GPA", sub: "All terms combined", body: "Add grade-point products across every term at UCSD, then divide by total graded units attempted. This is the GPA shown on your official UCSD transcript.", formula: "(all pts) / (all units)" },
              { Icon: Trophy, color: "#1a6e3c", title: "UCSD Honors", sub: "Provost Honors + graduation", body: "Provost Honors: 3.5+ GPA in a single semester with 12+ graded units. Graduation: Cum Laude 3.50–3.74 · Magna Cum Laude 3.75–3.89 · Summa Cum Laude 3.90+.", formula: "GPA threshold → honor" },
            ].map(({ Icon, color, title, sub, body, formula }, i) => (
              <div key={i} className="score-card" style={{ padding: "24px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Icon size={19} color={color} strokeWidth={1.75} /></div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, opacity: 0.8 }}>{sub}</div>
                <p style={{ fontSize: 13, color: "#666", lineHeight: 1.65, marginBottom: 12 }}>{body}</p>
                <div style={{ padding: "6px 12px", background: `${color}08`, borderRadius: 8, fontFamily: "monospace", fontSize: 12, color, fontWeight: 700 }}>{formula}</div>
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
              Now you know your GPA — time to{" "}<span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>actually move it.</span>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, marginBottom: 28 }}>
              UCSD is one of the most academically intense UC campuses — with notoriously difficult gateway courses in STEM and hard curves in Revelle and engineering. Passive studying doesn't cut it here. Lunora lets you upload your actual UCSD course materials and generates unlimited active recall questions on exactly what your professor will test. Whether you're pushing for Provost Honors or recovering from a brutal CHEM 6A, daily targeted practice is how you build the grades you want.
            </p>
            <Link href="/signin" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", color: "#203567", fontWeight: 800, fontSize: 15, padding: "14px 32px", borderRadius: 100, textDecoration: "none" }}>
              Try Lunora for Free — No Credit Card <ArrowRight size={15} color="#203567" strokeWidth={2.5} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { Icon: Sparkles, title: "Practice questions from your own UCSD notes", body: "Upload your lecture slides, syllabi, and readings from any UCSD course. Lunora generates unlimited MCQ and short-answer questions from your actual material — not generic textbook content." },
              { Icon: Brain, title: "Active recall beats passive review every time", body: "From CHEM 6A to MATH 20A to BILD 1 — Lunora adapts to any UCSD course. Active recall is the single most evidence-backed study technique for retention and exam performance." },
              { Icon: TrendingUp, title: "Track mastery topic by topic", body: "See exactly which concepts within each course you've mastered and which still need work. Walk into every Triton exam knowing your gaps are covered." },
              { Icon: Clock, title: "15 minutes a day compounds across a full semester", body: "A consistent 15-minute daily practice habit, built from your actual UCSD course material, compounds dramatically over a full semester. Early investment, outsized GPA return." },
            ].map(({ Icon, title, body }, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "16px 18px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={15} color="white" strokeWidth={2} /></div>
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
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><div className="tag-pill"><GraduationCap size={11} strokeWidth={2.5} />More GPA Calculators</div></div>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.025em" }}>GPA calculators for other universities</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
            {otherGPATools.map(({ name, href }) => (
              <Link key={name} href={href} className="tool-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><GraduationCap size={13} color="#203567" strokeWidth={2} /></div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>{name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AP TOOLS */}
      <section style={{ padding: "0 24px 80px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><div className="tag-pill"><Zap size={11} strokeWidth={2.5} />AP Score Calculators</div></div>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.025em" }}>Predict your AP exam score</h2>
            <p style={{ fontSize: 15, color: "#888", marginTop: 10 }}>Free AP score calculators for every major exam.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 12 }}>
            {apTools.map(({ name, href }) => (
              <Link key={name} href={href} className="tool-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Zap size={13} color="#203567" strokeWidth={2} /></div>
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
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><div className="tag-pill">FAQ</div></div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#203567", letterSpacing: "-0.025em" }}>UCSD GPA Calculator FAQ</h2>
            <p style={{ fontSize: 15, color: "#8899bb", marginTop: 10 }}>Everything you need to know about how GPA works at UC San Diego.</p>
          </div>
          {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, color: "white", letterSpacing: "-0.025em", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>Stop tracking. Start improving.</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", marginBottom: 36, lineHeight: 1.65 }}>Turn your UCSD course notes into unlimited targeted practice questions. Build daily habits that raise your GPA term over term.</p>
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