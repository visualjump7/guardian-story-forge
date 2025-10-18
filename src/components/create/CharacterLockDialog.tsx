import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Lock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CharacterLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterName: string;
  characterType: string;
  customDescription?: string;
  onConfirm: (characterSheet: any) => void;
}

export function CharacterLockDialog({
  open,
  onOpenChange,
  characterName,
  characterType,
  customDescription,
  onConfirm
}: CharacterLockDialogProps) {
  const [userBasics, setUserBasics] = useState(customDescription || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleLockAndContinue = async () => {
    setIsGenerating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('augment-character-sheet', {
        body: {
          characterName,
          characterType,
          userBasics: userBasics.trim()
        }
      });

      if (error) throw error;

      const characterSheet = {
        user_provided: {
          name: characterName,
          basics: userBasics.trim()
        },
        ai_augmented: data.augmented,
        locked: true,
        locked_at: new Date().toISOString()
      };

      onConfirm(characterSheet);
      toast.success('Character look locked! Your images will be consistent.');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Character augmentation error:', error);
      toast.error(error.message || 'Failed to lock character look');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSkip = () => {
    // Create minimal character sheet
    const characterSheet = {
      user_provided: {
        name: characterName,
        basics: userBasics.trim() || `${characterType} character`
      },
      ai_augmented: null,
      locked: false,
      locked_at: new Date().toISOString()
    };
    
    onConfirm(characterSheet);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Lock Character Look
          </DialogTitle>
          <DialogDescription>
            Define how <strong>{characterName}</strong> looks to ensure all images match perfectly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="appearance">Character Appearance (Optional)</Label>
            <Textarea
              id="appearance"
              placeholder="e.g., red curly hair, green eyes, freckles, wears a blue cape..."
              value={userBasics}
              onChange={(e) => setUserBasics(e.target.value)}
              maxLength={150}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {userBasics.length}/150 characters
            </p>
          </div>

          <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                Our AI will enhance your description to create a detailed reference for consistent artwork across all images.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSkip}
            disabled={isGenerating}
          >
            Skip for Now
          </Button>
          <Button 
            onClick={handleLockAndContinue} 
            disabled={isGenerating}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin" />
                Locking...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Lock & Continue
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}