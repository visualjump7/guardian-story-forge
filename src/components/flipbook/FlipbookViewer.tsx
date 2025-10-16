import { useState } from "react";
import { FlipbookPage as PageData } from "@/utils/pageGeneration";
import { FlipbookPage } from "./FlipbookPage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlipbookViewerProps {
  pages: PageData[];
  onPageTurn?: (page: number) => void;
}

export const FlipbookViewer = ({ pages, onPageTurn }: FlipbookViewerProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const goToNextPage = () => {
    if (currentPage < pages.length - 1 && !isFlipping) {
      setIsFlipping(true);
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageTurn?.(newPage);
      setTimeout(() => setIsFlipping(false), 600);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0 && !isFlipping) {
      setIsFlipping(true);
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageTurn?.(newPage);
      setTimeout(() => setIsFlipping(false), 600);
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-8">
      {/* Flipbook Container with 3D effect */}
      <div className="relative w-full max-w-4xl mx-auto" style={{ perspective: "2000px" }}>
        <div className="relative w-full aspect-square max-w-3xl mx-auto">
          {/* Book shadow */}
          <div className="absolute inset-0 bg-black/20 blur-xl translate-y-8 rounded-lg" />
          
          {/* Book spread container */}
          <div className="relative w-full h-full flex shadow-2xl rounded-lg overflow-hidden">
            {/* Left page */}
            <div className={cn(
              "w-1/2 h-full transition-all duration-600 ease-in-out origin-right",
              isFlipping && "animate-[pageFlipLeft_0.6s_ease-in-out]"
            )}>
              {currentPage > 0 && (
                <FlipbookPage page={pages[currentPage - 1]} pageNumber={currentPage} />
              )}
            </div>
            
            {/* Center spine shadow */}
            <div className="w-1 bg-gradient-to-r from-black/30 via-black/10 to-transparent" />
            
            {/* Right page */}
            <div className={cn(
              "w-1/2 h-full transition-all duration-600 ease-in-out origin-left",
              isFlipping && "animate-[pageFlipRight_0.6s_ease-in-out]"
            )}>
              <FlipbookPage page={pages[currentPage]} pageNumber={currentPage + 1} />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-4">
        <Button
          onClick={goToPrevPage}
          disabled={currentPage === 0 || isFlipping}
          variant="outline"
          size="icon"
          className="rounded-full bg-card/80 backdrop-blur-sm hover:bg-card"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="font-crimson text-sm text-[#3d2817] px-4 py-2 bg-warmth-200/50 rounded-full backdrop-blur-sm">
          Page {currentPage + 1} of {pages.length}
        </div>
        
        <Button
          onClick={goToNextPage}
          disabled={currentPage >= pages.length - 1 || isFlipping}
          variant="outline"
          size="icon"
          className="rounded-full bg-card/80 backdrop-blur-sm hover:bg-card"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};
