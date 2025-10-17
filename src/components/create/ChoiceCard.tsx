import { cn } from '@/lib/utils';

interface ChoiceCardProps {
  id: string;
  label: string;
  imageSrc: string;
  selected: boolean;
  hasSelection?: boolean;
  onSelect: () => void;
}

export const ChoiceCard = ({ label, imageSrc, selected, hasSelection, onSelect }: ChoiceCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300',
        'bg-card hover:bg-card/80 border-2',
        selected
          ? 'border-story-choice-selected shadow-lg shadow-story-choice-selected/20 scale-[1.02]'
          : 'border-story-choice-default hover:border-story-choice-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
      aria-pressed={selected}
    >
      <div
        className={cn(
          'w-full aspect-square rounded-lg overflow-hidden transition-transform duration-300 relative',
          'group-hover:scale-105',
          selected && 'ring-2 ring-story-choice-selected ring-offset-2 ring-offset-card'
        )}
      >
        <img
          src={imageSrc}
          alt={label}
          className="w-full h-full object-cover"
        />
        {/* Dimming overlay for unselected cards */}
        {hasSelection && !selected && (
          <div className="absolute inset-0 bg-black/50 transition-opacity duration-300 z-10" />
        )}
      </div>
      <span className={cn(
        "text-sm font-bold text-center text-foreground font-fredoka transition-opacity duration-300",
        hasSelection && !selected && 'opacity-50'
      )}>
        {label}
      </span>
    </button>
  );
};
