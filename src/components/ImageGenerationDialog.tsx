import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ImageGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (customPrompt: string) => Promise<void>;
  storyContent: string;
  heroName: string;
  imageCount: number;
  artStyle: string;
}

const contentSafetyKeywords = [
  "violence", "violent", "blood", "weapon", "gun", "knife", "scary", "horror",
  "death", "kill", "adult", "inappropriate", "explicit", "dangerous"
];

const positiveThemes = [
  "magical", "adventure", "friendship", "learning", "discovery", "wonder",
  "exploration", "teamwork", "courage", "kindness", "imagination", "joy"
];

export function ImageGenerationDialog({
  open,
  onOpenChange,
  onGenerate,
  storyContent,
  heroName,
  imageCount,
  artStyle,
}: ImageGenerationDialogProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [suggestedPrompt, setSuggestedPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationError, setValidationError] = useState("");

  const getImageTypeLabel = () => {
    if (imageCount === 0) return "Cover Image";
    if (imageCount === 1) return "Scene Image";
    return "Ending Image";
  };

  const getImageTypeDescription = () => {
    if (imageCount === 0) return "This will be the main cover illustration for your story";
    if (imageCount === 1) return "This will show a key moment from the middle of your story";
    return "This will show the conclusion of your story";
  };

  const generateSuggestedPrompt = () => {
    const storyExcerpt = storyContent.slice(0, 500);
    
    let prompt = "";
    if (imageCount === 0) {
      // Cover image - focus on hero and setting
      prompt = `A beautiful ${artStyle} style illustration showing ${heroName || "the young hero"} in a magical setting. The hero should look friendly and adventurous, ready to begin an exciting journey. Bright, colorful, and child-friendly.`;
    } else if (imageCount === 1) {
      // Scene image - middle action
      prompt = `A ${artStyle} style scene showing ${heroName || "the hero"} in the middle of an exciting adventure. Depict a magical moment full of wonder and discovery. Keep it bright, positive, and appropriate for children ages 8-10.`;
    } else {
      // Ending image - conclusion
      prompt = `A ${artStyle} style illustration showing ${heroName || "the hero"} celebrating success at the end of their journey. The scene should feel triumphant, joyful, and heartwarming. Perfect for children ages 8-10.`;
    }
    
    return prompt;
  };

  useEffect(() => {
    if (open) {
      const suggested = generateSuggestedPrompt();
      setSuggestedPrompt(suggested);
      setCustomPrompt(suggested);
      setValidationError("");
    }
  }, [open, imageCount, storyContent, heroName, artStyle]);

  const validatePrompt = (prompt: string): boolean => {
    const lowerPrompt = prompt.toLowerCase();
    
    // Check for unsafe content
    for (const keyword of contentSafetyKeywords) {
      if (lowerPrompt.includes(keyword)) {
        setValidationError(
          `Please avoid using "${keyword}" - Let's keep this story magical and kid-friendly! Try focusing on ${positiveThemes[Math.floor(Math.random() * positiveThemes.length)]} instead.`
        );
        return false;
      }
    }

    // Check minimum length
    if (prompt.trim().length < 20) {
      setValidationError("Please provide a more detailed description (at least 20 characters)");
      return false;
    }

    // Check maximum length
    if (prompt.length > 500) {
      setValidationError("Description is too long (maximum 500 characters)");
      return false;
    }

    setValidationError("");
    return true;
  };

  const handlePromptChange = (value: string) => {
    setCustomPrompt(value);
    validatePrompt(value);
  };

  const handleGenerate = async () => {
    if (!validatePrompt(customPrompt)) {
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerate(customPrompt);
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setCustomPrompt(suggestedPrompt);
    setValidationError("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Sparkles className="w-6 h-6 text-primary" />
            Create New Illustration
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base">{getImageTypeLabel()}</span>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  Image {imageCount + 1} of 3
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{getImageTypeDescription()}</p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Content Safety Guidelines */}
          <Alert className="border-primary/20 bg-primary/5">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              <strong className="font-semibold">Kid-Friendly Content Guidelines:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>✨ Focus on magical, positive, and inspiring themes</li>
                <li>🎨 Keep descriptions bright, colorful, and age-appropriate (8-10 years)</li>
                <li>🌟 Emphasize adventure, friendship, learning, and discovery</li>
                <li>🚫 Avoid scary, violent, or inappropriate content</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Image Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Image Description</label>
            <Textarea
              value={customPrompt}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="Describe the image you'd like to create..."
              className="min-h-[120px] resize-none"
              disabled={isGenerating}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{customPrompt.length} / 500 characters</span>
              {customPrompt !== suggestedPrompt && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="h-auto p-1 text-xs"
                  disabled={isGenerating}
                >
                  Reset to Suggested
                </Button>
              )}
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <Alert variant="destructive" className="py-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{validationError}</AlertDescription>
            </Alert>
          )}

          {/* Positive Suggestions */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Suggested themes to try:</p>
            <div className="flex flex-wrap gap-2">
              {positiveThemes.slice(0, 6).map((theme) => (
                <span
                  key={theme}
                  className="text-xs px-2 py-1 rounded-full bg-secondary/10 text-secondary cursor-pointer hover:bg-secondary/20 transition-colors"
                  onClick={() => {
                    if (!isGenerating && !customPrompt.toLowerCase().includes(theme)) {
                      handlePromptChange(customPrompt + ` ${theme}`);
                    }
                  }}
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !!validationError || !customPrompt.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
