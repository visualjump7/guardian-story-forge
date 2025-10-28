import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryConfig } from '@/contexts/StoryConfigContext';
import { CreateProgressBar } from '@/components/create/CreateProgressBar';

const NAME_REGEX = /^[a-zA-Z\s'-]+$/;

export default function CreateStep1() {
  const navigate = useNavigate();
  const { storyConfig, setCharacterName } = useStoryConfig();
  const [localName, setLocalName] = useState(storyConfig.characterName);

  const validateName = (name: string): boolean => {
    if (!name.trim()) return false;
    if (name.length < 2) return false;
    if (name.length > 24) return false;
    if (!NAME_REGEX.test(name)) return false;
    return true;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && validateName(localName)) {
      handleContinue();
    }
  };

  const handleContinue = () => {
    if (validateName(localName)) {
      setCharacterName(localName);
      navigate('/create/02');
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-8 lg:px-16">
        {/* Title */}
        <h1 className="font-aoboshi text-4xl md:text-5xl lg:text-6xl text-white mb-16 md:mb-24 text-center">
          Create Your Story...
        </h1>

        {/* Input section */}
        <div className="w-full max-w-3xl flex flex-col items-center gap-4">
          {/* Label */}
          <div className="font-inter text-2xl md:text-3xl lg:text-4xl font-bold text-center">
            <span className="text-white">Enter your </span>
            <span className="text-[#FFAE00]">main character's name.</span>
          </div>

          {/* Input field */}
          <input
            type="text"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder=""
            maxLength={24}
            className="w-full max-w-2xl h-16 px-4 rounded bg-[#D9D9D9] text-black text-xl font-inter focus:outline-none focus:ring-2 focus:ring-[#FFAE00] transition-all"
          />

          {/* Helper text */}
          <p className="font-inter text-xl md:text-2xl text-[#C4C4C4] text-center mt-2">
            Name your main character and start the quest!
          </p>
        </div>
      </div>

      {/* Progress bar at bottom */}
      <div className="pb-8">
        <CreateProgressBar currentStep={1} />
      </div>
    </div>
  );
}
