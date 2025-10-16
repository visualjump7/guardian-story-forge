import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, BookOpen, Download, Share2, ArrowLeft, Pencil } from "lucide-react";
import { CinematicBackground } from "@/components/cinematic/CinematicBackground";
import { LanternIcon } from "@/components/cinematic/LanternIcon";
import { ActionButton } from "@/components/cinematic/ActionButton";
import { FlipbookViewer } from "@/components/flipbook/FlipbookViewer";
import { FlatPageSlider } from "@/components/flipbook/FlatPageSlider";
import { generateFlipbookPages, FlipbookPage } from "@/utils/pageGeneration";
import { useIsMobile } from "@/hooks/use-mobile";
import { sanitizeContent } from "@/utils/contentFilter";
import { ShareDialog } from "@/components/ShareDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const [canEdit, setCanEdit] = useState(false);
  
  // Edit story state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    hero_name: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Regenerate image state
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [pageToRegenerate, setPageToRegenerate] = useState<number | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

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
    setCanEdit(session.user.id === storyData.created_by);

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

  const handleSaveStoryEdit = async () => {
    if (!story) return;
    
    setIsSaving(true);
    try {
      // Sanitize all text fields
      const titleResult = sanitizeContent(editFormData.title);
      const contentResult = sanitizeContent(editFormData.content);
      const heroNameResult = sanitizeContent(editFormData.hero_name);
      
      // Combine replaced words from all fields
      const allReplacedWords = [
        ...titleResult.replacedWords,
        ...contentResult.replacedWords,
        ...heroNameResult.replacedWords
      ];
      
      // Check if any content was modified
      const wasModified = titleResult.wasModified || 
                          contentResult.wasModified || 
                          heroNameResult.wasModified;
      
      // Update form with sanitized content
      const sanitizedFormData = {
        title: titleResult.sanitizedContent,
        content: contentResult.sanitizedContent,
        hero_name: heroNameResult.sanitizedContent
      };
      
      // Update the form state so user sees the changes
      setEditFormData(sanitizedFormData);
      
      // Notify user if content was filtered
      if (wasModified) {
        toast.info(
          `Some words were replaced with *** to keep the story kid-friendly. ${allReplacedWords.length} word(s) filtered.`,
          { duration: 5000 }
        );
      }
      
      const { error } = await supabase
        .from('stories')
        .update(sanitizedFormData)
        .eq('id', story.id);

      if (error) throw error;

      toast.success('Story updated!');
      setIsEditDialogOpen(false);
      loadStory();
    } catch (error: any) {
      console.error('Error saving story:', error);
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (pageToRegenerate === null || !story) return;
    
    const page = pages[pageToRegenerate];
    if (!page.imageUrl) return;

    setIsRegenerating(true);
    toast.loading('Regenerating illustration...', { id: 'regen' });

    try {
      const { data: imageData } = await supabase
        .from('story_images')
        .select('id')
        .eq('story_id', story.id)
        .eq('image_url', page.imageUrl)
        .single();

      if (!imageData) throw new Error('Image not found');

      await supabase
        .from('story_images')
        .delete()
        .eq('id', imageData.id);

      const { error } = await supabase.functions.invoke('generate-story-image', {
        body: { storyId: story.id }
      });

      if (error) throw error;

      toast.success('Illustration regenerated!', { id: 'regen' });
      loadStory();
    } catch (error: any) {
      console.error('Error regenerating image:', error);
      toast.error(error.message || 'Failed to regenerate', { id: 'regen' });
    } finally {
      setIsRegenerating(false);
      setIsRegenerateDialogOpen(false);
      setPageToRegenerate(null);
    }
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
      <CinematicBackground backgroundImage={story?.cover_image_url} />
      
      {/* Back Button */}
      <div className="absolute top-4 left-4 z-10">
        <Button
          onClick={() => navigate(`/story/${storyId}`)}
          variant="outline"
          size="icon"
          className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white border-warmth-300"
        >
          <ArrowLeft className="w-5 h-5 text-[#3d2817]" />
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
              
              {canEdit && (
                <ActionButton
                  icon={Pencil}
                  onClick={() => {
                    setEditFormData({
                      title: story.title,
                      content: story.content,
                      hero_name: story.hero_name || ''
                    });
                    setIsEditDialogOpen(true);
                  }}
                  variant="dark"
                >
                  Edit Story
                </ActionButton>
              )}
              
              <ActionButton
                icon={Download}
                onClick={handleDownloadPdf}
                loading={isDownloadingPdf}
                variant="dark"
              >
                Download PDF
              </ActionButton>
              
              <ActionButton
                icon={Share2}
                onClick={() => setIsShareDialogOpen(true)}
                variant="dark"
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
              <FlatPageSlider 
                pages={pages}
                onRegenerateImage={(pageIndex) => {
                  setPageToRegenerate(pageIndex);
                  setIsRegenerateDialogOpen(true);
                }}
                canEdit={canEdit}
              />
            ) : (
              <FlipbookViewer 
                pages={pages}
                onRegenerateImage={(pageIndex) => {
                  setPageToRegenerate(pageIndex);
                  setIsRegenerateDialogOpen(true);
                }}
                canEdit={canEdit}
              />
            )}

            {/* Action Buttons Below Book */}
            <div className="flex flex-wrap justify-center gap-4 pt-8">
              {canEdit && (
                <ActionButton
                  icon={Pencil}
                  onClick={() => {
                    setEditFormData({
                      title: story.title,
                      content: story.content,
                      hero_name: story.hero_name || ''
                    });
                    setIsEditDialogOpen(true);
                  }}
                  variant="dark"
                >
                  Edit Story
                </ActionButton>
              )}
              
              <ActionButton
                icon={Download}
                onClick={handleDownloadPdf}
                loading={isDownloadingPdf}
                variant="dark"
              >
                Download PDF
              </ActionButton>
              
              <ActionButton
                icon={Share2}
                onClick={() => setIsShareDialogOpen(true)}
                variant="dark"
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

      {/* Edit Story Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-crimson text-2xl">Edit Story</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Story title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hero_name">Hero Name</Label>
              <Input
                id="hero_name"
                value={editFormData.hero_name}
                onChange={(e) => setEditFormData({ ...editFormData, hero_name: e.target.value })}
                placeholder="Hero's name (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Story Content</Label>
              <Textarea
                id="content"
                value={editFormData.content}
                onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                placeholder="Story content"
                className="min-h-[300px] font-crimson"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveStoryEdit}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Image Dialog */}
      <AlertDialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-crimson">Regenerate Illustration?</AlertDialogTitle>
            <AlertDialogDescription>
              Generate a new illustration for this scene? The current image will be replaced.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRegenerating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRegenerateImage}
              disabled={isRegenerating}
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                'Regenerate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FlipbookStoryView;
