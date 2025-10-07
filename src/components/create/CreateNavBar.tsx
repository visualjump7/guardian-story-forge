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
  backLabel = '< Back',
  continueLabel = 'Continue >',
  continueDisabled = false,
  showBack = true,
}: CreateNavBarProps) => {
  return (
    <div className="flex justify-between items-center gap-4 mt-8 pt-6 border-t border-border">
      {showBack && onBack ? (
        <Button
          variant="outline"
          onClick={onBack}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {backLabel}
        </Button>
      ) : (
        <div />
      )}
      {onContinue && (
        <Button
          onClick={onContinue}
          disabled={continueDisabled}
          className="gap-2"
        >
          {continueLabel}
        </Button>
      )}
    </div>
  );
};
