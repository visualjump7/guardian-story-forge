import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChoiceButtonProps {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const ChoiceButton = ({ text, onClick, disabled, className }: ChoiceButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      size="lg"
      variant="magical"
      className={cn(
        'w-full text-left justify-start h-auto py-4 px-6 whitespace-normal',
        'transition-all duration-300 hover:scale-[1.02]',
        'shadow-md hover:shadow-lg',
        className
      )}
    >
      {text}
    </Button>
  );
};
