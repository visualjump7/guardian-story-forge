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

  const handleCreateStory = async () => {
    if (!heroName || !storyType || !selectedTheme) {
      toast.error("Please fill in all fields");
      return;
    }

    setGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-story", {
        body: {
          heroName,
          storyType,
          themeId: selectedTheme,
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
                What lesson should the story teach?
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

            <Button
              onClick={handleCreateStory}
              disabled={generating || !heroName || !storyType || !selectedTheme}
              variant="magical"
              size="lg"
              className="w-full mt-8"
            >
              {generating ? (
                <>
                  <Sparkles className="w-6 h-6 animate-spin" />
                  Creating Your Story...
                </>
              ) : (
                <>
                  <Wand2 className="w-6 h-6" />
                  Generate My Story
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateStory;
