import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  BookmarkPlus, 
  BookmarkCheck, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  Volume2, 
  Loader2, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Star,
  Play,
  Pause,
  MoreVertical,
  Info,
  Palette,
  Library,
  Sparkles,
  Download
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShareDialog } from "@/components/ShareDialog";
import { AudioPlayer } from "@/components/AudioPlayer";
import { AppHeader } from "@/components/AppHeader";
import { ImagePromptDialog } from "@/components/ImagePromptDialog";
import { useAuth } from "@/hooks/useAuth";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  story_type: string | null;
  cover_image_url: string | null;
  audio_url: string | null;
  art_style: string | null;
  created_by: string | null;
  story_universe: string | null;
  story_themes: {
    name: string;
    emoji: string;
  } | null;
}

interface CreatorProfile {
  display_name: string;
  author_name: string | null;
}

const StoryView = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [storyImages, setStoryImages] = useState<StoryImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [isImagePromptDialogOpen, setIsImagePromptDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [imageToRegenerate, setImageToRegenerate] = useState<{ id: string; index: number } | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  useEffect(() => {
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUserId(session.user.id);

    // Load current user profile
    const { data: currentUserProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    setProfile(currentUserProfile);

    // Load story
    const { data: storyData, error } = await supabase
      .from("stories")
      .select(`
        *,
        story_themes!theme_id(name, emoji)
      `)
      .eq("id", storyId)
      .single();

    if (error || !storyData) {
      toast.error("Story not found");
      navigate("/home");
      return;
    }

    setStory(storyData);

    // Load creator profile if story has created_by
    if (storyData.created_by) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, author_name")
        .eq("id", storyData.created_by)
        .single();
      
      if (profileData) {
        setCreatorProfile(profileData);
      }
    }

    // Load story images
    const { data: imagesData, error: imagesError } = await supabase
      .from("story_images")
      .select("*")
      .eq("story_id", storyId)
      .order("created_at", { ascending: true });

    if (!imagesError && imagesData) {
      setStoryImages(imagesData);
      // Find the selected image index
      const selectedIndex = imagesData.findIndex(img => img.is_selected);
      if (selectedIndex !== -1) {
        setCurrentImageIndex(selectedIndex);
      }
    }

    // Check if saved
    const { data: savedData } = await supabase
      .from("user_libraries")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("story_id", storyId)
      .single();

    setIsSaved(!!savedData);
    setLoading(false);
  };

  const handleSaveToggle = async () => {
    if (!userId || !storyId) return;

    try {
      if (isSaved) {
        const { error } = await supabase
          .from("user_libraries")
          .delete()
          .eq("user_id", userId)
          .eq("story_id", storyId);

        if (error) throw error;
        setIsSaved(false);
        toast.success("Removed from library");
      } else {
        const { error } = await supabase
          .from("user_libraries")
          .insert({
            user_id: userId,
            story_id: storyId,
          });

        if (error) throw error;
        setIsSaved(true);
        toast.success("Saved to library!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update library");
    }
  };

  const handleShare = () => {
    setIsShareDialogOpen(true);
  };

  const handleOpenImageDialog = () => {
    if (storyImages.length >= 5) {
      toast.error("Maximum 5 images per story");
      return;
    }
    setIsImagePromptDialogOpen(true);
  };

  const handleGenerateImage = async (customizations?: string) => {
    if (!storyId || storyImages.length >= 5) {
      toast.error("Maximum 5 images per story");
      return;
    }

    setGeneratingImage(true);
    setIsImagePromptDialogOpen(false);
    toast.loading("Creating your illustration...", { id: "generate-image" });
    
    try {
      const { data, error } = await supabase.functions.invoke("generate-story-image", {
        body: { 
          storyId,
          customizations: customizations || undefined
        },
      });

      if (error) {
        // Handle specific error types with user-friendly messages
        if (error.message?.includes("credits")) {
          toast.error("Insufficient AI credits. Please add credits in Settings > Usage.", { id: "generate-image" });
        } else if (error.message?.includes("Rate limit")) {
          toast.error("Too many requests. Please wait a moment and try again.", { id: "generate-image" });
        } else {
          toast.error(error.message || "Failed to generate image", { id: "generate-image" });
        }
        return;
      }

      await loadStory();
      toast.success("New illustration generated!", { id: "generate-image" });
    } catch (error: any) {
      console.error("Image generation error:", error);
      toast.error("Failed to generate image. Please try again.", { id: "generate-image" });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleRecreateImage = async () => {
    if (!storyId || storyImages.length === 0) return;

    setGeneratingImage(true);
    toast.loading("Re-creating illustration...", { id: "recreate-image" });

    try {
      // Delete the current image first
      const currentImage = storyImages[currentImageIndex];
      await supabase
        .from("story_images")
        .delete()
        .eq("id", currentImage.id);

      // Generate a new image
      const { error } = await supabase.functions.invoke("generate-story-image", {
        body: { storyId },
      });

      if (error) throw error;

      await loadStory();
      toast.success("Illustration re-created!", { id: "recreate-image" });
    } catch (error: any) {
      toast.error(error.message || "Failed to re-create image", { id: "recreate-image" });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    setImageToDelete(imageId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteImage = async () => {
    if (!imageToDelete) return;

    try {
      const { error } = await supabase
        .from("story_images")
        .delete()
        .eq("id", imageToDelete);

      if (error) throw error;

      // Adjust current index if needed
      if (currentImageIndex >= storyImages.length - 1 && currentImageIndex > 0) {
        setCurrentImageIndex(currentImageIndex - 1);
      }

      await loadStory();
      toast.success("Image deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete image");
    } finally {
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  const handleSelectImage = async (imageId: string) => {
    try {
      // Unselect all images first
      await supabase
        .from("story_images")
        .update({ is_selected: false })
        .eq("story_id", storyId);

      // Select the chosen image
      const { error } = await supabase
        .from("story_images")
        .update({ is_selected: true })
        .eq("id", imageId);

      if (error) throw error;

      await loadStory();
      toast.success("Image selected as cover");
    } catch (error: any) {
      toast.error(error.message || "Failed to select image");
    }
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (direction === 'next' && currentImageIndex < storyImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const handleGenerateAudio = async () => {
    if (!storyId) return;

    setIsGeneratingAudio(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-story-audio", {
        body: { storyId },
      });

      if (error) throw error;

      // Reload story to get new audio
      await loadStory();
      toast.success("Audio narration generated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate audio");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleOpenRegenerateDialog = (imageId: string, index: number) => {
    setImageToRegenerate({ id: imageId, index });
    setRegenerateDialogOpen(true);
  };

  const confirmRegenerateImage = async () => {
    if (!imageToRegenerate) return;
    
    setRegenerateDialogOpen(false);
    
    // Navigate carousel to the image being regenerated
    setCurrentImageIndex(imageToRegenerate.index);
    
    // Trigger regeneration after state update
    setTimeout(() => {
      handleRecreateImage();
    }, 0);
    
    setImageToRegenerate(null);
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
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
      setIsDownloadingPdf(false);
    }
  };

  const renderStoryWithImages = () => {
    const paragraphs = story.content.split("\n\n");
    const totalParagraphs = paragraphs.length;
    
    // Calculate positions for all images (excluding the first cover image)
    // Images placed at: 25%, 50%, 75%, 95% of story
    const imagePositions = [
      { position: Math.floor(totalParagraphs * 0.25), index: 1, label: 'Early Scene' },
      { position: Math.floor(totalParagraphs * 0.50), index: 2, label: 'Mid Scene' },
      { position: Math.floor(totalParagraphs * 0.75), index: 3, label: 'Climax' },
      { position: Math.floor(totalParagraphs * 0.95), index: 4, label: 'Ending' },
    ];
    
    const content = paragraphs.map((paragraph, index) => (
      <div key={index}>
        <p className="text-lg leading-relaxed mb-4">
          {paragraph}
        </p>
        
        {/* Insert images at calculated positions */}
        {imagePositions.map(({ position, index: imageIndex, label }) => {
          if (storyImages.length > imageIndex && index === position) {
            return (
              <div key={imageIndex} className="my-8 rounded-lg overflow-hidden shadow-lg bg-muted/30">
                <img
                  src={storyImages[imageIndex].image_url}
                  alt={`${story.title} - ${label}`}
                  className="w-full max-h-[600px] object-contain"
                />
              </div>
            );
          }
          return null;
        })}
      </div>
    ));

    // Add "The End" at the end of the story
    content.push(
      <div key="the-end" className="mt-12 mb-8 text-center">
        <p className="text-2xl font-serif italic text-muted-foreground">
          ~ The End ~
        </p>
      </div>
    );

    // Add action buttons at the bottom
    content.push(
      <div key="bottom-actions" className="mt-8 mb-12 flex flex-col sm:flex-row items-center justify-center gap-4">
        {/* Download PDF Button */}
        <Button
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          size="lg"
          variant="default"
          className="w-full sm:w-auto min-w-[200px] gap-2 text-lg py-6"
        >
          {isDownloadingPdf ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Download PDF
            </>
          )}
        </Button>

        {/* Share Button */}
        <Button
          onClick={handleShare}
          size="lg"
          variant="outline"
          className="w-full sm:w-auto min-w-[200px] gap-2 text-lg py-6 border-2"
        >
          <Share2 className="h-5 w-5" />
          Share Story
        </Button>
      </div>
    );

    return content;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <p className="text-xl font-bold text-primary">Loading story...</p>
      </div>
    );
  }

  if (!story) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <AppHeader 
        profile={profile}
        isAdmin={isAdmin}
        rightContent={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate("/library")} className="text-white border-white/30 hover:bg-white/10">
              <Library className="w-4 h-4" />
              My Library
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare} className="text-white border-white/30 hover:bg-white/10">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button
              variant={isSaved ? "default" : "outline"}
              size="sm"
              onClick={handleSaveToggle}
              className={isSaved ? "" : "text-white border-white/30 hover:bg-white/10"}
            >
              {isSaved ? (
                <>
                  <BookmarkCheck className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-4 h-4" />
                  Save
                </>
              )}
            </Button>
          </>
        }
      />

      {/* Share Dialog */}
      <ShareDialog 
        open={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        storyId={storyId!}
        storyTitle={story.title}
        coverImageUrl={storyImages[0]?.image_url}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Image?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteImage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Create New Image?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a fresh illustration for this scene. The current image will be replaced with a new AI-generated version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRegenerateImage}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Create New Image
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <Card className="shadow-2xl border-2">
          <CardHeader className="space-y-4">
            {storyImages.length > 0 ? (
              <div className="space-y-4">
                {/* Image Carousel with Peek Effect */}
                <Carousel 
                  opts={{
                    align: "center",
                    loop: true,
                    containScroll: "trimSnaps",
                  }}
                  className="w-full relative"
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {storyImages.map((image, index) => (
                      <CarouselItem key={image.id} className="pl-2 md:pl-4 basis-[85%] md:basis-[90%]">
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center shadow-2xl border border-border/50 transition-all duration-300 hover:shadow-3xl hover:scale-[1.02] group">
                    <img
                      src={image.image_url}
                      alt={`${story.title} - Image ${index + 1}`}
                      className="h-full w-full object-contain"
                    />
                    
                    {/* Magical Regenerate Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRegenerateDialog(image.id, index);
                      }}
                      className="absolute top-3 right-3 h-10 w-10 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-primary-foreground/20 hover:bg-primary hover:scale-110 transition-all duration-200 z-20 group-hover:scale-110"
                      aria-label="Regenerate this image"
                    >
                      <Sparkles className="h-5 w-5 text-primary-foreground" />
                    </button>
                    
                    {storyImages.length > 1 && (
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {storyImages.map((_, dotIndex) => (
                          <div
                            key={dotIndex}
                            className={`h-2 rounded-full transition-all duration-300 ${
                              dotIndex === index 
                                ? 'w-8 bg-primary' 
                                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {storyImages.length > 1 && (
                    <>
                      <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold text-primary-foreground shadow-lg border border-primary-foreground/20 z-10">
                        {currentImageIndex + 1} / {storyImages.length}
                      </div>
                      <CarouselPrevious className="left-2 md:left-4 h-12 w-12 border-2 bg-background/95 hover:bg-background hover:scale-110 transition-all duration-200 shadow-xl" />
                      <CarouselNext className="right-2 md:right-4 h-12 w-12 border-2 bg-background/95 hover:bg-background hover:scale-110 transition-all duration-200 shadow-xl" />
                    </>
                  )}
                </Carousel>

                {/* Compact Control Bar with Dots */}
                {isMobile ? (
                  <Accordion type="single" collapsible defaultValue="illustrations" className="w-full">
                    <AccordionItem value="illustrations" className="border rounded-lg bg-muted/30">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <Palette className="h-4 w-4 text-primary" />
                          <span className="font-semibold">Illustrations</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 space-y-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleOpenImageDialog}
                          disabled={generatingImage || storyImages.length >= 5}
                          className="w-full gap-2"
                        >
                          {generatingImage ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Palette className="h-4 w-4" />
                              New Illustration
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRecreateImage}
                          disabled={generatingImage}
                          className="w-full gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Recreate Current
                        </Button>
                        <Button
                          variant={storyImages[currentImageIndex].is_selected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleSelectImage(storyImages[currentImageIndex].id)}
                          disabled={storyImages[currentImageIndex].is_selected}
                          className="w-full gap-2"
                        >
                          <Star className={`h-4 w-4 ${storyImages[currentImageIndex].is_selected ? 'fill-current' : ''}`} />
                          {storyImages[currentImageIndex].is_selected ? 'Cover Image' : 'Set as Cover'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteImage(storyImages[currentImageIndex].id)}
                          className="w-full gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Image
                        </Button>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <div className="flex items-center justify-between gap-3 px-4 py-2 bg-muted/30 rounded-lg border border-border/50">
                    {/* Left: Primary Actions */}
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={handleOpenImageDialog}
                              disabled={generatingImage || storyImages.length >= 5}
                              className="h-8 gap-1.5"
                            >
                              {generatingImage ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Palette className="h-3.5 w-3.5" />
                                  <span className="text-xs font-medium">Create New Illustration</span>
                                </>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Create custom illustrations for your story - up to 5 images total</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRecreateImage}
                        disabled={generatingImage}
                        className="h-8"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Center: Dots + Counter */}
                    <div className="flex items-center gap-3">
                      {storyImages.length > 1 && (
                        <div className="flex gap-1.5">
                          {storyImages.map((image, index) => (
                            <button
                              key={image.id}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`h-1.5 rounded-full transition-all ${
                                index === currentImageIndex 
                                  ? 'w-6 bg-primary' 
                                  : 'w-1.5 bg-muted-foreground/30'
                              }`}
                              aria-label={`Go to image ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}
                      <span className="text-xs font-medium text-muted-foreground">
                        {currentImageIndex + 1}/{storyImages.length}
                      </span>
                    </div>

                    {/* Right: Secondary Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant={storyImages[currentImageIndex].is_selected ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleSelectImage(storyImages[currentImageIndex].id)}
                        disabled={storyImages[currentImageIndex].is_selected}
                        className="h-8"
                        title="Set as cover"
                      >
                        <Star className={`h-3.5 w-3.5 ${storyImages[currentImageIndex].is_selected ? 'fill-current' : ''}`} />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleDeleteImage(storyImages[currentImageIndex].id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Image
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-6 py-12 px-4">
                <div className="text-8xl animate-pulse">
                  {story.story_themes?.emoji || "📖"}
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold">Bring Your Story to Life</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Create stunning illustrations to accompany your story. Add up to 5 custom images that will be beautifully woven throughout the narrative.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleOpenImageDialog}
                  disabled={generatingImage}
                  className="gap-2"
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Illustration...
                    </>
                  ) : (
                    <>
                      <Palette className="w-5 h-5" />
                      Create Your First Illustration
                    </>
                  )}
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  <span>Customize the prompt to match your vision</span>
                </div>
              </div>
            )}

            {/* Enhanced Audio Section */}
            {isMobile ? (
              <Accordion type="single" collapsible defaultValue="audio" className="w-full">
                <AccordionItem value="audio" className="border rounded-lg bg-muted/30">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Audio Narration</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 space-y-4">
                    {!story.audio_url ? (
                      /* Pre-Generation State - Mobile */
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            Bring your story to life with AI-powered narration.
                          </p>
                        </div>
                        
                        <Button
                          onClick={handleGenerateAudio}
                          disabled={isGeneratingAudio}
                          size="default"
                          className="w-full gap-2"
                        >
                          {isGeneratingAudio ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4" />
                              Generate Narration
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      /* Audio Player State - Mobile */
                      <AudioPlayer audioUrl={story.audio_url} title={story.title} />
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <div className="space-y-4">
                {!story.audio_url ? (
                  /* Pre-Generation State - Desktop */
                  <div className="p-8 rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-2 border-dashed border-primary/30 text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 rounded-full bg-primary/10">
                        <Volume2 className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Generate Audio Narration</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Bring your story to life with AI-powered narration.
                      </p>
                    </div>
                    
                    <Button
                      onClick={handleGenerateAudio}
                      disabled={isGeneratingAudio}
                      size="lg"
                      className="gap-2"
                    >
                      {isGeneratingAudio ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Generate Narration
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  /* Audio Player State - Desktop */
                  <AudioPlayer audioUrl={story.audio_url} title={story.title} />
                )}

                {/* Generation Progress - Desktop */}
                {isGeneratingAudio && (
                  <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 space-y-4 animate-fade-in">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <div className="absolute inset-0 blur-md bg-primary/30 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">Generating Your Audio Narration</h4>
                        <p className="text-sm text-muted-foreground">This may take a moment...</p>
                      </div>
                    </div>
                    
                    {/* Stage Indicators */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                          1
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Analyzing Story Content</p>
                          <p className="text-xs text-muted-foreground">Processing text and preparing for narration</p>
                        </div>
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/30 border border-border/30 opacity-60">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm">
                          2
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Generating Audio</p>
                          <p className="text-xs text-muted-foreground">Creating narration with selected voice</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/30 border border-border/30 opacity-40">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-sm">
                          3
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Finalizing</p>
                          <p className="text-xs text-muted-foreground">Converting and saving your audio file</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <CardTitle className="text-4xl font-bold text-center">
              {story.title}
            </CardTitle>
            {story.excerpt && (
              <p className="text-center text-muted-foreground text-lg italic max-w-2xl mx-auto">
                {story.excerpt}
              </p>
            )}
            {creatorProfile && (
              <p className="text-center text-muted-foreground text-sm">
                Story Created by {creatorProfile.author_name || creatorProfile.display_name}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center gap-3">
              {story.story_universe === 'guardian-ranch' && (
                <span className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-blue-500/20 border-2 border-green-500/30 text-foreground font-bold">
                  🐾 Guardian Ranch Universe
                </span>
              )}
              {story.hero_name && (
                <span className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium">
                  Hero: {story.hero_name}
                </span>
              )}
              {story.story_type && (
                <span className="px-4 py-2 rounded-full bg-secondary/10 text-secondary font-medium">
                  {story.story_type}
                </span>
              )}
              {story.story_themes && (
                <span className="px-4 py-2 rounded-full bg-accent/10 text-accent font-medium">
                  {story.story_themes.emoji} {story.story_themes.name}
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-[15%] sm:px-[12%] md:px-[15%]">
            {/* Story Content with Embedded Images */}
            <div className="prose prose-lg max-w-none">
              {renderStoryWithImages()}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Image Prompt Dialog */}
      {story && (
        <ImagePromptDialog
          open={isImagePromptDialogOpen}
          onOpenChange={setIsImagePromptDialogOpen}
          onGenerate={handleGenerateImage}
          storyTitle={story.title}
          heroName={story.hero_name || "the hero"}
          artStyle={story.art_style || "pixar-3d"}
          imageType={
            storyImages.length === 0 ? 'cover' :
            storyImages.length === 1 ? 'early-scene' :
            storyImages.length === 2 ? 'mid-scene' :
            storyImages.length === 3 ? 'climax' : 'ending'
          }
          storyExcerpt={story.content.split('\n\n').find((p: string) => p.trim()) || story.content.substring(0, 200)}
          imageCount={storyImages.length}
          isGenerating={generatingImage}
        />
      )}
    </div>
  );
};

export default StoryView;
