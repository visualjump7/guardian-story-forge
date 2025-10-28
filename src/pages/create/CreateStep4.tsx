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

interface StoryKindOption {
  id: string;
  label: string;
  image: string;
  borderColor: string;
  labelColor: string;
}

interface ArtStyleOption {
  id: string;
  label: string;
  image: string;
  borderColor: string;
  labelColor: string;
  textStroke?: string;
}

const STORY_KINDS: StoryKindOption[] = [
  {
    id: 'Action',
    label: 'Action',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Fbd7079eb565f486b952b669c06ab277c?format=webp&width=800',
    borderColor: '#FFE500',
    labelColor: '#CCB700'
  },
  {
    id: 'Agent',
    label: 'Agent',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Fff79eb9a3bf4450ca01ad00b847c0952?format=webp&width=800',
    borderColor: '#6C2C2A',
    labelColor: '#CFCFCF'
  },
  {
    id: 'Fantasy',
    label: 'Fantasy',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F122fba98f46947d7b7c96148ef5336de?format=webp&width=800',
    borderColor: '#005AFF',
    labelColor: '#FFFFFF'
  },
  {
    id: 'Fairy Tale',
    label: 'Fairy Tale',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F665ef22f220243dda0cd115009df4363?format=webp&width=800',
    borderColor: '#9994F8',
    labelColor: '#FFFFFF'
  },
  {
    id: 'Explorer',
    label: 'Explorer',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Fd3159d17d9124bfca8fdaa7126943dc7?format=webp&width=800',
    borderColor: '#94F8B4',
    labelColor: '#FFFFFF'
  },
  {
    id: 'Superhero',
    label: 'Superhero',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Faa9a4f32bff54b18afb69b21e66290d9?format=webp&width=800',
    borderColor: '#E62222',
    labelColor: '#FFFFFF'
  },
];

const ART_STYLES: ArtStyleOption[] = [
  {
    id: '3d',
    label: '3D',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F16edfe3c6c73459b9ab5368fbb923c75?format=webp&width=800',
    borderColor: '#FFE500',
    labelColor: '#CCB700'
  },
  {
    id: 'illustration',
    label: 'Illustration',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F5f2af9c10240431a8247ec89c5ee4ce7?format=webp&width=800',
    borderColor: '#C03B1A',
    labelColor: '#968F96',
    textStroke: '0.5px #000'
  },
  {
    id: 'storybook',
    label: 'Storybook',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F757814de85294fdca888501150ff1f5c?format=webp&width=800',
    borderColor: '#005AFF',
    labelColor: '#FFFFFF',
    textStroke: '1px #005AFF'
  },
  {
    id: 'clay',
    label: 'Clay',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F25cfc0907f2440f19942447593a6bb76?format=webp&width=800',
    borderColor: '#9994F8',
    labelColor: '#FFFFFF',
    textStroke: '1px #9994F8'
  },
  {
    id: 'black-white',
    label: 'Black & White',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F175624b63f8f4a51877fa57f93ad3576?format=webp&width=800',
    borderColor: '#94F8B4',
    labelColor: '#FFFFFF'
  },
  {
    id: 'anime',
    label: 'Anime',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F7896f021f42d46359289cfebfc5eaab8?format=webp&width=800',
    borderColor: '#E62222',
    labelColor: '#FFFFFF',
    textStroke: '1px rgba(0, 0, 0, 0.2)'
  },
];

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

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col relative">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/20 transition-colors"
        style={{
          backgroundColor: '#262A32',
        }}
        aria-label="Go back"
      >
        <ArrowLeft className="h-5 w-5" style={{ color: '#9CA3AF' }} />
        <span className="font-inter text-sm" style={{ color: '#9CA3AF' }}>Back</span>
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
          Finalize Your Epic Journey
        </h1>

        {/* Review Cards */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Story Kind Card */}
          {storyConfig.storyKind && STORY_KINDS.find(s => s.id === storyConfig.storyKind) && (
            <div
              className="flex flex-col items-center justify-center rounded-2xl p-6 aspect-square relative overflow-hidden"
              style={{
                border: `5px solid ${STORY_KINDS.find(s => s.id === storyConfig.storyKind)?.borderColor || '#FFAE00'}`,
                background: 'rgba(20, 20, 20, 0.8)',
              }}
            >
              <img
                src={STORY_KINDS.find(s => s.id === storyConfig.storyKind)?.image}
                alt={storyConfig.storyKind}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

              <div className="relative z-10 flex flex-col items-center justify-end h-full pb-6 text-center">
                <p
                  className="font-inter font-bold text-lg md:text-xl"
                  style={{
                    color: STORY_KINDS.find(s => s.id === storyConfig.storyKind)?.labelColor || '#FFFFFF'
                  }}
                >
                  {storyConfig.storyKind}
                </p>
              </div>
            </div>
          )}

          {/* Art Style Card */}
          {storyConfig.artStyle && ART_STYLES.find(a => a.id === storyConfig.artStyle) && (
            <div
              className="flex flex-col items-center justify-center rounded-2xl p-6 aspect-square relative overflow-hidden"
              style={{
                border: `5px solid ${ART_STYLES.find(a => a.id === storyConfig.artStyle)?.borderColor || '#FFAE00'}`,
                background: 'rgba(20, 20, 20, 0.8)',
              }}
            >
              <img
                src={ART_STYLES.find(a => a.id === storyConfig.artStyle)?.image}
                alt={storyConfig.artStyle}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />

              <div className="relative z-10 flex flex-col items-center justify-end h-full pb-6 text-center">
                <p
                  className="font-inter font-bold text-lg md:text-xl"
                  style={{
                    color: ART_STYLES.find(a => a.id === storyConfig.artStyle)?.labelColor || '#FFFFFF'
                  }}
                >
                  {ART_STYLES.find(a => a.id === storyConfig.artStyle)?.label}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Generate Story Button */}
        <button
          onClick={handleGenerateStory}
          disabled={isGenerating || !isComplete() || !isConfigLoaded}
          className="relative transition-all mb-12"
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
