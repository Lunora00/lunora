import React from "react";
import AnswerOptions from "./AnswerOptions";
import { renderHighlightedText } from "../utils/renderHighlightedText";
import { ChevronDown } from "lucide-react";

interface QuestionCardProps {
  question: any;
  currentQuestion: number;
  selectedAnswer: string;
  isAnswered: boolean;
  sessionData: any; 
  onSelectAnswer: (answer: string) => void;
  onOpenSlide: () => void;
  onOpenSheetSelector: () => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentQuestion,
  selectedAnswer,
  isAnswered,
  sessionData,
  onSelectAnswer,
  onOpenSlide,
  onOpenSheetSelector,
}) => {
  
  const truncateSubtopic = (text: string, screenSize: 'mobile' | 'tablet' | 'desktop') => {
    const maxChars = screenSize === 'mobile' ? 20 : screenSize === 'tablet' ? 25 : 25;
    if (text.length > maxChars) {
      return text.slice(0, maxChars) + "...";
    }
    return text;
  };


  // Detect screen size
  const [screenSize, setScreenSize] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  React.useEffect(() => {
    const checkSize = () => {
      if (window.innerWidth < 640) {
        setScreenSize('mobile');
      } else if (window.innerWidth < 768) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  return (
<div className="flex-1 min-h-0 flex flex-col bg-[#FDFDFD] text-stone-900  relative">

  <header className="w-full relative bg-white/50 backdrop-blur-sm">
    <div className="pl-10 sm:pl-8 md:pl-6 pr-6 sm:pr-8 md:pr-12 pt-3 sm:pt-3.5 md:pt-4 pb-4 sm:pb-5 md:pb-6">
      <div className="max-w-5xl">
        
        {/* HEADER ROW */}
        <div className="flex items-start flex-wrap gap-y-2">
          
          {/* LEFT TITLE BLOCK */}
          <div className="flex-1 min-w-0 mt-4 flex flex-col justify-center  ml-2 sm:ml-3 md:ml-4  pl-3 sm:pl-4 md:pl-6">
            <button className="group flex flex-col items-start text-left outline-none w-full">
              
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 w-full">
                <h1 className="truncate text-xl font-black tracking-tighter text-black  m-0 leading-tight">
                  {truncateSubtopic(question.subtopic || "Logic", screenSize)}
                </h1>

                <div
                  className="bg-stone-100 cursor-pointer p-0.5 rounded group-hover:bg-stone-200 transition-colors shrink-0"
                  onClick={onOpenSheetSelector}
                >
                  <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-400 group-hover:text-stone-600 group-hover:translate-y-0.5 transition-all" />
                </div>
              </div>

              <div className="mt-4 sm:mt-0 flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-[8px] sm:text-[9px] uppercase font-bold tracking-[0.15em] sm:tracking-[0.2em] text-stone-400">
                <span className="flex items-center gap-1 sm:gap-1.5">
                  Difficulty:
                  <span className="text-stone-600">{question.difficulty || "Mid"}</span>
                </span>
 
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <span className="w-0.5 h-0.5 sm:w-1 sm:h-1 rounded-full bg-stone-300"></span>
                  Subject:
                  <span className="text-stone-600">{sessionData.subject || "Genral"}</span>
                </span>
              </div>
            </button>
          </div>

          {/* RIGHT SHEET NUMBER */}
          <div className="shrink-0 sheet-number-block flex flex-col items-end border-r-2 sm:border-r-3 md:border-r-4 border-[#004738]/10 pr-2 sm:pr-3 md:pr-4 ml-auto">
            <p className="text-[8px] sm:text-[9px] font-bold uppercase text-stone-400 tracking-[0.15em] sm:tracking-[0.2em] mb-0">
              Sheet No.
            </p>
            <p className="text-3xl sm:text-4xl md:text-5xl  font-light text-stone-800 tabular-nums leading-none">
              {String(currentQuestion + 1).padStart(2, "0")}
            </p>
          </div>

        </div>
      </div>
    </div>

    <div className="absolute bottom-0 left-8 sm:left-8 md:left-12 right-0 border-b border-stone-100" />
  </header>

  <main className="flex-1 pl-15 sm:pl-14 md:pl-20 pr-6 sm:pr-8 md:pr-12 py-2 sm:py-2.5 md:py-3 overflow-y-auto min-h-0">
    <div className="max-w-3xl">
      <h2 className="text-2xl font-medium text-stone-800 leading-relaxed tracking-tight mb-4 sm:mb-4.5 md:mb-5">
        {renderHighlightedText(question.question)}
      </h2>

      <AnswerOptions
        options={question.options}
        selectedAnswer={selectedAnswer}
        correctAnswerIndex={question.correctAnswer}
        isAnswered={isAnswered}
        isCompleted={sessionData?.isCompleted}
        onSelectAnswer={onSelectAnswer}
        onOpenSlide={onOpenSlide}
      />
    </div>
  </main>
</div>
 
  );
};

export default QuestionCard;