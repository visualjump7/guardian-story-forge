import { cn } from '@/lib/utils';

interface ChoiceCardProps {
  id: string;
  label: string;
  imageSrc: string;
  selected: boolean;
  hasSelection?: boolean;
  onSelect: () => void;
  gradientType?: 'character' | 'story' | 'mission' | 'art';
}

export const ChoiceCard = ({ label, imageSrc, selected, hasSelection, onSelect, gradientType }: ChoiceCardProps) => {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-300',
        'bg-card hover:bg-card/80',
        selected
          ? [
              'border-2 scale-[1.02]',
              gradientType === 'character' && 'border-gradient-character-end shadow-gradient-character-glow',
              gradientType === 'story' && 'border-gradient-story-end shadow-gradient-story-glow',
              gradientType === 'mission' && 'border-gradient-mission-end shadow-gradient-mission-glow',
              gradientType === 'art' && 'border-gradient-art-end shadow-gradient-art-glow',
              !gradientType && 'border-story-choice-selected shadow-lg shadow-story-choice-selected/20',
            ]
          : 'border-2 border-story-choice-default hover:border-story-choice-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
      aria-pressed={selected}
    >
      <div
        className={cn(
          'w-full aspect-square rounded-lg overflow-hidden transition-all duration-300 relative',
          'group-hover:scale-105',
          selected && [
            'ring-2 ring-offset-2 ring-offset-card',
            gradientType === 'character' && 'ring-gradient-character-end',
            gradientType === 'story' && 'ring-gradient-story-end',
            gradientType === 'mission' && 'ring-gradient-mission-end',
            gradientType === 'art' && 'ring-gradient-art-end',
            !gradientType && 'ring-story-choice-selected',
          ]
        )}
      >
        <img
          src={imageSrc}
          alt={label}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay on hover */}
        <div className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300',
          gradientType === 'character' && 'bg-gradient-character',
          gradientType === 'story' && 'bg-gradient-story',
          gradientType === 'mission' && 'bg-gradient-mission',
          gradientType === 'art' && 'bg-gradient-art',
        )} />
        {/* Dimming overlay for unselected cards */}
        {hasSelection && !selected && (
          <div className="absolute inset-0 bg-black/50 transition-opacity duration-300 z-10" />
        )}
      </div>
      <span className={cn(
        "text-sm font-bold text-center font-fredoka transition-opacity duration-300",
        selected && gradientType === 'character' && 'text-gradient-character',
        selected && gradientType === 'story' && 'text-gradient-story',
        selected && gradientType === 'mission' && 'text-gradient-mission',
        selected && gradientType === 'art' && 'text-gradient-art',
        !selected && 'text-foreground',
        hasSelection && !selected && 'opacity-50'
      )}>
        {label}
      </span>
    </button>
  );
};
