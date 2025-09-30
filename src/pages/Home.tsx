import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Sparkles, Library, LogOut, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import VimeoPlayer from "@/components/VimeoPlayer";

interface Story {
  id: string;
  title: string;
  content: string;
  hero_name: string | null;
  story_type: string | null;
  is_featured: boolean;
  cover_image_url: string | null;
  story_themes: {
    name: string;
    emoji: string;
  } | null;
}

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    
    // Get profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    setProfile(profileData);

    // Get featured stories
    const { data: storiesData, error } = await supabase
      .from("stories")
      .select(`
        *,
        story_themes!theme_id(name, emoji)
      `)
      .eq("is_featured", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load stories");
    } else {
      setStories(storiesData || []);
    }

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Goodbye! See you next time!");
    navigate("/");
  };

  const handleReadStory = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center space-y-4">
          <Sparkles className="w-16 h-16 text-primary animate-spin mx-auto" />
          <p className="text-xl font-bold text-primary">Loading magical stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Guardian Kids" className="w-12 h-12" />
            <div>
              <h1 className="text-2xl font-bold text-primary">Guardian Kids</h1>
              <p className="text-sm text-muted-foreground">
                Welcome back, {profile?.display_name || "Guardian"}!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/library")}>
              <Library className="w-4 h-4" />
              My Library
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Video Section */}
        <section className="space-y-4">
          <VimeoPlayer 
            videoId="1121252443" 
            title="Welcome to Guardian Kids"
            autoplay={false}
            muted={true}
          />
        </section>

        {/* Create Story CTA */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary-glow to-accent p-8 md:p-12 text-primary-foreground shadow-[var(--shadow-magical)]">
          <div className="relative z-10 max-w-2xl space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">
              Create Your Own Magical Story
            </h2>
            <p className="text-xl opacity-90">
              Choose your hero, pick an adventure, and let AI weave a tale with an important lesson!
            </p>
            <Button
              variant="warm"
              size="lg"
              onClick={() => navigate("/create")}
              className="shadow-xl"
            >
              <PlusCircle className="w-6 h-6" />
              Start Creating
            </Button>
          </div>
          <Sparkles className="absolute right-8 top-8 w-32 h-32 opacity-20 animate-pulse" />
        </section>

        {/* Featured Stories */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              Featured Stories
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Card
                key={story.id}
                className="hover:shadow-[var(--shadow-card)] transition-all hover:scale-105 cursor-pointer border-2 overflow-hidden"
                onClick={() => handleReadStory(story.id)}
              >
                <div className="h-40 bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center overflow-hidden">
                  {story.cover_image_url ? (
                    <img
                      src={story.cover_image_url}
                      alt={story.title}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-6xl">
                      {story.story_themes?.emoji || "📖"}
                    </span>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-xl line-clamp-2">{story.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    {story.story_themes?.name && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {story.story_themes.emoji} {story.story_themes.name}
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">
                    {story.content.substring(0, 150)}...
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
