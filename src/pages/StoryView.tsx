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
  ArrowLeft, 
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
  Star 
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShareDialog } from "@/components/ShareDialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  hero_name: string | null;
  story_type: string | null;
  cover_image_url: string | null;
  audio_url: string | null;
  art_style: string | null;
  story_themes: {
    name: string;
    emoji: string;
  } | null;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

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

  const handleGenerateImage = async () => {
    if (!storyId || storyImages.length >= 3) {
      toast.error("Maximum 3 images per story");
      return;
    }

    setGeneratingImage(true);
    toast.loading("Creating your illustration...", { id: "generate-image" });
    
    try {
      const { error } = await supabase.functions.invoke("generate-story-image", {
        body: { storyId },
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

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const renderStoryWithImages = () => {
    const paragraphs = story.content.split("\n\n");
    const totalParagraphs = paragraphs.length;
    
    // Calculate positions for images (excluding the first cover image)
    const middlePosition = Math.floor(totalParagraphs * 0.5);
    const endPosition = Math.floor(totalParagraphs * 0.85);
    
    return paragraphs.map((paragraph, index) => (
      <div key={index}>
        <p className="text-lg leading-relaxed mb-4">
          {paragraph}
        </p>
        
        {/* Insert second image (scene) in the middle */}
        {storyImages.length >= 2 && index === middlePosition && (
          <div className="my-8 rounded-lg overflow-hidden shadow-lg">
            <img
              src={storyImages[1].image_url}
              alt={`${story.title} - Scene`}
              className="w-full aspect-video object-cover"
            />
          </div>
        )}
        
        {/* Insert third image (ending) near the end */}
        {storyImages.length >= 3 && index === endPosition && (
          <div className="my-8 rounded-lg overflow-hidden shadow-lg">
            <img
              src={storyImages[2].image_url}
              alt={`${story.title} - Ending`}
              className="w-full aspect-video object-cover"
            />
          </div>
        )}
      </div>
    ));
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
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/home")}>
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </header>

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

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="shadow-2xl border-2">
          <CardHeader className="space-y-4">
            {storyImages.length > 0 ? (
              <div className="space-y-4">
                {/* Image Carousel */}
                <Carousel className="w-full" opts={{ loop: true }}>
                  <CarouselContent>
                    {storyImages.map((image, index) => (
                      <CarouselItem key={image.id}>
                        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                          <img
                            src={image.image_url}
                            alt={`${story.title} - Image ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {storyImages.length > 1 && (
                    <>
                      <CarouselPrevious className="left-2" />
                      <CarouselNext className="right-2" />
                    </>
                  )}
                </Carousel>

                {/* Dot indicators */}
                {storyImages.length > 1 && (
                  <div className="flex justify-center gap-2 py-2">
                    {storyImages.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentImageIndex 
                            ? 'w-8 bg-primary' 
                            : 'w-2 bg-muted-foreground/30'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Controls underneath image - single bar */}
                <div className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg">
                  {/* Re-create button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecreateImage}
                    disabled={generatingImage}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-create
                  </Button>

                  {/* Center: Image counter and star for cover */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {currentImageIndex + 1}/{storyImages.length}
                    </span>
                    <Button
                      variant={storyImages[currentImageIndex].is_selected ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleSelectImage(storyImages[currentImageIndex].id)}
                      disabled={storyImages[currentImageIndex].is_selected}
                      title="Set as cover image"
                    >
                      <Star className={`h-4 w-4 ${storyImages[currentImageIndex].is_selected ? 'fill-current' : ''}`} />
                    </Button>
                  </div>

                  {/* Add image button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateImage}
                    disabled={generatingImage || storyImages.length >= 3}
                  >
                    {generatingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add ({storyImages.length}/3)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <div className="text-7xl">
                  {story.story_themes?.emoji || "📖"}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateImage}
                  disabled={generatingImage}
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Illustration
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Audio Player Section */}
            {story.audio_url ? (
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/10">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={togglePlayPause}
                    size="lg"
                    className="rounded-full w-16 h-16"
                  >
                    {isPlaying ? (
                      <span className="text-2xl">⏸️</span>
                    ) : (
                      <Volume2 className="w-8 h-8" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">Audio Narration</p>
                    <audio
                      ref={audioRef}
                      src={story.audio_url}
                      onEnded={() => setIsPlaying(false)}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      className="w-full"
                      controls
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger className="w-32">
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
                    >
                      {isGeneratingAudio ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        "🎙️ Regenerate"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-dashed border-primary/20 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="text-5xl">🎙️</div>
                  <p className="text-muted-foreground">No audio narration yet</p>
                  <div className="flex items-center gap-2">
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alloy">Alloy (Neutral)</SelectItem>
                        <SelectItem value="echo">Echo (Male)</SelectItem>
                        <SelectItem value="fable">Fable (British)</SelectItem>
                        <SelectItem value="onyx">Onyx (Deep)</SelectItem>
                        <SelectItem value="nova">Nova (Female)</SelectItem>
                        <SelectItem value="shimmer">Shimmer (Soft)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleGenerateAudio}
                      disabled={isGeneratingAudio}
                    >
                      {isGeneratingAudio ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating Audio...
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 mr-2" />
                          Generate Audio Narration
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <CardTitle className="text-4xl font-bold text-center">
              {story.title}
            </CardTitle>
            <div className="flex flex-wrap items-center justify-center gap-3">
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
          <CardContent>
            {/* Story Content with Embedded Images */}
            <div className="prose prose-lg max-w-none">
              {renderStoryWithImages()}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StoryView;
