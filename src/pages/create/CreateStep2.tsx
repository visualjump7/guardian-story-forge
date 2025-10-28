import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, StoryKind } from '@/contexts/StoryConfigContext';
import { CreateProgressBar } from '@/components/create/CreateProgressBar';

import adventureImg from '@/assets/story-adventure.jpg';
import mysteryImg from '@/assets/story-mystery.jpg';
import magicalImg from '@/assets/story-magical.jpg';
import epicImg from '@/assets/story-epic.jpg';
import spaceImg from '@/assets/story-space.jpg';
import surpriseImg from '@/assets/story-surprise.jpg';

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
    image: adventureImg,
    borderColor: '#FFE500',
    borderColorSelected: '#FFE500',
    labelColor: '#CCB700',
    labelColorSelected: '#CCB700'
  },
  { 
    id: 'Agent', 
    label: 'Agent', 
    image: mysteryImg,
    borderColor: '#6C2C2A',
    borderColorSelected: '#6C2C2A',
    labelColor: '#CFCFCF',
    labelColorSelected: '#CFCFCF'
  },
  { 
    id: 'Fantasy', 
    label: 'Fantasy', 
    image: magicalImg,
    borderColor: '#005AFF',
    borderColorSelected: '#005AFF',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF'
  },
  { 
    id: 'Fairy Tale', 
    label: 'Fairy Tale', 
    image: epicImg,
    borderColor: '#9994F8',
    borderColorSelected: '#9994F8',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF'
  },
  { 
    id: 'Explorer', 
    label: 'Explorer', 
    image: spaceImg,
    borderColor: '#94F8B4',
    borderColorSelected: '#94F8B4',
    labelColor: '#FFFFFF',
    labelColorSelected: '#FFFFFF'
  },
  { 
    id: 'Superhero', 
    label: 'Superhero', 
    image: surpriseImg,
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

        {/* Right side: Video/Preview area (hidden on mobile/tablet) */}
        <div className="hidden lg:flex w-1/2 items-start justify-center pl-12">
          <div 
            className="w-full max-w-[704px] aspect-square bg-gradient-to-br from-gray-900 to-black rounded-lg border border-white/10 flex items-center justify-center"
          >
            {selectedKind && (
              <div className="text-center">
                <p className="text-white/60 text-lg font-inter">
                  Preview for {selectedKind}
                </p>
                <p className="text-white/40 text-sm mt-2">Coming soon</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar at bottom */}
      <div className="pb-8">
        <CreateProgressBar currentStep={2} />
      </div>
    </div>
  );
}
