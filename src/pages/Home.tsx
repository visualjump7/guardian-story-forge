import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Sparkles, Library, PlusCircle, Wand2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { ShareDialog } from "@/components/ShareDialog";
import { AppHeader } from "@/components/AppHeader";
import { DesktopNav } from "@/components/DesktopNav";
import { useAuth } from "@/hooks/useAuth";
import { useLibraryCount } from "@/hooks/useLibraryCount";
import { LibraryLimitDialog } from "@/components/LibraryLimitDialog";
import { FixedFeedbackButton } from "@/components/FixedFeedbackButton";
import { WelcomeVideoDialog } from "@/components/WelcomeVideoDialog";
import { StoryConfigProvider, useStoryConfig } from "@/contexts/StoryConfigContext";
import { CreateProgressBar } from "@/components/create/CreateProgressBar";

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

const NAME_REGEX = /^[a-zA-Z\s'-]+$/;

const HomeContent = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [storyToShare, setStoryToShare] = useState<Story | null>(null);
  const [showLibraryFullDialog, setShowLibraryFullDialog] = useState(false);
  const [showWelcomeVideo, setShowWelcomeVideo] = useState(false);
  const { count: libraryCount, isFull } = useLibraryCount(user?.id || null);
  const { storyConfig, setCharacterName } = useStoryConfig();
  const [localName, setLocalName] = useState(storyConfig.characterName);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    const shouldShowVideo = sessionStorage.getItem('showWelcomeVideo');
    if (shouldShowVideo === 'true') {
      setShowWelcomeVideo(true);
      sessionStorage.removeItem('showWelcomeVideo');
    }
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

  const validateName = (name: string): boolean => {
    if (!name.trim()) return false;
    if (name.length < 2) return false;
    if (name.length > 24) return false;
    if (!NAME_REGEX.test(name)) return false;
    return true;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && validateName(localName)) {
      handleContinue();
    }
  };

  const handleContinue = () => {
    if (isFull) {
      setShowLibraryFullDialog(true);
      return;
    }

    if (validateName(localName)) {
      setCharacterName(localName);
      navigate('/create/02');
    }
  };

  const handleCreateStoryClick = () => {
    if (isFull) {
      setShowLibraryFullDialog(true);
    } else {
      navigate("/create/01");
    }
  };

  const isValid = validateName(localName);

  const handleProgressBarClick = (stepNumber: number) => {
    if (stepNumber === 1) {
      // Already on home page
    } else if (stepNumber === 2 && isValid) {
      handleContinue();
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
        showBackButton={false}
        profile={profile}
        isAdmin={isAdmin}
        rightContent={
          <>
            <Button variant="outline" size="sm" onClick={handleCreateStoryClick} className="text-white border-white/30 hover:bg-white/10 hover:text-amber-400">
              <Wand2 className="w-4 h-4 mr-2" />
              Create A Story
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/library")} className="text-white border-white/30 hover:bg-white/10 hover:text-amber-400">
              <Library className="w-4 h-4 mr-2" />
              My Library
            </Button>
            <DesktopNav profile={profile} isAdmin={isAdmin} />
          </>
        }
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Character Name Hero Section */}
        <section className="relative overflow-hidden rounded-3xl shadow-[var(--shadow-magical)] bg-black min-h-[500px] flex flex-col">
          {/* Main content area */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 lg:px-16 py-12">
            {/* Title */}
            <h1 className="font-aoboshi text-4xl md:text-5xl lg:text-6xl text-white mb-12 md:mb-16 text-center">
              Create Your Story...
            </h1>

            {/* Input section */}
            <div className="w-full max-w-3xl flex flex-col items-center gap-4">
              {/* Label */}
              <div className="font-inter text-2xl md:text-3xl lg:text-4xl font-bold text-center">
                <span className="text-white">Enter your </span>
                <span className="text-[#FFAE00]">main character's name.</span>
              </div>

              {/* Input field */}
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder=""
                maxLength={24}
                className="w-full max-w-2xl h-16 px-4 rounded bg-[#D9D9D9] text-black text-xl font-inter focus:outline-none focus:ring-2 focus:ring-[#FFAE00] transition-all"
              />

              {/* Helper text */}
              <p className="font-inter text-xl md:text-2xl text-[#C4C4C4] text-center mt-2">
                Name your main character and start the quest!
              </p>
            </div>

            {/* Next Step Button */}
            <div className="mt-12">
              <button
                onClick={handleContinue}
                disabled={!isValid}
                className="relative transition-all"
                style={{
                  width: '307px',
                  height: '88px',
                }}
              >
                <div
                  className="absolute inset-0 rounded-xl transition-all"
                  style={{
                    border: isValid ? '4px solid #20B000' : '4px solid #3C3C3C',
                    background: 'rgba(9, 9, 9, 0.82)',
                    opacity: isValid ? 1 : 0.5,
                  }}
                />
                <span
                  className="absolute inset-0 flex items-center justify-center font-inter text-4xl md:text-5xl font-bold transition-all"
                  style={{
                    color: isValid ? '#FFFFFF' : '#6B7280',
                  }}
                >
                  Next Step
                </span>
              </button>
            </div>
          </div>

          {/* Progress bar at bottom */}
          <div className="pb-8 px-4">
            <CreateProgressBar currentStep={1} onStepClick={handleProgressBarClick} />
          </div>
        </section>

        {/* Featured Stories */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-chewy text-foreground flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              Featured Stories
            </h2>
            <p className="text-sm text-muted-foreground ml-11">(coming soon)</p>
          </div>
          {/* Empty state - no cards shown */}
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <Sparkles className="w-16 h-16 text-primary mx-auto opacity-50" />
              <p className="text-xl font-semibold text-muted-foreground">
                Featured stories coming soon!
              </p>
              <p className="text-sm text-muted-foreground max-w-md">
                We're working on curating amazing stories to inspire your next adventure.
              </p>
            </div>
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

      {/* Welcome Video Dialog */}
      <WelcomeVideoDialog
        open={showWelcomeVideo}
        onOpenChange={setShowWelcomeVideo}
      />

      <FixedFeedbackButton />
    </div>
  );
};

const Home = () => {
  return (
    <StoryConfigProvider>
      <HomeContent />
    </StoryConfigProvider>
  );
};

export default Home;
