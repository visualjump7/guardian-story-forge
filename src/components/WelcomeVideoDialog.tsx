import { useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WelcomeVideoDialog = ({ open, onOpenChange }: WelcomeVideoDialogProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!open || !iframeRef.current) return;

    // Load Vimeo Player API
    const script = document.createElement('script');
    script.src = 'https://player.vimeo.com/api/player.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore - Vimeo Player API
      const player = new window.Vimeo.Player(iframeRef.current);
      
      // Listen for the 'ended' event
      player.on('ended', () => {
        onOpenChange(false);
      });
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden bg-black border-2 border-primary/30">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-black/80 text-white rounded-full"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Video Container */}
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <iframe
            ref={iframeRef}
            src="https://player.vimeo.com/video/1126561409?badge=0&autopause=0&player_id=0&app_id=58479"
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            title="Welcome to Guardian Kids"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
