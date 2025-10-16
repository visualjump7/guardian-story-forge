import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, BookOpen, Download, Share2, ArrowLeft } from "lucide-react";
import { CinematicBackground } from "@/components/cinematic/CinematicBackground";
import { LanternIcon } from "@/components/cinematic/LanternIcon";
import { ActionButton } from "@/components/cinematic/ActionButton";
import { FlipbookViewer } from "@/components/flipbook/FlipbookViewer";
import { FlatPageSlider } from "@/components/flipbook/FlatPageSlider";
import { generateFlipbookPages, FlipbookPage } from "@/utils/pageGeneration";
import { useIsMobile } from "@/hooks/use-mobile";
import { ShareDialog } from "@/components/ShareDialog";
import { Button } from "@/components/ui/button";

interface StoryImage {
  id: string;
  image_url: string;
  is_selected: boolean;
  created_at: string;
}

interface Story {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  hero_name: string | null;
  cover_image_url: string | null;
  audio_url: string | null;
  created_by: string | null;
}

const FlipbookStoryView = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [story, setStory] = useState<Story | null>(null);
  const [pages, setPages] = useState<FlipbookPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [creatorName, setCreatorName] = useState("Unknown Author");

  useEffect(() => {
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Load story
    const { data: storyData, error } = await supabase
      .from("stories")
      .select("*")
      .eq("id", storyId)
      .single();

    if (error || !storyData) {
      toast.error("Story not found");
      navigate("/home");
      return;
    }

    setStory(storyData);

    // Load creator profile
    if (storyData.created_by) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, author_name")
        .eq("id", storyData.created_by)
        .single();
      
      if (profileData) {
        setCreatorName(profileData.author_name || profileData.display_name);
      }
    }

    // Load story images
    const { data: imagesData } = await supabase
      .from("story_images")
      .select("*")
      .eq("story_id", storyId)
      .order("created_at", { ascending: true });

    const storyImages = imagesData || [];

    // Generate flipbook pages
    const flipbookPages = generateFlipbookPages(storyData, storyImages, creatorName);
    setPages(flipbookPages);
    setLoading(false);
  };

  const handleDownloadPdf = async () => {
    if (!story) return;
    
    setIsDownloadingPdf(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("generate-story-pdf", {
        body: { storyId: story.id },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (response.error) throw response.error;

      const { html, title } = response.data;
      
      // Create a blob and download
      const blob = new Blob([html], { type: "text/html" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Story downloaded! Open the HTML file to print as PDF.");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download story");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CinematicBackground />
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!story || pages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CinematicBackground />
        <p className="text-xl font-crimson text-[#3d2817]">Story not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <CinematicBackground />
      
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          onClick={() => navigate(`/story/${storyId}`)}
          variant="outline"
          size="icon"
          className="rounded-full bg-card/80 backdrop-blur-sm hover:bg-card"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {!showBook ? (
          // Initial Landing View
          <div className="max-w-4xl mx-auto text-center space-y-12 animate-[fadeInUp_0.8s_ease-out]">
            {/* Header with Lantern */}
            <div className="flex flex-col items-center gap-6">
              <LanternIcon />
              <div>
                <h1 className="font-crimson font-bold text-4xl md:text-6xl text-[#2c1810] mb-4 leading-tight">
                  {story.title}
                </h1>
                <p className="font-crimson text-xl md:text-2xl text-[#5d3a22]">
                  By {creatorName}
                </p>
              </div>
            </div>

            {/* Cover Image Preview */}
            {story.cover_image_url && (
              <div className="max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <img
                  src={story.cover_image_url}
                  alt={story.title}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4 animate-[fadeInUp_1s_ease-out_0.6s_both]">
              <ActionButton
                icon={BookOpen}
                onClick={() => setShowBook(true)}
              >
                Read Story
              </ActionButton>
              
              <ActionButton
                icon={Download}
                onClick={handleDownloadPdf}
                loading={isDownloadingPdf}
                variant="secondary"
              >
                Download PDF
              </ActionButton>
              
              <ActionButton
                icon={Share2}
                onClick={() => setIsShareDialogOpen(true)}
                variant="secondary"
              >
                Share
              </ActionButton>
            </div>
          </div>
        ) : (
          // Flipbook View
          <div className="space-y-8 animate-[fadeInUp_1s_ease-out_0.3s_both]">
            <div className="text-center">
              <h2 className="font-crimson font-bold text-3xl md:text-4xl text-[#2c1810] mb-2">
                {story.title}
              </h2>
              <p className="font-crimson text-lg text-[#5d3a22]">
                By {creatorName}
              </p>
            </div>

            {isMobile ? (
              <FlatPageSlider pages={pages} />
            ) : (
              <FlipbookViewer pages={pages} />
            )}

            {/* Action Buttons Below Book */}
            <div className="flex flex-wrap justify-center gap-4 pt-8">
              <ActionButton
                icon={Download}
                onClick={handleDownloadPdf}
                loading={isDownloadingPdf}
                variant="secondary"
              >
                Download PDF
              </ActionButton>
              
              <ActionButton
                icon={Share2}
                onClick={() => setIsShareDialogOpen(true)}
                variant="secondary"
              >
                Share
              </ActionButton>
            </div>
          </div>
        )}
      </div>

      <ShareDialog
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        storyId={story.id}
        storyTitle={story.title}
        coverImageUrl={story.cover_image_url || undefined}
      />
    </div>
  );
};

export default FlipbookStoryView;
