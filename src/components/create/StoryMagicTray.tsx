import { Sparkles, Wand2 } from 'lucide-react';

interface TraySlot {
  filled: boolean;
  imageSrc?: string;
  label?: string;
  active?: boolean;
}

interface StoryMagicTrayProps {
  slot1: TraySlot;
  slot2: TraySlot;
  slot3: TraySlot;
  slot4?: TraySlot;
}

export const StoryMagicTray = ({ slot1, slot2, slot3, slot4 }: StoryMagicTrayProps) => {
  const renderSlot = (slot: TraySlot, index: number) => {
    const isWandSlot = index === 4;

    return (
      <div
        key={index}
        className={`
          flex flex-col items-center gap-2 transition-all duration-300
          ${slot.active ? 'scale-105' : ''}
        `}
      >
        <div
          className={`
            w-20 h-20 rounded-xl flex items-center justify-center
            transition-all duration-300
            ${
              slot.filled
                ? 'bg-card border-2 border-story-magic-active'
                : 'bg-card/50 border-2 border-dashed border-story-magic-empty'
            }
            ${slot.active ? 'ring-2 ring-story-magic-active ring-offset-2 ring-offset-background' : ''}
            ${isWandSlot && slot.active ? 'bg-story-magic-active/20' : ''}
          `}
        >
          {slot.filled && slot.imageSrc ? (
            <img
              src={slot.imageSrc}
              alt={slot.label || 'Story element'}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : isWandSlot ? (
            <Wand2
              className={`w-10 h-10 ${slot.active ? 'text-story-magic-active animate-pulse' : 'text-muted-foreground/30'}`}
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
      <div className="flex justify-center items-start gap-4 flex-wrap">
        {renderSlot(slot1, 1)}
        {renderSlot(slot2, 2)}
        {renderSlot(slot3, 3)}
        {slot4 && renderSlot(slot4, 4)}
      </div>
    </div>
  );
};
