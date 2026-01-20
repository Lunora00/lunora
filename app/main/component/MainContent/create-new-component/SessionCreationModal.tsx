"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth as useSession } from "../../../../hooks/useAuth";
import { AlertCircle, ArrowLeft, Loader2, X } from "lucide-react";
import { updateUserField } from "@/lib/indexdb/userCache";

import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  increment,
  setDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SupadataService } from "@/services/supadataService";
import { GeminiService } from "@/services/geminiService";
import { saveSessionToIndexedDB } from "@/lib/indexdb/sessionCache";

// Import step components
import Step1SubjectInput from "./Step1SubjectInput";
import Step2LessonInput from "./Step2lessoninput";
import Step3URLInput from "./Step3urlinput";
import LoadingScreen from "@/app/LoadingScreen";

// --- Interfaces ---
interface Question {
  subtopic: any;
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  type: "Multiple Choice";
  hint: string;
  analogy: string;
}

interface SessionCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ContentType = "youtube" | "web";

// --- UI Colors and Branding ---
const PRIMARY_COLOR = "#004738";
const ACCENT_COLOR = "#003E33";
const FEYNMAN_NAME = "FeynTrain";
const FEYNMAN_IMAGE_URL = "feyntrain.png";
const TYPING_QUOTE = "Master Any Web Article or Youtube Video.";

const SessionCreationModal: React.FC<SessionCreationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const { data: session, status } = useSession();

  // State management
  const [importSource, setImportSource] = useState("");
  const [contentType, setContentType] = useState<ContentType>("youtube");
  const [isCreating, setIsCreating] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [processingStep, setProcessingStep] = useState("");
  const [subject, setSubject] = useState("");
  const [lessonTopic, setLessonTopic] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [showPrevSubjects, setShowPrevSubjects] = useState(false);
  const [prevSubjects, setPrevSubjects] = useState<string[]>([]);
  const [prevTopics, setPrevTopics] = useState<string[]>([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
  const [supadataService, setSupadataService] = useState<SupadataService | null>(null);
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [animationReady, setAnimationReady] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [stars, setStars] = useState<Array<{
    id: number;
    left: string;
    top: string;
    size: string;
    delay: string;
  }>>([]);

  const terCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const terrainPointsRef = useRef<number[]>([]);

useEffect(() => {
    const terrain = terCanvasRef.current;
    const background = bgCanvasRef.current;
    if (!terrain || !background) return;

    const terCtx = terrain.getContext("2d");
    const bgCtx = background.getContext("2d");
    if (!terCtx || !bgCtx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    terrain.width = background.width = width;
    terrain.height = background.height = height;

    // --- 1. FIXED TERRAIN GENERATION ---
    if (terrainPointsRef.current.length === 0) {
      let points = [];
      let power = 2048; 
      let displacement = 120;

      const baseline = height * 0.86;
      points[0] = baseline;
      points[power] = baseline;

      for (let i = 1; i < power; i *= 2) {
        for (let j = (power / i) / 2; j < power; j += power / i) {
          points[j] =
            (points[j - (power / i) / 2] + points[j + (power / i) / 2]) / 2 +
            (Math.random() * displacement * 2 - displacement);
        }
        displacement *= 0.52; 
      }
      terrainPointsRef.current = points;
    }

    // --- 2. VIBRANT ANIMATION LOGIC ---
    let entities: any[] = [];

    // Star Class
    function Star(this: any) {
      this.size = Math.random() * 2;
      this.speed = Math.random() * 0.05;
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.opacity = 0.3 + Math.random() * 0.7;
    }

    Star.prototype.update = function () {
      this.x -= this.speed;
      if (this.x < 0) this.x = width;
      const blink = this.opacity * (0.8 + Math.random() * 0.4);
      bgCtx.fillStyle = `rgba(255, 255, 255, ${blink})`;
      bgCtx.fillRect(this.x, this.y, this.size, this.size);
    };

    // ShootingStar Class
    function ShootingStar(this: any) {
      this.reset();
    }

    ShootingStar.prototype.reset = function () {
      this.x = Math.random() * width;
      this.y = 0;
      this.len = Math.random() * 80 + 10;
      this.speed = Math.random() * 10 + 6;
      this.size = Math.random() * 1 + 0.1;
      this.waitTime = new Date().getTime() + Math.random() * 3000 + 500;
      this.active = false;
    };

    ShootingStar.prototype.update = function () {
      if (this.active) {
        this.x -= this.speed;
        this.y += this.speed;
        if (this.x < 0 || this.y >= height) {
          this.reset();
        } else {
          bgCtx.lineWidth = this.size;
          bgCtx.strokeStyle = "rgba(255, 255, 255, 0.8)"; // Bright white trail
          bgCtx.beginPath();
          bgCtx.moveTo(this.x, this.y);
          bgCtx.lineTo(this.x + this.len, this.y - this.len);
          bgCtx.stroke();
        }
      } else if (this.waitTime < new Date().getTime()) {
        this.active = true;
      }
    };

    // Initialize Entities
    for (let i = 0; i < 120; i++) entities.push(new (Star as any)());
    entities.push(new (ShootingStar as any)());
    entities.push(new (ShootingStar as any)());

    let firstFrame = true;

    function animate() {
      if (bgCtx) bgCtx.clearRect(0, 0, width, height);

      entities.forEach((ent) => ent.update());

      // DRAW TERRAIN WITH RIM LIGHTING
      if (terCtx) {
        terCtx.clearRect(0, 0, width, height);
        terCtx.shadowBlur = 20;
        terCtx.shadowColor = "rgba(255, 255, 255, 0.15)";
        terCtx.fillStyle = "#000000";
        terCtx.beginPath();
        
        const pts = terrainPointsRef.current;
        for (let i = 0; i <= width; i++) {
          const idx = Math.floor((i / width) * (pts.length - 1));
          if (i === 0) terCtx.moveTo(0, pts[0]);
          else terCtx.lineTo(i, pts[idx]);
        }
        
        terCtx.lineTo(width, height);
        terCtx.lineTo(0, height);
        terCtx.closePath();
        terCtx.fill();
        terCtx.shadowBlur = 0;
      } 

      if (firstFrame) {
        firstFrame = false;
        setAnimationReady(true);
      }
      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      terrain.width = background.width = width;
      terrain.height = background.height = height;
      // We do not clear terrainPointsRef here to keep the height fixed
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  function getFriendlyErrorMessage(error: any): string {
  const msg = error?.message?.toLowerCase?.() || "";

  // Firebase errors
  if (error?.code === "permission-denied") {
    return "Your account does not have permission to perform this action.";
  }

  if (error?.code === "resource-exhausted") {
    return "Daily usage limit reached. Please try again tomorrow.";
  }

  // Gemini errors
  if (msg.includes("gemini") || msg.includes("model")) {
    return "AI service is temporarily busy. Please try again in a moment.";
  }

  // Supadata errors
  if (msg.includes("supadata") || msg.includes("transcript")) {
    return "We could not fetch content from this link. Please try another one.";
  }

  // Network errors
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network issue. Please check your internet connection.";
  }

  // Timeout
  if (msg.includes("timeout")) {
    return "Request took too long. Please try again.";
  }

  // Default fallback
  return "Something went wrong. Please try again.";
}


  // Fetch previous data from Firestore
  const fetchPrevData = async (userId: string) => {
    setIsSubjectsLoading(true);
    try {
      const sessionsRef = collection(db, "sessions");
      const q = query(sessionsRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);

      const subjects: string[] = [];
      const topics: string[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.subject && typeof data.subject === "string") {
          subjects.push(data.subject);
        }
        if (data.name && typeof data.name === "string") {
          topics.push(data.name);
        }
      });

      const uniqueSubjects = Array.from(new Set(subjects)).sort();
      const uniqueTopics = Array.from(new Set(topics)).sort();
      setPrevSubjects(uniqueSubjects);
      setPrevTopics(uniqueTopics);
    } catch (error) {
      console.error("Error fetching previous data:", error);
    } finally {
      setIsSubjectsLoading(false);
    }
  };

  // Initialize services and fetch data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (status === "unauthenticated") {
      router.push("/signin");
      onClose();
      return;
    }

    if (status === "authenticated" && session?.user?.id) {
      fetchPrevData(session.user.id);
    }

    try {
      setSupadataService(new SupadataService());
      setGeminiService(new GeminiService());
    } catch (error: any) {
      console.error("Error initializing services:", error);
      if (error.message.includes("API")) {
        setUrlError("Service not configured. Please check API keys.");
      }
    }
  }, [isOpen, status, router, onClose, session?.user?.id]);

  // Helper function to create subtopic performance map
  const createSubtopicPerformanceMap = (questions: Question[]) => {
    return questions.reduce(
      (acc, question) => {
        const subtopicName = question.subtopic || "General Concepts";
        acc[subtopicName] = {
          name: subtopicName,
          scored: 0,
          total: (acc[subtopicName]?.total || 0) + 1,
        };
        return acc;
      },
      {} as Record<string, { name: string; scored: number; total: number }>
    );
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setImportSource("");
      setContentType("youtube");
      setIsCreating(false);
      setUrlError("");
      setProcessingStep("");
      setSubject("");
      setLessonTopic("");
      setCurrentStep(1);
      setShowPrevSubjects(false);
      setPrevSubjects([]);
      setPrevTopics([]);
      setAnimationReady(false);
    }
  }, [isOpen]);

  // URL validation
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Step handlers
  const handleSubjectSubmit = () => {
    if (!subject.trim()) {
      setUrlError("Please enter or select a subject.");
      return;
    }
    setUrlError("");
    setCurrentStep(2);
  };

  const handleLessonSubmit = () => {
    if (!lessonTopic.trim()) {
      setUrlError("Please enter or select a lesson or topic.");
      return;
    }
    setUrlError("");
    setCurrentStep(3);
  };

  const handleStartQuiz = async (useSample: boolean = false) => {
    if (
      !session?.user?.id ||
      !geminiService ||
      (!useSample && !supadataService)
    ) {
      setUrlError("Service or authentication issue.");
      return;
    }

    // 1. Basic Field Validation
    if (!subject.trim()) {
      setUrlError("Subject is missing. Please go back and enter a subject.");
      setCurrentStep(1);
      return;
    }

    if (!lessonTopic.trim()) {
      setUrlError("Lesson/Topic is missing. Please go back and enter a lesson/topic.");
      setCurrentStep(2);
      return;
    }

    if (!useSample && (!importSource.trim() || !isValidUrl(importSource))) {
      setUrlError(
        `Please enter a valid ${
          contentType === "youtube" ? "YouTube Video" : "Web Page"
        } URL to proceed.`
      );
      return;
    }

    setUrlError("");
    setIsCreating(true);

    try {
      // --- STEP A: VERIFY USAGE LIMITS ONLY ---      
const userRef = doc(db, "users", session.user.id);
const userSnap = await getDoc(userRef);

if (!userSnap.exists()) {
    // If we reach here, it means the user is logged in but has no DB entry.
    // Instead of guessing data, we tell them there's a profile error.
    setUrlError("User profile not found. Please try logging out and back in.");
    setIsCreating(false);
    return;
}

const userData = userSnap.data();
const isPro = userData.isPro || false;
const usedSessions = userData.usedSessions || 0;

if (!isPro && usedSessions >= 1) {
  setUrlError("Free limit reached. Please upgrade to Pro for unlimited sessions.");
  setIsCreating(false);
  return;
}
setIsCreating(true);

      // --- STEP B: FETCH CONTENT & GENERATE QUESTIONS ---
      setProcessingStep(
        `Fetching content`
      );
      
      const result = await supadataService!.processUrl(
        importSource,
      );


  

      setProcessingStep("Generating questions");
      const rawQuestions = await geminiService!.generateQuestions(
        result.text,
        subject
      );

      // --- STEP C: PREPARE DATA & SAVE ---
      setProcessingStep("Saving new session");
      
      const initialSubtopicPerformance = createSubtopicPerformanceMap(
        rawQuestions.questionList as any
      );

      const sessionData = {
        userId: session.user.id,
        subject: subject,
        svgTopicTitle: rawQuestions.svgTopicTitle,
        lessonTopic: lessonTopic,
        majorSubject: rawQuestions.majorSubject || "General",
        isCompleted: false,
        userEmail: session.user.email,
        name: lessonTopic,
        questionlist: rawQuestions.questionList,
        totalQuestions: rawQuestions.questionList.length,
        totalMarks: rawQuestions.questionList.length,
        content: result.text,
        lastPracticeDate: {},
        scoredMarks: 0,
        medal: "",
        medalLastDays: {},
        weakArea: {},
        learningToolUsed: {},
        totalpracticedSession: {},
        percentaeGrowthLastDays: {},
        subtopicPerformance: initialSubtopicPerformance,
        sourceUrl: importSource,
        motivationaltext: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      

      // 1. Create the session document
      const sessionDoc = await addDoc(collection(db, "sessions"), sessionData);
      
      // 2. Increment the usage counter in the user's profile
      await setDoc(userRef, { 
        usedSessions: increment(1),
        lastSessionCreated: serverTimestamp()
      }, { merge: true });

      await updateUserField(session.user.id, {
  usedSessions: (userData.usedSessions || 0) + 1,
});


      await saveSessionToIndexedDB(session.user.id,sessionDoc.id, sessionData);
      

      // --- STEP D: REDIRECT ---
      setProcessingStep("Redirecting to your session!");
      setTimeout(() => {
        onClose();
        router.push(`/training/${sessionDoc.id}`);
      }, 500);

    }  catch (error: any) {
  console.error("❌ Internal error:", error);

  const friendlyMessage = getFriendlyErrorMessage(error);
  setUrlError(friendlyMessage);

  setProcessingStep("");
  setIsCreating(false);
}

  };

  // Dynamic ready checks
  const isUrlValidAndReady =
    currentStep === 3 &&
    isValidUrl(importSource.trim()) &&
    importSource.trim() !== "" &&
    !isCreating;

  if (!isOpen) return null;

  return (
 <>
 {isPageLoading && (
  <LoadingScreen />
)}

      <style jsx global>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        canvas {
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          width: 100vw;
          height: 100vh;
        }
      `}</style>

      {/* Main Wrapper */}
     <div
  className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
  style={{
    background: `
      radial-gradient(circle at 20% 30%, rgba(60,120,255,0.25), transparent 45%),
      radial-gradient(circle at 80% 40%, rgba(120,80,255,0.18), transparent 45%),
      radial-gradient(circle at 50% 80%, rgba(40,140,255,0.18), transparent 50%),
      linear-gradient(to bottom, #0b1a33, #131e41 70%, #020406 100%)
    `
  }}
>

        {/* Background Stars */}
        <canvas ref={bgCanvasRef} className="z-0" />

        {/* Mountain/Terrain - Responsive height */}
        <div className="absolute bottom-0 left-0 w-full h-[40vh] sm:h-[50vh] md:h-[60vh] z-10 opacity-90 pointer-events-none">
          <canvas
            ref={terCanvasRef}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "left bottom",
            }}
          />
        </div>

        {/* Half Moon - Responsive positioning and size */}
        {animationReady && (
          <div className="absolute top-6 sm:top-8 md:top-12 left-1/2 -translate-x-1/2 z-20 animate-in fade-in zoom-in-95 duration-1000">
            <div className="relative w-19 h-19 sm:w-20 sm:h-20 md:w-28 md:h-28">
              <div className="absolute inset-0 bg-white/20 blur-xl md:blur-2xl rounded-full animate-pulse" />
              <svg
                viewBox="0 0 100 100"
                className="relative w-full h-full"
                style={{ transform: "rotate(-40deg)" }}
              >
                <defs>
                  <mask id="moon-cut">
                    <rect width="100" height="100" fill="white" />
                    <circle cx="62" cy="50" r="30" fill="black" />
                  </mask>
                </defs>
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill="white"
                  mask="url(#moon-cut)"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Global Close Button - Responsive positioning and size */}
        {!isCreating && animationReady && (
          <button
  onClick={() => {
    setIsPageLoading(true);
    setTimeout(() => {
      onClose(); // close modal
      if (window.history.length > 1) {
        window.history.back();
      } else {
        router.push("/main");
      }
    }, 200);
  }}
className={`
  absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 z-[70]
  w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14
  flex items-center justify-center
  rounded-full
  bg-white/10
  hover:bg-white/20
  text-white
  active:scale-90
  cursor-pointer
  transform transition-all duration-200 ease-out
  shadow-md shadow-black/30
  hover:shadow-lg hover:shadow-black/50
  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30
`}


>
  <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
</button>

        )}

        {/* Content Container - Responsive padding and spacing */}
        {animationReady && (
          <div className="relative z-[55] w-full max-w-[95%] sm:max-w-xl md:max-w-2xl px-4 sm:px-6 flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* LOADING STATE */}
            {isCreating ? (
              <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-white/10 rounded-full" />
                  <Loader2 className="w-16 h-16 sm:w-20 sm:h-20 animate-spin text-white absolute top-0 left-0" />
                  <div className="absolute inset-0 blur-lg sm:blur-xl bg-white/20 animate-pulse rounded-full" />
                </div>
                <div className="text-center px-4">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-light text-white tracking-widest uppercase">
                    {processingStep || "Generating Magic"}
                  </h2>
                  <p className="text-white/40 text-xs sm:text-sm mt-2 italic">
                    Preparing your lunar journey...
                  </p>
                </div>
              </div>
            ) : (
              /* INPUT STEPS - Responsive margin */
              <div className="w-full mt-8 sm:mt-10 md:mt-14 ml-0 sm:ml-8 md:ml-14">
                {currentStep === 1 && (
                  <Step1SubjectInput
                    subject={subject}
                    setSubject={setSubject}
                    showPrevSubjects={showPrevSubjects}
                    setShowPrevSubjects={setShowPrevSubjects}
                    prevSubjects={prevSubjects}
                    isSubjectsLoading={isSubjectsLoading}
                    isCreating={isCreating}
                    urlError={urlError}
                    setUrlError={setUrlError}
                    onSubmit={handleSubjectSubmit}
                    ACCENT_COLOR={ACCENT_COLOR}
                    stars={stars}
                  />
                )}

                {currentStep === 2 && (
                  <Step2LessonInput
                    lessonTopic={lessonTopic}
                    setLessonTopic={setLessonTopic}
                    showPrevSubjects={showPrevSubjects}
                    setShowPrevSubjects={setShowPrevSubjects}
                    prevTopics={prevTopics}
                    isSubjectsLoading={isSubjectsLoading}
                    isCreating={isCreating}
                    urlError={urlError}
                    setUrlError={setUrlError}
                    onSubmit={handleLessonSubmit}
                    onBack={() => {
                      setCurrentStep(1);
                      setUrlError("");
                      setShowPrevSubjects(false);
                    }}
                    ACCENT_COLOR={ACCENT_COLOR}
                    stars={stars}
                  />
                )}

                {currentStep === 3 && (
                  <Step3URLInput
                    contentType={contentType}
                    setContentType={setContentType}
                    importSource={importSource}
                    setImportSource={setImportSource}
                    isCreating={isCreating}
                    urlError={urlError}
                    setUrlError={setUrlError}
                    processingStep={processingStep}
                    onSubmit={() => handleStartQuiz(false)}
                    onBack={() => {
                      setCurrentStep(2);
                      setUrlError("");
                    }}
                    isUrlValidAndReady={isUrlValidAndReady}
                    PRIMARY_COLOR={PRIMARY_COLOR}
                    ACCENT_COLOR={ACCENT_COLOR}
                    FEYNMAN_NAME={FEYNMAN_NAME}
                    FEYNMAN_IMAGE_URL={FEYNMAN_IMAGE_URL}
                    TYPING_QUOTE={TYPING_QUOTE}
                    stars={stars}
                  />
                  
                )}
                

              </div>
              
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default SessionCreationModal;