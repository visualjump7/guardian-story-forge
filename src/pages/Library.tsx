import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Trash2, PlusCircle, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { DesktopNav } from "@/components/DesktopNav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { FixedFeedbackButton } from "@/components/FixedFeedbackButton";
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

interface SavedStory {
  id: string;
  title: string;
  hero_name: string;
  created_at: string;
  is_complete: boolean;
  current_part: number;
}

const Library = () => {
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storyToRemove, setStoryToRemove] = useState<SavedStory | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setIsLoading(true);
    try {
      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      setProfile(profileData);

      // Load stories
      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSavedStories(data || []);
    } catch (error: any) {
      toast.error("Failed to load library");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    try {
      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", storyId);

      if (error) throw error;

      const newStories = savedStories.filter((s) => s.id !== storyId);
      setSavedStories(newStories);
      toast.success(`Story deleted`);
    } catch (error: any) {
      toast.error("Failed to delete story");
      console.error(error);
    }

    setDialogOpen(false);
    setStoryToRemove(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="text-center space-y-4">
          <Sparkles className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-xl font-chewy text-primary">Loading your library...</p>
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
              <h2 className="text-3xl md:text-4xl font-chewy text-primary">
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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b-2 border-primary/20">
              <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-chewy text-primary">
                  Your Stories
                </h2>
                <p className="text-lg text-muted-foreground">
                  Your personal collection of adventures
                </p>
              </div>
              
              {/* Story Counter Badge */}
              <div className="flex items-center gap-3">
                <div className="relative px-6 py-4 rounded-2xl shadow-lg bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/30">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-primary" />
                    <div className="text-center">
                      <div className="text-3xl font-bold font-chewy text-primary">
                        {savedStories.length}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                        Stories
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedStories.map((item) => (
                <Card
                  key={item.id}
                  className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg"
                  onClick={() => navigate(`/interactive-story/${item.id}`)}
                >
                  <div className="aspect-video overflow-hidden bg-muted flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Hero: {item.hero_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Part {item.current_part} of 3 {item.is_complete && "• Complete"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStoryToRemove(item);
                          setDialogOpen(true);
                        }}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Story?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{storyToRemove?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStoryToRemove(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => storyToRemove && handleDelete(storyToRemove.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <FixedFeedbackButton />
    </div>
  );
};

export default Library;
