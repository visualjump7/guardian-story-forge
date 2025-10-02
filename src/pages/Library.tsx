import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Trash2, Share2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";
import { AppHeader } from "@/components/AppHeader";
import { cn } from "@/lib/utils";
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
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [storyToRemove, setStoryToRemove] = useState<SavedStory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [storyToShare, setStoryToShare] = useState<SavedStory | null>(null);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

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
      toast.success("Removed from library");
      setSavedStories(savedStories.filter((s) => s.id !== storyToRemove.id));
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <p className="text-xl font-bold text-primary">Loading your library...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <AppHeader 
        title="My Library"
        rightContent={
          <Button
            onClick={() => navigate("/create")}
            variant="magical"
            size="sm"
            className="gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Create New Story
          </Button>
        }
      />

      <main className="container mx-auto px-4 py-12">
        {savedStories.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <BookOpen className="w-24 h-24 text-muted-foreground mx-auto" />
            <h2 className="text-3xl font-bold text-foreground">Your library is empty</h2>
            <p className="text-xl text-muted-foreground">
              Start creating magical stories!
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="magical" size="lg" onClick={() => navigate("/create")} className="gap-2">
                <PlusCircle className="w-5 h-5" />
                Create Your First Story
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/home")}>
                Explore Stories
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">
              Your Saved Stories ({savedStories.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedStories.map((saved) => (
                <Card
                  key={saved.id}
                  variant="storybook"
                  className="group cursor-pointer"
                  onClick={() => navigate(`/story/${saved.stories.id}`)}
                >
                  <div
                    className={cn(
                      "h-48 flex items-center justify-center overflow-hidden relative",
                      getThemeGradient(saved.stories.story_themes?.name)
                    )}
                  >
                    {saved.stories.cover_image_url ? (
                      <img
                        src={saved.stories.cover_image_url}
                        alt={saved.stories.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-7xl group-hover:scale-110 transition-transform duration-300">
                        {saved.stories.story_themes?.emoji || "📖"}
                      </span>
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors font-serif">
                      {saved.stories.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-3">
                      {saved.stories.story_themes?.name && (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border",
                            getThemeBadgeStyle(saved.stories.story_themes.name)
                          )}
                        >
                          {saved.stories.story_themes.emoji}{" "}
                          {saved.stories.story_themes.name}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative pb-6">
                    <p className="text-muted-foreground line-clamp-3 mb-4 italic text-sm leading-relaxed">
                      {saved.stories.content.substring(0, 120)}...
                    </p>
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="magical"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/story/${saved.stories.id}`);
                        }}
                        className="w-full gap-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        View Story
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(saved);
                          }}
                          className="flex-1"
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStoryToRemove(saved);
                            setDialogOpen(true);
                          }}
                          className="flex-1"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
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
