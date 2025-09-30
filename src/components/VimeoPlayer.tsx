import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface VimeoPlayerProps {
  videoId: string;
  title?: string;
  autoplay?: boolean;
  muted?: boolean;
}

const VimeoPlayer = ({ 
  videoId, 
  title = "Featured Video",
  autoplay = false,
  muted = true 
}: VimeoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);

  const vimeoUrl = `https://player.vimeo.com/video/${videoId}?autoplay=${autoplay ? 1 : 0}&muted=${muted ? 1 : 0}&title=0&byline=0&portrait=0`;

  return (
    <Card className="overflow-hidden border-2 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-magical)] transition-all">
      <CardContent className="p-0">
        <div className="relative w-full aspect-video bg-gradient-to-br from-primary/5 to-secondary/5">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-muted-foreground">Loading video...</p>
              </div>
            </div>
          )}
          <iframe
            src={vimeoUrl}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={title}
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default VimeoPlayer;
