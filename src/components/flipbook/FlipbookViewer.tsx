import { useState } from "react";
import { FlipbookPage as PageData } from "@/utils/pageGeneration";
import { FlipbookPage } from "./FlipbookPage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlipbookViewerProps {
  pages: PageData[];
  onPageTurn?: (page: number) => void;
  onRegenerateImage?: (pageIndex: number) => void;
  canEdit?: boolean;
}

export const FlipbookViewer = ({ pages, onPageTurn, onRegenerateImage, canEdit }: FlipbookViewerProps) => {
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
          
          {/* Single page container */}
          <div className={cn(
            "relative w-full h-full shadow-2xl rounded-lg overflow-hidden transition-all duration-600 ease-in-out",
            isFlipping && "animate-[pageFlip_0.6s_ease-in-out]"
          )}>
            <FlipbookPage 
              page={pages[currentPage]} 
              pageNumber={currentPage + 1}
              onRegenerateImage={() => onRegenerateImage?.(currentPage)}
              canEdit={canEdit}
            />
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
          className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white border-warmth-300"
        >
          <ChevronLeft className="w-5 h-5 text-[#3d2817]" />
        </Button>
        
        <div className="font-crimson text-sm text-primary px-4 py-2 bg-black/60 rounded-full backdrop-blur-sm border border-primary">
          Page {currentPage + 1} of {pages.length}
        </div>
        
        <Button
          onClick={goToNextPage}
          disabled={currentPage >= pages.length - 1 || isFlipping}
          variant="outline"
          size="icon"
          className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white border-warmth-300"
        >
          <ChevronRight className="w-5 h-5 text-[#3d2817]" />
        </Button>
      </div>
    </div>
  );
};
