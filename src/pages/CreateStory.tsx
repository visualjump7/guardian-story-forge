import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";

interface Theme {
  id: string;
  name: string;
  description: string;
  emoji: string;
}

const CreateStory = () => {
  const navigate = useNavigate();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [heroName, setHeroName] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [storyType, setStoryType] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [narrativeStructure, setNarrativeStructure] = useState("");
  const [setting, setSetting] = useState("");
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
    { value: "", label: "Standalone Story", description: "A unique one-time adventure" },
    { value: "guardian-ranch", label: "🐾 Guardian Ranch", description: "Animal heroes rescue friends from Doctor Shadow" },
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
    { value: "enchanted-forest", label: "🌲 Enchanted Forest" },
    { value: "underwater-kingdom", label: "🌊 Underwater Kingdom" },
    { value: "space-station", label: "🚀 Space Station" },
    { value: "medieval-castle", label: "🏰 Medieval Castle" },
    { value: "modern-city", label: "🏙️ Modern City" },
    { value: "magical-school", label: "🎓 Magical School" },
    { value: "desert-oasis", label: "🏜️ Desert Oasis" },
    { value: "mountain-kingdom", label: "⛰️ Mountain Kingdom" },
  ];

  const artStyles = [
    { value: "pixar-3d", label: "🎬 Pixar/Disney 3D", description: "Vibrant 3D animation style" },
    { value: "ghibli-2d", label: "🎨 Studio Ghibli 2D", description: "Soft watercolor animation" },
    { value: "watercolor", label: "🖌️ Watercolor Illustration", description: "Gentle children's book art" },
    { value: "classic-disney", label: "✨ Classic Disney 2D", description: "Traditional hand-drawn animation" },
    { value: "modern-cartoon", label: "🎭 Modern 2D Cartoon", description: "Bold contemporary animation" },
    { value: "anime", label: "⚡ Anime Style", description: "Japanese anime aesthetic" },
    { value: "comic-book", label: "💥 Comic Book", description: "Dynamic illustrated panels" },
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
          setting: setting || undefined,
          secondaryThemeId: undefined,
          artStyle,
          storyUniverse: storyUniverse || undefined,
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
      <AppHeader />

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Card className="shadow-2xl border-2">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary to-accent">
                <Wand2 className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Create Your Story
            </CardTitle>
            <CardDescription className="text-lg">
              Answer a few questions and watch the magic happen!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="storyUniverse" className="text-lg">
                Story Universe
              </Label>
              <Select 
                value={storyUniverse} 
                onValueChange={(value) => {
                  setStoryUniverse(value);
                  if (value === "guardian-ranch") {
                    setStoryType("Animal Story");
                    setSetting("Guardian Ranch");
                  }
                }}
              >
                <SelectTrigger className="rounded-xl h-12 text-lg">
                  <SelectValue placeholder="Choose a universe" />
                </SelectTrigger>
                <SelectContent>
                  {storyUniverses.map((universe) => (
                    <SelectItem key={universe.value} value={universe.value} className="text-lg">
                      <div className="flex flex-col">
                        <span>{universe.label}</span>
                        <span className="text-xs text-muted-foreground">{universe.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroName" className="text-lg">
                {storyUniverse === "guardian-ranch" ? "What is your animal hero's name?" : "What is your hero's name?"}
              </Label>
              <Input
                id="heroName"
                placeholder={storyUniverse === "guardian-ranch" ? "e.g., Brave Bear, Swift Rabbit" : "e.g., Luna, Max, or Zara"}
                value={heroName}
                onChange={(e) => setHeroName(e.target.value)}
                className="rounded-xl h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt" className="text-lg">
                Story Summary (Optional)
              </Label>
              <Input
                id="excerpt"
                placeholder="A brief 1-2 sentence summary of your story..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                maxLength={250}
                className="rounded-xl h-12 text-lg"
              />
              <p className="text-xs text-muted-foreground">
                {excerpt.length}/250 characters - This will appear below the title and be read in the audio
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storyType" className="text-lg">
                What kind of story do you want?
              </Label>
              <Select value={storyType} onValueChange={setStoryType}>
                <SelectTrigger className="rounded-xl h-12 text-lg">
                  <SelectValue placeholder="Choose a story type" />
                </SelectTrigger>
                <SelectContent>
                  {storyTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-lg">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="narrativeStructure" className="text-lg">
                Choose a narrative structure *
              </Label>
              <Select value={narrativeStructure} onValueChange={setNarrativeStructure}>
                <SelectTrigger className="rounded-xl h-12 text-lg">
                  <SelectValue placeholder="Select story structure" />
                </SelectTrigger>
                <SelectContent>
                  {narrativeStructures.map((structure) => (
                    <SelectItem key={structure.value} value={structure.value} className="text-lg">
                      {structure.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {narrativeStructure && (
                <p className="text-sm text-muted-foreground mt-2">
                  {narrativeStructures.find((s) => s.value === narrativeStructure)?.description}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="setting" className="text-lg">
                Setting (Optional)
              </Label>
              <Select value={setting} onValueChange={setSetting}>
                <SelectTrigger className="rounded-xl h-12 text-lg">
                  <SelectValue placeholder="Choose a setting for your story" />
                </SelectTrigger>
                <SelectContent>
                  {settings.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="text-lg">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="artStyle" className="text-lg">
                Art Style
              </Label>
              <Select value={artStyle} onValueChange={setArtStyle}>
                <SelectTrigger className="rounded-xl h-12 text-lg">
                  <SelectValue placeholder="Choose an art style..." />
                </SelectTrigger>
                <SelectContent>
                  {artStyles.map((style) => (
                    <SelectItem key={style.value} value={style.value} className="text-lg">
                      <div className="flex flex-col">
                        <span>{style.label}</span>
                        <span className="text-xs text-muted-foreground">{style.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCreateStory}
              disabled={generating || !heroName || !storyType || !selectedTheme || !narrativeStructure}
              variant="magical"
              size="lg"
              className="w-full mt-8"
            >
              {generating ? (
                <>
                  <Sparkles className="w-6 h-6 animate-spin" />
                  Creating magical story and illustrations...
                </>
              ) : (
                <>
                  <Wand2 className="w-6 h-6" />
                  Generate My Story
                </>
              )}
            </Button>
            {generating && (
              <p className="text-center text-sm text-muted-foreground animate-pulse">
                ✨ Writing your story... 🎨 Creating beautiful illustrations...
              </p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateStory;
