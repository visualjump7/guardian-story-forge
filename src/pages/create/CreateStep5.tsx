import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, ArtStyle } from '@/contexts/StoryConfigContext';
import { useAgeBand } from '@/contexts/AgeBandContext';
import { supabase } from '@/integrations/supabase/client';
import { StoryMagicTray } from '@/components/create/StoryMagicTray';
import { ChoiceCard } from '@/components/create/ChoiceCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { LibraryLimitDialog } from '@/components/LibraryLimitDialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingAnimation } from '@/components/LoadingAnimation';

// Import art style images (using existing story images as temporary placeholders)
import comingSoonImg from '@/assets/coming-soon.jpg';

// Mission to Theme UUID mapping
const MISSION_TO_THEME: Record<string, string> = {
  'Rescue': 'e59bc1c0-319d-4899-a42a-b91e241c4524', // Courage
  'Treasure': 'eafb2f85-27ca-47a7-9534-96a01528f47b', // Perseverance
  'Protect': 'be4bd0cf-eaa3-437d-8784-d1a72566a63c', // Responsibility
  'Ranch': '84ab3e9b-cdf8-4e59-b152-372225fc1e82', // Friendship
  'Escape': 'e59bc1c0-319d-4899-a42a-b91e241c4524', // Courage
};

// Mission to Narrative Structure mapping
const MISSION_TO_NARRATIVE: Record<string, string> = {
  'Rescue': 'overcoming-monster',
  'Treasure': 'quest',
  'Protect': 'heros-journey',
  'Ranch': 'voyage-return',
  'Escape': 'overcoming-monster',
};

const ART_STYLES = [
  { 
    id: 'pixar-3d' as ArtStyle, 
    label: 'Cinematic Animation', 
    image: comingSoonImg,
    description: 'Coming Soon'
  },
  { 
    id: 'anime' as ArtStyle, 
    label: 'Anime Vision', 
    image: comingSoonImg,
    description: 'Coming Soon'
  },
  { 
    id: 'illustration' as ArtStyle, 
    label: 'Illustrations', 
    image: comingSoonImg,
    description: 'Coming Soon'
  },
  { 
    id: 'comic-book' as ArtStyle, 
    label: 'Comic Book', 
    image: comingSoonImg,
    description: 'Coming Soon'
  },
  { 
    id: 'watercolor' as ArtStyle, 
    label: 'Watercolor Dreams', 
    image: comingSoonImg,
    description: 'Coming Soon'
  },
  { 
    id: 'sketch' as ArtStyle, 
    label: 'Pencil Sketch', 
    image: comingSoonImg,
    description: 'Coming Soon'
  },
];

export const CreateStep5 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { storyConfig, setArtStyle, clearArtStyle, setGenerationMode, isStep5Complete } = useStoryConfig();
  const { selectedBand, isConfigLoaded } = useAgeBand();
  const [selectedStyle, setSelectedStyle] = useState<string>(storyConfig.artStyle || '');
  const [animateSlot, setAnimateSlot] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLibraryFullDialog, setShowLibraryFullDialog] = useState(false);
  const [libraryCount, setLibraryCount] = useState(10);

  const handleSlot1Click = () => navigate('/create/02');
  const handleSlot2Click = () => navigate('/create/03');
  const handleSlot3Click = () => navigate('/create/04');

  const handleBack = () => navigate('/create/04');

  const hasSelection = !!selectedStyle;

  const handleStyleSelect = (styleId: string, image: string) => {
    setSelectedStyle(styleId);
    setArtStyle(styleId as ArtStyle, image);
    
    setAnimateSlot(true);
    setTimeout(() => setAnimateSlot(false), 800);
  };

  const handleSlot4Click = () => {
    setSelectedStyle('');
    clearArtStyle();
  };

  const handleGenerateStory = async () => {
    if (!storyConfig.characterName || !storyConfig.storyType || !storyConfig.mission || !storyConfig.artStyle) {
      toast({
        title: "Incomplete Story Magic",
        description: "Please complete all steps including art style selection before generating your story.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Handle "Surprise" selections by randomly choosing actual values
      let actualCharacterType: string = storyConfig.characterType || '';
      if (storyConfig.characterType === 'Surprise') {
        const types = ['Explorer', 'Super Hero', 'Warrior', 'Robot', 'Creature'];
        actualCharacterType = types[Math.floor(Math.random() * types.length)];
      }

      let actualStoryType: string = storyConfig.storyType || '';
      if (storyConfig.storyType === 'Surprise') {
        const types = ['Adventure', 'Mystery', 'Epic', 'Magical', 'Space'];
        actualStoryType = types[Math.floor(Math.random() * types.length)];
      }

      // Handle "Surprise" mission by randomly choosing an actual mission
      let actualMission: string = storyConfig.mission;
      if (storyConfig.mission === 'Surprise') {
        const missions = ['Rescue', 'Treasure', 'Protect', 'Ranch', 'Escape'];
        actualMission = missions[Math.floor(Math.random() * missions.length)];
      }

      const themeId = MISSION_TO_THEME[actualMission];
      const narrativeStructure = MISSION_TO_NARRATIVE[actualMission] || 'heros-journey';

      // Log what we're sending to help debug
      console.log('Generating story with:', {
        heroName: storyConfig.characterName,
        characterType: actualCharacterType,
        customCharacterDescription: storyConfig.customCharacterDescription || 'None',
        storyType: actualStoryType,
        customStoryTypeDescription: storyConfig.customStoryTypeDescription || 'None',
        mission: narrativeStructure,
        customMissionDescription: storyConfig.customMissionDescription || 'None',
        artStyle: storyConfig.artStyle,
      });

      const { data, error } = await supabase.functions.invoke('generate-story', {
        body: {
          heroName: storyConfig.characterName,
          characterType: actualCharacterType,
          storyType: actualStoryType,
          themeId: themeId,
          narrativeStructure: narrativeStructure,
          writingStyle: storyConfig.writingStyle || undefined,
          storyLength: 'medium',
          ageRange: '8-10',
          artStyle: storyConfig.artStyle || 'pixar-3d',
          generationMode: storyConfig.generationMode,
          customCharacterDescription: storyConfig.customCharacterDescription,
          customStoryTypeDescription: storyConfig.customStoryTypeDescription,
          customMissionDescription: storyConfig.customMissionDescription,
          selectedBand: selectedBand, // Pass age band
        },
      });

      if (error) {
        // Check for library full error
        if (error.message?.includes('LIBRARY_FULL')) {
          try {
            const errorData = JSON.parse(error.message);
            setLibraryCount(errorData.currentCount || 10);
          } catch {
            setLibraryCount(10);
          }
          setShowLibraryFullDialog(true);
          setIsGenerating(false);
          return;
        }
        throw error;
      }

      if (data?.storyId) {
        toast({
          title: "Story Created! ✨",
          description: "Your magical story is ready!",
        });
        navigate(`/story/${data.storyId}`);
      } else {
        throw new Error('No story ID returned');
      }
    } catch (error: any) {
      console.error('Story generation error:', error);
      
      // Check if it's a library full error
      if (error.message?.includes('LIBRARY_FULL')) {
        setShowLibraryFullDialog(true);
        return;
      }

      toast({
        title: "Story Generation Failed",
        description: error.message || "Failed to create your story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen flex flex-col">
      {/* Config Warning */}
      {!isConfigLoaded && (
        <Alert variant="destructive" className="mx-4 mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration Error</AlertTitle>
          <AlertDescription>
            Story configs not loaded. Please reload the app.
          </AlertDescription>
        </Alert>
      )}

      {/* Art Style Selection Section */}
      <div className="text-center mb-4 mt-6">
        <h1 className="text-3xl md:text-4xl font-bold text-story-heading mb-2">
          Choose Your Art Style
        </h1>
        <p className="text-lg text-muted-foreground">
          Select the visual style for your story
        </p>
      </div>

      {/* Art Style Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-4">
        {ART_STYLES.map((style) => (
          <ChoiceCard
            key={style.id}
            id={style.id}
            label={style.label}
            imageSrc={style.image}
            selected={selectedStyle === style.id}
            hasSelection={hasSelection}
            onSelect={() => handleStyleSelect(style.id, style.image)}
            gradientType="art"
          />
        ))}
      </div>

      {/* Image Generation Quality Toggle */}
      <div className="px-4 mb-6">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-story-heading mb-3 text-center">
            Image Generation Quality
          </h3>
          
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className={`flex items-center gap-2 transition-opacity ${
              storyConfig.generationMode === 'express' ? 'opacity-100' : 'opacity-50'
            }`}>
              <span className="font-semibold">Built for Speed</span>
            </div>
            
            <Switch
              checked={storyConfig.generationMode === 'studio'}
              onCheckedChange={(checked) => setGenerationMode(checked ? 'studio' : 'express')}
            />
            
            <div className={`flex items-center gap-2 transition-opacity ${
              storyConfig.generationMode === 'studio' ? 'opacity-100' : 'opacity-50'
            }`}>
              <span className="font-semibold">Big Time Studio</span>
            </div>
          </div>
          
          {storyConfig.generationMode === 'express' && (
            <Alert className="bg-slate-800 text-white border-slate-700">
              <AlertDescription className="text-white text-base">
                <span className="font-medium">Fast generation</span> - Images ready in ~10 seconds using AI-powered creation
              </AlertDescription>
            </Alert>
          )}
          
          {storyConfig.generationMode === 'studio' && (
            <Alert className="bg-slate-800 text-white border-slate-700">
              <AlertDescription className="text-white text-base">
                <span className="font-medium">Premium quality</span> - Studio-grade images with enhanced detail. 
                Processing takes 1-2 minutes per image.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Generate Story Section */}
      <div className="flex flex-col items-center text-center px-4 mt-4">
        <h2 className="text-2xl md:text-3xl font-bold text-story-heading mb-4">
          Ready to build your story?
        </h2>

        <div className="flex gap-4 md:gap-6 items-center justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handleBack}
            disabled={isGenerating}
            className="text-lg px-8"
          >
            Not Yet
          </Button>

          <Button
            size="lg"
            onClick={handleGenerateStory}
            disabled={isGenerating || !isStep5Complete() || !isConfigLoaded}
            className={`text-lg px-8 ${
              !isGenerating && isStep5Complete() && isConfigLoaded ? 'animate-button-pulse' : ''
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating your story...
              </>
            ) : (
              'Yes, let\'s go!'
            )}
          </Button>
        </div>
      </div>

      {/* Enhanced Loading Animation */}
      {isGenerating && <LoadingAnimation />}

      {/* Story Magic Tray - Now with 4 slots */}
      <div className="mt-6">
        <StoryMagicTray
          slot1={{
            filled: true,
            imageSrc: storyConfig.assets.characterTypeIcon || undefined,
            label: storyConfig.characterType || undefined,
            active: false,
            onClick: handleSlot1Click,
          }}
          slot2={{
            filled: true,
            imageSrc: storyConfig.assets.storyTypeIcon || undefined,
            label: storyConfig.storyType || undefined,
            active: false,
            onClick: handleSlot2Click,
          }}
          slot3={{
            filled: true,
            imageSrc: storyConfig.assets.missionIcon || undefined,
            label: storyConfig.mission || undefined,
            active: false,
            onClick: handleSlot3Click,
          }}
          slot4={{
            filled: !!selectedStyle,
            imageSrc: storyConfig.assets.artStyleIcon || undefined,
            label: selectedStyle ? ART_STYLES.find(s => s.id === selectedStyle)?.label : undefined,
            active: true,
            justFilled: animateSlot,
            onClick: handleSlot4Click,
          }}
        />
      </div>

      <LibraryLimitDialog
        open={showLibraryFullDialog}
        onOpenChange={setShowLibraryFullDialog}
        currentCount={libraryCount}
        onGoToLibrary={() => navigate("/library")}
      />
    </div>
  );
};
