import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, StoryType } from '@/contexts/StoryConfigContext';
import { HeroImage } from '@/components/create/HeroImage';
import { StoryMagicTray } from '@/components/create/StoryMagicTray';
import { ChoiceCard } from '@/components/create/ChoiceCard';
import { CreateNavBar } from '@/components/create/CreateNavBar';
import { Textarea } from '@/components/ui/textarea';
import { validateContent } from '@/utils/contentFilter';

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
  const { storyConfig, setStoryType, clearStoryType, setCustomStoryTypeDescription } = useStoryConfig();
  const [selectedType, setSelectedType] = useState<string>(storyConfig.storyType || '');
  const [customInput, setCustomInput] = useState<string>(storyConfig.customStoryTypeDescription || '');
  const [inputError, setInputError] = useState<string>('');

  useEffect(() => {
    setSelectedType(storyConfig.storyType || '');
    setCustomInput(storyConfig.customStoryTypeDescription || '');
  }, [storyConfig.storyType, storyConfig.customStoryTypeDescription]);

  const handleCustomInputChange = (value: string) => {
    const previousValue = customInput;
    setCustomInput(value);
    setInputError('');
    
    // When user starts typing (first character), immediately show Surprise icon
    if (value.trim() && !previousValue.trim()) {
      setStoryType('Surprise' as StoryType, surpriseImg);
      setSelectedType('Surprise');
    }
    
    // Clear icon if user deletes all text
    if (!value.trim() && previousValue.trim()) {
      clearStoryType();
      setSelectedType('');
    }
  };

  const handleCustomInputBlur = () => {
    if (!customInput.trim()) return;
    
    const validation = validateContent(customInput);
    if (!validation.isValid) {
      setInputError(validation.message || 'Invalid input');
      return;
    }
    
    setCustomStoryTypeDescription(customInput);
  };

  const handleSelect = (typeId: string, image: string) => {
    // Clear custom input when selecting a card
    setCustomInput('');
    setInputError('');
    setCustomStoryTypeDescription('');
    
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

  const isContinueEnabled = () => {
    if (customInput.trim()) {
      const validation = validateContent(customInput);
      return validation.isValid;
    }
    return !!selectedType;
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
        continueDisabled={!isContinueEnabled()}
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
        <h2 className="text-3xl md:text-4xl font-bold text-story-heading mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          What Kind of Story?
        </h2>
        <p className="text-muted-foreground mb-4">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded font-medium">TYPE HERE</span>
          {' '}or{' '}
          <span className="bg-primary/10 text-primary px-2 py-1 rounded font-medium">CHOOSE BELOW</span>
        </p>

        {/* Custom Story Type Description Input */}
        <div className="mb-6 max-w-2xl mx-auto">
          <Textarea
            value={customInput}
            onChange={(e) => handleCustomInputChange(e.target.value)}
            onBlur={handleCustomInputBlur}
            placeholder="Describe your story... (e.g., a magical adventure in an enchanted forest) - optional"
            maxLength={80}
            className={`min-h-[60px] resize-none bg-black border-gray-700 text-white ${
              inputError ? 'border-red-500' : ''
            }`}
          />
          <div className="flex justify-between items-center mt-1 text-xs">
            {inputError ? (
              <span className="text-red-500">{inputError}</span>
            ) : (
              <span className="text-muted-foreground">Custom story descriptions help personalize your tale</span>
            )}
            <span className={`${customInput.length >= 70 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
              {customInput.length}/80
            </span>
          </div>
        </div>
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
