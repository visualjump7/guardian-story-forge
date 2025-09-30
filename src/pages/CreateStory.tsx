import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ArrowLeft, Wand2 } from "lucide-react";
import { toast } from "sonner";

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
  const [storyType, setStoryType] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("");
  const [narrativeStructure, setNarrativeStructure] = useState("");
  const [storyLength, setStoryLength] = useState("medium");
  const [ageRange, setAgeRange] = useState("8-10");
  const [setting, setSetting] = useState("");
  const [secondaryTheme, setSecondaryTheme] = useState("");
  const [generating, setGenerating] = useState(false);

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
    }
  };

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
          storyType,
          themeId: selectedTheme,
          narrativeStructure,
          storyLength,
          ageRange,
          setting: setting || undefined,
          secondaryThemeId: secondaryTheme || undefined,
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
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/home")}>
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Button>
        </div>
      </header>

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
              <Label htmlFor="heroName" className="text-lg">
                What is your hero's name?
              </Label>
              <Input
                id="heroName"
                placeholder="e.g., Luna, Max, or Zara"
                value={heroName}
                onChange={(e) => setHeroName(e.target.value)}
                className="rounded-xl h-12 text-lg"
              />
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
              <Label htmlFor="theme" className="text-lg">
                What lesson should the story teach? *
              </Label>
              <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                <SelectTrigger className="rounded-xl h-12 text-lg">
                  <SelectValue placeholder="Pick a moral theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.id} value={theme.id} className="text-lg">
                      {theme.emoji} {theme.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTheme && (
                <p className="text-sm text-muted-foreground mt-2">
                  {themes.find((t) => t.id === selectedTheme)?.description}
                </p>
              )}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="storyLength" className="text-lg">
                  Story Length
                </Label>
                <Select value={storyLength} onValueChange={setStoryLength}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {storyLengths.map((length) => (
                      <SelectItem key={length.value} value={length.value}>
                        {length.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {storyLengths.find((l) => l.value === storyLength)?.description}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ageRange" className="text-lg">
                  Age Range
                </Label>
                <Select value={ageRange} onValueChange={setAgeRange}>
                  <SelectTrigger className="rounded-xl h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ageRanges.map((age) => (
                      <SelectItem key={age.value} value={age.value}>
                        {age.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {ageRanges.find((a) => a.value === ageRange)?.description}
                </p>
              </div>
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
              <Label htmlFor="secondaryTheme" className="text-lg">
                Secondary Theme (Optional)
              </Label>
              <Select value={secondaryTheme} onValueChange={setSecondaryTheme}>
                <SelectTrigger className="rounded-xl h-12 text-lg">
                  <SelectValue placeholder="Add another lesson to weave in" />
                </SelectTrigger>
                <SelectContent>
                  {themes
                    .filter((theme) => theme.id !== selectedTheme)
                    .map((theme) => (
                      <SelectItem key={theme.id} value={theme.id} className="text-lg">
                        {theme.emoji} {theme.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {secondaryTheme && (
                <p className="text-sm text-muted-foreground mt-2">
                  {themes.find((t) => t.id === secondaryTheme)?.description}
                </p>
              )}
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
