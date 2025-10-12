import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Trash2, Share2, PlusCircle, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";
import { AppHeader } from "@/components/AppHeader";
import { DesktopNav } from "@/components/DesktopNav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SavedStory {
  id: string;
  saved_at: string;
  stories: {
    id: string;
    title: string;
    content: string;
    hero_name: string | null;
    story_type: string | null;
    cover_image_url: string | null;
    story_themes: {
      name: string;
      emoji: string;
    } | null;
  };
}

const getThemeGradient = (themeName?: string) => {
  if (!themeName) return "bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20";
  
  const theme = themeName.toLowerCase();
  const gradientMap: Record<string, string> = {
    adventure: "bg-gradient-to-br from-[hsl(var(--story-adventure))] to-[hsl(var(--story-adventure-light))]",
    fantasy: "bg-gradient-to-br from-[hsl(var(--story-fantasy))] to-[hsl(var(--story-fantasy-light))]",
    friendship: "bg-gradient-to-br from-[hsl(var(--story-friendship))] to-[hsl(var(--story-friendship-light))]",
    magic: "bg-gradient-to-br from-[hsl(var(--story-magic))] to-[hsl(var(--story-magic-light))]",
    nature: "bg-gradient-to-br from-[hsl(var(--story-nature))] to-[hsl(var(--story-nature-light))]",
  };
  
  // Check if theme contains any of the keywords
  for (const [key, gradient] of Object.entries(gradientMap)) {
    if (theme.includes(key)) return gradient;
  }
  
  return "bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20";
};

const getThemeBadgeStyle = (themeName?: string) => {
  if (!themeName) return "bg-primary/20 text-primary border-primary/30";
  
  const theme = themeName.toLowerCase();
  const styleMap: Record<string, string> = {
    adventure: "bg-[hsl(var(--story-adventure))]/20 text-[hsl(var(--story-adventure-light))] border-[hsl(var(--story-adventure))]",
    fantasy: "bg-[hsl(var(--story-fantasy))]/20 text-[hsl(var(--story-fantasy-light))] border-[hsl(var(--story-fantasy))]",
    friendship: "bg-[hsl(var(--story-friendship))]/20 text-[hsl(var(--story-friendship-light))] border-[hsl(var(--story-friendship))]",
    magic: "bg-[hsl(var(--story-magic))]/20 text-[hsl(var(--story-magic-light))] border-[hsl(var(--story-magic))]",
    nature: "bg-[hsl(var(--story-nature))]/20 text-[hsl(var(--story-nature-light))] border-[hsl(var(--story-nature))]",
  };
  
  // Check if theme contains any of the keywords
  for (const [key, style] of Object.entries(styleMap)) {
    if (theme.includes(key)) return style;
  }
  
  return "bg-primary/20 text-primary border-primary/30";
};

const Library = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [storyToRemove, setStoryToRemove] = useState<SavedStory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [storyToShare, setStoryToShare] = useState<SavedStory | null>(null);
  const [isLibraryAlertDismissed, setIsLibraryAlertDismissed] = useState(false);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Load profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    setProfile(profileData);

    const { data, error } = await supabase
      .from("user_libraries")
      .select(`
        id,
        saved_at,
        stories(
          id,
          title,
          content,
          hero_name,
          story_type,
          cover_image_url,
          story_themes!theme_id(name, emoji)
        )
      `)
      .eq("user_id", session.user.id)
      .order("saved_at", { ascending: false });

    if (error) {
      toast.error("Failed to load library");
    } else {
      setSavedStories(data || []);
      // Reset alert dismissed state if user deletes stories (library no longer full)
      if (data && data.length < 10) {
        setIsLibraryAlertDismissed(false);
      }
    }

    setLoading(false);
  };

  const handleRemove = async () => {
    if (!storyToRemove) return;

    const { error } = await supabase
      .from("user_libraries")
      .delete()
      .eq("id", storyToRemove.id);

    if (error) {
      toast.error("Failed to remove story");
    } else {
      const newStories = savedStories.filter((s) => s.id !== storyToRemove.id);
      setSavedStories(newStories);
      toast.success(`Removed from library (${newStories.length}/10 stories)`);
      // Reset alert dismissed state if we just went below 10 stories
      if (newStories.length < 10) {
        setIsLibraryAlertDismissed(false);
      }
    }

    setDialogOpen(false);
    setStoryToRemove(null);
  };

  const handleShare = (story: SavedStory) => {
    setStoryToShare(story);
    setShareDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="text-center space-y-4">
          <Sparkles className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-xl font-poppins font-bold text-primary">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <AppHeader 
        profile={profile}
        isAdmin={isAdmin}
        rightContent={
          <>
            <Button
              onClick={() => navigate("/create/01")}
              variant="magical"
              size="sm"
              className="gap-2 hidden md:flex"
            >
              <PlusCircle className="w-4 h-4" />
              Create New Story
            </Button>
            <DesktopNav profile={profile} isAdmin={isAdmin} />
          </>
        }
      />

      <main className="container max-w-6xl mx-auto px-4 py-8 md:py-12">
        {savedStories.length === 0 ? (
          <div className="text-center py-20 space-y-6 max-w-2xl mx-auto">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-poppins font-bold text-primary">
                Your Library is Empty
              </h2>
              <p className="text-lg text-muted-foreground">
                Start creating magical stories and they'll appear here!
              </p>
            </div>
            <div className="flex gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/create/01")} 
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <PlusCircle className="w-5 h-5" />
                Create Your First Story
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => navigate("/home")}
                className="gap-2"
              >
                Explore Stories
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Header with Counter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-primary/20">
              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-poppins font-bold text-primary">
                  Your Saved Stories
                </h2>
                <p className="text-lg text-muted-foreground">
                  Your personal collection of magical tales
                </p>
              </div>
              
              {/* Story Counter Badge */}
              <div className="flex items-center gap-3">
                <div className={cn(
                  "relative px-6 py-4 rounded-2xl shadow-lg",
                  savedStories.length >= 10 
                    ? "bg-gradient-to-br from-red-500/20 to-orange-500/20 border-2 border-red-500/50" 
                    : "bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/30"
                )}>
                  <div className="flex items-center gap-3">
                    <BookOpen className={cn(
                      "h-6 w-6",
                      savedStories.length >= 10 ? "text-red-600" : "text-primary"
                    )} />
                    <div className="text-center">
                      <div className={cn(
                        "text-3xl font-bold font-poppins",
                        savedStories.length >= 10 ? "text-red-600" : "text-primary"
                      )}>
                        {savedStories.length}/10
                      </div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Stories
                      </div>
                    </div>
                  </div>
                  
                  {/* Full Library Warning */}
                  {savedStories.length >= 10 && (
                    <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
                      FULL
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Full Library Alert Message */}
            {savedStories.length >= 10 && !isLibraryAlertDismissed && (
              <div className="bg-amber-500/10 border-2 border-amber-500/50 rounded-xl p-4 flex items-start gap-3 relative">
                <div className="bg-amber-500 rounded-full p-2 mt-0.5">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                    Library Full
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    You've reached the maximum of 10 stories. Delete a story to create new ones.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full hover:bg-amber-500/20"
                  onClick={() => setIsLibraryAlertDismissed(true)}
                >
                  <X className="h-4 w-4 text-amber-700 dark:text-amber-300" />
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedStories.map((saved) => (
                <Card
                  key={saved.id}
                  variant="storybook"
                  className="group relative overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/story/${saved.stories.id}`)}
                >
                  {/* Hero Image Section */}
                  <div className="relative h-56 md:h-64 overflow-hidden">
                    {saved.stories.cover_image_url ? (
                      <img
                        src={saved.stories.cover_image_url}
                        alt={saved.stories.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-full h-full flex items-center justify-center",
                          getThemeGradient(saved.stories.story_themes?.name)
                        )}
                      >
                        <span className="text-8xl group-hover:scale-110 transition-transform duration-300">
                          {saved.stories.story_themes?.emoji || "📖"}
                        </span>
                      </div>
                    )}

                    {/* Action Buttons Overlay - Top Right */}
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-black/80"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(saved);
                        }}
                      >
                        <Share2 className="h-4 w-4 text-white" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-black/60 backdrop-blur-sm border border-white/20 hover:bg-red-600/90"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStoryToRemove(saved);
                          setDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </Button>
                    </div>
                  </div>

                  {/* Dark Text Section */}
                  <div className="relative bg-gradient-to-t from-black/95 via-black/90 to-transparent p-6 space-y-3">
                    <h3 className="text-2xl md:text-3xl font-poppins font-bold text-amber-400 line-clamp-2 tracking-tight leading-tight">
                      {saved.stories.title}
                    </h3>
                    
                    <p className="text-white/90 text-sm md:text-base line-clamp-2 leading-relaxed">
                      {saved.stories.content.substring(0, 120)}...
                    </p>
                    
                    <Button
                      variant="outline"
                      className="w-full mt-4 rounded-full border-white/40 bg-transparent text-white hover:bg-white hover:text-black transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/story/${saved.stories.id}`);
                      }}
                    >
                      <BookOpen className="mr-2 h-4 w-4" />
                      Continue Reading
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
      
      {storyToShare && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          storyId={storyToShare.stories.id}
          storyTitle={storyToShare.stories.title}
          coverImageUrl={storyToShare.stories.cover_image_url}
        />
      )}

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Story from Library?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{storyToRemove?.stories.title}" from your library? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStoryToRemove(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Library;
