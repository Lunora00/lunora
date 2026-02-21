"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Bomb,
  MessageCircle,
  ScrollText,
  RotateCw,
  House,
  Lightbulb,
  Zap,
  RotateCcw,
  Crown,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  GeminiService,
  Flashcard,
  Question,
  GeminiFlashcardOutput,
  GeminiSimilarQuestionsOutput,
} from "@/services/geminiService";
import { useSubscription } from "../../../hooks/useSubscription";

import { ExplanationPanel } from "./ExplanationPanel";
import { SummaryPanel } from "./SummaryPanel";
import { FlashcardsPanel } from "./FlashcardsPanel";
import { SimilarQuestionsPanel } from "./SimilarQuestionsPanel";
import BlastModePanel from "./BlastModePanel";
import { SessionData } from "@/types/quiz.types";
import LoadingScreen from "@/app/LoadingScreen";

interface IntroPanelProps {
  title: string;
  text: string;
  icon: React.ReactNode;
  buttonText: string;
  buttonIcon: React.ReactNode;
  onButtonClick: () => void;
  isLoading: boolean;
  proError?: string | null;
}

const IntroPanel: React.FC<IntroPanelProps> = ({
  title,
  text,
  icon,
  buttonText,
  buttonIcon,
  onButtonClick,
  isLoading,
  proError,
}) => (
  <div className="
  w-full
  min-h-full
  flex flex-col
  justify-center
  items-center
  text-center 
  px-6 pb-25 sm:pb-0 sm:px-8 lg:px-8
  overflow-y-auto
">



    {/* Icon */}
    <div className="mt-1 sm:mt-4 mb-5 w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 flex items-center justify-center shrink-0">
      {icon}
    </div>

    {/* Title */}
    <h2 className="text-base md:text-2xl font-extrabold text-[#1B3358] mb-3 px-2 shrink-0">
      {title}
    </h2>

    {/* Text */}
    <p className="text-sm sm:text-base md:text-lg text-[#1B3358]/80 mb-6 max-w-md lg:max-w-lg font-medium px-4">
      {text}
    </p>

    {/* Pro Error */}
    {proError && (
      <div className="mb-4 text-amber-600 font-bold text-sm animate-in fade-in slide-in-from-bottom-1 px-4 text-center shrink-0">
        {proError}
      </div>
    )}

    {/* Button */}
    <button
      onClick={onButtonClick}
      disabled={isLoading}
      className={`
        flex items-center cursor-pointer justify-center gap-2
        px-4 sm:px-6 md:px-8
        py-2 sm:py-2.5
        rounded-full
        font-bold
        text-xs sm:text-sm
        transition-all duration-200
        border-2 shadow-sm
        shrink-0
        ${
          isLoading
            ? "border-gray-400 text-gray-400 cursor-not-allowed bg-gray-50"
            : "border-[#1B3358] text-[#1B3358] bg-white hover:bg-[#1B3358] hover:text-white active:scale-95"
        }
      `}
    >
      {isLoading ? (
        <>
          <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          {buttonIcon}
          {buttonText}
        </>
      )}
    </button>

  </div>
);

interface SlideExplanationProps {
  isOpen: boolean;
  onClose: () => void;
  question?: Question;
  sessionData: SessionData;
  geminiService: GeminiService;
  initialResourceTopic?: string;
  initialResourceType?: "quiz" | "flashcard" | "mindmap";
}

const SlideExplanation: React.FC<SlideExplanationProps> = ({
  isOpen,
  onClose,
  question,
  sessionData,
  geminiService,
  initialResourceTopic,
  initialResourceType,
}) => {
  const router = useRouter();
  const { isPro, loading } = useSubscription();
  const [proError, setProError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(false);

  if (!sessionData) {
    if (isOpen) {
      console.error(
        "Critical error: SlideExplanation rendered without sessionData.",
      );
    }
    return null;
  }

  const [activeMode, setActiveMode] = useState(
    initialResourceType === "quiz"
      ? "blastMode"
      : initialResourceType === "flashcard"
        ? "flashcards"
        : "explanation",
  );

  const resourceSubtopic =
    question?.subtopic || initialResourceTopic || sessionData.topic;

  const [blastStarted, setBlastStarted] = useState(false);

  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [flashcardContent, setFlashcardContent] = useState<Flashcard[] | null>(
    null,
  );
  const [subtopicQuestionContent, setSubtopicQuestionContent] = useState<
    Question[] | null
  >(null);

  const [isGenerating, setIsGenerating] = useState(false);

  let parsedSummary: any = null;
  try {
    parsedSummary = summaryContent ? JSON.parse(summaryContent) : null;
  } catch (e) {
    parsedSummary = null;
  }

  const [lastGeneratedSubtopic, setLastGeneratedSubtopic] = useState<
    string | undefined
  >(undefined);

  const modes = [
    {
      key: "explanation",
      icon: <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: "Explain",
    },
    {
      key: "summary",
      icon: <ScrollText className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: "Summary",
    },
    {
      key: "flashcards",
      icon: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: "Flashcards",
    },
    {
      key: "blastMode",
      icon: <Bomb className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: "Quiz",
    },
    {
      key: "subtopics",
      icon: <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
      label: "Topics",
    },
  ];

  useEffect(() => {
    if (resourceSubtopic) {
      if (resourceSubtopic !== lastGeneratedSubtopic) {
        setSummaryContent(null);
        setFlashcardContent(null);
        setSubtopicQuestionContent(null);
        setBlastStarted(false);
        setLastGeneratedSubtopic(undefined);
      }
    } else {
      setSummaryContent(null);
      setFlashcardContent(null);
      setSubtopicQuestionContent(null);
      setBlastStarted(false);
      setLastGeneratedSubtopic(undefined);
    }
  }, [resourceSubtopic, lastGeneratedSubtopic]);
  useEffect(() => {
    setProError(null);
  }, [activeMode]);

  const handleGenerateSummary = async () => {
    if (!isPro) {
      setProError("Summary requires a Pro subscription.!");
      return;
    }

    setIsGenerating(true);
    setSummaryContent(null);
    setProError(null);

    try {
      if (!sessionData.content) {
        setProError("Content not available for summary generation.");
        return;
      }
      const generatedText = await geminiService.generateSummary(
        resourceSubtopic,
        sessionData.content,
      );
      setSummaryContent(generatedText);
      setLastGeneratedSubtopic(resourceSubtopic);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!isPro) {
      setProError("Flashcards requires a Pro subscription.!");
      return;
    }

    setIsGenerating(true);
    setFlashcardContent(null);
    setProError(null);

    try {
      if (!sessionData.content) {
        setProError("Content not available for flashcard generation.");
        return;
      }
      const result: GeminiFlashcardOutput =
        await geminiService.generateFlashcards(
          resourceSubtopic,
          sessionData.content,
        );
      setFlashcardContent(result.flashcards);
      setLastGeneratedSubtopic(resourceSubtopic);

    } finally {
      setIsGenerating(false);
    }
  };

  const goToMain = () => {
    if (pageLoading) return;
    setPageLoading(true);
    router.push("/main");
  };

  const handleGenerateSubtopics = async () => {
    if (!isPro) {
      setProError("Practice Questions requires a Pro subscription.!");
      return;
    }

    setIsGenerating(true);
    setSubtopicQuestionContent(null);
    setProError(null);

    try {
      if (!sessionData.content) {
        setProError("Content not available for question generation.");
        return;
      }
      const result = await geminiService.generateSimilarQuestions(
        resourceSubtopic,
        sessionData.content,
      );
      setSubtopicQuestionContent(result.questionList);
      setLastGeneratedSubtopic(resourceSubtopic);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartBlastQuiz = () => {
    if (!isPro) {
      setProError("Blast Quiz requires a Pro subscription.!");
      return;
    }
    setProError(null);
    setBlastStarted(true);
  };

  const renderContent = () => {
    if (!resourceSubtopic) {
      return (
        <div className="p-4 sm:p-8 text-center text-red-700 text-sm sm:text-base">
          Error: Could not determine the topic to generate resources for. Please
          check your session data.
        </div>
      );
    }

    switch (activeMode) {
      case "explanation":
        if (!question || !question.explanation) {
          return (
            <div className="p-4 sm:p-8 text-center text-gray-700 text-sm sm:text-base">
              The full Explanation is only available when reviewing a specific
              question.
            </div>
          );
        }
        return (
          <ExplanationPanel
            explanationText={question.explanation}
          />
        );

      case "summary":
        if (summaryContent === null) {
          return (
            <IntroPanel
              title="Focused Subtopic Summary"
              proError={proError}
              text={`Generate a concise summary for: ${resourceSubtopic}`}
              icon={
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 20 20"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <path
                    d="M 4,0 V 18 H 17 V 5 4 L 13,0 h -1 z m 1,1 h 7 v 3 1 h 4 V 17 H 5 Z M 13,1.3535156 15.646484,4 H 13 Z M 2,2 v 17 1 H 3 15 V 19 H 3 V 2 Z m 4,0 v 4 h 4 V 2 Z M 7,3 H 9 V 5 H 7 Z M 6,7 v 1 h 9 V 7 Z m 0,2 v 1 h 9 V 9 Z m 0,2 v 1 h 9 v -1 z m 0,2 v 1 h 9 v -1 z m 0,2 v 1 h 9 v -1 z"
                    fill="#1B3358"
                  />
                </svg>
              }
              buttonText="Generate Summary"
              buttonIcon={<RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />}
              onButtonClick={handleGenerateSummary}
              isLoading={isGenerating}
            />
          );
        }
        return (
          <SummaryPanel
            data={parsedSummary}
          />
        );

      case "flashcards":
        if (flashcardContent === null) {
          return (
            <IntroPanel
              title="Subtopic Flashcards"
              proError={proError}
              text={`Generate flashcards for: ${resourceSubtopic}`}
              icon={
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <g fill="#1B3358" fillRule="evenodd">
                    <path d="M13 0H3a3.009 3.009 0 0 0-3 3v13.99a3.009 3.009 0 0 0 3 3h10a3.009 3.009 0 0 0 3-3V3a3.009 3.009 0 0 0-3-3zm1 16.99a1.016 1.016 0 0 1-1 1H3a1.016 1.016 0 0 1-1-1V3a1.016 1.016 0 0 1 1-1h10c.549.009.991.451 1 1v13.99z" />
                    <path d="M20 7v14a3.009 3.009 0 0 1-3 3H5a1 1 0 0 1 0-2h12a1.016 1.016 0 0 0 1-1V7a1 1 0 0 1 2 0z" />
                    <circle cx="8" cy="15" r="1" />
                    <path d="M12 8a3.992 3.992 0 0 1-3 3.87V12a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1 2 2 0 1 0-2-2 1 1 0 1 1-2 0 4 4 0 1 1 8 0z" />
                  </g>
                </svg>
              }
              buttonText="Generate Flashcards"
              buttonIcon={<RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />}
              onButtonClick={handleGenerateFlashcards}
              isLoading={isGenerating}
            />
          );
        }
        return (
          <FlashcardsPanel
            subtopicName={resourceSubtopic}
            flashcardContent={flashcardContent}
            isGenerating={isGenerating}
            handleGenerateFlashcards={handleGenerateFlashcards}
          />
        );

      case "subtopics":
        if (subtopicQuestionContent === null) {
          return (
            <IntroPanel
              title="Similar Practice Questions"
              proError={proError}
              text={`Generate related practice questions for: ${resourceSubtopic}`}
              icon={
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 15 15"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <path
                    fill="#1B3358"
                    d="M12.5547,1c-2.1441,0-5.0211,1.471-6.9531,4H4
        C2.8427,5,2.1794,5.8638,1.7227,6.7773L1.1113,8h1.4434H4l1.5,1.5L7,11v1.4453v1.4434l1.2227-0.6113
        C9.1362,12.8206,10,12.1573,10,11V9.3984c2.529-1.932,4-4.809,4-6.9531V1H12.5547z 
        M10,4c0.5523,0,1,0.4477,1,1l0,0
        c0,0.5523-0.4477,1-1,1l0,0C9.4477,6,9,5.5523,9,5v0C9,4.4477,9.4477,4,10,4L10,4z 
        M3.5,10L3,10.5C2.2778,11.2222,2,13,2,13
        s1.698-0.198,2.5-1L5,11.5L3.5,10z"
                  />
                </svg>
              }
              buttonText="Generate Questions"
              buttonIcon={<RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />}
              onButtonClick={handleGenerateSubtopics}
              isLoading={isGenerating}
            />
          );
        }
        return (
          <SimilarQuestionsPanel
            subtopicName={resourceSubtopic}
            subtopicQuestionContent={subtopicQuestionContent}
            isGenerating={isGenerating}
            handleGenerateSubtopics={handleGenerateSubtopics}
          />
        );

      case "blastMode":
        if (!blastStarted) {
          return (
            <IntroPanel
              title="Quick Match Drill"
              proError={proError}
              text="Pair the right concept with the right meaning."
              icon={
                <svg
                  width="100%"
                  height="100%"
                  viewBox="0 0 512 512"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <path
                    fill="#1B3358"
                    d="M377.212,441.898c64.465-64.469,76.4-161.574,35.799-238.125l56.127-56.126l-42.084-42.084 l-42.08-42.082l-56.127,56.124C252.294,79.006,155.191,90.94,90.723,155.408c-79.112,79.112-79.112,207.375,0,286.49 C169.835,521.008,298.098,521.008,377.212,441.898z"
                  />
                  <g fill="#1B3358">
                    <path d="M483.085,0.316c-5.776-1.424-11.611,2.106-13.034,7.88c-7.51,30.48-22.387,58.577-43.229,81.903 l-34.234-34.234c-4.205-4.206-11.022-4.206-15.232-0.001l-50.581,50.579c-28.576-13.826-60.13-21.138-92.81-21.138 c-56.988,0-110.564,22.191-150.86,62.488c-83.182,83.183-83.182,218.535,0,301.72C123.402,489.808,176.977,512,233.965,512 c56.986,0,110.564-22.191,150.86-62.489c65.776-65.778,79.525-164.171,41.277-243.6l50.652-50.651 c2.019-2.019,3.153-4.759,3.153-7.615c0-2.855-1.134-5.595-3.153-7.614l-34.682-34.684c23.608-26.119,40.446-57.702,48.895-91.998 C492.388,7.573,488.861,1.738,483.085,0.316z M369.596,434.281c-36.229,36.228-84.396,56.179-135.629,56.179 s-99.401-19.951-135.629-56.179c-74.785-74.786-74.785-196.473,0-271.259c36.229-36.228,84.396-56.179,135.629-56.179 c31.649,0,62.127,7.623,89.344,21.985c0.366,0.22,0.741,0.417,1.123,0.589c16.413,8.801,31.621,20.065,45.162,33.605 C444.378,237.809,444.378,359.495,369.596,434.281z M415.317,186.237c-8.477-13.671-18.635-26.589-30.491-38.444 c-11.752-11.753-24.643-21.954-38.412-30.526l38.559-38.556l34.464,34.464c0,0.001,0,0.002,0.002,0.003 c0,0,0.002,0.001,0.002,0.002l34.466,34.467L415.317,186.237z" />
                    <path d="M74.036,287.583c-5.946,0-10.77,4.822-10.77,10.77v0.299c0,5.947,4.824,10.77,10.77,10.77 c5.948,0,10.77-4.823,10.77-10.77v-0.299C84.806,292.405,79.985,287.583,74.036,287.583z" />
                    <path d="M393.897,309.721c5.946,0,10.77-4.822,10.77-10.77v-0.298c0-5.948-4.824-10.77-10.77-10.77 c-5.948,0-10.77,4.822-10.77,10.77v0.298C383.127,304.901,387.949,309.721,393.897,309.721z" />
                    <path d="M113.262,177.95c-24.352,24.356-40.612,55.117-47.019,88.956 c-1.106,5.845,2.734,11.479,8.578,12.587c0.677,0.127,1.351,0.19,2.015,0.19c5.074,0,9.592-3.601,10.57-8.769 c5.599-29.57,19.807-56.449,41.087-77.733c4.207-4.207,4.207-11.025,0-15.232C124.288,173.742,117.466,173.743,113.262,177.95z" />
                    <path d="M233.966,447.813c-5.946,0-10.77,4.823-10.77,10.77c0,5.948,4.824,10.77,10.77,10.77 c81.944,0,152.48-58.438,167.721-138.953c1.106-5.845-2.734-11.479-8.578-12.586c-5.844-1.101-11.479,2.734-12.586,8.579 C367.206,396.748,305.57,447.813,233.966,447.813z" />
                  </g>
                </svg>
              }
              buttonText="Start Blast Quiz"
              buttonIcon={<Zap className="w-4 h-4 sm:w-5 sm:h-5" />}
              onButtonClick={handleStartBlastQuiz}
              isLoading={false}
            />
          );
        }
        return <BlastModePanel content={sessionData.content || ""} />;
    }
  };

  return (
    <>
      {pageLoading && <LoadingScreen />}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      <div
        className={`
    absolute top-0 right-0 h-full z-50
    bg-[#BEE9F8] w-full
    transform transition-transform duration-300 ease-out
    ${isOpen ? "translate-x-0" : "translate-x-full"}
    flex flex-col shadow-2xl
  `}
      >
        <div className="w-full bg-[#1B3358] p-5 flex justify-center items-center gap-2 sm:gap-3 md:gap-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center  text-white">
            <h1
              className="
    text-2xl
    font-extrabold
    text-center
    leading-tight
    break-words
    max-w-[400px] sm:max-w-none
  "
            >
              Master {resourceSubtopic}
            </h1>
          </div>
        </div>

       <div className="top-buttons-mobile w-full bg-[#BEE9F8] py-5 px-4 flex justify-center items-center gap-4 flex-shrink-0">
  
  {/* Back Button */}
  <button
    onClick={onClose}
    className="
      flex-1 py-2
      bg-white rounded-full
      text-[#1B3358] text-xs font-bold
      shadow-md border border-gray-200
      active:scale-95 transition-all
    "
  >
    ⬅ Back
  </button>

  {/* Main Menu */}
  <button
    onClick={goToMain}
    disabled={pageLoading}
    className="
      flex-1 py-2
      bg-[#1B3358] rounded-full
      text-white text-xs font-bold
      shadow-lg
      active:scale-95 transition-all
      disabled:opacity-60
    "
  >
    Main Menu
  </button>

</div>


        <div className="flex-1 flex overflow-hidden">
       <div className="
  sidebar-left-modes
  w-16 sm:w-20
  flex flex-col items-center
  py-2 sm:py-4
  flex-shrink-0
  h-full
  overflow-y-auto
  hide-scrollbar
">


            {modes.map((mode) => {
              return (
                <button
                  key={mode.key}
                  onClick={() => {
                    setActiveMode(mode.key);
                    if (mode.key !== "blastMode") setBlastStarted(false);
                  }}
                  className={`
                flex flex-col cursor-pointer items-center justify-center w-full p-2.5 mb-1.5 sm:mb-2 transition-all duration-200
                ${
                  activeMode === mode.key
                    ? "text-[#1B3358] scale-110"
                    : "text-gray-500 hover:text-[#1B3358]"
                }
                
            `}
                >
                  <div
                    className={`${
                      activeMode === mode.key
                        ? "bg-white p-2 rounded-full shadow-sm"
                        : "relative"
                    }`}
                  >
                    {mode.icon}
                  </div>
                  <span className=" text-[10px] font-bold  mt-1 uppercase tracking-tighter text-center leading-tight">
                    {mode.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto bg-transparent relative">
            {renderContent()}
          </div>
        </div>

        <div className="bottom-buttons-desktop w-full bg-[#BEE9F8] p-3 sm:p-4 md:p-5 justify-center items-center flex gap-2 sm:gap-3 flex-shrink-0 border-t border-black/5">
          <button
            onClick={onClose}
            className="flex-1 py-2 sm:py-2.5 md:py-3 cursor-pointer bg-white rounded-full shadow-md text-[#1B3358] text-xs sm:text-sm font-bold hover:bg-gray-50 active:scale-95 transition-all border border-gray-100"
          >
            ⬅ Back
          </button>

          <button
            onClick={goToMain}
            disabled={pageLoading}
            className="flex-1 py-2 sm:py-2.5 md:py-3 bg-[#1B3358] rounded-full text-white text-xs sm:text-sm font-bold shadow-lg hover:bg-[#12243d] cursor-pointer active:scale-95 transition-all"
          >
            <span className="flex items-center justify-center gap-1.5 sm:gap-2">
              <House className="w-4 h-4 sm:w-5 sm:h-5" />
              Main Menu
            </span>
          </button>
        </div>

        {/* Mode buttons - BOTTOM horizontal bar on ≤350px */}
        <div className="bottom-mode-bar-mobile fixed bottom-0 left-0 right-0 w-full bg-[#BEE9F8] border-t border-black/10 shadow-lg z-50 flex">
          <div className="flex flex-row w-full justify-around items-center py-2">
            {modes.map((mode) => (
              <button
                key={mode.key}
                onClick={() => {
                  setActiveMode(mode.key);
                  if (mode.key !== "blastMode") setBlastStarted(false);
                }}
                className={`
                            flex flex-col cursor-pointer items-center justify-center flex-1 px-1 py-1.5 transition-all duration-200
                            ${
                              activeMode === mode.key
                                ? "text-[#1B3358] scale-105"
                                : "text-gray-500"
                            }
                        `}
              >
                <div
                  className={`${
                    activeMode === mode.key
                      ? "bg-white p-1.5 rounded-full shadow-sm"
                      : "relative"
                  }`}
                >
                  {mode.icon}
                </div>
                <span className="text-[9px] font-bold mt-0.5 uppercase tracking-tighter text-center leading-tight">
                  {mode.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SlideExplanation;
