
const getMoonGlowColor = (percentage: number): string => {
  if (percentage >= 90) return "#10b981";
  if (percentage >= 70) return "#3b82f6";
  if (percentage >= 50) return "#f59e0b";
  if (percentage >= 25) return "#f97316";
  return "#ef4444";
};

const MasterMoon: React.FC<{
  accuracy: number;
}> = ({ accuracy }) => {
  const glowColor = getMoonGlowColor(accuracy);
  const percentage = accuracy

  const getShadowPath = () => {
    const centerX = 28;
    const centerY = 28;
    const radius = 22;

    if (percentage === 0) {
      // New Moon - full shadow (100% dark)
      return `M ${centerX},${centerY - radius} 
              A ${radius},${radius} 0 1,0 ${centerX},${centerY + radius}
              A ${radius},${radius} 0 1,0 ${centerX},${centerY - radius}`;
    }

    // Calculate phase: 0 to 1 (0% = 0, 100% = 1)
    const phase = percentage / 100;

    // Calculate the x-offset for the ellipse that creates the shadow
    // phase 0 = full shadow (offsetX = radius)
    // phase 0.5 = half moon (offsetX = 0)
    // phase 1 = no shadow (offsetX = -radius, but we don't draw it)
    const offsetX = radius * (1 - 2 * phase);

    if (percentage >= 100) {
      // Full Moon - no shadow
      return "";
    }

    // Create the shadow path
    // The shadow is the right side of the moon when waxing (0-50%)
    // The shadow is the left side when waning (50-100%)
    const sweepFlag = offsetX > 0 ? 1 : 0;

    return `M ${centerX},${centerY - radius}
            A ${radius},${radius} 0 0,1 ${centerX},${centerY + radius}
            A ${Math.abs(offsetX)},${radius} 0 0,${sweepFlag} ${centerX},${
      centerY - radius
    }`;
  };

  return (
    <div className="relative w-14 h-14 flex-shrink-0">


      <svg viewBox="0 0 56 56" className="w-full h-full relative z-10">
        <defs>
          {/* REALISTIC Moon surface - White/Gray with lighting */}
          <radialGradient id="moonSurface" cx="38%" cy="32%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#f5f5f5" />
            <stop offset="60%" stopColor="#e8e8e8" />
            <stop offset="80%" stopColor="#d8d8d8" />
            <stop offset="100%" stopColor="#c0c0c0" />
          </radialGradient>

          {/* Enhanced texture noise */}
          <filter id="moonNoise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="1.2"
              numOctaves="4"
              seed="5"
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.15 0"
            />
            <feBlend in="SourceGraphic" mode="multiply" />
          </filter>

          {/* Hard clip */}
          <clipPath id="moonClip">
            <circle cx="28" cy="28" r="22" />
          </clipPath>

          {/* Dark side gradient - Using #655E62 */}
          <radialGradient id="shadowGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#7a7075" />
            <stop offset="50%" stopColor="#655E62" />
            <stop offset="100%" stopColor="#524d51" />
          </radialGradient>
        </defs>

        {/* MOON BODY with enhanced texture */}
        <g clipPath="url(#moonClip)">
          {/* Base moon - light side */}
          <circle
            cx="28"
            cy="28"
            r="22"
            fill="url(#moonSurface)"
            filter="url(#moonNoise)"
          />

          {/* Large realistic craters with depth - NOW ON ENTIRE MOON */}
          <g opacity="0.25">
            <ellipse cx="19" cy="17" rx="4.2" ry="3.8" fill="#a8a8a8" />
            <ellipse cx="19" cy="17" rx="3.5" ry="3.2" fill="#b8b8b8" />
            <ellipse cx="32" cy="23" rx="3.2" ry="2.8" fill="#a8a8a8" />
            <ellipse cx="32" cy="23" rx="2.5" ry="2.2" fill="#b8b8b8" />
            <ellipse cx="23" cy="33" rx="3.8" ry="3.5" fill="#a8a8a8" />
            <ellipse cx="23" cy="33" rx="3" ry="2.8" fill="#b8b8b8" />
            <ellipse cx="35" cy="35" rx="2.5" ry="2.2" fill="#a8a8a8" />
            <ellipse cx="17" cy="31" rx="2" ry="1.8" fill="#a8a8a8" />
          </g>

          {/* Medium craters */}
          <g opacity="0.18">
            <circle cx="28" cy="19" r="2.2" fill="#b0b0b0" />
            <circle cx="36" cy="28" r="1.9" fill="#b0b0b0" />
            <circle cx="20" cy="36" r="2.4" fill="#b0b0b0" />
            <circle cx="30" cy="38" r="1.6" fill="#b0b0b0" />
            <circle cx="14" cy="24" r="1.8" fill="#b0b0b0" />
          </g>

          {/* Small surface details and micro craters */}
          <g opacity="0.14">
            <circle cx="26" cy="20" r="1.3" fill="#a0a0a0" />
            <circle cx="30" cy="28" r="1.6" fill="#a0a0a0" />
            <circle cx="22" cy="26" r="1.1" fill="#a0a0a0" />
            <circle cx="28" cy="35" r="1.4" fill="#a0a0a0" />
            <circle cx="34" cy="31" r="1.2" fill="#a0a0a0" />
            <circle cx="25" cy="30" r="0.9" fill="#a0a0a0" />
            <circle cx="31" cy="34" r="1.0" fill="#a0a0a0" />
            <circle cx="18" cy="22" r="1.1" fill="#a0a0a0" />
          </g>

          {/* Enhanced limb darkening (realistic edge shading) */}
          <radialGradient id="limb">
            <stop offset="60%" stopColor="rgba(0,0,0,0)" />
            <stop offset="85%" stopColor="rgba(0,0,0,0.12)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.28)" />
          </radialGradient>
          <circle cx="28" cy="28" r="22" fill="url(#limb)" />

          {/* Subtle highlight on illuminated side */}
          <radialGradient id="moonHighlight" cx="65%" cy="35%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <circle cx="28" cy="28" r="22" fill="url(#moonHighlight)" />

          {/* MOON PHASE SHADOW - Dark side with #655E62 color and TEXTURE */}
          {percentage < 100 && (
            <>
              <path
                d={getShadowPath()}
                fill="url(#shadowGradient)"
                opacity="1"
              />

              {/* Add texture/craters to dark side too */}
              <g clipPath={`path('${getShadowPath()}')`}>
                {/* Large craters on dark side - darker versions */}
                <g opacity="0.15">
                  <ellipse cx="19" cy="17" rx="4.2" ry="3.8" fill="#554f53" />
                  <ellipse cx="19" cy="17" rx="3.5" ry="3.2" fill="#5e585c" />
                  <ellipse cx="32" cy="23" rx="3.2" ry="2.8" fill="#554f53" />
                  <ellipse cx="32" cy="23" rx="2.5" ry="2.2" fill="#5e585c" />
                  <ellipse cx="23" cy="33" rx="3.8" ry="3.5" fill="#554f53" />
                  <ellipse cx="23" cy="33" rx="3" ry="2.8" fill="#5e585c" />
                  <ellipse cx="35" cy="35" rx="2.5" ry="2.2" fill="#554f53" />
                  <ellipse cx="17" cy="31" rx="2" ry="1.8" fill="#554f53" />
                </g>

                {/* Medium craters on dark side */}
                <g opacity="0.12">
                  <circle cx="28" cy="19" r="2.2" fill="#5a545" />
                  <circle cx="36" cy="28" r="1.9" fill="#5a5458" />
                  <circle cx="20" cy="36" r="2.4" fill="#5a5458" />
                  <circle cx="30" cy="38" r="1.6" fill="#5a5458" />
                  <circle cx="14" cy="24" r="1.8" fill="#5a5458" />
                </g>

                {/* Small craters on dark side */}
                <g opacity="0.1">
                  <circle cx="26" cy="20" r="1.3" fill="#524d51" />
                  <circle cx="30" cy="28" r="1.6" fill="#524d51" />
                  <circle cx="22" cy="26" r="1.1" fill="#524d51" />
                  <circle cx="28" cy="35" r="1.4" fill="#524d51" />
                  <circle cx="34" cy="31" r="1.2" fill="#524d51" />
                  <circle cx="25" cy="30" r="0.9" fill="#524d51" />
                  <circle cx="31" cy="34" r="1.0" fill="#524d51" />
                  <circle cx="18" cy="22" r="1.1" fill="#524d51" />
                </g>
              </g>
            </>
          )}

          {/* Terminator line (the edge between light and shadow) */}
          {percentage > 0 && percentage < 100 && (
            <path
              d={getShadowPath()}
              fill="none"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth="0.6"
            />
          )}
        </g>

        {/* Crisp luminous edge */}
        <circle
          cx="28"
          cy="28"
          r="22"
          fill="none"
          stroke="rgba(255,255,255,0.6)"
          strokeWidth="0.5"
        />

        {/* Outer subtle rim */}
        <circle
          cx="28"
          cy="28"
          r="22.5"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="0.8"
        />

        {/* Achievement sparkles - Enhanced */}
        {percentage >= 90 && (
          <g opacity="0.95">
            {/* Main sparkles */}
            <g>
              <circle cx="15" cy="15" r="1.5" fill="white" />
              <circle cx="39" cy="19" r="1.3" fill="white" />
              <circle cx="35" cy="39" r="1.5" fill="white" />
            </g>
            {/* Sparkle cross effects */}
            <g opacity="0.8">
              <line
                x1="13"
                y1="15"
                x2="17"
                y2="15"
                stroke="white"
                strokeWidth="0.6"
              />
              <line
                x1="15"
                y1="13"
                x2="15"
                y2="17"
                stroke="white"
                strokeWidth="0.6"
              />
              <line
                x1="37"
                y1="19"
                x2="41"
                y2="19"
                stroke="white"
                strokeWidth="0.5"
              />
              <line
                x1="39"
                y1="17"
                x2="39"
                y2="21"
                stroke="white"
                strokeWidth="0.5"
              />
              <line
                x1="33"
                y1="39"
                x2="37"
                y2="39"
                stroke="white"
                strokeWidth="0.6"
              />
              <line
                x1="35"
                y1="37"
                x2="35"
                y2="41"
                stroke="white"
                strokeWidth="0.6"
              />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};

export default MasterMoon;
