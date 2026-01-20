import React from "react";

interface AnswerOptionsProps {
  options: string[];
  selectedAnswer: string;
  correctAnswerIndex: number;
  isAnswered: boolean;
  isCompleted: boolean;
  onSelectAnswer: (answer: string) => void;
  onOpenSlide: () => void;
}

const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  options,
  selectedAnswer,
  correctAnswerIndex,
  isAnswered,
  isCompleted,
  onSelectAnswer,
  onOpenSlide,
}) => {
  const isDisabled = isAnswered || isCompleted;

  // Helper to clean markdown/special characters from the option text
  const cleanOptionText = (text: string) => {
    return text
    .replace(/==/g, "")      // Removes ==
      .replace(/`/g, "")       // Removes backticks `
      .replace(/\.{2,}/g, "")   // Removes .. or ...
      .trim();
  };

  return (
    <div className="flex flex-col space-y-1">
      {options.map((option, index) => {
        const cleanedOption = cleanOptionText(option);
        const isSelected = selectedAnswer === option;
        const isCorrect = index === correctAnswerIndex;

        let textStyle = "text-stone-700";
        let circleStyle = "border-stone-300";
        let iconColor = "text-transparent";
        let iconContent = "";

        if (isDisabled) {
          if (isCorrect) {
            textStyle = "text-[#004738] font-medium";
            circleStyle = "border-[#004738]";
            iconColor = "text-[#004738]";
            iconContent = "✓";
          } else if (isSelected) {
            textStyle = "text-[#E9252F]";
            circleStyle = "border-[#E9252F]";
            iconColor = "text-[#E9252F]";
            iconContent = "✕";
          } else {
            textStyle = "text-stone-400 opacity-60";
            circleStyle = "border-stone-200";
          }
        }

        return (
          <div
            key={index}
            onClick={() => {
              if (!isDisabled) onSelectAnswer(option);
            }}
            className={`group flex items-start gap-2 sm:gap-3 md:gap-4 py-2 sm:py-3 md:py-3.5 px-1.5 sm:px-2 text-left w-full transition-all duration-200 rounded-lg ${
              !isDisabled ? "cursor-pointer" : "cursor-default"
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }} 
          >
            {/* Circle Indicator */}
            <div
              className={`
                shrink-0 w-5 h-5 sm:w-6 sm:h-6 mt-0.5 border rounded-full flex items-center justify-center text-[11px] sm:text-[12px] font-bold
                transition-all duration-300 ease-out
                ${circleStyle}
                ${isSelected && !isDisabled ? "border-[#004738] bg-[#004738]" : "bg-transparent"}
              `}
            >
              <span className={`${iconColor} transition-colors duration-200`}>
                {iconContent || (isSelected && !isDisabled ? "●" : "")}
              </span>
            </div>

            {/* Text Content */}
            <div className="flex-1 min-w-0">
              <div className={` cursor-pointer text-[15px] font-serif leading-relaxed whitespace-normal break-words ${textStyle} transition-colors duration-200`}>
                <span className="inline-block w-5 sm:w-6  text-[11px] font-mono text-stone-400 align-baseline">
                  {String.fromCharCode(65 + index)}.
                </span>
                {cleanedOption}
              </div>
            </div>

            {/* Reference Icon */}
            {isDisabled && isCorrect && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onOpenSlide();
                }}
                className="
                  relative z-30 shrink-0 mt-0.5
                  w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center
                  rounded-full border border-[#004738]/20
                  text-[11px] sm:text-[12px] font-bold text-[#004738]
                  hover:bg-[#004738] hover:text-white
                  active:scale-90
                  transition-all duration-200
                  ml-2 sm:ml-3
                  cursor-pointer
                "
              >
                ?
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AnswerOptions;