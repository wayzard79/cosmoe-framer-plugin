import React, { useState, useEffect } from "react";
import "./LoadingAnimation.css";

interface LoadingAnimationProps {
  onAnimationComplete?: () => void;
  duration?: number; // Duration in milliseconds
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  onAnimationComplete,
  duration = 3000, // Default 3 seconds
}) => {
  const [animationEnded, setAnimationEnded] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out a bit before the end to make transition smoother
    const fadeOutTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 500);

    // Complete animation after duration
    const animationTimer = setTimeout(() => {
      setAnimationEnded(true);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, duration);

    // Cleanup timers
    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(animationTimer);
    };
  }, [duration, onAnimationComplete]);

  if (animationEnded) {
    return null;
  }

  return (
    <div className={`loading-animation-container ${fadeOut ? "fade-out" : ""}`}>
      <div className="animation-wrapper">
        {/* Use an image for GIF */}
        <img 
          src="assets/Cosmoe Logo Animation Loader.gif" 
          alt="Loading animation" 
          className="animation-content"
        />
        
        {/* Uncomment for MP4 video version instead of GIF */}
        {/*
        <video 
          autoPlay 
          muted 
          playsInline 
          className="animation-content"
          onEnded={() => setFadeOut(true)}
        >
          <source src="path-to-your-animation.mp4" type="video/mp4" />
        </video>
        */}
        
        <div className="loading-text">Loading your components...</div>
      </div>
    </div>
  );
};