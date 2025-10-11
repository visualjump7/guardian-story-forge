import { Sparkles } from 'lucide-react';

interface TraySlot {
  filled: boolean;
  imageSrc?: string;
  label?: string;
  active?: boolean;
  onClick?: () => void;
}

interface StoryMagicTrayProps {
  slot1: TraySlot;
  slot2: TraySlot;
  slot3: TraySlot;
}

export const StoryMagicTray = ({ slot1, slot2, slot3 }: StoryMagicTrayProps) => {
  const renderSlot = (slot: TraySlot, index: number) => {
    const isClickable = !!slot.onClick;

    return (
      <div
        key={index}
        className={`
          flex flex-col items-center gap-2 transition-all duration-300
          ${slot.active ? 'scale-105' : ''}
        `}
      >
        <div
          onClick={isClickable ? slot.onClick : undefined}
          className={`
            w-20 h-20 rounded-xl flex items-center justify-center
            transition-all duration-300
            ${isClickable ? 'cursor-pointer hover:opacity-75' : ''}
            ${
              slot.filled
                ? 'bg-card border-2 border-story-magic-active animate-scale-in shadow-lg shadow-primary/50'
                : 'bg-card/50 border-2 border-dashed border-story-magic-empty'
            }
            ${slot.active && slot.filled ? 'ring-2 ring-story-magic-active ring-offset-2 ring-offset-background' : ''}
          `}
        >
          {slot.filled && slot.imageSrc ? (
            <img
              src={slot.imageSrc}
              alt={slot.label || 'Story element'}
              className="w-full h-full object-cover rounded-lg animate-fade-in"
            />
          ) : (
            <Sparkles className="w-8 h-8 text-muted-foreground/30" />
          )}
        </div>
        {slot.label && (
          <span className="text-xs font-medium text-center text-foreground/80">
            {slot.label}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-primary mb-4 text-center">
        Your Story Magic
      </h3>
      <div className="flex justify-center items-start">
        <div className="flex gap-4">
          {renderSlot(slot1, 1)}
          {renderSlot(slot2, 2)}
          {renderSlot(slot3, 3)}
        </div>
      </div>
    </div>
  );
};
