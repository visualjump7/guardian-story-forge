import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, Mission } from '@/contexts/StoryConfigContext';
import { StoryMagicTray } from '@/components/create/StoryMagicTray';
import { ChoiceCard } from '@/components/create/ChoiceCard';
import { CreateNavBar } from '@/components/create/CreateNavBar';

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
  const { storyConfig, setMission, clearMission } = useStoryConfig();
  const [selectedMission, setSelectedMission] = useState<string>(storyConfig.mission || '');
  const [animateSlot, setAnimateSlot] = useState(false);

  useEffect(() => {
    setSelectedMission(storyConfig.mission || '');
  }, [storyConfig.mission]);

  const handleSelect = (missionId: string, image: string) => {
    setSelectedMission(missionId);
    setMission(missionId as Mission, image);
    
    setAnimateSlot(true);
    setTimeout(() => setAnimateSlot(false), 800);
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
    return !!selectedMission;
  };

  const handleBack = () => {
    navigate('/create/03');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
    <CreateNavBar
      onBack={handleBack}
      onContinue={handleContinue}
      continueDisabled={!isContinueEnabled()}
      continuePulse={!!selectedMission}
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
          justFilled: animateSlot,
          onClick: handleSlotClick,
        }}
      />

      <div className="text-center mb-3 md:mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-story-heading font-chewy">
          What is the Mission?
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 mb-4">
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
