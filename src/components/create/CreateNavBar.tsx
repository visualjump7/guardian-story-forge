import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface CreateNavBarProps {
  onBack?: () => void;
  onContinue?: () => void;
  backLabel?: string;
  continueLabel?: string;
  continueDisabled?: boolean;
  showBack?: boolean;
}

export const CreateNavBar = ({
  onBack,
  onContinue,
  backLabel = 'Back',
  continueLabel = 'Continue >',
  continueDisabled = false,
  showBack = true,
}: CreateNavBarProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2 md:gap-3 mb-3 md:mb-4">
      {showBack && onBack ? (
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2 w-full md:w-auto text-base md:text-lg py-4 md:py-3"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          {backLabel}
        </Button>
      ) : (
        <div className="hidden md:block" />
      )}
      {onContinue && (
        <Button
          onClick={onContinue}
          disabled={continueDisabled}
          className={`gap-2 w-full md:w-auto text-base md:text-lg py-4 md:py-3 ${
            continueDisabled 
              ? 'border border-gray-700 text-gray-400 bg-transparent hover:bg-transparent' 
              : ''
          }`}
        >
          {continueLabel}
        </Button>
      )}
    </div>
  );
};
