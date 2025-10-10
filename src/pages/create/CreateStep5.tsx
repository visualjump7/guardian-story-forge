import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig } from '@/contexts/StoryConfigContext';
import { supabase } from '@/integrations/supabase/client';
import { HeroImage } from '@/components/create/HeroImage';
import { StoryMagicTray } from '@/components/create/StoryMagicTray';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

export const CreateStep5 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { storyConfig } = useStoryConfig();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSlot1Click = () => navigate('/create/02');
  const handleSlot2Click = () => navigate('/create/03');
  const handleSlot3Click = () => navigate('/create/04');
  const handleSlot4Click = () => navigate('/create/04_5');

  const handleBack = () => navigate('/create/04_5');

  const handleGenerateStory = async () => {
    if (!storyConfig.characterName || !storyConfig.storyType || !storyConfig.mission || !storyConfig.writingStyle) {
      toast({
        title: "Incomplete Story Magic",
        description: "Please complete all steps before generating your story.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const themeId = MISSION_TO_THEME[storyConfig.mission];
      const narrativeStructure = MISSION_TO_NARRATIVE[storyConfig.mission] || 'heros-journey';

      const { data, error } = await supabase.functions.invoke('generate-story', {
        body: {
          heroName: storyConfig.characterName,
          characterType: storyConfig.characterType,
          storyType: storyConfig.storyType,
          themeId: themeId,
          narrativeStructure: narrativeStructure,
          writingStyle: storyConfig.writingStyle,
          storyLength: 'medium',
          ageRange: '8-10',
          artStyle: 'pixar-3d',
        },
      });

      if (error) throw error;

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
      <HeroImage />

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
      />

      <div className="flex flex-col items-center text-center px-4 mt-8">
        <h1 className="text-4xl md:text-5xl font-bold text-story-heading mb-8">
          Ready to build your story?
        </h1>

        <div className="flex gap-6 items-center justify-center">
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
            disabled={isGenerating}
            className="text-lg px-8"
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
    </div>
  );
};
