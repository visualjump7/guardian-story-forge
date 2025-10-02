import { useEffect, useState } from "react";

const messages = [
  "Weaving your tale...",
  "Painting magical scenes...",
  "Adding sparkles and wonder...",
  "Crafting your adventure...",
  "Almost ready...",
];

export const LoadingAnimation = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col items-center">
        {/* Pulsing glow rings */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 rounded-full bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 animate-pulse" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center animate-ping">
          <div className="w-48 h-48 rounded-full bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10" />
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
                      ? "hsl(var(--primary))" 
                      : i % 3 === 1 
                      ? "hsl(var(--accent))" 
                      : "hsl(var(--secondary))",
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
              style={{ filter: "drop-shadow(0 0 20px hsl(var(--primary) / 0.5))" }}
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
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="50%" stopColor="hsl(var(--accent))" />
                  <stop offset="100%" stopColor="hsl(var(--secondary))" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Cycling text messages */}
        <div className="relative z-10 h-8 flex items-center justify-center">
          <p
            key={messageIndex}
            className="text-xl font-poppins font-semibold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent animate-fade-in"
          >
            {messages[messageIndex]}
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
