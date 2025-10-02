import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Library
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
  const [story, setStory] = useState<Story | null>(null);
  const [storyImages, setStoryImages] = useState<StoryImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("alloy");
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [isImagePromptDialogOpen, setIsImagePromptDialogOpen] = useState(false);

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
      const { error } = await supabase.functions.invoke("generate-story-image", {
        body: { 
          storyId,
          customizations: customizations || undefined
        },
      });

      if (error) throw error;

      await loadStory();
      toast.success("New illustration generated!", { id: "generate-image" });
    } catch (error: any) {
      toast.error(error.message || "Failed to generate image", { id: "generate-image" });
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
        body: { storyId, voice: selectedVoice },
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
        rightContent={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate("/library")}>
              <Library className="w-4 h-4" />
              My Library
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button
              variant={isSaved ? "default" : "outline"}
              size="sm"
              onClick={handleSaveToggle}
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
                        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center shadow-2xl border border-border/50 transition-all duration-300 hover:shadow-3xl hover:scale-[1.02]">
                          <img
                            src={image.image_url}
                            alt={`${story.title} - Image ${index + 1}`}
                            className="h-full w-full object-contain"
                          />
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
            <div className="space-y-4">
              {!story.audio_url ? (
                /* Pre-Generation State */
                <div className="p-8 rounded-xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-2 border-dashed border-primary/30 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 rounded-full bg-primary/10">
                      <Volume2 className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Generate Audio Narration</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Bring your story to life with AI-powered narration. Choose a voice and let AI read your story aloud.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-3">
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                        <SelectItem value="echo">Echo (Deep)</SelectItem>
                        <SelectItem value="fable">Fable (Warm)</SelectItem>
                        <SelectItem value="onyx">Onyx (Rich)</SelectItem>
                        <SelectItem value="nova">Nova (Bright)</SelectItem>
                        <SelectItem value="shimmer">Shimmer (Soft)</SelectItem>
                      </SelectContent>
                    </Select>
                    
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
                </div>
              ) : (
                /* Audio Player State */
                <div className="space-y-3">
                  <AudioPlayer audioUrl={story.audio_url} title={story.title} />
                  
                  {/* Regenerate Option */}
                  <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4" />
                      <span>Want a different voice?</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alloy">Alloy</SelectItem>
                          <SelectItem value="echo">Echo</SelectItem>
                          <SelectItem value="fable">Fable</SelectItem>
                          <SelectItem value="onyx">Onyx</SelectItem>
                          <SelectItem value="nova">Nova</SelectItem>
                          <SelectItem value="shimmer">Shimmer</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateAudio}
                        disabled={isGeneratingAudio}
                        className="h-8"
                      >
                        {isGeneratingAudio ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          'Regenerate'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Multi-Stage Generation Progress */}
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
