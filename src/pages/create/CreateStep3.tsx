import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, StoryType } from '@/contexts/StoryConfigContext';
import { HeroImage } from '@/components/create/HeroImage';
import { StoryMagicTray } from '@/components/create/StoryMagicTray';
import { ChoiceCard } from '@/components/create/ChoiceCard';
import { CreateNavBar } from '@/components/create/CreateNavBar';

import adventureImg from '@/assets/story-adventure.jpg';
import mysteryImg from '@/assets/story-mystery.jpg';
import magicalImg from '@/assets/story-magical.jpg';
import epicImg from '@/assets/story-epic.jpg';
import spaceImg from '@/assets/story-space.jpg';
import surpriseImg from '@/assets/story-surprise.jpg';

const STORY_TYPES = [
  { id: 'Adventure', label: 'Adventure', image: adventureImg },
  { id: 'Mystery', label: 'Mystery', image: mysteryImg },
  { id: 'Magical', label: 'Magical', image: magicalImg },
  { id: 'Epic', label: 'Epic', image: epicImg },
  { id: 'Space', label: 'Space', image: spaceImg },
  { id: 'Surprise', label: 'Surprise Me!', image: surpriseImg },
];

export const CreateStep3 = () => {
  const navigate = useNavigate();
  const { storyConfig, setStoryType, clearStoryType } = useStoryConfig();
  const [selectedType, setSelectedType] = useState<string>(storyConfig.storyType || '');

  useEffect(() => {
    setSelectedType(storyConfig.storyType || '');
  }, [storyConfig.storyType]);

  const handleSelect = (typeId: string, image: string) => {
    if (typeId === 'Surprise') {
      // For surprise, just store 'Surprise' without picking now
      // Actual randomization will happen at story generation time
      setSelectedType('Surprise');
      setStoryType('Surprise' as StoryType, surpriseImg);
    } else {
      // For normal selections, store the actual type
      setSelectedType(typeId);
      setStoryType(typeId as StoryType, image);
    }
  };

  const handleSlot1Click = () => {
    navigate('/create/02');
  };

  const handleSlotClick = () => {
    setSelectedType('');
    clearStoryType();
  };

  const handleSlot3Click = () => {
    navigate('/create/04');
  };

  const handleContinue = () => {
    navigate('/create/04');
  };

  const handleBack = () => {
    navigate('/create/02');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <HeroImage />

      <CreateNavBar
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!selectedType}
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
          filled: !!selectedType,
          imageSrc: storyConfig.assets.storyTypeIcon || undefined,
          label: selectedType === 'Surprise' ? 'Surprise Me!' : selectedType,
          active: true,
          onClick: handleSlotClick,
        }}
        slot3={{ filled: false, active: false, onClick: handleSlot3Click }}
      />

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-story-heading mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          What kind of story do you want to create?
        </h1>
        <p className="text-muted-foreground">
          Choose one from below and add it to your Story Magic.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {STORY_TYPES.map((type) => (
          <ChoiceCard
            key={type.id}
            id={type.id}
            label={type.label}
            imageSrc={type.image}
            selected={selectedType === type.id}
            onSelect={() => handleSelect(type.id, type.image)}
          />
        ))}
      </div>
    </div>
  );
};
