import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, StoryType } from '@/contexts/StoryConfigContext';
import { StoryMagicTray } from '@/components/create/StoryMagicTray';
import { ChoiceCard } from '@/components/create/ChoiceCard';
import { CreateNavBar } from '@/components/create/CreateNavBar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CornerDownLeft, Pencil } from 'lucide-react';
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
  const [isInputConfirmed, setIsInputConfirmed] = useState<boolean>(false);

  useEffect(() => {
    setSelectedType(storyConfig.storyType || '');
    setCustomInput(storyConfig.customStoryTypeDescription || '');
  }, [storyConfig.storyType, storyConfig.customStoryTypeDescription]);

  const handleCustomInputChange = (value: string) => {
    const previousValue = customInput;
    setCustomInput(value);
    setInputError('');
    setIsInputConfirmed(false);
    
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

  const handleConfirmInput = () => {
    const trimmedInput = customInput.trim();
    if (!trimmedInput) return;
    
    const validation = validateContent(trimmedInput);
    if (!validation.isValid) {
      setInputError(validation.message || 'Invalid input');
      return;
    }
    
    setCustomStoryTypeDescription(trimmedInput);
    setStoryType('Surprise' as StoryType, surpriseImg);
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
    setCustomStoryTypeDescription('');
    setIsInputConfirmed(false);
    
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
      <CreateNavBar
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!isContinueEnabled()}
      />

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
          <span className="bg-primary/10 text-primary px-2 py-1 rounded font-medium">CHOOSE ABOVE</span>
        </p>

        {/* Custom Story Type Description Input */}
        <div className="mb-6 max-w-2xl mx-auto">
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
                placeholder="Describe your story... (e.g., a magical adventure in an enchanted forest) - optional"
                maxLength={80}
                className={`min-h-[60px] resize-none bg-black border-2 text-white placeholder:text-gray-500 pr-12 ${
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
              
              <div className="flex justify-between items-center mt-1 text-xs">
                {inputError ? (
                  <span className="text-red-500">{inputError}</span>
                ) : customInput.trim() ? (
                  <span className="text-muted-foreground">Press Enter or click ↵ to confirm</span>
                ) : (
                  <span className="text-muted-foreground">Custom story descriptions help personalize your tale</span>
                )}
                <span className={`${customInput.length >= 70 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
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
              <p className="text-xs text-primary mt-2">✓ Custom story type confirmed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
