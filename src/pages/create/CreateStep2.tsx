import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, StoryKind } from '@/contexts/StoryConfigContext';
import { CreateProgressBar } from '@/components/create/CreateProgressBar';
import { ArrowLeft } from 'lucide-react';

interface StoryKindOption {
  id: StoryKind;
  label: string;
  image: string;
  video: string;
  borderColor: string;
  borderColorSelected: string;
  labelColor: string;
  labelColorSelected: string;
}

const STORY_KINDS: StoryKindOption[] = [
  {
    id: 'Action',
    label: 'Action',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Fbd7079eb565f486b952b669c06ab277c?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F05ee7d40af3a4fc6ae70af4ee38a48e2?alt=media&token=001e8311-7afc-4bfd-b443-99bbb8875fa2&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#FFE500',
    borderColorSelected: '#FFE500',
    labelColor: '#CCB700',
    labelColorSelected: '#CCB700'
  },
  {
    id: 'Agent',
    label: 'Agent',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Fff79eb9a3bf4450ca01ad00b847c0952?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Fe6b3d6ab91924be18fa8ebf382bd1be8?alt=media&token=47f81526-faac-42ec-9f9f-fd4d718c9631&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#6C2C2A',
    borderColorSelected: '#6C2C2A',
    labelColor: '#CFCFCF',
    labelColorSelected: '#CFCFCF'
  },
  {
    id: 'Fantasy',
    label: 'Fantasy',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F122fba98f46947d7b7c96148ef5336de?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F5999a21ef6df44229c6270aa4a69c349?alt=media&token=62264ada-ee30-4b3c-8370-61a6db8906e0&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#005AFF',
    borderColorSelected: '#005AFF',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF'
  },
  {
    id: 'Fairy Tale',
    label: 'Fairy Tale',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F665ef22f220243dda0cd115009df4363?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F083550454ac24a68abc7760fb0ef4cfc?alt=media&token=6e6efc47-5b88-451d-846c-369aefcf1b90&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#9994F8',
    borderColorSelected: '#9994F8',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF'
  },
  {
    id: 'Explorer',
    label: 'Explorer',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Fd3159d17d9124bfca8fdaa7126943dc7?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F640f6f3009fb4f87a5c9c0ff53c1a985?alt=media&token=a4bd8cee-782d-4904-8469-24d5d5c78f2b&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#94F8B4',
    borderColorSelected: '#94F8B4',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF'
  },
  {
    id: 'Superhero',
    label: 'Superhero',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Faa9a4f32bff54b18afb69b21e66290d9?format=webp&width=800',
    video: 'https://cdn.builder.io/o/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F2f709bfa39d3454a8cdea75ae79d5bf5?alt=media&token=c73c9e38-5b61-4b9f-84fe-bb08fdfd99a4&apiKey=9bebcf6b30bb4052a5f67c7bf4a01fd9',
    borderColor: '#E62222',
    borderColorSelected: '#E62222',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF'
  },
];

export default function CreateStep2() {
  const navigate = useNavigate();
  const { storyConfig, setStoryKind } = useStoryConfig();
  const [selectedKind, setSelectedKind] = useState<StoryKind | null>(storyConfig.storyKind);

  const handleSelect = (kind: StoryKind, image: string) => {
    setSelectedKind(kind);
    setStoryKind(kind, image);
  };

  const handleKeyPress = (e: React.KeyboardEvent, kind: StoryKind, image: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(kind, image);
    }
  };

  const handleNextStep = () => {
    if (selectedKind) {
      navigate('/create/03');
    }
  };

  const handleProgressBarClick = (stepNumber: number) => {
    if (stepNumber === 1) {
      navigate('/create/01');
    } else if (stepNumber === 2) {
      navigate('/create/02');
    }
  };

  const handleBack = () => {
    navigate('/create/01');
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

      {/* Main content area */}
      <div className="flex-1 flex items-center gap-8 px-4 md:px-8 lg:px-12 py-8">
        {/* Left side: Title and cards */}
        <div className="w-full lg:w-auto flex flex-col flex-shrink-0">
          {/* Title */}
          <h1 className="font-aoboshi text-2xl md:text-3xl lg:text-4xl text-white mb-6 lg:mb-8">
            What kind of story?
          </h1>

          {/* Cards grid - fixed size */}
          <div className="grid grid-cols-2 gap-4 lg:gap-6" style={{ width: '300px', maxWidth: '100%' }}>
            {STORY_KINDS.map((kind) => {
              const isSelected = selectedKind === kind.id;

              return (
                <button
                  key={kind.id}
                  onClick={() => handleSelect(kind.id, kind.image)}
                  onKeyPress={(e) => handleKeyPress(e, kind.id, kind.image)}
                  className="relative w-full aspect-square group focus:outline-none focus:ring-2 focus:ring-white/50 rounded-[19px]"
                  style={{
                    filter: isSelected
                      ? 'none'
                      : 'brightness(0.7)',
                    transition: 'filter 0.3s ease'
                  }}
                >
                  {/* Card image */}
                  <div
                    className="w-full h-full rounded-[19px] overflow-hidden relative"
                    style={{
                      border: `5px solid ${isSelected ? kind.borderColorSelected : kind.borderColor}`,
                      boxShadow: isSelected
                        ? '4px 11px 4px 0 rgba(0, 0, 0, 0.25) inset, 0 4px 4px 0 rgba(0, 0, 0, 0.25)'
                        : 'none'
                    }}
                  >
                    <img
                      src={kind.image}
                      alt={kind.label}
                      className="w-full h-full object-cover"
                    />

                    {/* Label overlay */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <span
                        className="font-inter text-base lg:text-xl font-bold"
                        style={{
                          color: isSelected ? kind.labelColorSelected : kind.labelColor,
                          textShadow: kind.id === 'Fantasy' && isSelected
                            ? '0 0 1px #005AFF, 0 0 1px #005AFF'
                            : kind.id === 'Superhero' && isSelected
                            ? '0 0 1px rgba(0, 0, 0, 0.2)'
                            : '0 1px 2.3px rgba(0, 0, 0, 0.25)'
                        }}
                      >
                        {kind.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: Video area - responsive and grows to fill space */}
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center gap-6">
          {/* Video preview area */}
          <div
            className="w-full aspect-square bg-gradient-to-br from-gray-900 to-black rounded-lg border border-white/10 flex items-center justify-center overflow-hidden"
            style={{ maxHeight: 'calc(100vh - 400px)' }}
          >
            {selectedKind ? (
              <video
                key={selectedKind}
                src={STORY_KINDS.find(k => k.id === selectedKind)?.video}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <p className="text-white/60 text-lg font-inter">
                  Select a story kind to preview
                </p>
              </div>
            )}
          </div>

          {/* Next Step Button for Desktop */}
          <button
            onClick={handleNextStep}
            disabled={!selectedKind}
            className="relative w-full max-w-sm transition-all"
            style={{
              height: '80px',
            }}
          >
            <div
              className="absolute inset-0 rounded-xl transition-all"
              style={{
                border: selectedKind ? '4px solid #20B000' : '4px solid #3C3C3C',
                background: 'rgba(9, 9, 9, 0.82)',
                opacity: selectedKind ? 1 : 0.5,
              }}
            />
            <span
              className="absolute inset-0 flex items-center justify-center font-inter text-4xl font-bold transition-all"
              style={{
                color: selectedKind ? '#FFFFFF' : '#6B7280',
              }}
            >
              Next Step
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Next Step Button */}
      <div className="lg:hidden flex justify-center px-4 pb-4">
        <button
          onClick={handleNextStep}
          disabled={!selectedKind}
          className="relative w-full max-w-md transition-all"
          style={{
            height: '80px',
          }}
        >
          <div
            className="absolute inset-0 rounded-xl transition-all"
            style={{
              border: selectedKind ? '4px solid #20B000' : '4px solid #3C3C3C',
              background: 'rgba(9, 9, 9, 0.82)',
              opacity: selectedKind ? 1 : 0.5,
            }}
          />
          <span
            className="absolute inset-0 flex items-center justify-center font-inter text-4xl font-bold transition-all"
            style={{
              color: selectedKind ? '#FFFFFF' : '#6B7280',
            }}
          >
            Next Step
          </span>
        </button>
      </div>

      {/* Progress bar at bottom */}
      <div className="pb-8">
        <CreateProgressBar currentStep={2} onStepClick={handleProgressBarClick} />
      </div>
    </div>
  );
}
