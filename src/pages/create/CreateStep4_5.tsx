import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, WritingStyle } from '@/contexts/StoryConfigContext';
import { HeroImage } from '@/components/create/HeroImage';
import { StoryMagicTray } from '@/components/create/StoryMagicTray';
import { CreateNavBar } from '@/components/create/CreateNavBar';

const WRITING_STYLES = [
  {
    id: 'interactive-playful',
    label: 'Interactive & Playful',
    description: 'Fun sound effects and talking to the reader!',
    icon: '🎪',
    emoji: '🎪'
  },
  {
    id: 'rhyming-rhythmic',
    label: 'Rhyming & Musical',
    description: 'Story flows like a song with fun rhymes',
    icon: '🎵',
    emoji: '🎵'
  },
  {
    id: 'conversational-casual',
    label: 'Friendly & Casual',
    description: 'Like your best friend telling you a story',
    icon: '💬',
    emoji: '💬'
  },
  {
    id: 'descriptive-immersive',
    label: 'Vivid & Detailed',
    description: 'Rich details that help you see every scene',
    icon: '🎨',
    emoji: '🎨'
  },
  {
    id: 'action-packed',
    label: 'Fast & Exciting',
    description: 'Non-stop action that keeps you on the edge!',
    icon: '⚡',
    emoji: '⚡'
  },
  {
    id: 'gentle-reassuring',
    label: 'Calm & Comforting',
    description: 'Gentle pacing that feels safe and warm',
    icon: '🌙',
    emoji: '🌙'
  },
  {
    id: 'Surprise',
    label: 'Surprise Me!',
    description: 'Let us pick the perfect style for you',
    icon: '✨',
    emoji: '✨'
  }
];

export const CreateStep4_5 = () => {
  const navigate = useNavigate();
  const { storyConfig, setWritingStyle, clearWritingStyle } = useStoryConfig();
  const [selectedStyle, setSelectedStyle] = useState<string>(storyConfig.writingStyle || '');

  useEffect(() => {
    setSelectedStyle(storyConfig.writingStyle || '');
  }, [storyConfig.writingStyle]);

  const handleSelect = (styleId: string, emoji: string) => {
    setSelectedStyle(styleId);
    setWritingStyle(styleId as WritingStyle, emoji);
  };

  const handleSlot1Click = () => {
    navigate('/create/02');
  };

  const handleSlot2Click = () => {
    navigate('/create/03');
  };

  const handleSlot3Click = () => {
    navigate('/create/04');
  };

  const handleSlotClick = () => {
    setSelectedStyle('');
    clearWritingStyle();
  };

  const handleContinue = () => {
    navigate('/create/05');
  };

  const handleBack = () => {
    navigate('/create/04');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <HeroImage />

      <CreateNavBar
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!selectedStyle}
      />

      <StoryMagicTray
        slot1={{
          filled: !!storyConfig.characterType,
          imageSrc: storyConfig.assets.characterTypeIcon || undefined,
          label: storyConfig.characterType || undefined,
          active: false,
          onClick: handleSlot1Click,
        }}
        slot2={{
          filled: !!storyConfig.storyType,
          imageSrc: storyConfig.assets.storyTypeIcon || undefined,
          label: storyConfig.storyType || undefined,
          active: false,
          onClick: handleSlot2Click,
        }}
        slot3={{
          filled: !!storyConfig.mission,
          imageSrc: storyConfig.assets.missionIcon || undefined,
          label: storyConfig.mission || undefined,
          active: false,
          onClick: handleSlot3Click,
        }}
      />

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-story-heading mb-2">
          Choose Your Writing Style
        </h1>
        <p className="text-muted-foreground">
          How should your story sound?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {WRITING_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => handleSelect(style.id, style.emoji)}
            className={`
              group relative flex items-start gap-4 p-4 rounded-xl transition-all duration-300
              bg-card hover:bg-card/80 border-2
              ${
                selectedStyle === style.id
                  ? 'border-story-choice-selected shadow-lg shadow-story-choice-selected/20 scale-[1.02]'
                  : 'border-story-choice-default hover:border-story-choice-hover'
              }
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            `}
          >
            <div className="text-4xl flex-shrink-0">{style.icon}</div>
            <div className="flex-1 text-left">
              <h3 className="text-lg font-bold text-foreground mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {style.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {style.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
