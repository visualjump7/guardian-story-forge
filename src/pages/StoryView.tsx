import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BookmarkPlus, BookmarkCheck, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Story {
  id: string;
  title: string;
  content: string;
  hero_name: string | null;
  story_type: string | null;
  story_themes: {
    name: string;
    emoji: string;
  } | null;
}

const StoryView = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

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
        story_themes(name, emoji)
      `)
      .eq("id", storyId)
      .single();

    if (error || !storyData) {
      toast.error("Story not found");
      navigate("/home");
      return;
    }

    setStory(storyData);

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
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: story?.title,
        text: `Check out this story: ${story?.title}`,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
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

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <Card className="shadow-2xl border-2">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="text-7xl">
                {story.story_themes?.emoji || "📖"}
              </div>
            </div>
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
            <div className="prose prose-lg max-w-none">
              {story.content.split("\n\n").map((paragraph, index) => (
                <p key={index} className="text-lg leading-relaxed mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default StoryView;
