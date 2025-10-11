import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Sparkles, Library, PlusCircle, Wand2, Share2 } from "lucide-react";
import { toast } from "sonner";
import heroImage from "@/assets/swiss-chocolate-story.jpg";
import VimeoPlayer from "@/components/VimeoPlayer";
import { ShareDialog } from "@/components/ShareDialog";
import { AppHeader } from "@/components/AppHeader";
import { DesktopNav } from "@/components/DesktopNav";
import { useAuth } from "@/hooks/useAuth";
import { useLibraryCount } from "@/hooks/useLibraryCount";
import { LibraryLimitDialog } from "@/components/LibraryLimitDialog";

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
  const { isAdmin } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [storyToShare, setStoryToShare] = useState<Story | null>(null);
  const [showLibraryFullDialog, setShowLibraryFullDialog] = useState(false);
  const { count: libraryCount, isFull } = useLibraryCount(user?.id || null);

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

  const handleCreateStoryClick = () => {
    if (isFull) {
      setShowLibraryFullDialog(true);
    } else {
      navigate("/create/01");
    }
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
      <AppHeader 
        profile={profile}
        isAdmin={isAdmin}
        rightContent={
          <>
            <Button variant="outline" size="sm" onClick={handleCreateStoryClick} className="text-white border-white/30 hover:bg-white/10">
              <Wand2 className="w-4 h-4 mr-2" />
              Create A Story
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/library")} className="text-white border-white/30 hover:bg-white/10">
              <Library className="w-4 h-4 mr-2" />
              My Library
            </Button>
            <DesktopNav profile={profile} isAdmin={isAdmin} />
          </>
        }
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Video Hero Section */}
        <section className="w-full -mx-4 px-0">
          <VimeoPlayer 
            videoId="1126023861" 
            title="Welcome to Guardian Kids"
            autoplay={false}
            muted={false}
          />
        </section>

        {/* Create Story CTA */}
        <section 
          className="relative overflow-hidden rounded-3xl p-8 md:p-12 shadow-[var(--shadow-magical)] bg-black"
        >
          {/* Centered Content */}
          <div className="relative z-10 w-full flex flex-col items-center text-center gap-6 max-w-3xl mx-auto">
            {/* Title */}
            <h2 className="text-4xl md:text-5xl font-poppins font-bold text-amber-400">
              Create Your Own Magical Story
            </h2>
            
            {/* Description */}
            <p className="text-xl text-white/90 leading-relaxed">
              Step into a world where imagination takes the lead. ✨<br />
              Choose your hero, pick your adventure, and watch as we bring your Epic Story to life—crafted with cinematic wonder, heartfelt emotion, and the magic only you can inspire.
              <br /><br />
              🧙‍♀️ Your story begins here.<br />
              Are you ready to see where it leads?
            </p>
            
            {/* Button */}
            <Button
              variant="default"
              size="lg"
              onClick={handleCreateStoryClick}
              className="shadow-xl"
            >
              <PlusCircle className="w-6 h-6" />
              Start Creating!
            </Button>
          </div>
        </section>

        {/* Hero Image Section */}
        <section className="w-full rounded-3xl overflow-hidden shadow-[var(--shadow-magical)]">
          <img
            src={heroImage}
            alt="Magical story creation"
            className="w-full h-auto object-cover max-h-[500px]"
          />
        </section>

        {/* Featured Stories */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-poppins font-bold text-foreground flex items-center gap-3">
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
                  <h3 className="text-2xl md:text-3xl font-poppins font-bold text-amber-400 line-clamp-2 tracking-tight leading-tight">
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

      {/* Library Full Dialog */}
      <LibraryLimitDialog
        open={showLibraryFullDialog}
        onOpenChange={setShowLibraryFullDialog}
        currentCount={libraryCount}
        onGoToLibrary={() => navigate("/library")}
      />
    </div>
  );
};

export default Home;
