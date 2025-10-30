import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig } from '@/contexts/StoryConfigContext';
import { useAgeBand } from '@/contexts/AgeBandContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Settings } from 'lucide-react';
import { LibraryLimitDialog } from '@/components/LibraryLimitDialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { CreateProgressBar } from '@/components/create/CreateProgressBar';
import { OptionsDialog } from '@/components/create/OptionsDialog';

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
  const [modeChanged, setModeChanged] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);

  // Navigation guards - redirect to previous steps if incomplete
  useEffect(() => {
    if (!storyConfig.characterName || storyConfig.characterName.trim().length < 2) {
      console.warn('Character name missing, redirecting to Step 1');
      navigate('/create/01', { replace: true });
      return;
    }
    
    if (!storyConfig.storyKind) {
      console.warn('Story kind missing, redirecting to Step 2');
      navigate('/create/02', { replace: true });
      return;
    }
    
    if (!storyConfig.artStyle) {
      console.warn('Art style missing, redirecting to Step 3');
      navigate('/create/03', { replace: true });
    }
  }, [storyConfig, navigate]);

  // Debug logging
  console.log('=== CreateStep4 Debug ===');
  console.log('characterName:', storyConfig.characterName);
  console.log('storyKind:', storyConfig.storyKind);
  console.log('artStyle:', storyConfig.artStyle);
  console.log('isComplete():', !!(storyConfig.characterName && storyConfig.storyKind && storyConfig.artStyle));
  console.log('isConfigLoaded:', isConfigLoaded);
  console.log('Button should be enabled:', !isGenerating && !!(storyConfig.characterName && storyConfig.storyKind && storyConfig.artStyle));

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      console.log('Generating branched story Part 1 with:', {
        heroName: storyConfig.characterName,
        genre: storyConfig.storyKind,
        artStyle: storyConfig.artStyle,
      });

      const { data, error } = await supabase.functions.invoke('generate-story-part-1', {
        body: {
          heroName: storyConfig.characterName,
          genre: storyConfig.storyKind,
          artStyle: storyConfig.artStyle,
          userId: session.user.id,
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

      if (data?.storyId && data?.nodeId) {
        toast({
          title: "Story Begins! ✨",
          description: "Your adventure awaits!",
        });
        navigate(`/story/${data.storyId}/interactive`);
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

      {/* Debug Section - Temporary for testing */}
      {import.meta.env.DEV && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900/95 p-4 rounded-lg text-xs border border-white/20 shadow-xl max-w-xs">
          <p className="text-white font-bold mb-2">Debug Info:</p>
          <p className="text-green-400">Name: {storyConfig.characterName || 'EMPTY'}</p>
          <p className="text-blue-400">Kind: {storyConfig.storyKind || 'EMPTY'}</p>
          <p className="text-purple-400">Style: {storyConfig.artStyle || 'EMPTY'}</p>
          <p className="text-yellow-400 mt-2">Config Loaded: {isConfigLoaded ? 'Yes' : 'No'}</p>
          <button
            onClick={() => {
              localStorage.removeItem('storyConfig');
              window.location.reload();
            }}
            className="mt-3 w-full px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
          >
            Clear Config & Reload
          </button>
        </div>
      )}

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
      <div className="flex-1 flex flex-col px-4 md:px-8 lg:px-12 py-8">
        {/* Content flex row - centered vertically */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          {/* Title */}
          <h1 className="font-aoboshi text-lg md:text-xl lg:text-2xl text-white" style={{ marginBottom: '0px' }}>
            Finalize Your Epic Journey
          </h1>

          {/* Review Cards */}
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
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

          {/* Three Button Row */}
          <div className="w-full max-w-4xl flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
            {/* Back Button */}
            <button
              onClick={handleBack}
              className="relative transition-all w-full md:w-auto"
              style={{
                minWidth: '180px',
                height: '80px',
              }}
            >
              <div
                className="absolute inset-0 rounded-xl"
                style={{
                  border: '4px solid #AA00B0',
                  background: 'rgba(9, 9, 9, 0.82)',
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center gap-3 font-inter text-2xl font-bold text-white">
                <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 28C22.1797 28 28 22.1797 28 15C28 7.8203 22.1797 2 15 2C7.8203 2 2 7.8203 2 15C2 22.1797 7.8203 28 15 28Z" stroke="#AA00B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 10L10 15L15 20" stroke="#AA00B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20 15H10" stroke="#AA00B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Back
              </span>
            </button>

            {/* Options Button */}
            <button
              onClick={() => setOptionsOpen(true)}
              className="relative transition-all w-full md:w-auto"
              style={{
                minWidth: '180px',
                height: '80px',
              }}
            >
              <div
                className="absolute inset-0 rounded-xl"
                style={{
                  border: '4px solid #005AFF',
                  background: 'rgba(9, 9, 9, 0.82)',
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center gap-3 font-inter text-2xl font-bold text-white">
                <Settings className="w-7 h-7" />
                Options
              </span>
            </button>

            {/* Let's Go Button */}
            <button
              onClick={handleGenerateStory}
              disabled={isGenerating || !isComplete()}
              className="relative transition-all w-full md:w-auto"
              style={{
                minWidth: '200px',
                height: '80px',
              }}
            >
              <div
                className="absolute inset-0 rounded-xl transition-all"
                style={{
                  border: !isGenerating && isComplete() ? '4px solid #20B000' : '4px solid #3C3C3C',
                  background: 'rgba(9, 9, 9, 0.82)',
                  opacity: !isGenerating && isComplete() ? 1 : 0.5,
                }}
              />
              <span
                className="absolute inset-0 flex items-center justify-center font-inter text-3xl font-bold transition-all"
                style={{
                  color: !isGenerating && isComplete() ? '#FFFFFF' : '#6B7280',
                }}
              >
                {isGenerating ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  "Let's go!"
                )}
              </span>
            </button>
          </div>
        </div>
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

      <OptionsDialog
        open={optionsOpen}
        onOpenChange={setOptionsOpen}
        generationMode={storyConfig.generationMode}
        setGenerationMode={setGenerationMode}
        modeChanged={modeChanged}
        setModeChanged={setModeChanged}
      />
    </div>
  );
};
