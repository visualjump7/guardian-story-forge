import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface Theme {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

const CreateStory = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [heroName, setHeroName] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [storyType, setStoryType] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [narrativeStructure, setNarrativeStructure] = useState("");
  const [setting, setSetting] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [artStyle, setArtStyle] = useState("pixar-3d");
  const [generating, setGenerating] = useState(false);
  const [storyUniverse, setStoryUniverse] = useState("");

  useEffect(() => {
    checkAuthAndLoadThemes();
  }, []);

  const checkAuthAndLoadThemes = async () => {
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

    const { data: themesData } = await supabase
      .from("story_themes")
      .select("*")
      .order("name");

    if (themesData) {
      setThemes(themesData);
      // Auto-select first theme as default
      if (themesData.length > 0) {
        setSelectedTheme(themesData[0].id);
      }
    }
  };

  const storyUniverses = [
    { value: "standalone", label: "Standalone Story", description: "A unique one-time adventure" },
    { value: "guardian-ranch", label: "Guardian Ranch", description: "Animal heroes rescue friends from Doctor Shadow" },
  ];

  const storyTypes = [
    "Adventure",
    "Fantasy",
    "Mystery",
    "Science Fiction",
    "Fairy Tale",
    "Animal Story",
    "Superhero",
    "Space Exploration",
  ];

  const narrativeStructures = [
    { value: "heros-journey", label: "Hero's Journey", description: "Classic quest with transformation" },
    { value: "problem-solution", label: "Problem & Solution", description: "Character faces obstacle and overcomes it" },
    { value: "rags-to-riches", label: "Rags to Riches", description: "Underdog story with growth" },
    { value: "voyage-return", label: "Voyage & Return", description: "Journey to unknown place and back" },
    { value: "quest", label: "Quest Narrative", description: "Search for something important" },
    { value: "overcoming-monster", label: "Overcoming the Monster", description: "Facing and defeating a challenge" },
  ];

  const storyLengths = [
    { value: "short", label: "Short Story", description: "300-400 words - Quick bedtime read" },
    { value: "medium", label: "Medium Story", description: "500-700 words - Standard length" },
    { value: "long", label: "Long Story", description: "800-1000 words - Extended adventure" },
  ];

  const ageRanges = [
    { value: "5-7", label: "Ages 5-7", description: "Early Readers - Simple vocabulary" },
    { value: "8-10", label: "Ages 8-10", description: "Middle Readers - Moderate complexity" },
    { value: "11-12", label: "Ages 11-12", description: "Pre-teens - Sophisticated themes" },
  ];

  const settings = [
    { value: "enchanted-forest", label: "Enchanted Forest" },
    { value: "underwater-kingdom", label: "Underwater Kingdom" },
    { value: "space-station", label: "Space Station" },
    { value: "medieval-castle", label: "Medieval Castle" },
    { value: "modern-city", label: "Modern City" },
    { value: "desert-oasis", label: "Desert Oasis" },
    { value: "mountain-kingdom", label: "Mountain Kingdom" },
    { value: "custom", label: "Custom Location" },
  ];

  const artStyles = [
    { value: "pixar-3d", label: "3D Animation", description: "Cinematic toy-3D style with warm lighting and handcrafted feel" },
    { value: "ghibli-2d", label: "2D Animation/Cartoon", description: "Classic 2D illustrated style" },
  ];

  const handleCreateStory = async () => {
    if (!heroName || !storyType || !selectedTheme || !narrativeStructure) {
      toast.error("Please fill in all required fields");
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: {
          heroName,
          excerpt: excerpt || undefined,
          storyType,
          themeId: selectedTheme,
          narrativeStructure,
          storyLength: "medium",
          ageRange: "7-10",
          setting: setting === "custom" ? customLocation : (setting || undefined),
          secondaryThemeId: undefined,
          artStyle,
          storyUniverse: storyUniverse === "standalone" ? undefined : storyUniverse,
        },
      });

      if (error) throw error;

      toast.success("Your magical story is ready!");
      navigate(`/story/${data.storyId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create story");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <AppHeader profile={profile} isAdmin={isAdmin} />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-poppins font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-3">
            Create Your Story
          </h1>
          <p className="text-lg text-muted-foreground font-inter">
            Answer a few questions and watch the magic happen!
          </p>
        </div>

        <div className="space-y-6">
          {/* Story Universe Section */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-poppins">Choose Your Universe</CardTitle>
              <CardDescription>Select where your story takes place</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {storyUniverses.map((universe) => (
                  <button
                    key={universe.value}
                    onClick={() => {
                      setStoryUniverse(universe.value);
                      if (universe.value === "guardian-ranch") {
                        setStoryType("Animal Story");
                        setSetting("Guardian Ranch");
                      }
                    }}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02]",
                      storyUniverse === universe.value
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="font-semibold text-lg mb-1">{universe.label}</div>
                    <div className="text-sm text-muted-foreground">{universe.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Hero Details Section */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-poppins">Your Hero</CardTitle>
              <CardDescription>Tell us about the main character</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heroName" className="text-base font-medium">
                  {storyUniverse === "guardian-ranch" ? "What is your animal hero's name?" : "What is your hero's name?"}
                </Label>
                <Input
                  id="heroName"
                  placeholder={storyUniverse === "guardian-ranch" ? "e.g., Brave Bear, Swift Rabbit" : "e.g., Luna, Max, or Zara"}
                  value={heroName}
                  onChange={(e) => setHeroName(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt" className="text-base font-medium">
                  Story Summary <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <Textarea
                  id="excerpt"
                  placeholder="A brief 1-2 sentence summary of your story..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  maxLength={250}
                  className="min-h-[100px] text-base resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {excerpt.length}/250 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Story Type & Structure Section */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-poppins">Story Details</CardTitle>
              <CardDescription>Choose the type and structure of your story</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storyType" className="text-base font-medium">
                  Story Type
                </Label>
                <Select value={storyType} onValueChange={setStoryType}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Choose a story type" />
                  </SelectTrigger>
                  <SelectContent>
                    {storyTypes.map((type) => (
                      <SelectItem key={type} value={type} className="text-base">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="narrativeStructure" className="text-base font-medium">
                  Narrative Structure <span className="text-destructive">*</span>
                </Label>
                <Select value={narrativeStructure} onValueChange={setNarrativeStructure}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Select story structure" />
                  </SelectTrigger>
                  <SelectContent>
                    {narrativeStructures.map((structure) => (
                      <SelectItem key={structure.value} value={structure.value} className="text-base">
                        {structure.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {narrativeStructure && (
                  <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted/50 rounded-lg">
                    {narrativeStructures.find((s) => s.value === narrativeStructure)?.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="setting" className="text-base font-medium">
                  Where does your story take place? <span className="text-muted-foreground font-normal">(Optional)</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {settings.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => {
                        setSetting(s.value);
                        if (s.value !== "custom") {
                          setCustomLocation("");
                        }
                      }}
                      className={cn(
                        "p-3 rounded-lg border-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02]",
                        setting === s.value
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {setting === "custom" && (
                  <div className="mt-3">
                    <Input
                      id="customLocation"
                      placeholder="e.g., A floating island in the clouds, An underground city..."
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      className="h-12 text-base"
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {customLocation.length}/100 characters
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Art Style Section */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2">
            <CardHeader>
              <CardTitle className="text-2xl font-poppins">Art Style</CardTitle>
              <CardDescription>Choose how your story will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {artStyles.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setArtStyle(style.value)}
                    className={cn(
                      "p-6 rounded-xl border-2 text-left transition-all duration-200 hover:scale-[1.02] group",
                      artStyle === style.value
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                      {style.label}
                    </div>
                    <div className="text-sm text-muted-foreground">{style.description}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <div className="pt-4">
            <Button
              onClick={handleCreateStory}
              disabled={generating || !heroName || !storyType || !selectedTheme || !narrativeStructure}
              variant="magical"
              size="lg"
              className="w-full h-14 text-lg font-semibold"
            >
              {generating ? "Creating magical story and illustrations..." : "Generate My Story"}
            </Button>
          </div>
        </div>
      </main>

      {generating && <LoadingAnimation />}
    </div>
  );
};

export default CreateStory;
