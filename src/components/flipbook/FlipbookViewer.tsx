import { useRef, useState, useEffect } from "react";
import HTMLFlipBook from "react-pageflip";
import { FlipbookPage as PageData } from "@/utils/pageGeneration";
import { FlipbookPage } from "./FlipbookPage";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlipbookViewerProps {
  pages: PageData[];
  onPageTurn?: (page: number) => void;
}

export const FlipbookViewer = ({ pages, onPageTurn }: FlipbookViewerProps) => {
  const bookRef = useRef<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(pages.length);

  useEffect(() => {
    setTotalPages(pages.length);
  }, [pages]);

  const handleFlip = (e: any) => {
    const newPage = e.data;
    setCurrentPage(newPage);
    onPageTurn?.(newPage);
  };

  const goToNextPage = () => {
    bookRef.current?.pageFlip()?.flipNext();
  };

  const goToPrevPage = () => {
    bookRef.current?.pageFlip()?.flipPrev();
  };

  return (
    <div className="relative flex flex-col items-center gap-8">
      {/* Flipbook Container */}
      <div className="relative perspective-[2000px] drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        <HTMLFlipBook
          ref={bookRef}
          width={400}
          height={400}
          size="stretch"
          minWidth={300}
          maxWidth={800}
          minHeight={300}
          maxHeight={800}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={true}
          startZIndex={0}
          autoSize={true}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={handleFlip}
          className="flipbook-demo"
          style={{}}
          startPage={0}
          clickEventForward={true}
          useMouseEvents={true}
          swipeDistance={30}
          showPageCorners={true}
          disableFlipByClick={false}
        >
          {pages.map((page, index) => (
            <FlipbookPage key={index} page={page} pageNumber={index + 1} />
          ))}
        </HTMLFlipBook>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-4">
        <Button
          onClick={goToPrevPage}
          disabled={currentPage === 0}
          variant="outline"
          size="icon"
          className="rounded-full bg-card/80 backdrop-blur-sm hover:bg-card"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="font-crimson text-sm text-[#3d2817] px-4 py-2 bg-warmth-200/50 rounded-full backdrop-blur-sm">
          Page {currentPage + 1} of {totalPages}
        </div>
        
        <Button
          onClick={goToNextPage}
          disabled={currentPage >= totalPages - 1}
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
