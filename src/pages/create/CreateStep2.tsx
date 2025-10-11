import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, CharacterType } from '@/contexts/StoryConfigContext';
import { HeroImage } from '@/components/create/HeroImage';
import { StoryMagicTray } from '@/components/create/StoryMagicTray';
import { ChoiceCard } from '@/components/create/ChoiceCard';
import { CreateNavBar } from '@/components/create/CreateNavBar';
import { Textarea } from '@/components/ui/textarea';
import { validateContent } from '@/utils/contentFilter';

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
  const { storyConfig, setCharacterType, clearCharacterType, setCustomCharacterDescription } = useStoryConfig();
  const [selectedType, setSelectedType] = useState<string>(storyConfig.characterType || '');
  const [customInput, setCustomInput] = useState<string>(storyConfig.customCharacterDescription || '');
  const [inputError, setInputError] = useState<string>('');

  useEffect(() => {
    if (storyConfig.characterType) {
      setSelectedType(storyConfig.characterType);
    }
    if (storyConfig.customCharacterDescription) {
      setCustomInput(storyConfig.customCharacterDescription);
    }
  }, [storyConfig.characterType, storyConfig.customCharacterDescription]);

  const handleCustomInputChange = (value: string) => {
    setCustomInput(value);
    setInputError('');
    
    // Clear card selection when typing
    if (value.trim()) {
      setSelectedType('');
    }
  };

  const handleCustomInputBlur = () => {
    const trimmedInput = customInput.trim();
    
    if (!trimmedInput) {
      setCustomCharacterDescription('');
      return;
    }

    const validation = validateContent(trimmedInput);
    if (!validation.isValid) {
      setInputError(validation.message || 'Invalid input');
      return;
    }

    // Valid custom input - set as "Surprise" type
    setCustomCharacterDescription(trimmedInput);
    setCharacterType('Surprise' as CharacterType, surpriseImg);
    setSelectedType('Surprise');
  };

  const handleSelect = (typeId: string, image: string) => {
    // Clear custom input when selecting a card
    setCustomInput('');
    setInputError('');
    setCustomCharacterDescription('');

    if (typeId === 'Surprise') {
      setSelectedType('Surprise');
      setCharacterType('Surprise' as CharacterType, surpriseImg);
    } else {
      setSelectedType(typeId);
      setCharacterType(typeId as CharacterType, image);
    }
  };

  const handleSlotClick = () => {
    setSelectedType('');
    setCustomInput('');
    setInputError('');
    clearCharacterType();
  };

  const handleSlot2Click = () => {
    navigate('/create/03');
  };

  const handleSlot3Click = () => {
    navigate('/create/04');
  };

  const handleContinue = () => {
    // Validate custom input one more time before continuing
    if (customInput.trim()) {
      const validation = validateContent(customInput.trim());
      if (!validation.isValid) {
        setInputError(validation.message || 'Invalid input');
        return;
      }
    }
    navigate('/create/03');
  };

  const isContinueEnabled = () => {
    if (customInput.trim()) {
      const validation = validateContent(customInput.trim());
      return validation.isValid;
    }
    return !!selectedType;
  };

  const handleBack = () => {
    navigate('/create/01');
  };

  return (
    <div className="w-full">
      <HeroImage />

      <CreateNavBar
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!isContinueEnabled()}
      />

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

      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
          Who is Your Character?
        </h2>
        <p className="text-muted-foreground mb-4">
          Tell us about your character or choose a character type below.
        </p>

        {/* Custom Character Description Input */}
        <div className="mb-6">
          <div className="relative">
            <Textarea
              value={customInput}
              onChange={(e) => handleCustomInputChange(e.target.value)}
              onBlur={handleCustomInputBlur}
              placeholder="Describe your character... (e.g., a brave young wizard with a pet dragon)"
              maxLength={200}
              className={`bg-black border-2 text-white placeholder:text-gray-500 min-h-[100px] resize-none ${
                inputError 
                  ? 'border-red-500 focus-visible:ring-red-500' 
                  : customInput.trim() 
                  ? 'border-primary focus-visible:ring-primary'
                  : 'border-gray-700 focus-visible:ring-ring'
              }`}
            />
            <div className="flex items-center justify-between mt-2">
              <div className="text-sm">
                {inputError ? (
                  <span className="text-red-500">{inputError}</span>
                ) : customInput.trim() ? (
                  <span className="text-primary">✓ Custom character saved</span>
                ) : (
                  <span className="text-muted-foreground">Or select a character type below</span>
                )}
              </div>
              <span className={`text-sm ${customInput.length >= 180 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                {customInput.length}/200
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
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
    </div>
  );
};
