import { forwardRef } from "react";
import { FlipbookPage as PageData } from "@/utils/pageGeneration";
import { cn } from "@/lib/utils";

interface FlipbookPageProps {
  page: PageData;
  pageNumber: number;
}

export const FlipbookPage = forwardRef<HTMLDivElement, FlipbookPageProps>(
  ({ page, pageNumber }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-full h-full bg-warmth-100 relative overflow-hidden",
          "shadow-[0_2px_10px_rgba(0,0,0,0.1),inset_0_0_20px_rgba(0,0,0,0.05)]"
        )}
      >
        {page.type === 'cover' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-12 bg-gradient-to-br from-primary/10 to-accent/10">
            {page.imageUrl && (
              <img
                src={page.imageUrl}
                alt="Cover"
                className="w-full h-2/3 object-cover rounded-xl mb-8 shadow-lg"
              />
            )}
            <h1 className="font-crimson font-bold text-4xl md:text-5xl text-center text-[#2c1810] mb-4 leading-tight">
              {page.title}
            </h1>
            {page.subtitle && (
              <p className="font-crimson text-xl text-[#5d3a22] text-center">
                {page.subtitle}
              </p>
            )}
          </div>
        )}

        {page.type === 'content' && (
          <div className="w-full h-full p-8 md:p-12 flex flex-col">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-clay-300 scrollbar-track-transparent">
              <p className="font-crimson text-lg md:text-xl leading-relaxed text-[#3d2817] whitespace-pre-wrap text-justify">
                {page.text}
              </p>
            </div>
            <div className="mt-4 text-center">
              <span className="font-crimson text-sm text-clay-300">{pageNumber}</span>
            </div>
          </div>
        )}

        {page.type === 'illustration' && (
          <div className="w-full h-full p-6 md:p-8 flex items-center justify-center bg-gradient-to-br from-warmth-200 to-warmth-100">
            {page.imageUrl && (
              <img
                src={page.imageUrl}
                alt="Illustration"
                className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
              />
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
