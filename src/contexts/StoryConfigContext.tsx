import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type CharacterType = 'Explorer' | 'Super Hero' | 'Creature' | 'Robot' | 'Warrior';
export type StoryType = 'Adventure' | 'Mystery' | 'Magical' | 'Epic' | 'Space';
export type Mission = 'Rescue' | 'Treasure' | 'Protect' | 'Ranch' | 'Escape';

interface StoryConfig {
  characterName: string;
  characterType: CharacterType | null;
  storyType: StoryType | null;
  mission: Mission | null;
  assets: {
    characterTypeIcon: string | null;
    storyTypeIcon: string | null;
    missionIcon: string | null;
  };
}

interface StoryConfigContextType {
  storyConfig: StoryConfig;
  setCharacterName: (name: string) => void;
  setCharacterType: (type: CharacterType, icon: string) => void;
  setStoryType: (type: StoryType, icon: string) => void;
  setMission: (mission: Mission, icon: string) => void;
  resetConfig: () => void;
  isStep1Complete: () => boolean;
  isStep2Complete: () => boolean;
  isStep3Complete: () => boolean;
  isStep4Complete: () => boolean;
}

const defaultConfig: StoryConfig = {
  characterName: '',
  characterType: null,
  storyType: null,
  mission: null,
  assets: {
    characterTypeIcon: null,
    storyTypeIcon: null,
    missionIcon: null,
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

  const resetConfig = () => {
    setStoryConfig(defaultConfig);
    localStorage.removeItem('storyConfig');
  };

  const isStep1Complete = () => {
    return storyConfig.characterName.length >= 2 && storyConfig.characterName.length <= 24;
  };

  const isStep2Complete = () => {
    return storyConfig.characterType !== null;
  };

  const isStep3Complete = () => {
    return storyConfig.storyType !== null;
  };

  const isStep4Complete = () => {
    return storyConfig.mission !== null;
  };

  return (
    <StoryConfigContext.Provider
      value={{
        storyConfig,
        setCharacterName,
        setCharacterType,
        setStoryType,
        setMission,
        resetConfig,
        isStep1Complete,
        isStep2Complete,
        isStep3Complete,
        isStep4Complete,
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
