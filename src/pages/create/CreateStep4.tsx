import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig, Mission } from '@/contexts/StoryConfigContext';
import { HeroImage } from '@/components/create/HeroImage';
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

  useEffect(() => {
    setSelectedMission(storyConfig.mission || '');
  }, [storyConfig.mission]);

  const handleSelect = (missionId: string, image: string) => {
    let finalMission: Mission;
    let finalImage = image;

    if (missionId === 'Surprise') {
      const randomIndex = Math.floor(Math.random() * 5);
      const randomChoice = MISSION_OPTIONS[randomIndex];
      finalMission = randomChoice.id as Mission;
      finalImage = surpriseImg;
    } else {
      finalMission = missionId as Mission;
    }

    setSelectedMission(missionId === 'Surprise' ? 'Surprise' : finalMission);
    setMission(finalMission, finalImage);
  };

  const handleSlotClick = () => {
    setSelectedMission('');
    clearMission();
  };

  const handleContinue = () => {
    navigate('/create/05');
  };

  const handleBack = () => {
    navigate('/create/03');
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <HeroImage />

      <StoryMagicTray
        slot1={{
          filled: !!storyConfig.characterType,
          imageSrc: storyConfig.assets.characterTypeIcon || undefined,
          label: storyConfig.characterType || undefined,
          active: false,
        }}
        slot2={{
          filled: !!storyConfig.storyType,
          imageSrc: storyConfig.assets.storyTypeIcon || undefined,
          label: storyConfig.storyType || undefined,
          active: false,
        }}
        slot3={{
          filled: !!selectedMission,
          imageSrc: storyConfig.assets.missionIcon || undefined,
          label: selectedMission === 'Surprise' ? 'Surprise Me!' : selectedMission,
          active: true,
          onClick: handleSlotClick,
        }}
        slot4={{ filled: false, active: false }}
      />

      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-story-heading mb-2">
          What is the Mission?
        </h1>
        <p className="text-muted-foreground">
          Choose the mission for your story and add it to your Story Magic.
        </p>
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

      <CreateNavBar
        onBack={handleBack}
        onContinue={handleContinue}
        continueDisabled={!selectedMission}
      />
    </div>
  );
};
