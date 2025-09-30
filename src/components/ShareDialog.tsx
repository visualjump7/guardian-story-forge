import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share2, Link as LinkIcon, Download, Facebook, Twitter } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: string;
  storyTitle: string;
  coverImageUrl?: string;
}

export const ShareDialog = ({ open, onOpenChange, storyId, storyTitle, coverImageUrl }: ShareDialogProps) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const shareUrl = `${window.location.origin}/story/${storyId}`;
  const shareText = `Check out this amazing story: "${storyTitle}"`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in to download PDF");
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-story-pdf', {
        body: { storyId }
      });

      if (error) throw error;

      // Create a simple PDF download using the HTML
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Story downloaded! Open the HTML file in your browser and use Print to PDF");
    } catch (error: any) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  };

  const handleShareInstagram = () => {
    // Instagram doesn't have a direct share URL, so we copy the link and notify
    handleCopyLink();
    toast.info("Link copied! Open Instagram and paste it in your story or post");
  };

  const handleShareTikTok = () => {
    // TikTok doesn't have a direct share URL, so we copy the link and notify
    handleCopyLink();
    toast.info("Link copied! Open TikTok and paste it in your video description");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Story
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Copy Link */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Share Link</h4>
            <Button 
              onClick={handleCopyLink}
              variant="outline" 
              className="w-full justify-start"
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Copy Link
            </Button>
          </div>

          {/* Download PDF */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Download</h4>
            <Button 
              onClick={handleDownloadPdf}
              variant="outline" 
              className="w-full justify-start"
              disabled={isGeneratingPdf}
            >
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingPdf ? "Generating..." : "Download as PDF"}
            </Button>
          </div>

          {/* Social Media */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Share on Social Media</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={handleShareFacebook}
                variant="outline" 
                className="justify-start"
              >
                <Facebook className="h-4 w-4 mr-2" />
                Facebook
              </Button>
              <Button 
                onClick={handleShareTwitter}
                variant="outline" 
                className="justify-start"
              >
                <Twitter className="h-4 w-4 mr-2" />
                X (Twitter)
              </Button>
              <Button 
                onClick={handleShareInstagram}
                variant="outline" 
                className="justify-start"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram
              </Button>
              <Button 
                onClick={handleShareTikTok}
                variant="outline" 
                className="justify-start"
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                TikTok
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};