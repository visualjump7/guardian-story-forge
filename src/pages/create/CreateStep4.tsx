import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig } from '@/contexts/StoryConfigContext';
import { useAgeBand } from '@/contexts/AgeBandContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { LibraryLimitDialog } from '@/components/LibraryLimitDialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { CreateProgressBar } from '@/components/create/CreateProgressBar';

// Story Kind to Story Type mapping
const STORY_KIND_TO_STORY_TYPE: Record<string, string> = {
  'Action': 'Adventure',
  'Agent': 'Mystery',
  'Fantasy': 'Magical',
  'Fairy Tale': 'Epic',
  'Explorer': 'Adventure',
  'Superhero': 'Epic',
};

// Story Kind to Theme UUID mapping
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

// Art Style mapping
const ART_STYLE_MAPPING: Record<string, string> = {
  '3d': 'pixar-3d',
  'illustration': 'classic-disney',
  'storybook': 'ghibli-2d',
  'clay': 'watercolor',
  'black-white': 'classic-disney',
  'anime': 'anime',
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

  const handleProgressBarClick = (stepNumber: number) => {
    if (stepNumber === 1) {
      navigate('/create/01');
    } else if (stepNumber === 2) {
      navigate('/create/02');
    } else if (stepNumber === 3) {
      navigate('/create/03');
    } else if (stepNumber === 4) {
      navigate('/create/04');
    }
  };

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
      const storyKind = storyConfig.storyKind || 'Action';
      const themeId = STORY_KIND_TO_THEME[storyKind];
      const narrativeStructure = STORY_KIND_TO_NARRATIVE[storyKind];
      const storyType = STORY_KIND_TO_STORY_TYPE[storyKind];
      const mappedArtStyle = ART_STYLE_MAPPING[storyConfig.artStyle || '3d'];

      console.log('Generating story with:', {
        heroName: storyConfig.characterName,
        storyKind,
        storyType,
        artStyle: mappedArtStyle,
        themeId,
        narrativeStructure,
      });

      const { data, error } = await supabase.functions.invoke('generate-story', {
        body: {
          heroName: storyConfig.characterName,
          storyType: storyType,
          themeId: themeId,
          narrativeStructure: narrativeStructure,
          storyLength: 'medium',
          ageRange: '8-10',
          artStyle: mappedArtStyle,
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

  const getArtStyleLabel = (style: string | null) => {
    if (!style) return 'Art Style';
    const labelMap: Record<string, string> = {
      '3d': '3D',
      'illustration': 'Illustration',
      'storybook': 'Storybook',
      'clay': 'Clay',
      'black-white': 'Black & White',
      'anime': 'Anime',
    };
    return labelMap[style] || style;
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col relative">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 z-10 p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Go back"
      >
        <ArrowLeft className="h-6 w-6 text-white" />
      </button>

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
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 lg:px-16 py-12">
        {/* Title */}
        <h1 className="font-aoboshi text-4xl md:text-5xl text-white mb-16 text-center">
          Review
        </h1>

        {/* Review Cards */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Story Kind Card */}
          <div 
            className="flex flex-col items-center justify-center rounded-2xl p-8 md:p-12 aspect-square"
            style={{
              border: '3px solid #FFAE00',
              background: 'rgba(20, 20, 20, 0.8)',
            }}
          >
            <div className="text-white/60 font-inter text-center mb-4">
              <p className="text-sm md:text-base">Story Kind</p>
            </div>
            <p className="text-white/40 text-center font-inter text-xs md:text-sm">
              Placeholder
            </p>
            <p 
              className="font-inter font-bold mt-8 text-center"
              style={{ color: '#FFAE00' }}
            >
              02 - {storyConfig.storyKind}
            </p>
          </div>

          {/* Art Style Card */}
          <div 
            className="flex flex-col items-center justify-center rounded-2xl p-8 md:p-12 aspect-square"
            style={{
              border: '3px solid #FFAE00',
              background: 'rgba(20, 20, 20, 0.8)',
            }}
          >
            <div className="text-white/60 font-inter text-center mb-4">
              <p className="text-sm md:text-base">Art Style</p>
            </div>
            <p className="text-white/40 text-center font-inter text-xs md:text-sm">
              Placeholder
            </p>
            <p 
              className="font-inter font-bold mt-8 text-center"
              style={{ color: '#FFAE00' }}
            >
              03 - {getArtStyleLabel(storyConfig.artStyle)}
            </p>
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

        {/* Generate Story Button */}
        <button
          onClick={handleGenerateStory}
          disabled={isGenerating || !isComplete() || !isConfigLoaded}
          className="relative transition-all"
          style={{
            width: '307px',
            height: '88px',
          }}
        >
          <div 
            className="absolute inset-0 rounded-xl transition-all"
            style={{
              border: !isGenerating && isComplete() && isConfigLoaded ? '4px solid #20B000' : '4px solid #3C3C3C',
              background: 'rgba(9, 9, 9, 0.82)',
              opacity: !isGenerating && isComplete() && isConfigLoaded ? 1 : 0.5,
            }}
          />
          <span 
            className="absolute inset-0 flex items-center justify-center font-inter text-5xl font-bold transition-all"
            style={{
              color: !isGenerating && isComplete() && isConfigLoaded ? '#FFFFFF' : '#6B7280',
            }}
          >
            {isGenerating ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : (
              "Let's go!"
            )}
          </span>
        </button>

        {/* Back Button */}
        {!isGenerating && (
          <button
            onClick={handleBack}
            className="mt-6 font-inter text-white/60 hover:text-white transition-colors"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Enhanced Loading Animation */}
      {isGenerating && <LoadingAnimation />}

      {/* Progress bar at bottom - showing all 4 complete */}
      <div className="pb-8">
        <CreateProgressBar currentStep={4} onStepClick={handleProgressBarClick} />
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
