import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, CharacterType } from '@/contexts/StoryConfigContext';
import { HeroImage } from '@/components/create/HeroImage';
import { StoryMagicTray } from '@/components/create/StoryMagicTray';
import { ChoiceCard } from '@/components/create/ChoiceCard';
import { CreateNavBar } from '@/components/create/CreateNavBar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CornerDownLeft, Pencil } from 'lucide-react';
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
  const [isInputConfirmed, setIsInputConfirmed] = useState<boolean>(false);

  useEffect(() => {
    if (storyConfig.characterType) {
      setSelectedType(storyConfig.characterType);
    }
    if (storyConfig.customCharacterDescription) {
      setCustomInput(storyConfig.customCharacterDescription);
    }
  }, [storyConfig.characterType, storyConfig.customCharacterDescription]);

  const handleCustomInputChange = (value: string) => {
    const previousValue = customInput;
    setCustomInput(value);
    setInputError('');
    setIsInputConfirmed(false);
    
    // When user starts typing (first character), immediately show Surprise icon
    if (value.trim() && !previousValue.trim()) {
      setCharacterType('Surprise' as CharacterType, surpriseImg);
      setSelectedType('Surprise');
    }
    
    // Clear icon if user deletes all text
    if (!value.trim() && previousValue.trim()) {
      clearCharacterType();
      setSelectedType('');
    }
  };

  const handleConfirmInput = () => {
    const trimmedInput = customInput.trim();
    if (!trimmedInput) return;
    
    const validation = validateContent(trimmedInput);
    if (!validation.isValid) {
      setInputError(validation.message || 'Invalid input');
      return;
    }
    
    setCustomCharacterDescription(trimmedInput);
    setCharacterType('Surprise' as CharacterType, surpriseImg);
    setSelectedType('Surprise');
    setIsInputConfirmed(true);
    setInputError('');
  };

  const handleEditInput = () => {
    setIsInputConfirmed(false);
  };

  const handleSelect = (typeId: string, image: string) => {
    // Clear custom input when selecting a card
    setCustomInput('');
    setInputError('');
    setCustomCharacterDescription('');
    setIsInputConfirmed(false);

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
          <span className="bg-primary/10 text-primary px-2 py-1 rounded font-medium">TYPE HERE</span>
          {' '}or{' '}
          <span className="bg-primary/10 text-primary px-2 py-1 rounded font-medium">CHOOSE BELOW</span>
        </p>

        {/* Custom Character Description Input */}
        <div className="mb-6">
          {!isInputConfirmed ? (
            // INPUT MODE
            <div className="relative">
              <Textarea
                value={customInput}
                onChange={(e) => handleCustomInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleConfirmInput();
                  }
                }}
                placeholder="Describe your character... (e.g., a brave young wizard) - optional"
                maxLength={80}
                className={`bg-black border-2 text-white placeholder:text-gray-500 min-h-[60px] resize-none pr-12 ${
                  inputError 
                    ? 'border-red-500 focus-visible:ring-red-500' 
                    : customInput.trim() 
                    ? 'border-primary focus-visible:ring-primary'
                    : 'border-gray-700 focus-visible:ring-ring'
                }`}
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleConfirmInput}
                disabled={!customInput.trim() || !!inputError}
                className="absolute right-2 top-2 h-8 w-8 text-primary hover:text-primary/80 disabled:opacity-30"
              >
                <CornerDownLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center justify-between mt-2">
                <div className="text-sm">
                  {inputError ? (
                    <span className="text-red-500">{inputError}</span>
                  ) : customInput.trim() ? (
                    <span className="text-muted-foreground">Press Enter or click ↵ to confirm</span>
                  ) : (
                    <span className="text-muted-foreground">Or select a character type below</span>
                  )}
                </div>
                <span className={`text-sm ${customInput.length >= 70 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {customInput.length}/80
                </span>
              </div>
            </div>
          ) : (
            // CONFIRMED MODE
            <div className="relative bg-black/50 border-2 border-primary/50 rounded-md px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-white text-sm flex-1 leading-relaxed">
                  {customInput}
                </p>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={handleEditInput}
                  className="h-8 w-8 text-primary hover:text-primary/80 shrink-0"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-primary mt-2">✓ Custom character confirmed</p>
            </div>
          )}
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
