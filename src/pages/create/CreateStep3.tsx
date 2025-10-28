import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, ArtStyle } from '@/contexts/StoryConfigContext';
import { CreateProgressBar } from '@/components/create/CreateProgressBar';
import { ArrowLeft } from 'lucide-react';


interface ArtStyleOption {
  id: ArtStyle;
  label: string;
  image: string;
  borderColor: string;
  borderColorSelected: string;
  labelColor: string;
  labelColorSelected: string;
  textStroke?: string;
}

const ART_STYLES: ArtStyleOption[] = [
  {
    id: '3d',
    label: '3D',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F16edfe3c6c73459b9ab5368fbb923c75?format=webp&width=800',
    borderColor: '#FFE500',
    borderColorSelected: '#FFE500',
    labelColor: '#CCB700',
    labelColorSelected: '#CCB700'
  },
  {
    id: 'illustration',
    label: 'Illustration',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F5f2af9c10240431a8247ec89c5ee4ce7?format=webp&width=800',
    borderColor: '#C03B1A',
    borderColorSelected: '#C03B1A',
    labelColor: '#968F96',
    labelColorSelected: '#968F96',
    textStroke: '0.5px #000'
  },
  {
    id: 'storybook',
    label: 'Storybook',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F757814de85294fdca888501150ff1f5c?format=webp&width=800',
    borderColor: '#005AFF',
    borderColorSelected: '#005AFF',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF',
    textStroke: '1px #005AFF'
  },
  {
    id: 'clay',
    label: 'Clay',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F25cfc0907f2440f19942447593a6bb76?format=webp&width=800',
    borderColor: '#9994F8',
    borderColorSelected: '#9994F8',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF',
    textStroke: '1px #9994F8'
  },
  {
    id: 'black-white',
    label: 'Black & White',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F175624b63f8f4a51877fa57f93ad3576?format=webp&width=800',
    borderColor: '#94F8B4',
    borderColorSelected: '#94F8B4',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF'
  },
  {
    id: 'anime',
    label: 'Anime',
    image: 'https://cdn.builder.io/api/v1/image/assets%2F9bebcf6b30bb4052a5f67c7bf4a01fd9%2F7896f021f42d46359289cfebfc5eaab8?format=webp&width=800',
    borderColor: '#E62222',
    borderColorSelected: '#E62222',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF',
    textStroke: '1px rgba(0, 0, 0, 0.2)'
  },
];

export const CreateStep3 = () => {
  const navigate = useNavigate();
  const { storyConfig, setArtStyle } = useStoryConfig();
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle | null>(storyConfig.artStyle);

  const handleSelect = (style: ArtStyle, image: string) => {
    setSelectedStyle(style);
    setArtStyle(style, image);
  };

  const handleKeyPress = (e: React.KeyboardEvent, style: ArtStyle, image: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(style, image);
    }
  };

  const handleNextStep = () => {
    if (selectedStyle) {
      navigate('/create/04');
    }
  };

  const handleProgressBarClick = (stepNumber: number) => {
    if (stepNumber === 1) {
      navigate('/create/01');
    } else if (stepNumber === 2) {
      navigate('/create/02');
    } else if (stepNumber === 3) {
      navigate('/create/03');
    } else if (stepNumber === 4 && selectedStyle) {
      handleNextStep();
    }
  };

  const handleBack = () => {
    navigate('/create/02');
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* Main content area */}
      <div className="flex-1 flex px-4 md:px-8 lg:px-12 py-8">
        {/* Left side: Title and cards */}
        <div className="w-full lg:w-1/2 flex flex-col">
          {/* Title */}
          <h1 className="font-aoboshi text-3xl md:text-4xl text-white mb-8">
            Choose your art style.
          </h1>

          {/* Cards grid */}
          <div className="grid grid-cols-2 gap-6 md:gap-8 max-w-lg">
            {ART_STYLES.map((artStyle) => {
              const isSelected = selectedStyle === artStyle.id;
              
              return (
                <button
                  key={artStyle.id}
                  onClick={() => handleSelect(artStyle.id, artStyle.image)}
                  onKeyPress={(e) => handleKeyPress(e, artStyle.id, artStyle.image)}
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
                      border: `5px solid ${isSelected ? artStyle.borderColorSelected : artStyle.borderColor}`,
                      boxShadow: isSelected 
                        ? '4px 11px 4px 0 rgba(0, 0, 0, 0.25) inset, 0 4px 4px 0 rgba(0, 0, 0, 0.25)'
                        : 'none'
                    }}
                  >
                    <img 
                      src={artStyle.image} 
                      alt={artStyle.label}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Label overlay */}
                    <div className="absolute bottom-3 left-3 right-3">
                      <span 
                        className="font-inter text-xl md:text-2xl font-bold"
                        style={{ 
                          color: isSelected ? artStyle.labelColorSelected : artStyle.labelColor,
                          textShadow: artStyle.id === 'illustration' && isSelected
                            ? '0 1px 2.3px rgba(0, 0, 0, 0.25)'
                            : undefined,
                          WebkitTextStroke: artStyle.textStroke && isSelected ? artStyle.textStroke : undefined
                        }}
                      >
                        {artStyle.label}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right side: Video and Next button */}
        <div className="hidden lg:flex w-1/2 flex-col items-center justify-start pl-12 gap-8">
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
            {selectedStyle && (
              <div className="text-center">
                <p className="text-white/60 text-lg font-inter">
                  Preview for {ART_STYLES.find(s => s.id === selectedStyle)?.label}
                </p>
                <p className="text-white/40 text-sm mt-2">Video coming soon</p>
              </div>
            )}
          </div>

          {/* Next Step Button - Desktop */}
          <button
            onClick={handleNextStep}
            disabled={!selectedStyle}
            className="relative transition-all"
            style={{
              width: '307px',
              height: '88px',
            }}
          >
            <div
              className="absolute inset-0 rounded-xl transition-all"
              style={{
                border: selectedStyle ? '4px solid #20B000' : '4px solid #3C3C3C',
                background: 'rgba(9, 9, 9, 0.82)',
                opacity: selectedStyle ? 1 : 0.5,
              }}
            />
            <span
              className="absolute inset-0 flex items-center justify-center font-inter text-5xl font-bold transition-all"
              style={{
                color: selectedStyle ? '#FFFFFF' : '#6B7280',
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
          disabled={!selectedStyle}
          className="relative w-full max-w-md transition-all"
          style={{
            height: '80px',
          }}
        >
          <div
            className="absolute inset-0 rounded-xl transition-all"
            style={{
              border: selectedStyle ? '4px solid #20B000' : '4px solid #3C3C3C',
              background: 'rgba(9, 9, 9, 0.82)',
              opacity: selectedStyle ? 1 : 0.5,
            }}
          />
          <span
            className="absolute inset-0 flex items-center justify-center font-inter text-4xl font-bold transition-all"
            style={{
              color: selectedStyle ? '#FFFFFF' : '#6B7280',
            }}
          >
            Next Step
          </span>
        </button>
      </div>

      {/* Progress bar at bottom */}
      <div className="pb-8">
        <CreateProgressBar currentStep={3} onStepClick={handleProgressBarClick} />
      </div>
    </div>
  );
};
