import React, { useState, useEffect, useRef } from 'react';

interface FeynMeterProps {
  correctAnswers: number;
  questions: any[];
}

function FeynMeter({ correctAnswers, questions }: FeynMeterProps) {
  const terCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Calculate moon phase based on progress (0 to 1)
  const totalQuestions = questions.length || 1;
  const progress = Math.min(correctAnswers / totalQuestions);
  
  // Calculate moon size (grows from 120px to 180px)
  const moonSize = 120 + (60 * 0.4);
  
  // Calculate moon brightness (from dim to bright)
  const moonBrightness = 0.3 + (0.7 * progress);
  
  // Calculate glow intensity
  const glowIntensity = 30 + (170 * progress);

  // 1. Randomized Stars - Fixed at the top with a natural distribution
  const [stars] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 45,
      size: Math.random() * 2 + 0.5,
      duration: 2 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.7,
    }))
  );

  // 2. Tall, Dark, Authentic Mountains
  useEffect(() => {
    const canvas = terCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const handleResize = () => {
      const width = window.innerWidth / 2; // Half screen width
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;

      const staticPeaks = [
        0.42, 0.46, 0.50, 0.56, 0.60,
        0.58, 0.54, 0.49, 0.45,
        0.47, 0.52, 0.55, 0.53,
        0.48, 0.44
      ];
      
      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      
      for (let i = 0; i < staticPeaks.length; i++) {
        const x = (width / (staticPeaks.length - 1)) * i;
        const y = height * staticPeaks[i];
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      ctx.fillStyle = "#020408"; 
      ctx.fill();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

const styles = {
 hero: {
    width: '100%',
    height: '100vh',
    position: 'relative' as const,
    overflow: 'hidden',
    background: `
      radial-gradient(circle at 20% 30%, rgba(60,120,255,0.25), transparent 45%),
      radial-gradient(circle at 80% 40%, rgba(120,80,255,0.18), transparent 45%),
      radial-gradient(circle at 50% 80%, rgba(40,140,255,0.18), transparent 50%),
      linear-gradient(to bottom, #0b1a33, #131e41 70%, #020406 100%)
    `
  },
  ocean: {
    width: '100%',
    height: '35vh',
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    backgroundImage: 'url(https://miro.medium.com/v2/resize:fit:720/format:webp/1*arc39NtrzPm3OGMuT6zcOA.png)',
    backgroundRepeat: 'repeat-x' as const,
    backgroundSize: 'cover' as const,
    animation: 'waterFlow 25s linear infinite',
    zIndex: 20,
  },
  shipContainer: {
  width: 'clamp(220px, 22vw, 420px)', 
    position: 'absolute' as const,
    bottom: '18vh',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 30,
    animation: 'rocking 5s ease-in-out infinite',
    filter: 'brightness(0.6) drop-shadow(0 10px 20px rgba(0,0,0,0.6))',
  },
  moonContainer: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '400px',
    height: '400px',
    zIndex: 5,
    display: 'flex',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  moonCore: {
    width: '220px',
    height: '220px',
    backgroundColor: '#FFF',
    borderRadius: '50%',
    boxShadow: `0 0 ${40 + (progress * 60)}px rgba(255,255,255,0.6)`,
    transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
    clipPath: `inset(0 0 0 ${Math.max(0, 95 - (progress * 95))}%)`,
    transform: `scale(${0.9 + (progress * 0.1)})`,
  }
};


  return (
    <div style={styles.hero}>
      <style>
        {`
          @keyframes waterFlow {
            from { background-position: 0 0; }
            to { background-position: 1440px 0; }
          }
          @keyframes rocking {
            0%, 100% { transform: translateX(-50%) rotate(0.8deg) translateY(0); }
            50% { transform: translateX(-50%) rotate(-1.2deg) translateY(-12px); }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
          @keyframes moonPulse {
            0%, 100% { opacity: ${0.5 + (moonBrightness * 0.3)}; transform: scale(1); }
            50% { opacity: ${0.7 + (moonBrightness * 0.3)}; transform: scale(1.08); }
          }
            @keyframes moonBreath {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.04); }
}

        `}
      </style>

      {/* 1. Randomized Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          style={{
            position: 'absolute',
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: 'white',
            borderRadius: '50%',
            opacity: star.opacity,
            animation: `twinkle ${star.duration}s ease-in-out infinite`,
            boxShadow: `0 0 ${star.size * 2}px white`,
            zIndex: 1,
          }}
        />
      ))}

{/* 🌙 LUNORA-STYLE DYNAMIC MOON CONTAINER */}
<div style={{
  position: 'absolute',
  left: '50%',
  top: '8%',
  transform: 'translateX(-50%)',
  width: '200px', 
  height: '200px',
  zIndex: 100,
}}>
  {/* The Outer Glow - Intensifies as moon becomes full */}
  <div style={{
    position: 'absolute',
    inset: '-20px',
    background: 'white',
    borderRadius: '50%',
    filter: `blur(${30 + (progress * 40)}px)`,
    opacity: 0.15 + (progress * 0.25),
    transition: 'all 1s ease-out',
  }} />

  <svg 
    viewBox="0 0 100 100" 
    style={{ 
      width: '100%', 
      height: '100%', 
      transform: 'rotate(-40deg)',
      filter: `drop-shadow(0 0 ${10 + (progress * 15)}px rgba(255,255,255,0.4))`
    }}
  >
    <defs>
      <mask id="feyn-moon-cut">
        <rect width="100" height="100" fill="white" />
        {/* The Shadow Circle (The "Cutter"):
            - cx="62" is a Crescent
            - cx="120" is a Full Moon (cutter is completely off-screen)
        */}
        <circle 
          cx={62 + (progress * 58)} 
          cy="50" 
          r="36" 
          fill="black" 
          style={{ transition: 'cx 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </mask>
    </defs>
    
    <circle
      cx="50"
      cy="50"
      r="40"
      fill="white"
      mask="url(#feyn-moon-cut)"
    />
  </svg>

  {/* Optional: Subtle Surface Textures */}
  <div style={{
    position: 'absolute',
    inset: '10%',
    borderRadius: '50%',
    background: 'radial-gradient(circle at 30% 30%, rgba(0,0,0,0.05) 0%, transparent 80%)',
    pointerEvents: 'none',
    opacity: 1 - progress // Textures fade as it glows brighter
  }} />
</div>

      {/* 3. Original Dark Tall Mountains */}
      <canvas 
        ref={terCanvasRef} 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          zIndex: 10, 
          pointerEvents: 'none' 
        }} 
      />

      {/* 4. Moving Dark Sea */}
      <div style={styles.ocean} />

      {/* 5. The Ship */}
      <div style={styles.shipContainer}>
        <img 
          src="/ChatGPT Image Jan 17, 2026, 12_47_45 AM-Photoroom.png" 
          alt="ship" 
          style={{ 
            width: '100%', 
            WebkitBoxReflect: 'below -15px linear-gradient(transparent 50%, rgba(255,255,255,0.05))' 
          }}
        />
      </div>

      {/* Dark Horizon Blend */}
      <div style={{
        position: 'absolute',
        bottom: '34vh',
        width: '100%',
        height: '150px',
        background: 'linear-gradient(to top, #020406 20%, transparent 100%)',
        zIndex: 15
      }} />
    </div>
  );
}

export default FeynMeter;