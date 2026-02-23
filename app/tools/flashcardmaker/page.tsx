"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Link2, FileText, PenLine, BookOpen, CheckCircle, ArrowLeft, ArrowRight, Cloud, Trash2, Eye, Brain, Download, Cpu, Sparkles, ExternalLink } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Flashcard {
  id: string;
  term: string;
  definition: string;
  subtopic: string;
}

interface FlashcardDeck {
  id: string;
  title: string;
  topic: string;
  cards: Flashcard[];
  createdAt: number;
  source: string;
}

type InputMode = "file" | "url" | "text";
type AppState = "idle" | "loading" | "result" | "study";

// ─── Moon Logo ────────────────────────────────────────────────────────────────
function LunoraLogo({ light = false, size = "md" }: { light?: boolean; size?: "sm" | "md" | "lg" }) {
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
        <circle cx="50" cy="50" r="42" fill={light ? "white" : "#203567"} mask={`url(#lunora-mask-${light ? "light" : "dark"})`} />
      </svg>
      <span style={{ fontSize: ts, fontWeight: 300, letterSpacing: "0.12em", color: light ? "white" : "#1a1a1a", marginLeft: -60, marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>
        lunora
      </span>
    </div>
  );
}

// ─── FaqItem — separate component to avoid hooks-in-map violation ─────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #eef0f8", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif" }}
      >
        <span style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", paddingRight: 16 }}>{q}</span>
        <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: open ? "#203567" : "#f0f3fa", color: open ? "white" : "#203567", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "all .25s", transform: open ? "rotate(45deg)" : "none" }}>+</span>
      </button>
      <div style={{ maxHeight: open ? 200 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "max-height .3s ease, opacity .3s ease" }}>
        <p style={{ paddingBottom: 20, fontSize: 14, color: "#666", lineHeight: 1.7 }}>{a}</p>
      </div>
    </div>
  );
}

// ─── Flip Card ────────────────────────────────────────────────────────────────
function FlipCard({ card, index }: { card: Flashcard; index: number }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onClick={() => setFlipped(!flipped)} style={{ perspective: 1000, cursor: "pointer", height: 200, animationDelay: `${index * 0.05}s` }} className="card-fade-in">
      <div style={{ position: "relative", width: "100%", height: "100%", transformStyle: "preserve-3d", transition: "transform 0.5s cubic-bezier(0.4,0.2,0.2,1)", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "white", borderRadius: 16, border: "1.5px solid #eef0f8", boxShadow: "0 4px 20px rgba(32,53,103,0.07)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#203567", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.5 }}>Term</span>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", textAlign: "center", margin: 0, lineHeight: 1.4 }}>{card.term}</p>
          <span style={{ position: "absolute", bottom: 12, right: 16, fontSize: 10, color: "#bbb" }}>tap to flip</span>
        </div>
        <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "#203567", borderRadius: 16, transform: "rotateY(180deg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Definition</span>
          <p style={{ fontSize: 14, color: "white", textAlign: "center", margin: 0, lineHeight: 1.6 }}>{card.definition}</p>
          {card.subtopic && (
            <span style={{ position: "absolute", bottom: 12, fontSize: 10, color: "rgba(255,255,255,0.35)", padding: "2px 10px", background: "rgba(255,255,255,0.1)", borderRadius: 20 }}>{card.subtopic}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Study Mode ───────────────────────────────────────────────────────────────
function StudyMode({ deck, onExit }: { deck: FlashcardDeck; onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());
  const total = deck.cards.length;
  const card = deck.cards[index];

  const next = () => { setFlipped(false); setTimeout(() => setIndex(i => Math.min(i + 1, total - 1)), 200); };
  const prev = () => { setFlipped(false); setTimeout(() => setIndex(i => Math.max(i - 1, 0)), 200); };
  const markKnown = () => { setKnown(s => new Set([...s, index])); next(); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === " ") { e.preventDefault(); setFlipped(f => !f); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [index]);

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fd", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #eef0f8", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <LunoraLogo size="sm" />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#888" }}>{index + 1} / {total}</span>
          <button onClick={onExit} style={{ background: "none", border: "1.5px solid #ddd", borderRadius: 100, padding: "6px 18px", cursor: "pointer", fontSize: 13, color: "#555", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowLeft size={13} />Back to deck
          </button>
        </div>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 32 }}>
        <div style={{ width: "100%", maxWidth: 640 }}>
          <div style={{ height: 4, background: "#eef0f8", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "#203567", width: `${((index + 1) / total) * 100}%`, transition: "width 0.3s ease", borderRadius: 4 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            <span style={{ fontSize: 12, color: "#888" }}>{known.size} known</span>
            <span style={{ fontSize: 12, color: "#888" }}>{total - known.size} remaining</span>
          </div>
        </div>
        <div style={{ width: "100%", maxWidth: 640, height: 320, perspective: 1200, cursor: "pointer" }} onClick={() => setFlipped(f => !f)}>
          <div style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", transition: "transform 0.55s cubic-bezier(0.4,0.2,0.2,1)", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "white", borderRadius: 24, border: "1.5px solid #eef0f8", boxShadow: "0 8px 40px rgba(32,53,103,0.1)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.5 }}>Term</span>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#1a1a1a", textAlign: "center", margin: 0, lineHeight: 1.3 }}>{card.term}</p>
              <span style={{ fontSize: 12, color: "#bbb", marginTop: 8 }}>press space or tap to reveal</span>
            </div>
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", background: "#203567", borderRadius: 24, transform: "rotateY(180deg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, gap: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Definition</span>
              <p style={{ fontSize: 20, color: "white", textAlign: "center", margin: 0, lineHeight: 1.65 }}>{card.definition}</p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button onClick={prev} disabled={index === 0} style={{ width: 44, height: 44, borderRadius: "50%", border: "1.5px solid #ddd", background: "white", cursor: index === 0 ? "not-allowed" : "pointer", opacity: index === 0 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowLeft size={18} /></button>
          <button onClick={markKnown} style={{ background: "#203567", color: "white", border: "none", borderRadius: 100, padding: "12px 28px", cursor: "pointer", fontSize: 14, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle size={16} />Got it
          </button>
          <button onClick={next} disabled={index === total - 1} style={{ width: 44, height: 44, borderRadius: "50%", border: "1.5px solid #ddd", background: "white", cursor: index === total - 1 ? "not-allowed" : "pointer", opacity: index === total - 1 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center" }}><ArrowRight size={18} /></button>
        </div>
        <p style={{ fontSize: 12, color: "#bbb" }}>Arrow keys to navigate · Space to flip</p>
      </div>
    </div>
  );
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
const DB_NAME = "lunora_flashcards";
const DB_VERSION = 1;
const STORE = "decks";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveDecktoDB(deck: FlashcardDeck) {
  const db = await openDB();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(deck);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function loadDecksFromDB(): Promise<FlashcardDeck[]> {
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

async function deleteDeckFromDB(id: string) {
  const db = await openDB();
  return new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FlashcardMaker() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [inputMode, setInputMode] = useState<InputMode>("url");
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [currentDeck, setCurrentDeck] = useState<FlashcardDeck | null>(null);
  const [savedDecks, setSavedDecks] = useState<FlashcardDeck[]>([]);
  const [studyDeck, setStudyDeck] = useState<FlashcardDeck | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDecksFromDB().then(setSavedDecks);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const callGemini = async (content: string, sourceLabel: string): Promise<FlashcardDeck> => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY not set");
    const cardTopic = topic || subject || "General Topic";
    const prompt = `You are an expert educator. Based ONLY on the content provided, generate exactly 20 high-quality flashcards.
Topic context: "${cardTopic}"
RULES:
1. Each term should be short and memorable (1-5 words).
2. Each definition should be clear and educational (1-3 sentences max).
3. Group cards into logical subtopics.
4. Do NOT add information not found in the content.
5. Output ONLY valid raw JSON. No markdown, no backticks, no extra text.
JSON SCHEMA:
{ "title": "string", "topic": "string", "flashcards": [{ "term": "string", "definition": "string", "subtopic": "string" }] }
CONTENT:
${content.slice(0, 80000)}`;
    const models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"];
    let lastErr: any;
    for (const model of models) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: "application/json" } }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
        const parsed = JSON.parse(cleaned);
        return {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          title: parsed.title || cardTopic, topic: parsed.topic || cardTopic, source: sourceLabel, createdAt: Date.now(),
          cards: (parsed.flashcards || []).map((c: any, i: number) => ({ id: `${i}-${Math.random().toString(36).slice(2)}`, term: c.term || "", definition: c.definition || "", subtopic: c.subtopic || "General" })),
        };
      } catch (e) { lastErr = e; console.warn(`Model ${model} failed:`, e); }
    }
    throw new Error(`All models failed: ${lastErr?.message}`);
  };

  const fileToBase64 = (f: File): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res((reader.result as string).split(",")[1]);
      reader.onerror = () => rej(new Error("File read failed"));
      reader.readAsDataURL(f);
    });

  const callGeminiWithFile = async (f: File): Promise<FlashcardDeck> => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY not set");
    const cardTopic = topic || subject || f.name;
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext === "docx") {
      const mammoth = await import("mammoth");
      const ab = await f.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: ab });
      return callGemini(result.value, f.name);
    }
    if (ext === "txt") return callGemini(await f.text(), f.name);
    const b64 = await fileToBase64(f);
    const mimeType = f.type || (ext === "pdf" ? "application/pdf" : "image/png");
    const prompt = `You are an expert educator. Analyze this document and generate exactly 20 high-quality flashcards based ONLY on its content.
Topic context: "${cardTopic}"
RULES: 1. Term: 1-5 words. 2. Definition: 1-3 sentences. 3. Group by subtopic. 4. Output ONLY valid raw JSON.
JSON SCHEMA: { "title": "string", "topic": "string", "flashcards": [{ "term": "string", "definition": "string", "subtopic": "string" }] }`;
    const models = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-2.0-flash-lite"];
    let lastErr: any;
    for (const model of models) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ inlineData: { mimeType, data: b64 } }, { text: prompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 8192, responseMimeType: "application/json" } }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
        const parsed = JSON.parse(cleaned);
        return {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          title: parsed.title || cardTopic, topic: parsed.topic || cardTopic, source: f.name, createdAt: Date.now(),
          cards: (parsed.flashcards || []).map((c: any, i: number) => ({ id: `${i}-${Math.random().toString(36).slice(2)}`, term: c.term || "", definition: c.definition || "", subtopic: c.subtopic || "General" })),
        };
      } catch (e) { lastErr = e; }
    }
    throw new Error(`All models failed: ${lastErr?.message}`);
  };

  const fetchUrl = async (url: string): Promise<string> => {
    const keys = [process.env.NEXT_PUBLIC_SUPADATA_API_KEY, process.env.NEXT_PUBLIC_SUPADATA_API_KEY_1, process.env.NEXT_PUBLIC_SUPADATA_API_KEY_2].filter(Boolean) as string[];
    if (!keys.length) throw new Error("No Supadata API keys found");
    const isVideo = url.includes("youtube.com") || url.includes("youtu.be") || url.includes("tiktok.com");
    let lastErr: any;
    for (const key of keys) {
      try {
        if (isVideo) {
          const res = await fetch(`https://api.supadata.ai/v1/youtube/transcript?url=${encodeURIComponent(url)}&text=true`, { headers: { "x-api-key": key } });
          if (!res.ok) throw new Error(`Supadata ${res.status}`);
          const data = await res.json();
          if (data.jobId) {
            for (let i = 0; i < 20; i++) {
              await new Promise(r => setTimeout(r, 2500));
              const poll = await fetch(`https://api.supadata.ai/v1/youtube/transcript/job/${data.jobId}`, { headers: { "x-api-key": key } });
              const job = await poll.json();
              if (job.status === "completed") return typeof job.result?.content === "string" ? job.result.content : JSON.stringify(job.result?.content || "");
              if (job.status === "failed") throw new Error("Transcript job failed");
            }
            throw new Error("Transcript timed out");
          }
          return typeof data.content === "string" ? data.content : JSON.stringify(data.content || "");
        } else {
          const res = await fetch(`https://api.supadata.ai/v1/web/scrape?url=${encodeURIComponent(url)}`, { headers: { "x-api-key": key } });
          if (!res.ok) throw new Error(`Supadata ${res.status}`);
          const data = await res.json();
          return data.content || "";
        }
      } catch (e) { lastErr = e; }
    }
    throw new Error(`URL extraction failed`);
  };

  const generate = async () => {
    setError(""); setAppState("loading");
    try {
      let deck: FlashcardDeck;
      if (inputMode === "url") {
        if (!urlInput.trim()) throw new Error("Please enter a URL.");
        setProgress("Extracting content from URL...");
        const text = await fetchUrl(urlInput.trim());
        if (!text || text.length < 50) throw new Error("Could not extract enough content from this URL.");
        setProgress("Generating flashcards with AI...");
        deck = await callGemini(text, urlInput.trim());
      } else if (inputMode === "file") {
        if (!file) throw new Error("Please select a file.");
        setProgress("Reading your file...");
        deck = await callGeminiWithFile(file);
      } else {
        if (!textInput.trim() || textInput.trim().length < 50) throw new Error("Please enter at least 50 characters of text.");
        setProgress("Generating flashcards with AI...");
        deck = await callGemini(textInput.trim(), "Pasted text");
      }
      setProgress("Saving to your library...");
      await saveDecktoDB(deck);
      const updated = await loadDecksFromDB();
      setSavedDecks(updated); setCurrentDeck(deck); setAppState("result"); setProgress("");
    } catch (e: any) {
      setError(e.message || "Something went wrong."); setAppState("idle"); setProgress("");
    }
  };

  const deleteDeck = async (id: string) => {
    await deleteDeckFromDB(id);
    const updated = await loadDecksFromDB();
    setSavedDecks(updated);
    if (currentDeck?.id === id) { setCurrentDeck(null); setAppState("idle"); }
  };

  // ── studyDeck renders StudyMode — no hooks below this point issue because
  // StudyMode is a full separate component, so hooks order is preserved ──────
  if (studyDeck) return <StudyMode deck={studyDeck} onExit={() => setStudyDeck(null)} />;

  const faqs = [
    { q: "Is this flashcard maker really free?", a: "Yes, completely free. No account, no sign-up needed. Just paste your content and get flashcards instantly." },
    { q: "What file types are supported?", a: "PDF, DOCX (Word), TXT, PNG, and JPG images. You can also use YouTube URLs, web article links, or just paste text directly." },
    { q: "Where are my flashcards saved?", a: "All your decks are saved locally in your browser using IndexedDB. They persist across sessions but are private to your device." },
    { q: "How many flashcards does it generate?", a: "Each generation creates exactly 20 high-quality flashcards, grouped into logical subtopics based on your content." },
    { q: "How is Lunora different from this tool?", a: "This is a free single-purpose tool. Lunora is the full platform — unlimited quiz questions, attempt tracking, summaries, flashcards, blast games, and your complete learning library. Think of this as a taste of what Lunora does." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: "'DM Sans', sans-serif", color: "#1a1a1a", overflowX: "hidden" }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #203567; color: white; }

        .btn-primary {
          background: #203567; color: white; border: none; border-radius: 100px;
          padding: 14px 32px; font-size: 15px; font-weight: 700; cursor: pointer;
          transition: background .2s, transform .15s, box-shadow .2s;
          font-family: 'DM Sans', sans-serif; display: inline-flex; align-items: center;
          justify-content: center; gap: 8px; white-space: nowrap; flex-shrink: 0;
        }
        .btn-primary:hover { background: #162a54; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(32,53,103,.3); }
        .btn-primary:disabled { opacity: .5; cursor: not-allowed; transform: none; box-shadow: none; }

        .mode-tab {
          padding: 9px 16px; border-radius: 100px; font-size: 12px; font-weight: 600;
          cursor: pointer; border: 1.5px solid #ddd; background: white; color: #666;
          transition: all .2s; font-family: 'DM Sans', sans-serif;
          white-space: nowrap; flex-shrink: 0;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .mode-tab.active { background: #203567; color: white; border-color: #203567; }
        .mode-tab:hover:not(.active) { border-color: #203567; color: #203567; }

        .mode-tabs-row {
          display: flex;
          flex-direction: row;
          gap: 8px;
          margin-bottom: 24px;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .mode-tabs-row::-webkit-scrollbar { display: none; }

        .input-base { width: 100%; padding: 14px 18px; border-radius: 14px; border: 1.5px solid #eef0f8; font-size: 15px;
          font-family: 'DM Sans', sans-serif; outline: none; transition: border-color .2s, box-shadow .2s; background: white; color: #1a1a1a; }
        .input-base:focus { border-color: #203567; box-shadow: 0 0 0 3px rgba(32,53,103,.08); }

        .deck-card { background: white; border-radius: 20px; border: 1.5px solid #eef0f8; padding: 24px;
          cursor: pointer; transition: transform .3s, box-shadow .3s; }
        .deck-card:hover { transform: translateY(-4px); box-shadow: 0 16px 50px rgba(32,53,103,.1); }

        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .card-fade-in { animation: fadeInUp .5s ease both; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { animation: spin .7s linear infinite; }

        .upload-zone {
          border: 2px dashed #d0d6e8; border-radius: 16px; padding: 40px 24px;
          text-align: center; cursor: pointer; transition: all .2s; background: #f8f9fd;
        }
        .upload-zone:hover, .upload-zone.drag { border-color: #203567; background: rgba(32,53,103,.04); }

        .tag-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; border-radius: 100px;
          background: rgba(32,53,103,.07); border: 1px solid rgba(32,53,103,.12); font-size: 11px;
          font-weight: 700; color: #203567; letter-spacing: .08em; text-transform: uppercase; font-family: 'DM Sans', sans-serif; }

        @media(max-width: 768px) {
          .hero-title { font-size: 36px !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(255,255,255,.95)" : "white", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(32,53,103,.08)" : "1px solid transparent", transition: "all .3s" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 120, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <LunoraLogo size="sm" />
          </Link>
          <Link href="/main" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={{ padding: "9px 22px", fontSize: 13 }}>
              Open Lunora App <ExternalLink size={13} />
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: "160px 24px 60px", textAlign: "center", background: "linear-gradient(180deg, #f8f9fd 0%, #fff 100%)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div className="tag-pill">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#203567", display: "inline-block" }} />
              Free Online Tool
            </div>
          </div>
          <h1 className="hero-title" style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", color: "#1a1a1a", marginBottom: 16 }}>
            Online{" "}
            <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#203567" }}>Flashcard</span>
            {" "}Maker
          </h1>
          <p style={{ fontSize: 18, color: "#666", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 12px" }}>
            Turn any PDF, video, URL, or text into smart AI-powered flashcards in seconds. Free. No signup needed.
          </p>
          <p style={{ fontSize: 14, color: "#aaa" }}>Supports PDF · DOCX · Images · YouTube · Web articles · Plain text</p>
        </div>
      </section>

      {/* ── GENERATOR ── */}
      <section style={{ padding: "0 24px 80px", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ background: "white", borderRadius: 24, border: "1.5px solid #eef0f8", boxShadow: "0 8px 40px rgba(32,53,103,.08)", padding: 36 }}>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }} className="grid-2">
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Subject (optional)</label>
              <input className="input-base" placeholder="e.g. Biology, History..." value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#888", letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8, display: "block" }}>Topic (optional)</label>
              <input className="input-base" placeholder="e.g. Cell Division..." value={topic} onChange={e => setTopic(e.target.value)} />
            </div>
          </div>

          {/* Mode tabs — always one row, scrollable on mobile */}
          <div className="mode-tabs-row">
            <button className={`mode-tab${inputMode === "url" ? " active" : ""}`} onClick={() => { setInputMode("url"); setError(""); }}>
              <Link2 size={13} />URL / YouTube
            </button>
            <button className={`mode-tab${inputMode === "file" ? " active" : ""}`} onClick={() => { setInputMode("file"); setError(""); }}>
              <FileText size={13} />Upload File
            </button>
            <button className={`mode-tab${inputMode === "text" ? " active" : ""}`} onClick={() => { setInputMode("text"); setError(""); }}>
              <PenLine size={13} />Paste Text
            </button>
          </div>

          {inputMode === "url" && (
            <input className="input-base" placeholder="Paste a YouTube link, web article URL, or any page URL..." value={urlInput} onChange={e => setUrlInput(e.target.value)} onKeyDown={e => e.key === "Enter" && generate()} style={{ marginBottom: 8 }} />
          )}

          {inputMode === "file" && (
            <div className={`upload-zone${file ? " drag" : ""}`} onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add("drag"); }}
              onDragLeave={e => e.currentTarget.classList.remove("drag")}
              onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove("drag"); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
            >
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg" style={{ display: "none" }} onChange={e => setFile(e.target.files?.[0] || null)} />
              {file ? (
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#203567", marginBottom: 4, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}><FileText size={16} />{file.name}</p>
                  <p style={{ fontSize: 13, color: "#888" }}>{(file.size / 1024).toFixed(0)} KB · Click to change</p>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Cloud size={36} color="#203567" style={{ opacity: 0.4 }} /></div>
                  <p style={{ fontSize: 15, fontWeight: 600, color: "#1a1a1a", marginBottom: 4 }}>Drag & drop or click to upload</p>
                  <p style={{ fontSize: 13, color: "#888" }}>PDF, DOCX, TXT, PNG, JPG</p>
                </div>
              )}
            </div>
          )}

          {inputMode === "text" && (
            <textarea className="input-base" placeholder="Paste your notes, lecture content, study material here... (min 50 characters)" value={textInput} onChange={e => setTextInput(e.target.value)} rows={7} style={{ resize: "vertical" }} />
          )}

          {error && (
            <div style={{ marginTop: 12, padding: "12px 16px", background: "#fff0f0", border: "1px solid #ffd0d0", borderRadius: 10, fontSize: 14, color: "#c00" }}>
              ⚠️ {error}
            </div>
          )}

          <button className="btn-primary" onClick={generate} disabled={appState === "loading"} style={{ marginTop: 20, width: "100%", padding: "16px", fontSize: 16 }}>
            {appState === "loading" ? (
              <>
                <span style={{ width: 18, height: 18, border: "2.5px solid rgba(255,255,255,.4)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", flexShrink: 0 }} className="spinner" />
                {progress || "Generating..."}
              </>
            ) : <><Sparkles size={16} />Generate Flashcards</>}
          </button>
        </div>
      </section>

      {/* ── RESULT DECK ── */}
      {appState === "result" && currentDeck && (
        <section style={{ padding: "0 24px 80px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div className="tag-pill" style={{ marginBottom: 8 }}><CheckCircle size={11} />Generated</div>
              <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-.02em" }}>{currentDeck.title}</h2>
              <p style={{ fontSize: 14, color: "#888", marginTop: 4 }}>{currentDeck.cards.length} flashcards · Saved to your library</p>
            </div>
            <button onClick={() => setStudyDeck(currentDeck)} className="btn-primary" style={{ padding: "12px 28px" }}>
              <BookOpen size={16} />Study Mode
            </button>
          </div>
          {Array.from(new Set(currentDeck.cards.map(c => c.subtopic))).map(sub => (
            <div key={sub} style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#203567" }}>{sub}</h3>
                <span style={{ fontSize: 12, color: "#aaa" }}>{currentDeck.cards.filter(c => c.subtopic === sub).length} cards</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {currentDeck.cards.filter(c => c.subtopic === sub).map((card, i) => (
                  <FlipCard key={card.id} card={card} index={i} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── SAVED DECKS ── */}
      {savedDecks.length > 0 && (
        <section style={{ padding: "0 24px 80px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-.02em" }}>Your Library</h2>
            <p style={{ fontSize: 14, color: "#888", marginTop: 4 }}>Saved in your browser · {savedDecks.length} deck{savedDecks.length !== 1 ? "s" : ""}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
            {[...savedDecks].sort((a, b) => b.createdAt - a.createdAt).map(deck => (
              <div key={deck.id} className="deck-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(32,53,103,.08)", display: "flex", alignItems: "center", justifyContent: "center" }}><BookOpen size={18} color="#203567" /></div>
                  <button onClick={() => deleteDeck(deck.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", padding: 4, display: "flex", alignItems: "center" }} title="Delete"><Trash2 size={15} /></button>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", marginBottom: 4, lineHeight: 1.3 }}>{deck.title}</h3>
                <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>{deck.cards.length} cards · {new Date(deck.createdAt).toLocaleDateString()}</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { setCurrentDeck(deck); setAppState("result"); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ flex: 1, padding: "9px", border: "1.5px solid #eef0f8", borderRadius: 10, background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#555", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <Eye size={13} />View
                  </button>
                  <button onClick={() => setStudyDeck(deck)} className="btn-primary" style={{ flex: 1, padding: "9px", fontSize: 13 }}>
                    <BookOpen size={13} />Study
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "80px 24px", background: "#f8f9fd" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <div className="tag-pill">Simple Process</div>
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-.025em", marginBottom: 12 }}>How it works</h2>
          <p style={{ fontSize: 16, color: "#777", maxWidth: 440, margin: "0 auto 56px" }}>Three steps from any content to mastered knowledge.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32, textAlign: "left" }}>
            {[
              { icon: <Download size={28} color="#203567" style={{ opacity: 0.7 }} />, step: "01", title: "Import anything", desc: "Paste a YouTube URL, web article, upload a PDF, or just type your notes." },
              { icon: <Cpu size={28} color="#203567" style={{ opacity: 0.7 }} />, step: "02", title: "AI extracts & creates", desc: "Gemini AI reads your content and creates 20 focused flashcards grouped by subtopic." },
              { icon: <Brain size={28} color="#203567" style={{ opacity: 0.7 }} />, step: "03", title: "Study & remember", desc: "Flip through cards, use study mode, and track what you know. Saved in your browser." },
            ].map((s, i) => (
              <div key={i} style={{ background: "white", borderRadius: 20, padding: 28, border: "1.5px solid #eef0f8" }}>
                <div style={{ marginBottom: 12 }}>{s.icon}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: ".1em", opacity: .5 }}>STEP {s.step}</span>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", margin: "6px 0 8px" }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "#777", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LUNORA PROMO ── */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <LunoraLogo light size="sm" />
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: "white", letterSpacing: "-.025em", marginBottom: 16, lineHeight: 1.2 }}>
            Want the full learning experience?
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,.65)", lineHeight: 1.7, marginBottom: 12 }}>
            This flashcard tool is just the start. <strong style={{ color: "white" }}>Lunora</strong> is the complete AI study system — generate 1,000+ quiz questions from any material, track your mastery per subtopic, get instant summaries, and build your personal learning library.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "rgba(255,255,255,.55)" }}><Sparkles size={13} />Unlimited questions</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "rgba(255,255,255,.55)" }}><Brain size={13} />Deep-dive learning aids</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "rgba(255,255,255,.55)" }}><CheckCircle size={13} />Full attempt history</span>
          </div>
          <Link href="/main" style={{ textDecoration: "none" }}>
            <button
              style={{ background: "white", color: "#203567", border: "none", borderRadius: 100, padding: "16px 40px", fontSize: 16, fontWeight: 800, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "transform .2s, box-shadow .2s", display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 12px 40px rgba(0,0,0,.3)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = "none"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
            >
              Try Lunora AI Quiz — Free <ExternalLink size={15} />
            </button>
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-.025em", textAlign: "center", marginBottom: 48 }}>Frequently asked questions</h2>
          {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#16254a", padding: "40px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
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