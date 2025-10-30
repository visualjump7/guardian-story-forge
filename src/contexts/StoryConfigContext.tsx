import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Simplified types for branched story system
export type StoryKind = 'Action' | 'Agent' | 'Fantasy' | 'Fairy Tale' | 'Explorer' | 'Superhero';
export type ArtStyle = '3d' | 'illustration' | 'storybook' | 'clay' | 'black-white' | 'anime';
export type GenerationMode = 'express' | 'studio';

interface StoryConfig {
  characterName: string;
  storyKind: StoryKind | null;
  artStyle: ArtStyle | null;
  generationMode: GenerationMode;
  assets: {
    storyKindIcon: string | null;
    artStyleIcon: string | null;
  };
}

interface StoryConfigContextType {
  storyConfig: StoryConfig;
  setCharacterName: (name: string) => void;
  setStoryKind: (kind: StoryKind, icon: string) => void;
  setArtStyle: (style: ArtStyle, icon: string) => void;
  setGenerationMode: (mode: GenerationMode) => void;
  clearStoryKind: () => void;
  clearArtStyle: () => void;
  resetConfig: () => void;
  isStep1Complete: () => boolean;
  isStep2Complete: () => boolean;
  isStep3Complete: () => boolean;
}

const defaultConfig: StoryConfig = {
  characterName: '',
  storyKind: null,
  artStyle: null,
  generationMode: 'express',
  assets: {
    storyKindIcon: null,
    artStyleIcon: null,
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

  const setStoryKind = (kind: StoryKind, icon: string) => {
    setStoryConfig(prev => ({
      ...prev,
      storyKind: kind,
      assets: { ...prev.assets, storyKindIcon: icon },
    }));
  };


  const clearStoryKind = () => {
    setStoryConfig(prev => ({
      ...prev,
      storyKind: null,
      assets: { ...prev.assets, storyKindIcon: null },
    }));
  };


  const setArtStyle = (style: ArtStyle, icon: string) => {
    setStoryConfig(prev => ({
      ...prev,
      artStyle: style,
      assets: { ...prev.assets, artStyleIcon: icon },
    }));
  };

  const clearArtStyle = () => {
    setStoryConfig(prev => ({
      ...prev,
      artStyle: null,
      assets: { ...prev.assets, artStyleIcon: null },
    }));
  };

  const setGenerationMode = (mode: GenerationMode) => {
    setStoryConfig(prev => ({ ...prev, generationMode: mode }));
  };

  const resetConfig = () => {
    setStoryConfig(defaultConfig);
    localStorage.removeItem('storyConfig');
  };

  const isStep1Complete = () => {
    return storyConfig.characterName.length >= 2 && storyConfig.characterName.length <= 24;
  };

  const isStep2Complete = () => {
    return storyConfig.storyKind !== null;
  };

  const isStep3Complete = () => {
    return storyConfig.artStyle !== null;
  };

  return (
    <StoryConfigContext.Provider
      value={{
        storyConfig,
        setCharacterName,
        setStoryKind,
        setArtStyle,
        setGenerationMode,
        clearStoryKind,
        clearArtStyle,
        resetConfig,
        isStep1Complete,
        isStep2Complete,
        isStep3Complete,
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
