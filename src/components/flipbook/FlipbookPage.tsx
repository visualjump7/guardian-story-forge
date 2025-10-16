import { forwardRef } from "react";
import { FlipbookPage as PageData } from "@/utils/pageGeneration";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface FlipbookPageProps {
  page: PageData;
  pageNumber: number;
  onRegenerateImage?: () => void;
  canEdit?: boolean;
}

export const FlipbookPage = forwardRef<HTMLDivElement, FlipbookPageProps>(
  ({ page, pageNumber, onRegenerateImage, canEdit }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full h-full bg-warmth-100 relative overflow-hidden",
          "shadow-[0_2px_10px_rgba(0,0,0,0.1),inset_0_0_20px_rgba(0,0,0,0.05)]"
        )}
      >
        {page.type === 'cover' && (
          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-warmth-200 to-warmth-100">
            {page.imageUrl && (
              <img
                src={page.imageUrl}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            )}
            {canEdit && onRegenerateImage && page.imageUrl && (
              <Button
                onClick={onRegenerateImage}
                size="icon"
                variant="outline"
                className="absolute top-4 right-4 bg-white/90 hover:bg-white transition-opacity border-warmth-300"
                aria-label="Regenerate cover image"
              >
                <RefreshCw className="w-4 h-4 text-[#3d2817]" />
              </Button>
            )}
          </div>
        )}

        {page.type === 'content' && (
          <div className="w-full h-full p-8 md:p-12 flex flex-col justify-between">
            <div className="flex-1 flex items-start overflow-hidden">
              <p className="font-crimson text-lg md:text-xl leading-relaxed text-[#3d2817] whitespace-pre-wrap text-justify">
                {page.text}
              </p>
            </div>
            <div className="mt-4 text-center flex-shrink-0">
              <span className="font-crimson text-sm text-clay-300">{pageNumber}</span>
            </div>
          </div>
        )}

        {page.type === 'illustration' && (
          <div className="relative w-full h-full p-6 md:p-8 flex items-center justify-center bg-gradient-to-br from-warmth-200 to-warmth-100">
            {page.imageUrl && (
              <img
                src={page.imageUrl}
                alt="Illustration"
                className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
              />
            )}
            {canEdit && onRegenerateImage && page.imageUrl && (
              <Button
                onClick={onRegenerateImage}
                size="icon"
                variant="outline"
                className="absolute top-4 right-4 bg-white/90 hover:bg-white transition-opacity border-warmth-300"
                aria-label="Regenerate illustration"
              >
                <RefreshCw className="w-4 h-4 text-[#3d2817]" />
              </Button>
            )}
          </div>
        )}

        {page.type === 'end' && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent/10 to-primary/10">
            <h2 className="font-crimson font-bold text-5xl md:text-6xl text-[#2c1810]">
              {page.text}
            </h2>
          </div>
        )}
      </div>
    );
  }
);

FlipbookPage.displayName = "FlipbookPage";
