import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Trash2, Share2, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { ShareDialog } from "@/components/ShareDialog";
import { AppHeader } from "@/components/AppHeader";
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedStories.map((saved) => (
                <Card
                  key={saved.id}
                  className="hover:shadow-[var(--shadow-card)] transition-all hover:scale-105 border-2 overflow-hidden"
                >
                  <div
                    className="h-40 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center cursor-pointer overflow-hidden"
                    onClick={() => navigate(`/story/${saved.stories.id}`)}
                  >
                    {saved.stories.cover_image_url ? (
                      <img
                        src={saved.stories.cover_image_url}
                        alt={saved.stories.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-6xl">
                        {saved.stories.story_themes?.emoji || "📖"}
                      </span>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle
                      className="text-xl line-clamp-2 cursor-pointer hover:text-primary"
                      onClick={() => navigate(`/story/${saved.stories.id}`)}
                    >
                      {saved.stories.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      {saved.stories.story_themes?.name && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {saved.stories.story_themes.emoji}{" "}
                          {saved.stories.story_themes.name}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2 mb-4">
                      {saved.stories.content.substring(0, 100)}...
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleShare(saved)}
                        className="flex-1 gap-2"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </Button>
                      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setStoryToRemove(saved)}
                            className="flex-1 gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Story from Library?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove "{saved.stories.title}" from your library? This action cannot be undone.
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
    </div>
  );
};

export default Library;
