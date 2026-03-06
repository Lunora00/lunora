"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import {
  Zap, BarChart2, Brain, BookOpen,
  ChevronDown, Trash2, History,
  CheckCircle, Sparkles,
  Trophy, TrendingUp, Clock,
  ArrowRight, RotateCcw, Info, Plus, GraduationCap, Target,
} from "lucide-react";

// ─── Texas A&M GPA Calculation ────────────────────────────────────────────────
// Texas A&M University uses a standard 4.0 grading scale with full plus/minus.
//
// TAMU grade scale:
//   A  = 4.0
//   B  = 3.0
//   C  = 2.0
//   D  = 1.0
//   F  = 0.0
//
// Note: Texas A&M does NOT use plus/minus grades (no A-, B+, B-, C+, etc.)
// This is one of the key differences from UT Austin and UIUC.
//
// Non-GPA grades (excluded from GPA calculation):
//   S  = Satisfactory (not counted)
//   U  = Unsatisfactory (not counted)
//   Q  = Drop (not counted)
//   W  = Withdrawal (not counted)
//   I  = Incomplete (not counted — converts to F if not resolved)
//   X  = Absent from final exam (not counted)
//   CR = Credit (not counted)
//   NC = No Credit (not counted)
//
// Cumulative GPA = Sum(grade_points × credit_hours) / Sum(credit_hours)
//
// Dean's List (Semester Honor Roll): semester GPA ≥ 3.5, 12+ graded credit hours
// Academic honors at graduation:
//   Summa Cum Laude: cumulative GPA ≥ 3.90
//   Magna Cum Laude: cumulative GPA ≥ 3.70
//   Cum Laude:       cumulative GPA ≥ 3.50
// Good standing: cumulative GPA ≥ 2.0
// Academic probation: cumulative GPA < 2.0

const GRADE_POINTS: Record<string, number | null> = {
  "A":  4.0,
  "B":  3.0,
  "C":  2.0,
  "D":  1.0,
  "F":  0.0,
  "S":  null,
  "U":  null,
  "Q":  null,
  "W":  null,
  "I":  null,
  "CR": null,
  "NC": null,
};

const GRADE_OPTIONS = ["A","B","C","D","F","S","U","Q","W","I","CR","NC"];

function getGPALabel(gpa: number): string {
  if (gpa >= 3.9)  return "Summa Cum Laude";
  if (gpa >= 3.7)  return "Magna Cum Laude";
  if (gpa >= 3.5)  return "Dean's List";
  if (gpa >= 3.0)  return "Good Standing";
  if (gpa >= 2.0)  return "Satisfactory";
  if (gpa >= 1.0)  return "Academic Warning";
  return "Academic Probation";
}

function getGPAColor(gpa: number): string {
  if (gpa >= 3.7) return "#13294b";
  if (gpa >= 3.5) return "#1a5276";
  if (gpa >= 3.0) return "#2e7d32";
  if (gpa >= 2.0) return "#8a6a00";
  if (gpa >= 1.0) return "#b84e00";
  return "#c83232";
}

function getGPABg(gpa: number): string {
  if (gpa >= 3.7) return "rgba(19,41,75,0.07)";
  if (gpa >= 3.5) return "rgba(26,82,118,0.07)";
  if (gpa >= 3.0) return "rgba(46,125,50,0.07)";
  if (gpa >= 2.0) return "rgba(138,106,0,0.07)";
  if (gpa >= 1.0) return "rgba(184,78,0,0.07)";
  return "rgba(200,50,50,0.07)";
}

function getGPAMessage(gpa: number): string {
  if (gpa >= 3.9) return "Outstanding — Summa Cum Laude standing at Texas A&M. You're among the top academic performers across the entire university.";
  if (gpa >= 3.7) return "Excellent work. Magna Cum Laude standing at TAMU reflects real mastery of your coursework. You're in elite company.";
  if (gpa >= 3.5) return "Dean's List level. This GPA opens doors to top graduate programs, competitive research positions, and Aggie fellowships.";
  if (gpa >= 3.0) return "Solid academic standing. Push toward 3.5 to earn Dean's List recognition and distinguish yourself in a competitive applicant pool.";
  if (gpa >= 2.0) return "You're meeting TAMU's minimum standards. Identify your weakest courses and work with your advisor to build a stronger record.";
  if (gpa >= 1.0) return "Academic warning territory. Connect with your TAMU academic advisor and the Student Success Center as soon as possible.";
  return "Immediate action required. Contact your college's academic dean's office and the TAMU Student Success Center today.";
}

interface Course { id: string; name: string; credits: number; grade: string; }
interface SavedAttempt {
  id: string; courses: Course[]; gpa: number;
  totalCredits: number; savedAt: number; label: string; semesterLabel: string;
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
const DB_NAME = "lunora_tamu_gpa"; const DB_VERSION = 1; const STORE = "attempts";
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}
async function saveAttempt(a: SavedAttempt): Promise<void> {
  try { const db = await openDB(); await new Promise<void>((res, rej) => { const tx = db.transaction(STORE,"readwrite"); tx.objectStore(STORE).put(a); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); }); } catch {}
}
async function loadAttempts(): Promise<SavedAttempt[]> {
  try { const db = await openDB(); return new Promise((res,rej) => { const tx=db.transaction(STORE,"readonly"); const req=tx.objectStore(STORE).getAll(); req.onsuccess=()=>res(req.result||[]); req.onerror=()=>rej(req.error); }); } catch { return []; }
}
async function deleteAttempt(id: string): Promise<void> {
  try { const db = await openDB(); await new Promise<void>((res,rej) => { const tx=db.transaction(STORE,"readwrite"); tx.objectStore(STORE).delete(id); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); }); } catch {}
}

// ─── GPA math ─────────────────────────────────────────────────────────────────
function calcGPA(courses: Course[]) {
  let totalCredits = 0, totalPoints = 0;
  for (const c of courses) {
    const pts = GRADE_POINTS[c.grade];
    if (pts != null) { totalCredits += c.credits; totalPoints += pts * c.credits; }
  }
  return { gpa: totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 1000) / 1000 : 0, totalCredits, totalPoints };
}

function calcCumulativeGPA(prevGPA: number, prevCredits: number, newGPA: number, newCredits: number): number {
  const total = prevCredits + newCredits;
  if (total === 0) return 0;
  return Math.round(((prevGPA * prevCredits + newGPA * newCredits) / total) * 1000) / 1000;
}

function newCourse(): Course {
  return { id: Date.now().toString(36) + Math.random().toString(36).slice(2), name: "", credits: 3, grade: "A" };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function LunoraLogo({ light = false, size = "md" }: { light?: boolean; size?: "sm"|"md"|"lg" }) {
  const svgS = { sm: 90, md: 120, lg: 140 }[size];
  const txS  = { sm: 40, md: 50,  lg: 60  }[size];
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, userSelect:"none" }}>
      <svg viewBox="0 0 100 100" style={{ width:svgS, height:svgS, transform:"rotate(40deg)", flexShrink:0 }}>
        <defs><mask id={`lm-${light?"l":"d"}`}><rect width="100" height="100" fill="white"/><circle cx="57" cy="50" r="40" fill="black"/></mask></defs>
        <circle cx="50" cy="50" r="42" fill={light?"white":"#13294b"} mask={`url(#lm-${light?"l":"d"})`}/>
      </svg>
      <span style={{ fontSize:txS, fontWeight:300, letterSpacing:"0.12em", color:light?"white":"#1a1a1a", marginLeft:-60, marginTop:6, fontFamily:"'DM Sans',sans-serif" }}>lunora</span>
    </div>
  );
}

function GPAGauge({ gpa }: { gpa: number }) {
  const color = getGPAColor(gpa);
  const pct = gpa / 4.0;
  const r = 54, circ = 2 * Math.PI * r;
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <svg width={140} height={100} viewBox="0 0 140 110">
        <circle cx="70" cy="80" r={r} fill="none" stroke="#eef0f8" strokeWidth={10}
          strokeDasharray={`${circ*0.75} ${circ*0.25}`} strokeDashoffset={circ*0.125}
          strokeLinecap="round" transform="rotate(-225 70 80)"/>
        <circle cx="70" cy="80" r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${circ*0.75*pct} ${circ*(1-0.75*pct)}`} strokeDashoffset={circ*0.125}
          strokeLinecap="round" transform="rotate(-225 70 80)"
          style={{ transition:"stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }}/>
        <text x="70" y="74" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="DM Sans,sans-serif">{gpa.toFixed(2)}</text>
        <text x="70" y="92" textAnchor="middle" fill="#aaa" fontSize="10" fontFamily="DM Sans,sans-serif">out of 4.00</text>
      </svg>
    </div>
  );
}

function CourseRow({ course, onChange, onDelete, index }: {
  course: Course; onChange: (c: Course) => void; onDelete: () => void; index: number;
}) {
  const pts = GRADE_POINTS[course.grade];
  const contributed = pts != null ? pts * course.credits : null;
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 90px 120px 36px", gap:10, alignItems:"center", padding:"10px 0", borderBottom:"1px solid #f0f3fa" }}>
      <input type="text" placeholder={`Course ${index+1} (e.g. MATH 151)`} value={course.name}
        onChange={e => onChange({...course, name:e.target.value})}
        style={{ padding:"8px 12px", border:"1.5px solid #eef0f8", borderRadius:10, fontSize:13, fontFamily:"'DM Sans',sans-serif", color:"#1a1a1a", outline:"none", background:"white", width:"100%" }}/>
      <input type="number" min={1} max={12} value={course.credits}
        onChange={e => onChange({...course, credits:Math.max(1,Math.min(12,Number(e.target.value)||1))})}
        style={{ width:"100%", padding:"8px 12px", border:"1.5px solid #eef0f8", borderRadius:10, fontSize:13, fontWeight:700, color:"#13294b", textAlign:"center", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"white" }}/>
      <select value={course.grade} onChange={e => onChange({...course, grade:e.target.value})}
        style={{ padding:"8px 10px", border:"1.5px solid #eef0f8", borderRadius:10, fontSize:13, fontWeight:700, color:"#13294b", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"white", cursor:"pointer", width:"100%" }}>
        {GRADE_OPTIONS.map(g => (
          <option key={g} value={g}>{g}{GRADE_POINTS[g]!=null ? ` (${GRADE_POINTS[g]?.toFixed(2)})` : " (no credit)"}</option>
        ))}
      </select>
      <button onClick={onDelete}
        style={{ width:36, height:36, borderRadius:8, border:"none", background:"none", cursor:"pointer", color:"#ddd", display:"flex", alignItems:"center", justifyContent:"center", transition:"color 0.2s" }}
        onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color="#c83232"}
        onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color="#ddd"}>
        <Trash2 size={15}/>
      </button>
      {contributed !== null && (
        <div style={{ gridColumn:"1/-1", marginTop:-4, paddingBottom:4 }}>
          <span style={{ fontSize:11, color:"#aaa" }}>Grade points: <strong style={{ color:"#13294b" }}>{contributed.toFixed(2)}</strong></span>
        </div>
      )}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom:"1px solid #eef0f8" }}>
      <button onClick={()=>setOpen(!open)} style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 0", background:"none", border:"none", cursor:"pointer", textAlign:"left", fontFamily:"'DM Sans',sans-serif" }}>
        <span style={{ fontWeight:600, fontSize:15, color:"#13294b", paddingRight:16, lineHeight:1.4 }}>{q}</span>
        <span style={{ color:"#13294b", transition:"transform 0.25s", transform:open?"rotate(180deg)":"none", flexShrink:0 }}><ChevronDown size={18}/></span>
      </button>
      <div style={{ maxHeight:open?500:0, opacity:open?1:0, overflow:"hidden", transition:"max-height 0.35s ease, opacity 0.3s" }}>
        <p style={{ fontSize:14, color:"#555", lineHeight:1.75, paddingBottom:20 }}>{a}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TAMUGPACalculator() {
  const [courses, setCourses] = useState<Course[]>([
    {...newCourse(), name:"Course 1"}, {...newCourse(), name:"Course 2"},
    {...newCourse(), name:"Course 3"}, {...newCourse(), name:"Course 4"},
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
  const gpaBg    = getGPABg(displayGPA);

  useEffect(() => {
    loadAttempts().then(setSavedAttempts);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const addCourse    = () => setCourses(p => [...p, newCourse()]);
  const updateCourse = (id: string, c: Course) => setCourses(p => p.map(x => x.id===id ? c : x));
  const deleteCourse = (id: string) => setCourses(p => p.filter(x => x.id!==id));
  const handleReset  = () => setCourses([newCourse(),newCourse(),newCourse(),newCourse()].map((c,i)=>({...c,name:`Course ${i+1}`})));

  const handleSave = async () => {
    const a: SavedAttempt = {
      id: Date.now().toString(36)+Math.random().toString(36).slice(2),
      courses:[...courses], gpa:displayGPA, totalCredits, savedAt:Date.now(),
      label: new Date().toLocaleString("en-US",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}),
      semesterLabel,
    };
    await saveAttempt(a);
    setSavedAttempts(await loadAttempts());
    setJustSaved(true); setShowHistory(true);
    setTimeout(()=>setJustSaved(false), 2200);
  };
  const handleDelete = async (id: string) => { await deleteAttempt(id); setSavedAttempts(await loadAttempts()); };
  const loadAttemptIntoCalc = (a: SavedAttempt) => { setCourses(a.courses); setSemesterLabel(a.semesterLabel); window.scrollTo({top:0,behavior:"smooth"}); };

  // ── SEO DATA ──────────────────────────────────────────────────────────────
  const PAGE_TITLE       = "TAMU GPA Calculator — Texas A&M University GPA Calculator (2025)";
  const PAGE_DESCRIPTION = "Free Texas A&M University GPA calculator. Uses TAMU's official 4.0 grading scale (A, B, C, D, F — no plus/minus) to calculate your semester GPA and cumulative GPA instantly.";
  const PAGE_URL         = "https://lunora.app/tools/gpa-calculator/tamu-gpa-calculator";

  const faqs = [
    { q:"How is GPA calculated at Texas A&M?",
      a:"Texas A&M University uses a 4.0 grading scale with five letter grades: A = 4.0, B = 3.0, C = 2.0, D = 1.0, and F = 0.0. Critically, TAMU does not use plus/minus grades — there is no A-, B+, B-, C+, or any other modified letter grade on the standard scale. Your GPA is calculated by multiplying each grade's point value by the number of credit hours in that course, summing those products across all letter-graded courses, then dividing by the total letter-graded credit hours attempted. S, U, Q, W, I, CR, and NC grades are excluded from GPA calculations." },
    { q:"Does Texas A&M use plus/minus grades?",
      a:"No. Texas A&M University does not use plus/minus grades on its standard undergraduate grading scale. TAMU uses a simplified 5-grade system: A (4.0), B (3.0), C (2.0), D (1.0), and F (0.0). This is a significant difference from universities like UT Austin, UIUC, or Purdue, which use full plus/minus scales with 12–13 distinct grade values. Because TAMU uses only whole-letter grades, there are larger jumps between GPA outcomes — moving from a B to an A in a 3-credit course adds 3.0 grade points to your total, compared to 1.0 points per credit at schools with plus/minus systems." },
    { q:"What GPA do I need for the Dean's List at Texas A&M?",
      a:"To qualify for the Semester Honor Roll (Dean's List equivalent) at Texas A&M University, undergraduate students generally need a semester GPA of 3.5 or higher while enrolled in at least 12 graded credit hours. Requirements can vary by college — the College of Engineering, Mays Business School, and College of Agriculture and Life Sciences each have their own Honor Roll criteria. Always confirm the specific requirements with your college's academic advising office." },
    { q:"What GPA is required for graduation honors at TAMU?",
      a:"Texas A&M awards three tiers of graduation honors based on cumulative GPA: Summa Cum Laude requires a cumulative GPA of 3.90 or above. Magna Cum Laude requires a cumulative GPA of 3.70 or above. Cum Laude requires a cumulative GPA of 3.50 or above. These thresholds are applied to your cumulative GPA across all letter-graded coursework at TAMU. Note that because TAMU does not use plus/minus grades, GPAs tend to cluster at whole-number boundaries (4.0, 3.0, 2.0), so reaching 3.5 or 3.9 typically requires a consistent record of A grades with limited B grades." },
    { q:"What is the minimum GPA to stay in good academic standing at TAMU?",
      a:"Texas A&M requires a minimum cumulative GPA of 2.0 to remain in good academic standing as an undergraduate student. Students who fall below a 2.0 cumulative GPA are placed on academic probation. Many individual programs at TAMU — particularly engineering, veterinary medicine, business, and nursing — require higher GPAs for continued enrollment in the major, sometimes 2.5 to 3.0 or above. Always check the specific requirements for your declared major and college." },
    { q:"How do Q, W, S, U, and I grades affect my TAMU GPA?",
      a:"Q (Drop), W (Withdrawal), S (Satisfactory), U (Unsatisfactory), I (Incomplete), CR (Credit), and NC (No Credit) grades are excluded from your Texas A&M GPA calculation entirely. A Q grade is assigned when you drop a course after the Q-drop deadline and does not affect GPA but uses one of your 6 allowed Q-drops for the degree. A W is recorded after official withdrawal from a course. An I (Incomplete) must be resolved by the end of the next regular semester — if not completed, it converts to an F, which would then count against your GPA. S and U grades are used for pass/fail coursework and do not affect GPA." },
    { q:"How do I calculate my cumulative GPA at TAMU across multiple semesters?",
      a:"To calculate your cumulative GPA at Texas A&M, multiply each letter grade's point value by the credit hours for that course across every semester, sum those products, then divide by your total letter-graded credit hours. The Cumulative GPA mode in this calculator lets you enter your prior TAMU GPA and credit hours to see exactly how your current semester affects your overall standing. Because TAMU uses only whole-letter grades (A, B, C, D, F), semester GPAs will typically be round numbers or straightforward averages." },
    { q:"How is TAMU's grading scale different from other Texas universities?",
      a:"The key difference between TAMU's grading scale and those of most other major Texas universities is that Texas A&M does not use plus/minus grades. UT Austin uses a full plus/minus system with 12 letter grades (A through D-). This means a TAMU student earning all B grades has a 3.0 GPA, whereas a UT Austin student earning B+ and B- grades could have anything from 2.67 to 3.33 across courses. TAMU's 5-grade system creates larger GPA jumps between letter grades, making each individual grade more impactful on your cumulative GPA." },
    { q:"How can I raise my GPA at Texas A&M?",
      a:"Because TAMU uses only whole-letter grades, improving a single course from a B (3.0) to an A (4.0) in a 3-credit course adds 3.0 grade points — a meaningful improvement. Key strategies: focus on high-credit courses where grade improvements yield maximum GPA impact, use TAMU's grade exclusion policy if you retake courses, take advantage of the Student Success Center tutoring and academic coaching resources, and use tools like Lunora to generate targeted practice questions from your actual TAMU course notes and readings so you walk into every exam genuinely prepared." },
    { q:"Is this TAMU GPA calculator accurate?",
      a:"Yes. This Texas A&M GPA calculator uses TAMU's official grading scale exactly as published by the Office of the Registrar — A = 4.0, B = 3.0, C = 2.0, D = 1.0, F = 0.0, with no plus/minus grades. Non-GPA grades (Q, W, S, U, I, CR, NC) are correctly excluded from calculations. For your official GPA, always refer to your transcript on Howdy, TAMU's student information portal." },
  ];

  const honorThresholds = [
    { label:"Summa Cum Laude",  range:"3.90 – 4.00", color:"#13294b" },
    { label:"Magna Cum Laude",  range:"3.70 – 3.89", color:"#13294b" },
    { label:"Dean's List",      range:"3.50 – 3.69", color:"#1a5276" },
    { label:"Good Standing",    range:"3.00 – 3.49", color:"#2e7d32" },
    { label:"Satisfactory",     range:"2.00 – 2.99", color:"#8a6a00" },
    { label:"Academic Warning", range:"1.00 – 1.99", color:"#b84e00" },
    { label:"Probation Risk",   range:"0.00 – 0.99", color:"#c83232" },
  ];

  const otherGPATools = [
    { name:"Rutgers GPA Calculator",              href:"/tools/gpa-calculator/rutgers-gpa-calculator" },
    { name:"UTK GPA Calculator",                  href:"/tools/gpa-calculator/utk-gpa-calculator" },
    { name:"Cumulative GPA Calculator ASU",        href:"/tools/gpa-calculator/cumulative-gpa-calculator-asu" },
    { name:"Cumulative GPA Calculator Berkeley",   href:"/tools/gpa-calculator/cumulative-gpa-calculator-berkeley" },
    { name:"Purdue University GPA Calculator",     href:"/tools/gpa-calculator/purdue-gpa-calculator" },
    { name:"Cumulative GPA Calculator LSU",        href:"/tools/gpa-calculator/cumulative-gpa-calculator-lsu" },
    { name:"UIUC GPA Calculator",                  href:"/tools/gpa-calculator/uiuc-gpa-calculator" },
    { name:"UT Austin GPA Calculator",             href:"/tools/gpa-calculator/ut-austin-gpa-calculator" },
    { name:"UH GPA Calculator",                    href:"/tools/gpa-calculator/uh-gpa-calculator" },
    { name:"OSU GPA Calculator",                   href:"/tools/gpa-calculator/osu-gpa-calculator" },
    { name:"GPA Calculator Berkeley",              href:"/tools/gpa-calculator/gpa-calculator-berkeley" },
    { name:"UCSD GPA Calculator",                  href:"/tools/gpa-calculator/ucsd-gpa-calculator" },
    { name:"IU GPA Calculator",                    href:"/tools/gpa-calculator/iu-gpa-calculator" },
    { name:"FSU GPA Calculator",                   href:"/tools/gpa-calculator/fsu-gpa-calculator" },
    { name:"UVM GPA Calculator",                   href:"/tools/gpa-calculator/uvm-gpa-calculator" },
    { name:"Clemson GPA Calculator",               href:"/tools/gpa-calculator/clemson-gpa-calculator" },
  ];

  // ── JSON-LD schemas ───────────────────────────────────────────────────────
  const schemaWebApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "TAMU GPA Calculator",
    "alternateName": ["Texas A&M GPA Calculator", "Texas A&M University GPA Calculator", "Aggie GPA Calculator"],
    "description": PAGE_DESCRIPTION,
    "url": PAGE_URL,
    "applicationCategory": "EducationApplication",
    "operatingSystem": "All",
    "browserRequirements": "Requires JavaScript",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "author": { "@type": "Organization", "name": "Lunora", "url": "https://lunora.app" },
    "audience": { "@type": "EducationalAudience", "educationalRole": "student" },
    "keywords": "TAMU GPA calculator, Texas A&M GPA calculator, Texas A&M University GPA calculator, TAMU semester GPA, TAMU cumulative GPA, Aggie GPA calculator",
  };

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Lunora", "item": "https://lunora.app" },
      { "@type": "ListItem", "position": 2, "name": "GPA Calculators", "item": "https://lunora.app/tools/gpa-calculator" },
      { "@type": "ListItem", "position": 3, "name": "TAMU GPA Calculator", "item": PAGE_URL },
    ],
  };

  const schemaFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(f => ({
      "@type": "Question", "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a },
    })),
  };

  const schemaHowTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to calculate your TAMU GPA",
    "description": "Step-by-step guide to calculating your GPA at Texas A&M University using the official 4.0 grading scale.",
    "step": [
      { "@type": "HowToStep", "name": "Enter your courses", "text": "Add each course you are taking this semester at Texas A&M, including the course name and number of credit hours." },
      { "@type": "HowToStep", "name": "Select your grade", "text": "Choose your letter grade for each course using TAMU's scale: A, B, C, D, or F. Texas A&M does not use plus/minus grades. S, U, Q, W, I, CR, and NC grades are automatically excluded." },
      { "@type": "HowToStep", "name": "Read your semester GPA", "text": "The calculator instantly computes your TAMU semester GPA using the formula: Sum(grade_points × credit_hours) ÷ Sum(credit_hours)." },
      { "@type": "HowToStep", "name": "(Optional) Calculate cumulative GPA", "text": "Switch to Cumulative GPA mode and enter your previous TAMU GPA and credit hours to see your overall cumulative GPA." },
    ],
  };

  return (
    <>
      {/* ── Head / SEO ───────────────────────────────────────────────────── */}
      <Head>
        <title>{PAGE_TITLE}</title>
        <meta name="description" content={PAGE_DESCRIPTION} />
        <meta name="keywords" content="TAMU GPA calculator, Texas A&M GPA calculator, Texas A&M University GPA calculator, TAMU semester GPA calculator, TAMU cumulative GPA calculator, Aggie GPA calculator, TAMU Dean's List GPA, Texas A&M grading scale" />
        <link rel="canonical" href={PAGE_URL} />

        <meta property="og:title"       content={PAGE_TITLE} />
        <meta property="og:description" content={PAGE_DESCRIPTION} />
        <meta property="og:url"         content={PAGE_URL} />
        <meta property="og:type"        content="website" />
        <meta property="og:site_name"   content="Lunora" />
        <meta property="og:image"       content="https://lunora.app/og/tamu-gpa-calculator.png" />

        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content={PAGE_TITLE} />
        <meta name="twitter:description" content={PAGE_DESCRIPTION} />
        <meta name="twitter:image"       content="https://lunora.app/og/tamu-gpa-calculator.png" />

        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaWebApp) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaBreadcrumb) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaFAQ) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaHowTo) }} />
      </Head>

      <div style={{ minHeight:"100vh", background:"#fff", color:"#1a1a1a", fontFamily:"'DM Sans',sans-serif", overflowX:"hidden" }}>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400;1,9..40,700&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&display=swap');
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html{scroll-behavior:smooth}
          ::selection{background:#13294b;color:white}
          .nav-link{color:#555;text-decoration:none;font-size:14px;font-weight:500;transition:color .2s;font-family:'DM Sans',sans-serif;position:relative}
          .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1.5px;background:#13294b;transition:width .25s}
          .nav-link:hover{color:#13294b}.nav-link:hover::after{width:100%}
          .btn-primary{background:#13294b;color:white;border:none;border-radius:100px;padding:14px 32px;font-size:15px;font-weight:700;cursor:pointer;transition:background .2s,transform .15s,box-shadow .2s;font-family:'DM Sans',sans-serif;display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none}
          .btn-primary:hover{background:#0d1f38;transform:translateY(-1px);box-shadow:0 8px 30px rgba(19,41,75,0.3)}
          .tag-pill{display:inline-flex;align-items:center;gap:6px;padding:4px 14px;border-radius:100px;background:rgba(19,41,75,0.07);border:1px solid rgba(19,41,75,0.12);font-size:11px;font-weight:700;color:#13294b;letter-spacing:.08em;text-transform:uppercase;font-family:'DM Sans',sans-serif}
          .score-card{border-radius:20px;border:1.5px solid #eef0f8;background:white;padding:28px;transition:box-shadow .2s,transform .2s}
          .score-card:hover{box-shadow:0 8px 32px rgba(19,41,75,0.09);transform:translateY(-2px)}
          .calc-grid{display:grid;grid-template-columns:1fr 380px;gap:32px;max-width:1100px;margin:0 auto;align-items:start}
          @media(max-width:900px){.calc-grid{grid-template-columns:1fr}}
          .hide-mobile{display:none!important}
          @media(min-width:769px){.hide-mobile{display:flex!important}}
          input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
          input[type=number]{-moz-appearance:textfield}
          @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
          .fade-up{animation:fadeUp .5s ease both}
          .tool-card{padding:14px 16px;border-radius:14px;border:1.5px solid #eef0f8;background:#fafbfd;transition:border-color .2s,box-shadow .2s,transform .2s;cursor:pointer;text-decoration:none;display:block}
          .tool-card:hover{border-color:rgba(19,41,75,0.25);box-shadow:0 4px 20px rgba(19,41,75,0.08);transform:translateY(-2px)}
          .promo-grid{display:grid;grid-template-columns:1fr;gap:48px;align-items:center}
          @media(min-width:768px){.promo-grid{grid-template-columns:1fr 1fr}}
          select{appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:28px!important}
          .toggle-btn{padding:8px 18px;border-radius:100px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid #eef0f8;transition:all .2s;font-family:'DM Sans',sans-serif}
          .toggle-btn.active{background:#13294b;color:white;border-color:#13294b}
          .toggle-btn:not(.active){background:white;color:#888}
          .grade-ref-row{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f5f5f5}
        `}</style>

        {/* ── NAV ──────────────────────────────────────────────────────────── */}
        <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, background:scrolled?"rgba(255,255,255,0.95)":"rgba(255,255,255,1)", backdropFilter:scrolled?"blur(20px)":"none", borderBottom:scrolled?"1px solid rgba(19,41,75,0.08)":"1px solid transparent", transition:"all .3s ease" }}>
          <div style={{ maxWidth:1280, margin:"0 auto", padding:"60px", height:72, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <Link href="/" style={{ textDecoration:"none" }} aria-label="Lunora home"><LunoraLogo size="sm"/></Link>
            <div className="hide-mobile" style={{ display:"flex", gap:32, alignItems:"center" }}>
              <Link href="/#features"     className="nav-link">Features</Link>
              <Link href="/#how-it-works" className="nav-link">How it works</Link>
              <Link href="/#faq"          className="nav-link">FAQ</Link>
            </div>
            <Link href="/signin" className="btn-primary" style={{ padding:"10px 24px", fontSize:14 }}>Get Started</Link>
          </div>
        </nav>

        {/* ── HERO ─────────────────────────────────────────────────────────── */}
        <section style={{ padding:"140px 24px 56px", background:"linear-gradient(180deg,#f8f9fd 0%,#fff 100%)" }}>
          <div style={{ maxWidth:760, margin:"0 auto", textAlign:"center" }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
              <div className="tag-pill"><Zap size={11} color="#13294b" strokeWidth={2.5}/>Free Tool · Texas A&M</div>
            </div>

            <h1 style={{ fontSize:"clamp(30px,5vw,56px)", fontWeight:800, lineHeight:1.08, letterSpacing:"-0.03em", color:"#1a1a1a", fontFamily:"'DM Sans',sans-serif", marginBottom:16 }}>
              TAMU{" "}
              <span style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic", color:"#13294b" }}>GPA Calculator</span>
            </h1>

            <p style={{ fontSize:18, color:"#666", lineHeight:1.7, maxWidth:640, margin:"0 auto 8px" }}>
              The free <strong style={{ color:"#1a1a1a" }}>Texas A&M University GPA calculator</strong> — built on TAMU's official grading scale. No plus/minus grades. Calculate your semester GPA and cumulative GPA in seconds.
            </p>
            <p style={{ fontSize:14, color:"#999", marginBottom:24, maxWidth:560, margin:"0 auto 24px" }}>
              Used by Aggies across Engineering, Mays Business, Agriculture & Life Sciences, and every other TAMU college.
            </p>

            {/* TAMU grade scale callout — no plus/minus */}
            <div style={{ display:"inline-flex", flexWrap:"wrap", justifyContent:"center", gap:8, background:"rgba(19,41,75,0.05)", border:"1px solid rgba(19,41,75,0.15)", borderRadius:14, padding:"12px 20px", marginBottom:8 }}>
              {[["A","4.00"],["B","3.00"],["C","2.00"],["D","1.00"],["F","0.00"]].map(([g,p]) => (
                <span key={g} style={{ fontSize:13, fontWeight:700, color:"#13294b", background:"rgba(19,41,75,0.08)", padding:"4px 14px", borderRadius:100 }}>{g} = {p}</span>
              ))}
            </div>
            <p style={{ fontSize:12, color:"#aaa", marginBottom:24 }}>Texas A&M does not use plus/minus grades</p>

            <div style={{ display:"flex", justifyContent:"center", gap:20, flexWrap:"wrap" }}>
              {[
                { Icon:CheckCircle, text:"No plus/minus scale" },
                { Icon:History,     text:"Saves your semesters" },
                { Icon:Target,      text:"Cumulative GPA mode"  },
              ].map(({ Icon, text }, i) => (
                <span key={i} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, color:"#888" }}>
                  <Icon size={13} color="#28a745" strokeWidth={2}/> {text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── CALCULATOR ───────────────────────────────────────────────────── */}
        <section aria-label="TAMU GPA Calculator" style={{ padding:"0 24px 80px" }}>
          <div className="calc-grid">

            {/* Left — inputs */}
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
                <input type="text" placeholder="Semester (e.g. Fall 2025)" value={semesterLabel}
                  onChange={e=>setSemesterLabel(e.target.value)}
                  aria-label="Semester label"
                  style={{ padding:"8px 16px", border:"1.5px solid #eef0f8", borderRadius:100, fontSize:13, fontWeight:600, color:"#13294b", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"white", minWidth:180 }}/>
                <div style={{ display:"flex", gap:8 }}>
                  <button className={`toggle-btn${!showCumulative?" active":""}`} onClick={()=>setShowCumulative(false)} aria-pressed={!showCumulative}>Semester GPA</button>
                  <button className={`toggle-btn${showCumulative?" active":""}`}  onClick={()=>setShowCumulative(true)}  aria-pressed={showCumulative}>Cumulative GPA</button>
                </div>
              </div>

              <div className="score-card" style={{ marginBottom:24 }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:"rgba(19,41,75,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <BookOpen size={17} color="#13294b" strokeWidth={2}/>
                  </div>
                  <div>
                    <h2 style={{ fontSize:17, fontWeight:800, color:"#1a1a1a", margin:0 }}>Your Courses — {semesterLabel}</h2>
                    <p style={{ fontSize:12, color:"#aaa", marginTop:2 }}>S, U, Q, W, I, CR, and NC grades are excluded from GPA calculations per TAMU's official policy</p>
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 90px 120px 36px", gap:10, paddingBottom:8, borderBottom:"2px solid #eef0f8", marginBottom:4 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.06em", textTransform:"uppercase" }}>Course Name</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.06em", textTransform:"uppercase", textAlign:"center" }}>Credits</span>
                  <span style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.06em", textTransform:"uppercase" }}>Grade</span>
                  <span/>
                </div>

                {courses.map((c,i) => (
                  <CourseRow key={c.id} course={c} index={i}
                    onChange={updated=>updateCourse(c.id,updated)}
                    onDelete={()=>deleteCourse(c.id)}/>
                ))}

                <button onClick={addCourse}
                  style={{ marginTop:14, width:"100%", padding:"10px", border:"1.5px dashed #d0d8f0", borderRadius:12, background:"transparent", cursor:"pointer", fontSize:13, fontWeight:600, color:"#13294b", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"background .2s" }}
                  onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.background="rgba(19,41,75,0.04)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.background="transparent"}>
                  <Plus size={14} strokeWidth={2.5}/> Add Course
                </button>

                <div style={{ marginTop:16, padding:"12px 16px", background:"rgba(19,41,75,0.04)", borderRadius:10, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                  <span style={{ fontSize:12, color:"#888" }}>Total credit hours counted: <strong style={{ color:"#13294b" }}>{totalCredits}</strong></span>
                  <span style={{ fontSize:12, color:"#888" }}>Total grade points: <strong style={{ color:"#13294b" }}>{totalPoints.toFixed(2)}</strong></span>
                </div>
              </div>

              {showCumulative && (
                <div className="score-card fade-up" style={{ marginBottom:24 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:"rgba(19,41,75,0.08)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <TrendingUp size={17} color="#13294b" strokeWidth={2}/>
                    </div>
                    <div>
                      <h2 style={{ fontSize:17, fontWeight:800, color:"#1a1a1a", margin:0 }}>Previous Academic Record at TAMU</h2>
                      <p style={{ fontSize:12, color:"#aaa", marginTop:2 }}>Enter your existing Texas A&M cumulative GPA and credit hours</p>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                    <div>
                      <label style={{ fontSize:13, fontWeight:600, color:"#555", display:"block", marginBottom:6 }}>Previous Cumulative GPA</label>
                      <input type="number" min={0} max={4} step={0.01} value={prevGPA}
                        onChange={e=>setPrevGPA(Math.max(0,Math.min(4,Number(e.target.value)||0)))}
                        aria-label="Previous cumulative GPA"
                        style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #eef0f8", borderRadius:10, fontSize:15, fontWeight:700, color:"#13294b", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"white" }}/>
                    </div>
                    <div>
                      <label style={{ fontSize:13, fontWeight:600, color:"#555", display:"block", marginBottom:6 }}>Previous Credit Hours Earned</label>
                      <input type="number" min={0} max={300} value={prevCredits}
                        onChange={e=>setPrevCredits(Math.max(0,Number(e.target.value)||0))}
                        aria-label="Previous credit hours earned"
                        style={{ width:"100%", padding:"10px 14px", border:"1.5px solid #eef0f8", borderRadius:10, fontSize:15, fontWeight:700, color:"#13294b", fontFamily:"'DM Sans',sans-serif", outline:"none", background:"white" }}/>
                    </div>
                  </div>
                  <div style={{ marginTop:14, padding:"10px 14px", background:"rgba(19,41,75,0.04)", borderRadius:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:12, color:"#888" }}>Total credits after this semester: <strong style={{ color:"#13294b" }}>{prevCredits+totalCredits}</strong></span>
                    <span style={{ fontSize:14, fontWeight:800, color:"#13294b" }}>Cumulative GPA: {cumulativeGPA.toFixed(3)}</span>
                  </div>
                </div>
              )}

              <div style={{ display:"flex", gap:10 }}>
                <button onClick={handleReset}
                  style={{ flex:1, padding:"11px", border:"1.5px solid #eef0f8", borderRadius:12, background:"white", cursor:"pointer", fontSize:13, fontWeight:600, color:"#888", fontFamily:"'DM Sans',sans-serif", display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"border-color .2s,color .2s" }}
                  onMouseEnter={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#13294b";(e.currentTarget as HTMLButtonElement).style.color="#13294b"}}
                  onMouseLeave={e=>{(e.currentTarget as HTMLButtonElement).style.borderColor="#eef0f8";(e.currentTarget as HTMLButtonElement).style.color="#888"}}>
                  <RotateCcw size={13} strokeWidth={2}/> Reset all
                </button>
                <button onClick={handleSave} className="btn-primary" style={{ flex:2, padding:"11px", fontSize:13 }}>
                  {justSaved ? <><CheckCircle size={14}/>Saved!</> : <><History size={14}/>Save this semester</>}
                </button>
              </div>
            </div>

            {/* Right — results panel */}
            <div>
              <div style={{ borderRadius:24, background:gpaBg, border:`2px solid ${gpaColor}22`, padding:"32px 28px", marginBottom:20, textAlign:"center", position:"sticky", top:88 }}>
                <div style={{ marginBottom:8 }}><GPAGauge gpa={displayGPA}/></div>

                <div style={{ display:"inline-flex", flexDirection:"column", alignItems:"center", padding:"18px 32px", borderRadius:16, background:"white", border:`2px solid ${gpaColor}33`, marginBottom:16, minWidth:160 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"#aaa", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>{showCumulative?"Cumulative GPA":"Semester GPA"}</span>
                  <span style={{ fontSize:64, fontWeight:800, color:gpaColor, lineHeight:1, fontFamily:"'DM Sans',sans-serif" }} aria-live="polite">{displayGPA.toFixed(2)}</span>
                  <span style={{ fontSize:12, fontWeight:600, color:gpaColor, marginTop:4 }}>{getGPALabel(displayGPA)}</span>
                </div>

                <p style={{ fontSize:14, color:"#555", lineHeight:1.65, maxWidth:280, margin:"0 auto 20px" }}>{getGPAMessage(displayGPA)}</p>

                {/* Honor thresholds */}
                <div style={{ borderRadius:14, border:"1.5px solid #eef0f8", overflow:"hidden", background:"white", marginBottom:20 }}>
                  <div style={{ padding:"12px 16px", background:"#f8f9fd", borderBottom:"1px solid #eef0f8" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"#13294b", letterSpacing:"0.08em", textTransform:"uppercase" }}>TAMU Honor Thresholds</span>
                  </div>
                  {honorThresholds.map(({ label, range, color }) => {
                    const isActive = getGPALabel(displayGPA) === label;
                    return (
                      <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"9px 16px", borderBottom:"1px solid #f0f3fa", background:isActive?getGPABg(displayGPA):"transparent" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0 }}/>
                          <span style={{ fontSize:12, color:"#555", fontWeight:isActive?700:400 }}>{label}</span>
                        </div>
                        <span style={{ fontSize:11, fontWeight:700, color:isActive?color:"#bbb", fontFamily:"monospace" }}>{range}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Course breakdown bars */}
                <div style={{ textAlign:"left" }}>
                  <span style={{ fontSize:11, fontWeight:700, color:"#13294b", letterSpacing:"0.08em", textTransform:"uppercase", display:"block", marginBottom:10 }}>Course Breakdown</span>
                  {courses.map((c,i) => {
                    const pts = GRADE_POINTS[c.grade];
                    const counted = pts != null;
                    return (
                      <div key={c.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                            <span style={{ fontSize:12, color:"#888", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:130 }}>{c.name||`Course ${i+1}`}</span>
                            <span style={{ fontSize:12, fontWeight:700, color:counted?"#13294b":"#ccc", flexShrink:0, marginLeft:6 }}>{c.grade}</span>
                          </div>
                          <div style={{ height:5, background:"#eef0f8", borderRadius:100, overflow:"hidden" }}>
                            <div style={{ height:"100%", background:counted?"#13294b":"#eee", width:counted?`${((pts as number)/4.0)*100}%`:"0%", borderRadius:100, transition:"width 0.6s ease" }}/>
                          </div>
                        </div>
                        <span style={{ fontSize:11, color:"#aaa", width:38, textAlign:"right", flexShrink:0 }}>{counted?`${c.credits}cr`:"excl."}</span>
                      </div>
                    );
                  })}
                  <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid #f0f3fa", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>{showCumulative?"Cumulative GPA":"Semester GPA"}</span>
                    <span style={{ fontSize:16, fontWeight:800, color:gpaColor }}>{displayGPA.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Saved semesters */}
          {savedAttempts.length > 0 && (
            <div style={{ maxWidth:1100, margin:"32px auto 0" }}>
              <button onClick={()=>setShowHistory(h=>!h)}
                style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, background:"none", border:"none", cursor:"pointer", padding:0, fontFamily:"'DM Sans',sans-serif" }}>
                <div style={{ width:32, height:32, borderRadius:8, background:"rgba(19,41,75,0.07)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <History size={15} color="#13294b" strokeWidth={2}/>
                </div>
                <span style={{ fontSize:16, fontWeight:700, color:"#1a1a1a" }}>Saved Semesters</span>
                <span style={{ fontSize:12, color:"#aaa", background:"#f0f3fa", padding:"2px 10px", borderRadius:100, fontWeight:600 }}>{savedAttempts.length}</span>
                <ChevronDown size={16} color="#888" style={{ transform:showHistory?"rotate(180deg)":"none", transition:"transform .25s" }}/>
              </button>
              {showHistory && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }} className="fade-up">
                  {[...savedAttempts].sort((a,b)=>b.savedAt-a.savedAt).map(a => {
                    const c = getGPAColor(a.gpa);
                    return (
                      <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:12, border:"1.5px solid #eef0f8", background:"white" }}>
                        <div style={{ width:44, height:44, borderRadius:12, background:getGPABg(a.gpa), display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <span style={{ fontSize:15, fontWeight:800, color:c, lineHeight:1 }}>{a.gpa.toFixed(2)}</span>
                          <span style={{ fontSize:9, color:c, fontWeight:600 }}>GPA</span>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>{a.semesterLabel}</div>
                          <div style={{ fontSize:12, color:"#aaa" }}>{a.courses.length} courses · {a.totalCredits} credits</div>
                          <div style={{ fontSize:11, color:"#ccc", marginTop:2 }}>{a.label}</div>
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={()=>loadAttemptIntoCalc(a)} style={{ padding:"6px 12px", border:"1.5px solid #eef0f8", borderRadius:8, background:"white", cursor:"pointer", fontSize:11, fontWeight:600, color:"#555", fontFamily:"'DM Sans',sans-serif" }}>Load</button>
                          <button onClick={()=>handleDelete(a.id)} style={{ padding:6, border:"none", background:"none", cursor:"pointer", color:"#ddd", display:"flex" }}
                            onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.color="#c83232"}
                            onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.color="#ddd"}>
                            <Trash2 size={14}/>
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

        {/* ── HOW IT'S CALCULATED ──────────────────────────────────────────── */}
        <section aria-label="How the TAMU GPA is calculated" style={{ padding:"80px 24px", background:"#fafbfd" }}>
          <div style={{ maxWidth:960, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
                <div className="tag-pill"><Info size={11} strokeWidth={2.5}/>TAMU Grading Guide</div>
              </div>
              <h2 style={{ fontSize:36, fontWeight:800, color:"#1a1a1a", letterSpacing:"-0.025em", marginBottom:12 }}>How the TAMU GPA calculator works</h2>
              <p style={{ fontSize:16, color:"#777", maxWidth:580, margin:"0 auto" }}>Texas A&M uses a straightforward 5-grade scale — A, B, C, D, F — with no plus/minus modifiers. Here's exactly how your GPA is computed.</p>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:20, marginBottom:32 }}>
              {[
                { Icon:BarChart2, color:"#13294b", title:"TAMU Grade Scale", sub:"5 grades — no plus/minus",
                  body:"A = 4.0 · B = 3.0 · C = 2.0 · D = 1.0 · F = 0.0. Texas A&M does not use plus/minus grades. S, U, Q, W, I, CR, and NC grades are excluded from GPA calculations.",
                  formula:"grade × credit_hours" },
                { Icon:BookOpen, color:"#4a7cc7", title:"Semester GPA Formula", sub:"Per-semester calculation",
                  body:"Multiply each course's grade points by its credit hours. Sum those products for all letter-graded courses this semester. Divide by total letter-graded credits attempted.",
                  formula:"Σ(pts × credits) ÷ Σ(credits)" },
                { Icon:TrendingUp, color:"#2e7d32", title:"Cumulative GPA", sub:"Across all TAMU semesters",
                  body:"Combine grade-point products and credit hours from every semester at Texas A&M. Cumulative GPA is the weighted average across all letter-graded coursework on your TAMU transcript.",
                  formula:"(prev_pts + new_pts) ÷ total_credits" },
                { Icon:Trophy, color:"#13294b", title:"TAMU Honors & Dean's List", sub:"GPA-based recognition",
                  body:"TAMU's Semester Honor Roll requires a 3.5+ semester GPA with 12+ graded hours. Graduation honors: Summa ≥ 3.90, Magna ≥ 3.70, Cum Laude ≥ 3.50 cumulative GPA.",
                  formula:"cumulative GPA → honors tier" },
              ].map(({ Icon, color, title, sub, body, formula }, i) => (
                <div key={i} className="score-card" style={{ padding:"24px" }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:`${color}15`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
                    <Icon size={19} color={color} strokeWidth={1.75}/>
                  </div>
                  <div style={{ fontSize:15, fontWeight:800, color:"#1a1a1a", marginBottom:2 }}>{title}</div>
                  <div style={{ fontSize:11, fontWeight:700, color, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10, opacity:.8 }}>{sub}</div>
                  <p style={{ fontSize:13, color:"#666", lineHeight:1.65, marginBottom:12 }}>{body}</p>
                  <div style={{ padding:"6px 12px", background:`${color}08`, borderRadius:8, fontFamily:"monospace", fontSize:12, color, fontWeight:700 }}>{formula}</div>
                </div>
              ))}
            </div>

            {/* Grade point reference table */}
            <div className="score-card" style={{ maxWidth:480, margin:"0 auto", padding:"24px 28px" }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#1a1a1a", marginBottom:4 }}>TAMU Grade Point Reference</div>
              <p style={{ fontSize:12, color:"#aaa", marginBottom:16 }}>Texas A&M University official values — no plus/minus grades</p>
              {[
                { grade:"A",   pts:"4.00", note:"Excellent" },
                { grade:"B",   pts:"3.00", note:"Good" },
                { grade:"C",   pts:"2.00", note:"Satisfactory" },
                { grade:"D",   pts:"1.00", note:"Passing (minimal)" },
                { grade:"F",   pts:"0.00", note:"Failing" },
                { grade:"S",   pts:"—",    note:"Satisfactory — excluded from GPA" },
                { grade:"U",   pts:"—",    note:"Unsatisfactory — excluded from GPA" },
                { grade:"Q",   pts:"—",    note:"Q-Drop — excluded from GPA" },
                { grade:"W",   pts:"—",    note:"Withdrawal — excluded from GPA" },
                { grade:"I",   pts:"—",    note:"Incomplete — excluded from GPA" },
                { grade:"CR",  pts:"—",    note:"Credit — excluded from GPA" },
                { grade:"NC",  pts:"—",    note:"No Credit — excluded from GPA" },
              ].map(({ grade, pts, note }) => (
                <div key={grade} className="grade-ref-row">
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ width:36, fontSize:14, fontWeight:800, color:pts==="—"?"#ccc":"#13294b", fontFamily:"monospace" }}>{grade}</span>
                    <span style={{ fontSize:13, color:"#888" }}>{note}</span>
                  </div>
                  <span style={{ fontSize:14, fontWeight:700, color:pts==="—"?"#ccc":"#13294b", fontFamily:"monospace" }}>{pts}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PROMO ────────────────────────────────────────────────────────── */}
        <section aria-label="Lunora — study smarter at Texas A&M" style={{ padding:"80px 24px", background:"#13294b" }}>
          <div style={{ maxWidth:900, margin:"0 auto" }} className="promo-grid">
            <div>
              <div style={{ display:"flex", marginBottom:20 }}><LunoraLogo light size="sm"/></div>
              <h2 style={{ fontSize:"clamp(26px,4vw,38px)", fontWeight:800, color:"white", lineHeight:1.2, letterSpacing:"-0.025em", marginBottom:16 }}>
                Now you know your TAMU GPA — time to{" "}
                <span style={{ fontFamily:"'Playfair Display',serif", fontStyle:"italic" }}>actually improve it.</span>
              </h2>
              <p style={{ fontSize:16, color:"rgba(255,255,255,0.65)", lineHeight:1.75, marginBottom:28 }}>
                Knowing your GPA is step one. Step two is doing something about it. Because TAMU uses only whole-letter grades, the jump from a B (3.0) to an A (4.0) in a single 3-credit course adds a full 3.0 grade points to your total — a bigger swing per course than at most universities. Most Aggies study from static lecture notes and passive rereading, then wonder why exam performance doesn't match time invested. Lunora lets you upload your actual TAMU course notes, syllabi, and textbook chapters to generate unlimited targeted practice questions, so you're drilling exactly what your professor will test and walking into every exam genuinely ready.
              </p>
              <Link href="/signin" style={{ display:"inline-flex", alignItems:"center", gap:8, background:"white", color:"#13294b", fontWeight:800, fontSize:15, padding:"14px 32px", borderRadius:100, textDecoration:"none" }}>
                Try Lunora for Free — No Credit Card <ArrowRight size={15} color="#13294b" strokeWidth={2.5}/>
              </Link>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {[
                { Icon:Sparkles,   title:"Practice questions from your own TAMU notes",      body:"Upload your lecture slides, syllabi, and readings from any Texas A&M course — MATH 151, CHEM 107, ENGR 111, POLS 206, and beyond. Lunora generates unlimited MCQ and short-answer questions from your actual material, not generic internet content." },
                { Icon:Brain,      title:"Active recall beats passive rereading every time",  body:"Stop rereading the same slides and start actively recalling. The research on active recall is unambiguous — it's the most effective study method for long-term retention. Lunora builds the practice questions so you don't have to." },
                { Icon:TrendingUp, title:"Track mastery topic by topic",                      body:"See your accuracy by topic across every TAMU course. Know exactly which concepts need another pass before your next exam. No surprises on test day — just confidence built from actual evidence of what you know." },
                { Icon:Clock,      title:"Short daily sessions that compound all semester",   body:"Even 15–20 minutes of targeted daily practice compounds dramatically over an Aggie semester. Consistent short sessions beat the pre-exam cramming cycle every single time — especially in TAMU's high-stakes engineering and science sequences." },
              ].map(({ Icon, title, body }, i) => (
                <div key={i} style={{ display:"flex", gap:14, padding:"16px 18px", borderRadius:14, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:"rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <Icon size={15} color="white" strokeWidth={2}/>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, color:"white", marginBottom:4 }}>{title}</div>
                    <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.6 }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── OTHER GPA CALCULATORS ─────────────────────────────────────────── */}
        <section aria-label="GPA calculators for other universities" style={{ padding:"80px 24px", background:"#fff" }}>
          <div style={{ maxWidth:1000, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:48 }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
                <div className="tag-pill"><GraduationCap size={11} strokeWidth={2.5}/>More GPA Calculators</div>
              </div>
              <h2 style={{ fontSize:34, fontWeight:800, color:"#1a1a1a", letterSpacing:"-0.025em" }}>GPA calculators for other universities</h2>
              <p style={{ fontSize:15, color:"#888", marginTop:10 }}>Each calculator uses that school's exact official grading scale.</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:12 }}>
              {otherGPATools.map(({ name, href }) => (
                <Link key={name} href={href} className="tool-card">
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:28, height:28, borderRadius:7, background:"rgba(19,41,75,0.07)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <GraduationCap size={13} color="#13294b" strokeWidth={2}/>
                    </div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a", lineHeight:1.3 }}>{name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section id="faq" aria-label="TAMU GPA Calculator FAQ" style={{ padding:"80px 24px", background:"#fafbfd" }}>
          <div style={{ maxWidth:720, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:52 }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
                <div className="tag-pill">FAQ</div>
              </div>
              <h2 style={{ fontSize:36, fontWeight:800, color:"#13294b", letterSpacing:"-0.025em" }}>TAMU GPA Calculator — Frequently Asked Questions</h2>
              <p style={{ fontSize:15, color:"#8899bb", marginTop:10 }}>Everything you need to know about how GPA works at Texas A&M University.</p>
            </div>
            {faqs.map((faq,i) => <FaqItem key={i} q={faq.q} a={faq.a}/>)}
          </div>
        </section>

        {/* ── BOTTOM CTA ───────────────────────────────────────────────────── */}
        <section style={{ padding:"80px 24px", background:"#13294b" }}>
          <div style={{ maxWidth:700, margin:"0 auto", textAlign:"center" }}>
            <h2 style={{ fontSize:"clamp(28px,5vw,42px)", fontWeight:800, color:"white", letterSpacing:"-0.025em", marginBottom:16 }}>Gig 'Em — and actually ace your exams.</h2>
            <p style={{ fontSize:17, color:"rgba(255,255,255,0.65)", marginBottom:36, lineHeight:1.65 }}>Turn your TAMU course notes into unlimited targeted practice questions. Track your mastery. Raise your GPA.</p>
            <Link href="/signin" style={{ display:"inline-flex", alignItems:"center", gap:10, background:"white", color:"#13294b", fontWeight:800, fontSize:16, padding:"16px 40px", borderRadius:100, textDecoration:"none" }}>
              Start learning free <ArrowRight size={16} color="#13294b" strokeWidth={2.5}/>
            </Link>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <footer style={{ background:"#0d1f38", padding:"48px 24px" }}>
          <div style={{ maxWidth:1280, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:20 }}>
            <LunoraLogo light size="sm"/>
            <div style={{ display:"flex", gap:28 }}>
              <Link href="/privacy-policy"       style={{ fontSize:13, color:"rgba(255,255,255,0.45)", textDecoration:"none" }}>Privacy</Link>
              <Link href="/terms-and-conditions" style={{ fontSize:13, color:"rgba(255,255,255,0.45)", textDecoration:"none" }}>Terms</Link>
            </div>
            <p style={{ fontSize:13, color:"rgba(255,255,255,0.35)", margin:0 }}>© 2026 Lunora. All rights reserved.</p>
          </div>
        </footer>

      </div>
    </>
  );
}