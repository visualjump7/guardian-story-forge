import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Share2, 
  Loader2, 
  Palette,
  Library,
  Sparkles,
  Download,
  BookOpen,
  Pencil
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
import { AppHeader } from "@/components/AppHeader";
import { ImagePromptDialog } from "@/components/ImagePromptDialog";
import { useAuth } from "@/hooks/useAuth";
import { FixedFeedbackButton } from "@/components/FixedFeedbackButton";

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
  const [isSaved, setIsSaved] = useState(false);
  const [isGeneratingAdditionalImages, setIsGeneratingAdditionalImages] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [isImagePromptDialogOpen, setIsImagePromptDialogOpen] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [imageToRegenerate, setImageToRegenerate] = useState<{ id: string; index: number } | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [generationMode, setGenerationMode] = useState<'express' | 'studio'>('express');

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
    if (storyImages.length >= 3) {
      toast.error("Maximum 3 images per story");
      return;
    }
    setIsImagePromptDialogOpen(true);
  };

  const handleGenerateImage = async (customizations?: string) => {
    if (!storyId || storyImages.length >= 3) {
      toast.error("Maximum 3 images per story");
      return;
    }

    setGeneratingImage(true);
    setIsImagePromptDialogOpen(false);
    toast.loading("Creating your illustration...", { id: "generate-image" });
    
    try {
      const imageFunction = generationMode === 'studio' 
        ? 'generate-story-image-leonardo' 
        : 'generate-story-image';
      
      const { data, error } = await supabase.functions.invoke(imageFunction, {
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

  const handleGenerateAdditionalImages = async () => {
    if (!storyId) return;
    
    setIsGeneratingAdditionalImages(true);
    toast.loading("Building new images...", { id: "additional-images" });
    
    try {
      // Generate 2 more images: mid-scene and ending
      const imagesToCreate = 2;
      
      for (let i = 0; i < imagesToCreate; i++) {
        const { data, error } = await supabase.functions.invoke('generate-story-image', {
          body: { storyId }
        });

        if (error) {
          console.error(`Failed to generate image ${i + 1}:`, error);
          toast.error(`Failed to create image ${i + 1} of ${imagesToCreate}`, { id: "additional-images" });
          continue;
        }

        console.log(`Successfully generated image ${i + 1} of ${imagesToCreate}`);
        
        // Small delay between generations to avoid rate limits
        if (i < imagesToCreate - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Reload story to show new images
      await loadStory();
      
      toast.success("Additional images created!", { id: "additional-images" });
      
    } catch (error: any) {
      console.error("Error generating additional images:", error);
      toast.error("Failed to create additional images", { id: "additional-images" });
    } finally {
      setIsGeneratingAdditionalImages(false);
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

      await loadStory();
      toast.success("Image deleted");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete image");
    } finally {
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };



  const handleOpenRegenerateDialog = (imageId: string, index: number) => {
    setImageToRegenerate({ id: imageId, index });
    setRegenerateDialogOpen(true);
  };

  const confirmRegenerateImage = async () => {
    if (!imageToRegenerate || !storyId) return;

    setGeneratingImage(true);
    setRegenerateDialogOpen(false);
    toast.loading("Regenerating illustration...", { id: "regenerate-image" });

    try {
      // Delete the current image
      await supabase
        .from("story_images")
        .delete()
        .eq("id", imageToRegenerate.id);

      // Generate a new image
      const { error } = await supabase.functions.invoke("generate-story-image", {
        body: { storyId },
      });

      if (error) throw error;

      await loadStory();
      toast.success("Illustration regenerated!", { id: "regenerate-image" });
    } catch (error: any) {
      toast.error(error.message || "Failed to regenerate image", { id: "regenerate-image" });
    } finally {
      setGeneratingImage(false);
    }
    
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
          {paragraph.replace(/\*\*(.*?)\*\*/g, '$1')}
        </p>
        
        {/* Insert images at calculated positions */}
            {imagePositions.map(({ position, index: imageIndex, label }) => {
              if (storyImages.length > imageIndex && index === position) {
                return (
                  <div key={imageIndex} className="my-8 rounded-lg overflow-hidden shadow-lg bg-muted/30 relative">
                    <img
                      src={storyImages[imageIndex].image_url}
                      alt={`${story.title} - ${label}`}
                      className="w-full max-h-[600px] object-contain"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRegenerateDialog(storyImages[imageIndex].id, imageIndex);
                      }}
                      className="absolute top-3 right-3 h-10 w-10 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-primary-foreground/20 hover:bg-primary hover:scale-110 transition-all duration-200 z-20"
                      aria-label={`Regenerate ${label} image`}
                    >
                      <Sparkles className="h-5 w-5 text-primary-foreground" />
                    </button>
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
            {story.created_by === userId && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate(`/admin/stories/${storyId}/edit`)} 
                className="text-white border-white/30 hover:bg-white/10 gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit Story
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate(`/story/${storyId}/flipbook`)} className="text-white border-white/30 hover:bg-white/10 gap-2">
              <BookOpen className="w-4 h-4" />
              Flipbook View
            </Button>
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
                {/* Single Hero Image - No Carousel */}
                <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center shadow-2xl border border-border/50">
                  <div className="relative w-full aspect-video overflow-hidden">
                    <img
                      src={storyImages[0].image_url}
                      alt={`${story.title} - Hero Image`}
                      className="h-full w-full object-cover"
                    />
                    
                    {/* Regenerate Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenRegenerateDialog(storyImages[0].id, 0);
                      }}
                      className="absolute top-3 right-3 h-10 w-10 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-lg border-2 border-primary-foreground/20 hover:bg-primary hover:scale-110 transition-all duration-200 z-20"
                      aria-label="Regenerate hero image"
                    >
                      <Sparkles className="h-5 w-5 text-primary-foreground" />
                    </button>
                  </div>
                </div>

                {/* Edit your Story Button */}
                {storyImages.length < 3 && (
                  <div className="flex justify-center">
                    <Button
                      onClick={() => navigate(`/admin/stories/${storyId}/edit`)}
                      size="lg"
                      variant="default"
                      className="gap-2 min-w-[280px]"
                    >
                      <Pencil className="h-5 w-5" />
                      Edit your Story
                    </Button>
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
                    Create a hero image for your story to bring it to life visually.
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
                      Create Hero Image
                    </>
                  )}
                </Button>
              </div>
            )}

            <CardTitle className="text-4xl font-bold text-center mt-8">
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
          generationMode={generationMode}
          onGenerationModeChange={setGenerationMode}
        />
      )}
      <FixedFeedbackButton />
    </div>
  );
};

export default StoryView;
