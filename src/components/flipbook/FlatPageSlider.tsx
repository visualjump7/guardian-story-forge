import { useState } from "react";
import { FlipbookPage as PageData } from "@/utils/pageGeneration";
import { FlipbookPage } from "./FlipbookPage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlatPageSliderProps {
  pages: PageData[];
  onPageChange?: (page: number) => void;
  onRegenerateImage?: (pageIndex: number) => void;
  canEdit?: boolean;
}

export const FlatPageSlider = ({ pages, onPageChange, onRegenerateImage, canEdit }: FlatPageSliderProps) => {
  const [currentPage, setCurrentPage] = useState(0);

  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
      {/* Page Container */}
      <div className="relative w-full aspect-square overflow-hidden rounded-lg shadow-2xl">
        <div
          className="flex transition-transform duration-500 ease-out h-full"
          style={{ transform: `translateX(-${currentPage * 100}%)` }}
        >
          {pages.map((page, index) => (
            <div key={index} className="min-w-full h-full">
              <FlipbookPage 
                page={page} 
                pageNumber={index + 1}
                onRegenerateImage={() => onRegenerateImage?.(index)}
                canEdit={canEdit}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-4">
        <Button
          onClick={goToPrevPage}
          disabled={currentPage === 0}
          variant="outline"
          size="icon"
          className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white border-warmth-300"
        >
          <ChevronLeft className="w-5 h-5 text-[#3d2817]" />
        </Button>
        
        <div className="font-crimson text-sm text-[#3d2817] px-4 py-2 bg-warmth-50/90 rounded-full backdrop-blur-sm border border-warmth-300">
          Page {currentPage + 1} of {pages.length}
        </div>
        
        <Button
          onClick={goToNextPage}
          disabled={currentPage >= pages.length - 1}
          variant="outline"
          size="icon"
          className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white border-warmth-300"
        >
          <ChevronRight className="w-5 h-5 text-[#3d2817]" />
        </Button>
      </div>

      {/* Page Dots Indicator */}
      <div className="flex gap-2">
        {pages.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentPage(index);
              onPageChange?.(index);
            }}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              index === currentPage 
                ? "bg-primary w-8" 
                : "bg-clay-300 hover:bg-clay-200"
            )}
            aria-label={`Go to page ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
