"use client";

import React, { useMemo } from "react";

interface StarProps {
  id: number;
  left: string;
  top: string;
  size: string;
  delay: string;
  duration?: string;
  animationClass?: string;
}

/**
 * Optimized Star Component
 * - Uses fixed dimensions (no dynamic resizing)
 * - GPU-accelerated transforms
 * - Memoized to prevent unnecessary re-renders
 * - Batch CSS variables for animation parameters
 */
export const OptimizedStar = React.memo(
  ({
    id,
    left,
    top,
    size,
    delay,
    duration = "3s",
    animationClass = "star-breathe",
  }: StarProps) => {
    // Memoize style calculations
    const starStyle = useMemo(
      () => ({
        // Position using CSS variables for GPU acceleration
        "--star-left": left,
        "--star-top": top,
        "--star-size": size,
        "--star-delay": delay,
        "--star-duration": duration,
        position: "absolute" as const,
        width: size,
        height: size,
        backgroundColor: "white",
        borderRadius: "50%",
        animationDelay: delay,
        animationDuration: duration,
      }),
      [left, top, size, delay, duration]
    );

    return (
      <div
        key={id}
        className={`${animationClass} pointer-events-none`}
        style={starStyle}
      />
    );
  }
);

OptimizedStar.displayName = "OptimizedStar";

/**
 * Optimized Star List Component
 * Renders multiple stars efficiently
 */
interface OptimizedStarListProps {
  stars: StarProps[];
  containerClassName?: string;
}

export const OptimizedStarList = React.memo(
  ({
    stars,
    containerClassName = "absolute inset-0 pointer-events-none",
  }: OptimizedStarListProps) => {
    return (
      <div className={containerClassName}>
        {stars.map((star) => (
          <OptimizedStar key={star.id} {...star} />
        ))}
      </div>
    );
  }
);

OptimizedStarList.displayName = "OptimizedStarList";
