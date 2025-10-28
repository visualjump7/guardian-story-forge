import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig } from '@/contexts/StoryConfigContext';
import { useAgeBand } from '@/contexts/AgeBandContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { LibraryLimitDialog } from '@/components/LibraryLimitDialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { CreateProgressBar } from '@/components/create/CreateProgressBar';

// Mission to Theme UUID mapping (keeping for backend compatibility)
const STORY_KIND_TO_THEME: Record<string, string> = {
  'Action': 'e59bc1c0-319d-4899-a42a-b91e241c4524', // Courage
  'Agent': 'eafb2f85-27ca-47a7-9534-96a01528f47b', // Perseverance
  'Fantasy': 'be4bd0cf-eaa3-437d-8784-d1a72566a63c', // Responsibility
  'Fairy Tale': '84ab3e9b-cdf8-4e59-b152-372225fc1e82', // Friendship
  'Explorer': 'e59bc1c0-319d-4899-a42a-b91e241c4524', // Courage
  'Superhero': 'e59bc1c0-319d-4899-a42a-b91e241c4524', // Courage
};

const STORY_KIND_TO_NARRATIVE: Record<string, string> = {
  'Action': 'overcoming-monster',
  'Agent': 'quest',
  'Fantasy': 'heros-journey',
  'Fairy Tale': 'voyage-return',
  'Explorer': 'quest',
  'Superhero': 'heros-journey',
};

export const CreateStep4 = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { storyConfig, setGenerationMode } = useStoryConfig();
  const { selectedBand, isConfigLoaded } = useAgeBand();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLibraryFullDialog, setShowLibraryFullDialog] = useState(false);
  const [libraryCount, setLibraryCount] = useState(10);

  const handleBack = () => navigate('/create/03');

  const isComplete = () => {
    return !!(storyConfig.characterName && storyConfig.storyKind && storyConfig.artStyle);
  };

  const handleGenerateStory = async () => {
    if (!isComplete()) {
      toast({
        title: "Incomplete Story Magic",
        description: "Please complete all steps before generating your story.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const themeId = STORY_KIND_TO_THEME[storyConfig.storyKind || ''] || STORY_KIND_TO_THEME['Action'];
      const narrativeStructure = STORY_KIND_TO_NARRATIVE[storyConfig.storyKind || ''] || 'heros-journey';

      console.log('Generating story with:', {
        heroName: storyConfig.characterName,
        storyKind: storyConfig.storyKind,
        artStyle: storyConfig.artStyle,
        themeId,
        narrativeStructure,
      });

      const { data, error } = await supabase.functions.invoke('generate-story', {
        body: {
          heroName: storyConfig.characterName,
          characterType: storyConfig.storyKind, // Using story kind as character type for now
          storyType: storyConfig.storyKind, // Using story kind as story type
          themeId: themeId,
          narrativeStructure: narrativeStructure,
          storyLength: 'medium',
          ageRange: '8-10',
          artStyle: storyConfig.artStyle || '3d',
          generationMode: storyConfig.generationMode,
          selectedBand: selectedBand,
        },
      });

      if (error) {
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
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
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

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 lg:px-16">
        {/* Story Summary */}
        <div className="w-full max-w-2xl mb-12 text-center">
          <h1 className="font-aoboshi text-3xl md:text-4xl lg:text-5xl text-white mb-8">
            Your Story Magic
          </h1>
          
          <div className="space-y-4 text-left bg-white/5 rounded-lg p-6 md:p-8 border border-white/10">
            <div className="flex justify-between items-center">
              <span className="font-inter text-lg text-white/60">Hero:</span>
              <span className="font-inter text-xl md:text-2xl font-bold text-white">
                {storyConfig.characterName}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-inter text-lg text-white/60">Story Kind:</span>
              <span className="font-inter text-xl md:text-2xl font-bold text-white">
                {storyConfig.storyKind}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-inter text-lg text-white/60">Art Style:</span>
              <span className="font-inter text-xl md:text-2xl font-bold text-white">
                {storyConfig.artStyle === '3d' ? '3D' :
                 storyConfig.artStyle === 'black-white' ? 'Black & White' :
                 storyConfig.artStyle?.charAt(0).toUpperCase() + storyConfig.artStyle?.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Image Generation Quality Toggle */}
        <div className="w-full max-w-2xl mb-12">
          <h3 className="text-xl font-bold text-white mb-4 text-center font-inter">
            Image Generation Quality
          </h3>
          
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className={`flex items-center gap-2 transition-opacity ${
              storyConfig.generationMode === 'express' ? 'opacity-100' : 'opacity-50'
            }`}>
              <span className="font-semibold text-white font-inter">Built for Speed</span>
            </div>
            
            <Switch
              checked={storyConfig.generationMode === 'studio'}
              onCheckedChange={(checked) => setGenerationMode(checked ? 'studio' : 'express')}
            />
            
            <div className={`flex items-center gap-2 transition-opacity ${
              storyConfig.generationMode === 'studio' ? 'opacity-100' : 'opacity-50'
            }`}>
              <span className="font-semibold text-white font-inter">Big Time Studio</span>
            </div>
          </div>
          
          {storyConfig.generationMode === 'express' && (
            <Alert className="bg-slate-800 text-white border-slate-700">
              <AlertDescription className="text-white text-base">
                <span className="font-medium">Fast generation</span> - Images ready in ~10 seconds
              </AlertDescription>
            </Alert>
          )}
          
          {storyConfig.generationMode === 'studio' && (
            <Alert className="bg-slate-800 text-white border-slate-700">
              <AlertDescription className="text-white text-base">
                <span className="font-medium">Premium quality</span> - Studio-grade images. Takes 1-2 minutes per image.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Generate Story Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <h2 className="font-inter text-2xl md:text-3xl font-bold text-white mb-8">
            Ready to build your story?
          </h2>

          <div className="flex gap-6 items-center justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={handleBack}
              disabled={isGenerating}
              className="text-lg px-8 font-inter"
            >
              Not Yet
            </Button>

            <Button
              size="lg"
              onClick={handleGenerateStory}
              disabled={isGenerating || !isComplete() || !isConfigLoaded}
              className={`text-lg px-8 font-inter ${
                !isGenerating && isComplete() && isConfigLoaded ? 'animate-button-pulse' : ''
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
      </div>

      {/* Enhanced Loading Animation */}
      {isGenerating && <LoadingAnimation />}

      {/* Progress bar at bottom */}
      <div className="pb-8">
        <CreateProgressBar currentStep={4} />
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
