import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, CharacterType } from '@/contexts/StoryConfigContext';
import { StoryMagicTray } from '@/components/create/StoryMagicTray';
import { ChoiceCard } from '@/components/create/ChoiceCard';
import { CreateNavBar } from '@/components/create/CreateNavBar';

import explorerImg from '@/assets/character-explorer.jpg';
import superheroImg from '@/assets/character-superhero.jpg';
import creatureImg from '@/assets/character-creature.jpg';
import robotImg from '@/assets/character-robot.jpg';
import warriorImg from '@/assets/character-warrior.jpg';
import surpriseImg from '@/assets/character-surprise.jpg';

const CHARACTER_TYPES = [
  { id: 'Explorer' as CharacterType, label: 'Explorer', image: explorerImg },
  { id: 'Super Hero' as CharacterType, label: 'Super Hero', image: superheroImg },
  { id: 'Creature' as CharacterType, label: 'Creature', image: creatureImg },
  { id: 'Robot' as CharacterType, label: 'Robot', image: robotImg },
  { id: 'Warrior' as CharacterType, label: 'Warrior', image: warriorImg },
  { id: 'Surprise', label: 'Surprise Me!', image: surpriseImg },
];

export const CreateStep2 = () => {
  const navigate = useNavigate();
  const { storyConfig, setCharacterType, clearCharacterType } = useStoryConfig();
  const [selectedType, setSelectedType] = useState<string>(storyConfig.characterType || '');

  useEffect(() => {
    if (storyConfig.characterType) {
      setSelectedType(storyConfig.characterType);
    }
  }, [storyConfig.characterType]);

  const handleSelect = (typeId: string, image: string) => {
    setSelectedType(typeId);
    setCharacterType(typeId as CharacterType, image);
  };

  const handleSlotClick = () => {
    setSelectedType('');
    clearCharacterType();
  };

  const handleSlot2Click = () => {
    navigate('/create/03');
  };

  const handleSlot3Click = () => {
    navigate('/create/04');
  };

  const handleContinue = () => {
    navigate('/create/03');
  };

  const isContinueEnabled = () => {
    return !!selectedType;
  };

  const handleBack = () => {
    navigate('/create/01');
  };

  return (
    <div className="w-full">
      <CreateNavBar
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!isContinueEnabled()}
      />

      <div className="text-center mb-3 md:mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-story-heading font-chewy">
          Who is Your Character?
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-4">
        {CHARACTER_TYPES.map((type) => (
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

      <StoryMagicTray
        slot1={{
          filled: !!selectedType,
          imageSrc: storyConfig.assets.characterTypeIcon || undefined,
          label: selectedType,
          active: true,
          onClick: handleSlotClick,
        }}
        slot2={{ filled: false, active: false, onClick: handleSlot2Click }}
        slot3={{ filled: false, active: false, onClick: handleSlot3Click }}
      />
    </div>
  );
};
