import { Flame } from "lucide-react";
import { useEffect, useState } from "react";

export const LanternIcon = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className="relative w-16 h-16 flex items-center justify-center"
      style={{ transform: `rotate(${scrollY * 0.05}deg)` }}
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 blur-xl animate-pulse" />
      <Flame className="w-8 h-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]" />
    </div>
  );
};
