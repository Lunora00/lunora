import { Loader2 } from "lucide-react";

interface SubtopicData {
  name: string;
  scored: number;
  total: number;
  percentage: number;
}


const getMoonPhase = (percentage: number): string => {
  if (percentage === 0) return "new";
  if (percentage < 25) return "crescent";
  if (percentage < 50) return "quarter";
  if (percentage < 75) return "gibbous";
  return "full";
};

const getMoonGlowColor = (percentage: number): string => {
  if (percentage >= 90) return "#10b981";
  if (percentage >= 70) return "#3b82f6";
  if (percentage >= 50) return "#f59e0b";
  if (percentage >= 25) return "#f97316";
  return "#ef4444";
};

const RealisticMoon: React.FC<{
  subtopic: SubtopicData;
  onClick: () => void;
  isLoading: boolean;
}> = ({ subtopic, onClick, isLoading }) => {
  const phase = getMoonPhase(subtopic.percentage);
  const glowColor = getMoonGlowColor(subtopic.percentage);
  const percentage = subtopic.percentage;

  const getShadowPath = () => {
    const centerX = 16;
    const centerY = 16;
    const radius = 13;

    if (percentage === 0) {
      return `M ${centerX},${centerY - radius} 
              A ${radius},${radius} 0 1,0 ${centerX},${centerY + radius}
              A ${radius},${radius} 0 1,0 ${centerX},${centerY - radius}`;
    } else if (percentage < 25) {
      const offset = radius * (1 - percentage / 25);
      return `M ${centerX},${centerY - radius}
              A ${radius},${radius} 0 0,1 ${centerX},${centerY + radius}
              Q ${centerX + offset},${centerY} ${centerX},${centerY - radius}`;
    } else if (percentage < 50) {
      const offset = radius * (1 - (percentage - 25) / 25);
      return `M ${centerX},${centerY - radius}
              A ${radius},${radius} 0 0,1 ${centerX},${centerY + radius}
              Q ${centerX - offset},${centerY} ${centerX},${centerY - radius}`;
    } else if (percentage < 75) {
      const offset = radius * ((percentage - 50) / 25);
      return `M ${centerX},${centerY - radius}
              A ${radius},${radius} 0 0,1 ${centerX},${centerY + radius}
              A ${offset * 2},${radius} 0 0,0 ${centerX},${centerY - radius}`;
    } else if (percentage < 100) {
      const offset = radius * 0.3 * (1 - (percentage - 75) / 25);
      return `M ${centerX},${centerY - radius}
              A ${radius},${radius} 0 0,1 ${centerX},${centerY + radius}
              A ${offset},${radius} 0 0,0 ${centerX},${centerY - radius}`;
    }
    return "";
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      title={`${subtopic.name}: ${subtopic.percentage}% (${subtopic.scored}/${subtopic.total})`}
      className="relative group disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-110 active:scale-95"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7 sm:w-8 sm:h-8">
        <defs>
          <radialGradient
            id={`moon-gradient-${subtopic.name.replace(/\s+/g, "-")}`}
          >
            <stop offset="0%" stopColor="#f5e6d3" />
            <stop offset="50%" stopColor="#e8d5c4" />
            <stop offset="100%" stopColor="#d4c4b0" />
          </radialGradient>

          <filter id={`moon-glow-${subtopic.name.replace(/\s+/g, "-")}`}>
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx="16"
          cy="16"
          r="15"
          fill="none"
          stroke={glowColor}
          strokeWidth="0.5"
          opacity="0.6"
          className={percentage < 50 ? "animate-pulse" : ""}
        />

        <circle
          cx="16"
          cy="16"
          r="13"
          fill={`url(#moon-gradient-${subtopic.name.replace(/\s+/g, "-")})`}
          filter={`url(#moon-glow-${subtopic.name.replace(/\s+/g, "-")})`}
        />

        <g opacity="0.15">
          <circle cx="12" cy="11" r="2" fill="#8b7355" />
          <circle cx="19" cy="14" r="1.5" fill="#8b7355" />
          <circle cx="14" cy="19" r="1.8" fill="#8b7355" />
          <circle cx="20" cy="20" r="1.2" fill="#8b7355" />
        </g>

        {percentage < 100 && (
          <path
            d={getShadowPath()}
            fill="rgba(20, 20, 40, 0.75)"
            opacity="0.8"
          />
        )}

        {percentage >= 90 && (
          <g className="animate-pulse">
            <circle cx="10" cy="10" r="1" fill="white" opacity="0.9" />
            <circle cx="22" cy="12" r="0.8" fill="white" opacity="0.7" />
            <circle cx="20" cy="22" r="1" fill="white" opacity="0.8" />
            <circle cx="11" cy="21" r="0.7" fill="white" opacity="0.6" />
          </g>
        )}
      </svg>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin text-white" />
        </div>
      )}
    </button>
  );
};

export default RealisticMoon;