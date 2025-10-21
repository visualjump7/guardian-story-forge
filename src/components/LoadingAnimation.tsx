import { useEffect, useState } from "react";

const progressMessages = [
  // Story generation phase (0-30%)
  { phase: "story", message: "Building your story...", duration: 3000 },
  { phase: "story", message: "Weaving your tale...", duration: 3000 },
  { phase: "story", message: "Crafting your adventure...", duration: 3000 },
  
  // Image generation phase (30-90%)
  { phase: "images", message: "Painting the cover art...", duration: 8000 },
  { phase: "images", message: "Creating opening scenes...", duration: 8000 },
  { phase: "images", message: "Illustrating the adventure...", duration: 8000 },
  { phase: "images", message: "Drawing the climax...", duration: 8000 },
  { phase: "images", message: "Finishing touches...", duration: 8000 },
  
  // Final phase (90-100%)
  { phase: "final", message: "Adding sparkles and wonder...", duration: 3000 },
  { phase: "final", message: "Almost ready...", duration: 2000 },
];

interface LoadingAnimationProps {
  /** Optional: specific progress value (0-100) */
  progress?: number;
  /** Optional: override the cycling messages */
  customMessage?: string;
}

export const LoadingAnimation = ({ progress, customMessage }: LoadingAnimationProps = {}) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [estimatedProgress, setEstimatedProgress] = useState(0);

  useEffect(() => {
    // If custom message is provided, don't cycle
    if (customMessage) return;

    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const cycleMessage = () => {
      const currentMsg = progressMessages[currentIndex];
      setMessageIndex(currentIndex);
      
      currentIndex = (currentIndex + 1) % progressMessages.length;
      timeoutId = setTimeout(cycleMessage, currentMsg.duration);
    };

    cycleMessage();

    return () => clearTimeout(timeoutId);
  }, [customMessage]);

  useEffect(() => {
    // Simulate progress if not provided
    if (progress !== undefined) {
      setEstimatedProgress(progress);
      return;
    }

    // Auto-increment estimated progress
    const interval = setInterval(() => {
      setEstimatedProgress(prev => {
        if (prev >= 95) return prev; // Cap at 95% until actual completion
        return prev + 0.5; // Slow increment
      });
    }, 500);

    return () => clearInterval(interval);
  }, [progress]);

  const currentMessage = customMessage || progressMessages[messageIndex]?.message;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col items-center max-w-md px-6">
        {/* Pulsing glow rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full bg-gradient-to-r from-gradient-character-start/20 via-gradient-story-start/20 to-gradient-art-start/20 animate-pulse" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center animate-ping">
          <div className="w-48 h-48 rounded-full bg-gradient-to-r from-gradient-character-start/10 via-gradient-story-start/10 to-gradient-art-start/10" />
        </div>

        {/* Central book icon with sparkles */}
        <div className="relative z-10 mb-8">
          {/* Sparkle particles */}
          {Array.from({ length: 15 }).map((_, i) => {
            const angle = (i * 360) / 15;
            const radius = 80 + (i % 3) * 15;
            const size = 3 + (i % 3);
            const delay = i * 0.1;
            const duration = 3 + (i % 3) * 0.5;
            
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  left: "50%",
                  top: "50%",
                  animation: `orbit ${duration}s linear infinite`,
                  animationDelay: `${delay}s`,
                }}
              >
                <div
                  className="rounded-full animate-pulse"
                  style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    background: i % 3 === 0 
                      ? "hsl(var(--color-character-start))" 
                      : i % 3 === 1 
                      ? "hsl(var(--color-story-start))" 
                      : "hsl(var(--color-art-start))",
                    transform: `translate(-50%, -50%) translate(${Math.cos((angle * Math.PI) / 180) * radius}px, ${Math.sin((angle * Math.PI) / 180) * radius}px)`,
                    boxShadow: "0 0 10px currentColor",
                  }}
                />
              </div>
            );
          })}

          {/* Central book icon */}
          <div className="relative w-24 h-24 flex items-center justify-center animate-float">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-full h-full drop-shadow-glow"
              style={{ filter: "drop-shadow(0 0 20px hsl(var(--color-character-start) / 0.5))" }}
            >
              <path
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                stroke="url(#book-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-pulse"
              />
              <defs>
                <linearGradient id="book-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--color-character-start))" />
                  <stop offset="50%" stopColor="hsl(var(--color-story-start))" />
                  <stop offset="100%" stopColor="hsl(var(--color-art-start))" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Cycling text messages */}
        <div className="relative z-10 mb-4 h-10 flex items-center justify-center">
          <p
            key={messageIndex}
            className="text-xl font-chewy bg-gradient-to-r from-gradient-character-start via-gradient-story-start to-gradient-art-start bg-clip-text text-transparent animate-fade-in text-center"
          >
            {currentMessage}
          </p>
        </div>

        {/* Progress bar */}
        <div className="relative z-10 w-full max-w-xs">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gradient-character-start via-gradient-story-start to-gradient-art-start transition-all duration-500 ease-out"
              style={{ width: `${estimatedProgress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            {Math.round(estimatedProgress)}% complete
          </p>
        </div>
      </div>

      <style>{`
        @keyframes orbit {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};