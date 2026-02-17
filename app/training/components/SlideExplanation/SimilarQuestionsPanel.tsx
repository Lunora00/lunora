import React, { useState, useCallback } from 'react';
import { MessageCircle, RotateCw, Zap, CheckCircle, XCircle, Loader2 } from 'lucide-react'; 
import { Question } from "@/services/geminiService"; 

interface SimilarQuestionsPanelProps {
    subtopicName?: string;
    subtopicQuestionContent: Question[] | null;
    isGenerating: boolean;
    handleGenerateSubtopics: () => void;
}

// --- Updated Style Refinements for Deep Blue Theme ---
const iconColor = "text-[#1B3358]"; 
const primaryColor = "#1B3358";      
const primaryButtonStyle = `w-[80%] max-w-sm p-3 bg-[#1B3358] text-white rounded-full font-bold transition shadow-xl hover:bg-[#12243d] flex items-center justify-center gap-2 active:scale-95`;
const defaultText = "Click **'Generate Practice Questions'** to start a fast quiz based on the current subtopic and reinforce your learning.";


export const SimilarQuestionsPanel: React.FC<SimilarQuestionsPanelProps> = ({
    subtopicName,
    subtopicQuestionContent,
    isGenerating,
    handleGenerateSubtopics,
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);

    const totalQuestions = subtopicQuestionContent?.length || 0;
    
    const currentQuestion = subtopicQuestionContent && currentQuestionIndex < totalQuestions 
        ? subtopicQuestionContent[currentQuestionIndex] 
        : null;

    const isFinished = totalQuestions > 0 && currentQuestionIndex >= totalQuestions;
 

    const resetQuiz = useCallback(() => {
        setCurrentQuestionIndex(0);
        setScore(0);
        setShowAnswer(false);
        setSelectedOptionIndex(null);
    }, []);

    React.useEffect(() => {
        if (subtopicQuestionContent && totalQuestions > 0) {
            resetQuiz();
        }
    }, [subtopicQuestionContent, totalQuestions, resetQuiz]);

    const handleAnswer = (selectedIndex: number) => {
        if (showAnswer || !currentQuestion) return; 

        setSelectedOptionIndex(selectedIndex);
        setShowAnswer(true);

        const isCorrect = selectedIndex === currentQuestion.correctAnswer;
        if (isCorrect) {
            setScore(s => s + 1);
        }

        setTimeout(() => {
            setShowAnswer(false);
            setSelectedOptionIndex(null);
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        }, 1200);
    };

    // --- Loading State (Updated Colors) ---
    const GeneratingState = (
        <div className="w-full max-w-md flex flex-col items-center mt-4 sm:mt-6 px-4">
            <h3 className="text-lg sm:text-xl font-bold text-[#1B3358] mb-3 sm:mb-4 uppercase tracking-tight text-center">Generating Practice Questions...</h3>
            
            <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden shadow-inner mb-4 border border-[#1B3358]/10">
                <div 
                    className="h-full bg-[#1B3358] rounded-full animate-progress-stripes" 
                    style={{ width: '80%' }}
                ></div>
            </div>
            
            <RotateCw className="animate-spin w-7 h-7 sm:w-8 sm:h-8 text-[#1B3358]" />
            <p className="text-sm sm:text-base text-[#1B3358]/70 mt-3 font-medium text-center">
                Creating practice set for {subtopicName || 'your topic'}. Hold tight!
            </p>
        </div>
    );

    if (!currentQuestion && !isFinished && totalQuestions > 0) {
        return <Loader2 className="animate-spin w-8 h-8 sm:w-10 sm:h-10 text-[#1B3358]/40 m-auto" />;
    }

    // --- Question Card (Updated to White/Blue) ---
    const SingleQuestionDisplay = currentQuestion ? (
        <div className="w-full max-w-lg mb-4 sm:mb-6 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300 px-3 sm:px-0">
            {/* Progress + Score Bar */}
<div className="w-full max-w-lg mb-3 sm:mb-4 px-1">
  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-[#1B3358] mb-1">
    <span>
      Question {currentQuestionIndex + 1} / {totalQuestions}
    </span>
    <span>
      Score: {score}
    </span>
  </div>

  <div className="w-full h-2 sm:h-2.5 bg-[#1B3358]/10 rounded-full overflow-hidden">
    <div
      className="h-full bg-[#1B3358] transition-all duration-300"
      style={{
        width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
      }}
    />
  </div>
</div>

            <div className="w-full bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-[#1B3358]/5 mb-4 relative overflow-hidden">

                <p className="font-extrabold text-base sm:text-xl text-[#1B3358] flex items-start mb-4 sm:mb-6 leading-tight"> 
                    {currentQuestion.question}
                </p>
                
                <ul className="list-none ml-0 text-sm sm:text-base text-[#1B3358] space-y-2 sm:space-y-3">
                    {currentQuestion.options.map((option, optIndex) => {
                        let optionClasses = 'pl-3 sm:pl-4 pr-2 sm:pr-3 py-2.5 sm:py-3.5 rounded-xl transition-all duration-200 flex items-start cursor-pointer hover:bg-sky-50 border border-gray-100 font-medium';
                        let letterColor = 'text-[#1B3358]/40';

                        if (showAnswer) {
                            const isCorrect = optIndex === currentQuestion.correctAnswer;
                            const isSelected = optIndex === selectedOptionIndex;

                            if (isCorrect) {
                                optionClasses = 'pl-3 sm:pl-4 pr-2 sm:pr-3 py-2.5 sm:py-3.5 rounded-xl flex items-start border-2 border-green-500 bg-green-50 shadow-sm font-bold text-green-800 pointer-events-none';
                                letterColor = 'text-green-600';
                            } else if (isSelected) {
                                optionClasses = 'pl-3 sm:pl-4 pr-2 sm:pr-3 py-2.5 sm:py-3.5 rounded-xl flex items-start border-2 border-red-500 bg-red-50 shadow-sm text-red-800 pointer-events-none';
                                letterColor = 'text-red-600';
                            } else {
                                optionClasses = 'pl-3 sm:pl-4 pr-2 sm:pr-3 py-2.5 sm:py-3.5 rounded-xl flex items-start border border-gray-100 text-gray-400 pointer-events-none opacity-40';
                            }
                        } else if (optIndex === selectedOptionIndex) {
                            optionClasses = 'pl-3 sm:pl-4 pr-2 sm:pr-3 py-2.5 sm:py-3.5 rounded-xl transition-all duration-200 flex items-start border-2 border-[#1B3358] bg-sky-50 font-bold';
                            letterColor = 'text-[#1B3358]';
                        }

                        return (
                            <li 
                                key={optIndex} 
                                className={optionClasses}
                                onClick={() => handleAnswer(optIndex)}
                            >
                                <span className={`w-5 sm:w-6 mr-2 sm:mr-3 font-black text-center flex-shrink-0 ${letterColor}`}>
                                    {String.fromCharCode(65 + optIndex)}.
                                </span> 
                                {option}
                            </li>
                        );
                    })}
                </ul>
            </div>
            
        </div>
    ) : null;

    // --- Quiz Finished (Updated Colors) ---
    const QuizFinishedDisplay = (
        <div className="w-full max-w-sm flex flex-col items-center text-center mb-20 sm:mb-0 p-6 sm:p-8  rounded-3xl   mt-4 mx-3 sm:mx-0">
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-2xl font-black text-[#1B3358] mb-2 uppercase">Quiz Complete!</h3>
            
            <div className="flex flex-col items-center justify-center mb-5 sm:mb-6 p-4 sm:p-5 bg-[#1B3358]/5 text-[#1B3358] rounded-2xl w-28 sm:w-32 shadow-inner border border-[#1B3358]/10">
                <span className="text-4xl sm:text-5xl font-black leading-none">{score}</span> 
                <hr className="w-1/2 my-2 border-[#1B3358]/20" />
                <span className="text-lg sm:text-xl font-bold opacity-60">{totalQuestions}</span>
            </div>
            
            <button
                className="w-full p-3 sm:p-3.5 bg-[#1B3358] text-white rounded-full font-bold transition shadow-xl hover:bg-[#12243d] flex items-center justify-center gap-2 active:scale-95" 
                onClick={resetQuiz}
            >
                <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
                Review & Try Again
            </button>
            
          <button
  className="
    mt-3 w-full p-2.5 sm:p-3 border-2 border-[#1B3358]/20 text-[#1B3358] 
    rounded-full font-bold text-xs sm:text-sm
    transition-all duration-200
    hover:bg-[#1B3358]/5
    active:scale-95
    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B3358]/30
  "
  onClick={() => {
    resetQuiz();
    handleGenerateSubtopics();
  }}
>
  Generate New Questions
</button>

        </div>
    );

    return (
        <div className="p-3 sm:p-4 flex flex-col items-center justify-start pt-4 sm:pt-6 overflow-y-auto h-full hide-scrollbar relative">

            <style jsx global>{`
                * {
                    font-family: "DM Sans", sans-serif !important;
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    scrollbar-width: none;
                }
                @keyframes stripe-move {
                    0% { background-position: 0 0; }
                    100% { background-position: 40px 0; }
                }
                .animate-progress-stripes {
                    background-image: linear-gradient(
                        45deg, 
                        rgba(255, 255, 255, .2) 25%, 
                        transparent 25%, 
                        transparent 50%, 
                        rgba(255, 255, 255, .2) 50%, 
                        rgba(255, 255, 255, .2) 75%, 
                        transparent 75%, 
                        transparent
                    );
                    background-size: 20px 20px;
                    animation: stripe-move 1s linear infinite;
                }
            `}</style>

            {isGenerating ? (
                GeneratingState
            ) : isFinished ? (
                QuizFinishedDisplay
            ) : currentQuestion ? (
                SingleQuestionDisplay
            ) : (
                <div className="text-[#1B3358] text-center text-base sm:text-xl leading-relaxed mb-6 sm:mb-8 max-w-md font-bold px-4">
                    <p className="opacity-80">{defaultText}</p>
                    <div className="mt-6 sm:mt-8 text-5xl sm:text-6xl opacity-20">🎯</div>
                </div>
            )}
        </div>
    );
};