import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generationMode: 'express' | 'studio';
  setGenerationMode: (mode: 'express' | 'studio') => void;
  modeChanged: boolean;
  setModeChanged: (changed: boolean) => void;
}

export const OptionsDialog = ({
  open,
  onOpenChange,
  generationMode,
  setGenerationMode,
  modeChanged,
  setModeChanged,
}: OptionsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white font-inter text-xl">Story Options</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-bold text-white font-inter">
              Image Quality
            </h3>

            <div className="flex items-center justify-center gap-4">
              <div className={`flex items-center gap-2 transition-opacity ${
                generationMode === 'express' ? 'opacity-100' : 'opacity-50'
              }`}>
                <span className="font-semibold text-white font-inter text-sm">Built for Speed</span>
              </div>

              <Switch
                checked={generationMode === 'studio'}
                onCheckedChange={(checked) => {
                  setGenerationMode(checked ? 'studio' : 'express');
                  setModeChanged(true);
                }}
              />

              <div className={`flex items-center gap-2 transition-opacity ${
                generationMode === 'studio' ? 'opacity-100' : 'opacity-50'
              }`}>
                <span className="font-semibold text-white font-inter text-sm">Big Time Studio</span>
              </div>
            </div>

            {modeChanged && generationMode === 'express' && (
              <Alert className="bg-slate-800 text-white border-slate-700 w-full">
                <AlertDescription className="text-white text-xs">
                  <span className="font-medium">Fast generation</span> - Images ready in ~10 seconds
                </AlertDescription>
              </Alert>
            )}

            {generationMode === 'studio' && (
              <Alert className="bg-slate-800 text-white border-slate-700 w-full">
                <AlertDescription className="text-white text-xs">
                  <span className="font-medium">Premium quality</span> - Studio-grade images. Takes 1-2 minutes per image.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
