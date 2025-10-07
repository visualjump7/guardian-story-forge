import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroImage } from '@/components/create/HeroImage';
import { StoryMagicTray } from '@/components/create/StoryMagicTray';
import { CreateNavBar } from '@/components/create/CreateNavBar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStoryConfig } from '@/contexts/StoryConfigContext';

const NAME_REGEX = /^[a-zA-Z\s'-]+$/;

export default function CreateStep1() {
  const navigate = useNavigate();
  const { storyConfig, setCharacterName, isStep1Complete } = useStoryConfig();
  const [localName, setLocalName] = useState(storyConfig.characterName);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const validateName = (name: string): string => {
    if (!name.trim()) {
      return 'Please enter your character\'s name';
    }
    if (name.length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (name.length > 24) {
      return 'Name must be less than 24 characters';
    }
    if (!NAME_REGEX.test(name)) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }
    return '';
  };

  const handleNameChange = (value: string) => {
    setLocalName(value);
    if (touched) {
      setError(validateName(value));
    }
  };

  const handleContinue = () => {
    setTouched(true);
    const validationError = validateName(localName);
    if (validationError) {
      setError(validationError);
      return;
    }
    setCharacterName(localName);
    navigate('/create/02');
  };

  const isValid = isStep1Complete() && localName === storyConfig.characterName;

  return (
    <div>
      <HeroImage />

      <StoryMagicTray
        slot1={{ filled: false }}
        slot2={{ filled: false }}
        slot3={{ filled: false }}
        slot4={{ filled: false }}
      />

      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-6 text-primary leading-tight">
          Let's Craft Story Magic…
        </h1>

        <div className="space-y-4 mb-8">
          <Label htmlFor="characterName" className="text-lg font-medium">
            What is your Main Character's Name?
          </Label>
          <Input
            id="characterName"
            type="text"
            value={localName}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Enter your main character's name"
            className={error && touched ? 'border-destructive' : ''}
            maxLength={24}
          />
          {error && touched && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <CreateNavBar
          showBack={false}
          onContinue={handleContinue}
          continueLabel="Let's Begin >"
          continueDisabled={!isValid && (!localName || validateName(localName) !== '')}
        />
      </div>
    </div>
  );
}
