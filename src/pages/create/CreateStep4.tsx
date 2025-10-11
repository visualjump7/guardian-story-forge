import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, Mission } from '@/contexts/StoryConfigContext';
import { HeroImage } from '@/components/create/HeroImage';
import { StoryMagicTray } from '@/components/create/StoryMagicTray';
import { ChoiceCard } from '@/components/create/ChoiceCard';
import { CreateNavBar } from '@/components/create/CreateNavBar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CornerDownLeft, Pencil } from 'lucide-react';
import { validateContent } from '@/utils/contentFilter';

import rescueImg from '@/assets/mission-rescue.jpg';
import treasureImg from '@/assets/mission-treasure.jpg';
import protectImg from '@/assets/mission-protect.jpg';
import ranchImg from '@/assets/mission-ranch.jpg';
import escapeImg from '@/assets/mission-escape.jpg';
import surpriseImg from '@/assets/mission-surprise.jpg';

const MISSION_OPTIONS = [
  { id: 'Rescue', label: 'Rescue', image: rescueImg },
  { id: 'Treasure', label: 'Treasure', image: treasureImg },
  { id: 'Protect', label: 'Protect', image: protectImg },
  { id: 'Ranch', label: 'Ranch', image: ranchImg },
  { id: 'Escape', label: 'Escape', image: escapeImg },
  { id: 'Surprise', label: 'Surprise Me!', image: surpriseImg },
];

export const CreateStep4 = () => {
  const navigate = useNavigate();
  const { storyConfig, setMission, clearMission, setCustomMissionDescription } = useStoryConfig();
  const [selectedMission, setSelectedMission] = useState<string>(storyConfig.mission || '');
  const [customInput, setCustomInput] = useState<string>(storyConfig.customMissionDescription || '');
  const [inputError, setInputError] = useState<string>('');
  const [isInputConfirmed, setIsInputConfirmed] = useState<boolean>(false);

  useEffect(() => {
    setSelectedMission(storyConfig.mission || '');
    setCustomInput(storyConfig.customMissionDescription || '');
  }, [storyConfig.mission, storyConfig.customMissionDescription]);

  const handleCustomInputChange = (value: string) => {
    const previousValue = customInput;
    setCustomInput(value);
    setInputError('');
    setIsInputConfirmed(false);
    
    // When user starts typing (first character), immediately show Surprise icon
    if (value.trim() && !previousValue.trim()) {
      setMission('Surprise' as Mission, surpriseImg);
      setSelectedMission('Surprise');
    }
    
    // Clear icon if user deletes all text
    if (!value.trim() && previousValue.trim()) {
      clearMission();
      setSelectedMission('');
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
    
    setCustomMissionDescription(trimmedInput);
    setMission('Surprise' as Mission, surpriseImg);
    setSelectedMission('Surprise');
    setIsInputConfirmed(true);
    setInputError('');
  };

  const handleEditInput = () => {
    setIsInputConfirmed(false);
  };

  const handleSelect = (missionId: string, image: string) => {
    // Clear custom input when selecting a card
    setCustomInput('');
    setInputError('');
    setCustomMissionDescription('');
    setIsInputConfirmed(false);
    
    if (missionId === 'Surprise') {
      // For surprise, just store 'Surprise' without picking now
      // Actual randomization will happen at story generation time
      setSelectedMission('Surprise');
      setMission('Surprise' as Mission, surpriseImg);
    } else {
      // For normal selections, store the actual type
      setSelectedMission(missionId);
      setMission(missionId as Mission, image);
    }
  };

  const handleSlot1Click = () => {
    navigate('/create/02');
  };

  const handleSlot2Click = () => {
    navigate('/create/03');
  };

  const handleSlotClick = () => {
    setSelectedMission('');
    clearMission();
  };

  const handleContinue = () => {
    navigate('/create/05');
  };

  const isContinueEnabled = () => {
    if (customInput.trim()) {
      const validation = validateContent(customInput);
      return validation.isValid;
    }
    return !!selectedMission;
  };

  const handleBack = () => {
    navigate('/create/03');
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
          filled: !!storyConfig.storyType,
          imageSrc: storyConfig.assets.storyTypeIcon || undefined,
          label: storyConfig.storyType || undefined,
          active: false,
          onClick: handleSlot2Click,
        }}
        slot3={{
          filled: !!selectedMission,
          imageSrc: storyConfig.assets.missionIcon || undefined,
          label: selectedMission === 'Surprise' ? 'Surprise Me!' : selectedMission,
          active: true,
          onClick: handleSlotClick,
        }}
      />

      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-story-heading mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          What is the Mission?
        </h2>
        <p className="text-muted-foreground mb-4">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded font-medium">TYPE HERE</span>
          {' '}or{' '}
          <span className="bg-primary/10 text-primary px-2 py-1 rounded font-medium">CHOOSE BELOW</span>
        </p>

        {/* Custom Mission Description Input */}
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
                placeholder="Describe your mission... (e.g., find the lost crystal in the underwater kingdom) - optional"
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
                  <span className="text-muted-foreground">Custom missions make your story unique</span>
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
              <p className="text-xs text-primary mt-2">✓ Custom mission confirmed</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {MISSION_OPTIONS.map((mission) => (
          <ChoiceCard
            key={mission.id}
            id={mission.id}
            label={mission.label}
            imageSrc={mission.image}
            selected={selectedMission === mission.id}
            onSelect={() => handleSelect(mission.id, mission.image)}
          />
        ))}
      </div>
    </div>
  );
};
