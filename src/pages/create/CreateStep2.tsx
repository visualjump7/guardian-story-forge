import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, CharacterType } from '@/contexts/StoryConfigContext';
import { HeroImage } from '@/components/create/HeroImage';
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
  const { storyConfig, setCharacterType } = useStoryConfig();
  const [selectedType, setSelectedType] = useState<string>(storyConfig.characterType || '');

  useEffect(() => {
    if (storyConfig.characterType) {
      setSelectedType(storyConfig.characterType);
    }
  }, [storyConfig.characterType]);

  const handleSelect = (typeId: string, image: string) => {
    let finalType: CharacterType;
    let finalImage = image;

    // Handle "Surprise Me!" - randomly select from first 5 options
    if (typeId === 'Surprise') {
      const randomIndex = Math.floor(Math.random() * 5);
      const randomChoice = CHARACTER_TYPES[randomIndex];
      finalType = randomChoice.id as CharacterType;
      finalImage = randomChoice.image;
    } else {
      finalType = typeId as CharacterType;
    }

    setSelectedType(finalType);
    setCharacterType(finalType, finalImage);
  };

  const handleContinue = () => {
    navigate('/create/03');
  };

  const handleBack = () => {
    navigate('/create/01');
  };

  return (
    <div className="w-full">
      <HeroImage />

      <StoryMagicTray
        slot1={{
          filled: !!selectedType,
          imageSrc: storyConfig.assets.characterTypeIcon || undefined,
          label: selectedType,
          active: true,
        }}
        slot2={{ filled: false, active: false }}
        slot3={{ filled: false, active: false }}
        slot4={{ filled: false, active: false }}
      />

      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
          Select Your Character's Type:
        </h2>
        <p className="text-muted-foreground">
          Choose one from below and add it to your Story Magic.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {CHARACTER_TYPES.map((type) => (
          <ChoiceCard
            key={type.id}
            id={type.id}
            label={type.label}
            imageSrc={type.image}
            selected={selectedType === type.id || (type.id === 'Surprise' && selectedType !== '' && selectedType !== 'Surprise')}
            onSelect={() => handleSelect(type.id, type.image)}
          />
        ))}
      </div>

      <CreateNavBar
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!selectedType}
      />
    </div>
  );
};
