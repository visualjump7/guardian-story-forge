import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CharacterType = 'Explorer' | 'Super Hero' | 'Creature' | 'Robot' | 'Warrior' | 'Surprise';
export type StoryType = 'Adventure' | 'Mystery' | 'Magical' | 'Epic' | 'Space' | 'Surprise';
export type Mission = 'Rescue' | 'Treasure' | 'Protect' | 'Ranch' | 'Escape';
export type WritingStyle = 
  | 'interactive-playful'
  | 'rhyming-rhythmic'
  | 'conversational-casual'
  | 'descriptive-immersive'
  | 'action-packed'
  | 'gentle-reassuring'
  | 'Surprise';

interface StoryConfig {
  characterName: string;
  characterType: CharacterType | null;
  storyType: StoryType | null;
  mission: Mission | null;
  writingStyle: WritingStyle | null;
  customCharacterDescription?: string;
  customStoryTypeDescription?: string;
  customMissionDescription?: string;
  assets: {
    characterTypeIcon: string | null;
    storyTypeIcon: string | null;
    missionIcon: string | null;
    writingStyleIcon: string | null;
  };
}

interface StoryConfigContextType {
  storyConfig: StoryConfig;
  setCharacterName: (name: string) => void;
  setCharacterType: (type: CharacterType, icon: string) => void;
  setStoryType: (type: StoryType, icon: string) => void;
  setMission: (mission: Mission, icon: string) => void;
  setWritingStyle: (style: WritingStyle, icon: string) => void;
  setCustomCharacterDescription: (description: string) => void;
  setCustomStoryTypeDescription: (description: string) => void;
  setCustomMissionDescription: (description: string) => void;
  clearCharacterType: () => void;
  clearStoryType: () => void;
  clearMission: () => void;
  clearWritingStyle: () => void;
  resetConfig: () => void;
  isStep1Complete: () => boolean;
  isStep2Complete: () => boolean;
  isStep3Complete: () => boolean;
  isStep4Complete: () => boolean;
  isStep4_5Complete: () => boolean;
}

const defaultConfig: StoryConfig = {
  characterName: '',
  characterType: null,
  storyType: null,
  mission: null,
  writingStyle: null,
  customCharacterDescription: undefined,
  customStoryTypeDescription: undefined,
  customMissionDescription: undefined,
  assets: {
    characterTypeIcon: null,
    storyTypeIcon: null,
    missionIcon: null,
    writingStyleIcon: null,
  },
};

const StoryConfigContext = createContext<StoryConfigContextType | undefined>(undefined);

export const StoryConfigProvider = ({ children }: { children: ReactNode }) => {
  const [storyConfig, setStoryConfig] = useState<StoryConfig>(() => {
    const saved = localStorage.getItem('storyConfig');
    return saved ? JSON.parse(saved) : defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem('storyConfig', JSON.stringify(storyConfig));
  }, [storyConfig]);

  const setCharacterName = (name: string) => {
    setStoryConfig(prev => ({ ...prev, characterName: name }));
  };

  const setCharacterType = (type: CharacterType, icon: string) => {
    setStoryConfig(prev => ({
      ...prev,
      characterType: type,
      customCharacterDescription: undefined, // Clear custom description when card is selected
      assets: { ...prev.assets, characterTypeIcon: icon },
    }));
  };

  const setStoryType = (type: StoryType, icon: string) => {
    setStoryConfig(prev => ({
      ...prev,
      storyType: type,
      assets: { ...prev.assets, storyTypeIcon: icon },
    }));
  };

  const setMission = (mission: Mission, icon: string) => {
    setStoryConfig(prev => ({
      ...prev,
      mission: mission,
      assets: { ...prev.assets, missionIcon: icon },
    }));
  };

  const setCustomCharacterDescription = (description: string) => {
    setStoryConfig(prev => ({
      ...prev,
      customCharacterDescription: description,
    }));
  };

  const setCustomStoryTypeDescription = (description: string) => {
    setStoryConfig(prev => ({
      ...prev,
      customStoryTypeDescription: description,
    }));
  };

  const setCustomMissionDescription = (description: string) => {
    setStoryConfig(prev => ({
      ...prev,
      customMissionDescription: description,
    }));
  };

  const clearCharacterType = () => {
    setStoryConfig(prev => ({
      ...prev,
      characterType: null,
      customCharacterDescription: undefined,
      assets: { ...prev.assets, characterTypeIcon: null },
    }));
  };

  const clearStoryType = () => {
    setStoryConfig(prev => ({
      ...prev,
      storyType: null,
      assets: { ...prev.assets, storyTypeIcon: null },
    }));
  };

  const clearMission = () => {
    setStoryConfig(prev => ({
      ...prev,
      mission: null,
      assets: { ...prev.assets, missionIcon: null },
    }));
  };

  const setWritingStyle = (style: WritingStyle, icon: string) => {
    setStoryConfig(prev => ({
      ...prev,
      writingStyle: style,
      assets: { ...prev.assets, writingStyleIcon: icon },
    }));
  };

  const clearWritingStyle = () => {
    setStoryConfig(prev => ({
      ...prev,
      writingStyle: null,
      assets: { ...prev.assets, writingStyleIcon: null },
    }));
  };

  const resetConfig = () => {
    setStoryConfig(defaultConfig);
    localStorage.removeItem('storyConfig');
  };

  const isStep1Complete = () => {
    return storyConfig.characterName.length >= 2 && storyConfig.characterName.length <= 24;
  };

  const isStep2Complete = () => {
    return storyConfig.characterType !== null || (storyConfig.customCharacterDescription && storyConfig.customCharacterDescription.trim().length > 0);
  };

  const isStep3Complete = () => {
    return storyConfig.storyType !== null;
  };

  const isStep4Complete = () => {
    return storyConfig.mission !== null;
  };

  const isStep4_5Complete = () => {
    return storyConfig.writingStyle !== null;
  };

  return (
    <StoryConfigContext.Provider
      value={{
        storyConfig,
        setCharacterName,
        setCharacterType,
        setStoryType,
        setMission,
        setWritingStyle,
        setCustomCharacterDescription,
        setCustomStoryTypeDescription,
        setCustomMissionDescription,
        clearCharacterType,
        clearStoryType,
        clearMission,
        clearWritingStyle,
        resetConfig,
        isStep1Complete,
        isStep2Complete,
        isStep3Complete,
        isStep4Complete,
        isStep4_5Complete,
      }}
    >
      {children}
    </StoryConfigContext.Provider>
  );
};

export const useStoryConfig = () => {
  const context = useContext(StoryConfigContext);
  if (!context) {
    throw new Error('useStoryConfig must be used within StoryConfigProvider');
  }
  return context;
};
