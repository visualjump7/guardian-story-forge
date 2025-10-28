import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, StoryKind } from '@/contexts/StoryConfigContext';
import { CreateProgressBar } from '@/components/create/CreateProgressBar';

interface StoryKindOption {
  id: StoryKind;
  label: string;
  image: string;
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
    borderColor: '#FFE500',
    borderColorSelected: '#FFE500',
    labelColor: '#CCB700',
    labelColorSelected: '#CCB700'
  },
  {
    id: 'Agent',
    label: 'Agent',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Fff79eb9a3bf4450ca01ad00b847c0952?format=webp&width=800',
    borderColor: '#6C2C2A',
    borderColorSelected: '#6C2C2A',
    labelColor: '#CFCFCF',
    labelColorSelected: '#CFCFCF'
  },
  {
    id: 'Fantasy',
    label: 'Fantasy',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F122fba98f46947d7b7c96148ef5336de?format=webp&width=800',
    borderColor: '#005AFF',
    borderColorSelected: '#005AFF',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF'
  },
  {
    id: 'Fairy Tale',
    label: 'Fairy Tale',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F665ef22f220243dda0cd115009df4363?format=webp&width=800',
    borderColor: '#9994F8',
    borderColorSelected: '#9994F8',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF'
  },
  {
    id: 'Explorer',
    label: 'Explorer',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Fd3159d17d9124bfca8fdaa7126943dc7?format=webp&width=800',
    borderColor: '#94F8B4',
    borderColorSelected: '#94F8B4',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF'
  },
  {
    id: 'Superhero',
    label: 'Superhero',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2Faa9a4f32bff54b18afb69b21e66290d9?format=webp&width=800',
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

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* Main content area */}
      <div className="flex-1 flex px-4 md:px-8 lg:px-12 py-8">
        {/* Left side: Title and cards */}
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Title */}
          <h1 className="font-aoboshi text-3xl md:text-4xl text-white mb-8">
            What kind of story?
          </h1>

          {/* Cards grid */}
          <div className="grid grid-cols-2 gap-6 md:gap-8 max-w-lg">
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
                    <div className="absolute bottom-3 left-3 right-3">
                      <span
                        className="font-inter text-xl md:text-2xl font-bold"
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

        {/* Right side: Video area */}
        <div className="hidden lg:flex w-1/2 items-start justify-center pl-12">
          {/* Video preview area */}
          <div
            className="w-full max-w-[704px] aspect-square bg-gradient-to-br from-gray-900 to-black rounded-lg border border-white/10 flex items-center justify-center overflow-hidden"
          >
            <video
              src=""
              autoPlay
              loop
              muted
              className="w-full h-full object-cover"
              style={{ display: 'none' }}
            />
            {selectedKind && (
              <div className="text-center">
                <p className="text-white/60 text-lg font-inter">
                  Preview for {selectedKind}
                </p>
                <p className="text-white/40 text-sm mt-2">Video coming soon</p>
              </div>
            )}
          </div>
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
        <CreateProgressBar currentStep={2} />
      </div>
    </div>
  );
}
