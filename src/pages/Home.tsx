import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Sparkles, Library, User, PlusCircle, Wand2, Share2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import heroImage from "@/assets/swiss-chocolate-story.jpg";
import VimeoPlayer from "@/components/VimeoPlayer";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNav } from "@/components/MobileNav";
import { ShareDialog } from "@/components/ShareDialog";
import { useAuth } from "@/hooks/useAuth";

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
  const isMobile = useIsMobile();
  const { isAdmin } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [storyToShare, setStoryToShare] = useState<Story | null>(null);

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

  const handleReadStory = (storyId: string) => {
    navigate(`/story/${storyId}`);
  };

  const handleShare = (e: React.MouseEvent, story: Story) => {
    e.stopPropagation();
    setStoryToShare(story);
    setShareDialogOpen(true);
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
            {!isMobile && (
              <div>
                <h1 className="text-2xl font-bold text-primary">Guardian Kids</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome back, {profile?.display_name || "Guardian"}!
                </p>
              </div>
            )}
          </div>

          {isMobile ? (
            <div className="flex items-center gap-2">
              <Button
                variant="default"
                size="icon"
                onClick={() => navigate("/create")}
                className="rounded-full shadow-lg"
              >
                <Wand2 className="w-5 h-5" />
              </Button>
              <MobileNav profile={profile} isAdmin={isAdmin} />
            </div>
          ) : (
            <nav className="flex items-center gap-2">
              <Button variant="default" size="sm" onClick={() => navigate("/create")}>
                <Wand2 className="w-4 h-4 mr-2" />
                Create A Story
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/library")}>
                <Library className="w-4 h-4 mr-2" />
                My Library
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                <User className="w-5 h-5" />
              </Button>
            </nav>
          )}
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
        <section 
          className="relative overflow-hidden rounded-3xl p-8 md:p-12 shadow-[var(--shadow-magical)] min-h-[400px] flex items-end"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
          
          {/* Content */}
          <div className="relative z-10 w-full flex flex-col md:flex-row items-end justify-between gap-6">
            {/* Text Content - Left Side */}
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-bold text-amber-400">
                Create Your Own Magical Story
              </h2>
              <p className="text-xl text-white/90">
                Choose your hero, pick an adventure, and let AI weave a tale with an important lesson!
              </p>
            </div>
            
            {/* Button - Right Side */}
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/create")}
              className="shadow-xl whitespace-nowrap border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              <PlusCircle className="w-6 h-6" />
              Start Creating!
            </Button>
          </div>
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
                className="group relative overflow-hidden cursor-pointer hover:shadow-[var(--shadow-card)] transition-all hover:scale-[1.02] border-2"
                onClick={() => handleReadStory(story.id)}
              >
                {/* Hero Image Section */}
                <div className="relative h-56 md:h-64 overflow-hidden">
                  {story.cover_image_url ? (
                    <img
                      src={story.cover_image_url}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 via-accent/30 to-secondary/30 flex items-center justify-center">
                      <span className="text-8xl group-hover:scale-110 transition-transform duration-300">
                        {story.story_themes?.emoji || "📖"}
                      </span>
                    </div>
                  )}
                  
                  {/* Share Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleShare(e, story)}
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>

                {/* Dark Text Section */}
                <div className="relative bg-gradient-to-t from-black/95 via-black/90 to-transparent p-6 space-y-3">
                  <h3 className="text-2xl md:text-3xl font-bold text-amber-400 line-clamp-2 tracking-tight leading-tight">
                    {story.title}
                  </h3>
                  
                  <p className="text-white/90 text-sm md:text-base line-clamp-2 leading-relaxed">
                    {story.content.substring(0, 120)}...
                  </p>
                  
                  <Button
                    variant="outline"
                    className="w-full mt-4 rounded-full border-white/40 bg-transparent text-white hover:bg-white hover:text-black transition-all"
                    onClick={() => handleReadStory(story.id)}
                  >
                    Begin This Adventure
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Share Dialog */}
      {storyToShare && (
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          storyId={storyToShare.id}
          storyTitle={storyToShare.title}
        />
      )}
    </div>
  );
};

export default Home;
