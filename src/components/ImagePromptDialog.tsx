import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

interface ImagePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (customizations: string) => void;
  storyTitle: string;
  heroName: string;
  artStyle: string;
  imageType: 'cover' | 'early-scene' | 'mid-scene' | 'climax' | 'ending';
  storyExcerpt: string;
  imageCount: number;
  isGenerating: boolean;
  generationMode: 'express' | 'studio';
  onGenerationModeChange: (mode: 'express' | 'studio') => void;
}

const artStyleLabels: Record<string, string> = {
  'pixar-3d': 'Pixar 3D Style',
  'ghibli-2d': 'Studio Ghibli Style',
  'watercolor': 'Watercolor',
  'classic-disney': 'Classic Disney',
  'modern-cartoon': 'Modern Cartoon',
  'anime': 'Anime Style',
  'comic-book': 'Comic Book Style'
};

const imageTypeLabels: Record<string, { label: string; description: string; icon: string }> = {
  'cover': { 
    label: 'Cover Illustration', 
    description: 'The main cover image for your story',
    icon: '🎨'
  },
  'early-scene': { 
    label: 'Early Scene', 
    description: 'Beginning of the adventure',
    icon: '🌅'
  },
  'mid-scene': { 
    label: 'Mid Scene', 
    description: 'A key moment in the story',
    icon: '⚡'
  },
  'climax': { 
    label: 'Climax Scene', 
    description: 'The peak dramatic moment',
    icon: '🌟'
  },
  'ending': { 
    label: 'Ending Scene', 
    description: 'The story\'s resolution',
    icon: '🌈'
  }
};

export function ImagePromptDialog({
  open,
  onOpenChange,
  onGenerate,
  storyTitle,
  heroName,
  artStyle,
  imageType,
  storyExcerpt,
  imageCount,
  isGenerating,
  generationMode,
  onGenerationModeChange
}: ImagePromptDialogProps) {
  const [corePrompt, setCorePrompt] = useState("");
  const [customizations, setCustomizations] = useState("");
  const [charCount, setCharCount] = useState(0);
  const maxChars = 500;

  // Generate core prompt based on image type and story
  useEffect(() => {
    if (open) {
      const artStylePrompts: Record<string, string> = {
        'pixar-3d': 'vibrant 3D animated illustration in Pixar/DreamWorks style with rich colors and cinematic lighting',
        'ghibli-2d': 'soft watercolor 2D illustration in Studio Ghibli style with gentle brushstrokes and dreamy atmosphere',
        'watercolor': 'gentle watercolor children\'s book illustration with soft edges and delicate color blending',
        'classic-disney': 'traditional hand-drawn 2D animation in classic Disney style with expressive characters',
        'modern-cartoon': 'bold modern 2D cartoon style with clean lines and vibrant colors',
        'anime': 'Japanese anime style illustration with detailed character designs',
        'comic-book': 'dynamic comic book style illustration with bold outlines'
      };

      const styleDescription = artStylePrompts[artStyle] || artStylePrompts['pixar-3d'];
      let generatedPrompt = '';

      if (imageType === 'cover') {
        generatedPrompt = `Create a child-friendly cover illustration in ${styleDescription}. Feature ${heroName} as the main character. Scene: ${storyExcerpt}. Art style: colorful, family-friendly, high-quality with expressive characters and magical atmosphere.`;
      } else if (imageType === 'early-scene') {
        generatedPrompt = `Create an early adventure scene in ${styleDescription}. Feature ${heroName} in this moment: ${storyExcerpt}. Show the beginning of the journey with excitement and anticipation. Child-friendly, colorful illustration.`;
      } else if (imageType === 'mid-scene') {
        generatedPrompt = `Create a mid-story scene in ${styleDescription}. Feature ${heroName} in this key moment: ${storyExcerpt}. Show the action and emotion. Child-friendly, colorful illustration.`;
      } else if (imageType === 'climax') {
        generatedPrompt = `Create a climactic scene in ${styleDescription}. Feature ${heroName} at the peak moment: ${storyExcerpt}. Show the tension and excitement with dramatic visuals. Child-friendly, colorful illustration.`;
      } else {
        generatedPrompt = `Create a resolution scene in ${styleDescription}. Feature ${heroName} in the conclusion: ${storyExcerpt}. Capture the emotional resolution with warmth. Child-friendly, colorful illustration.`;
      }

      setCorePrompt(generatedPrompt);
      setCustomizations("");
      setCharCount(0);
    }
  }, [open, imageType, storyExcerpt, heroName, artStyle]);

  const handleCustomizationsChange = (value: string) => {
    if (value.length <= maxChars) {
      setCustomizations(value);
      setCharCount(value.length);
    }
  };

  const handleGenerate = () => {
    onGenerate(customizations);
  };

  const typeInfo = imageTypeLabels[imageType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <span>{typeInfo.icon}</span>
            Create New Illustration
          </DialogTitle>
          <DialogDescription>
            Describe the image you'd like to generate. Your description will enhance our AI's understanding.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Image Context Info */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">{typeInfo.label} - {typeInfo.description}</p>
                <p className="text-xs text-muted-foreground">
                  This will be image {imageCount + 1} of 5 in "{storyTitle}"
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Style and Character Info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {artStyleLabels[artStyle] || 'Custom Style'}
            </Badge>
            <Badge variant="outline">
              Character: {heroName}
            </Badge>
          </div>

          {/* Generation Mode Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
            <Label className="font-medium">Generation Speed</Label>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${generationMode === 'express' ? 'font-bold' : 'text-muted-foreground'}`}>
                🚀 Express
              </span>
              <Switch 
                checked={generationMode === 'studio'}
                onCheckedChange={(checked) => onGenerationModeChange(checked ? 'studio' : 'express')}
                disabled={isGenerating}
              />
              <span className={`text-sm ${generationMode === 'studio' ? 'font-bold' : 'text-muted-foreground'}`}>
                🎨 Studio
              </span>
            </div>
          </div>

          {generationMode === 'studio' && (
            <Alert className="border-amber-500 bg-amber-50">
              <AlertDescription className="text-sm">
                Studio mode uses premium Leonardo AI for higher quality images. Generation takes 1-2 minutes.
              </AlertDescription>
            </Alert>
          )}

          {/* Customizations Editor */}
          <div className="space-y-2">
            <Label htmlFor="customizations">
              Image Details
              <span className="text-xs text-muted-foreground ml-2">
                ({charCount}/{maxChars} characters)
              </span>
            </Label>
            <Textarea
              id="customizations"
              value={customizations}
              onChange={(e) => handleCustomizationsChange(e.target.value)}
              placeholder="Example: Add more trees in the background, make the sky orange at sunset, include a friendly dog..."
              className="min-h-[120px] resize-none"
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> Describe what you'd like to see in this illustration. Be specific about elements, mood, or composition.
            </p>
          </div>

          {/* Quick Additions */}
          <div className="space-y-2">
            <Label className="text-xs">Quick Additions:</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCustomizationsChange(customizations + (customizations ? " " : "") + "Add more magical elements and sparkles.")}
                disabled={isGenerating}
              >
                + More Magic
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCustomizationsChange(customizations + (customizations ? " " : "") + "Make it more adventurous and exciting.")}
                disabled={isGenerating}
              >
                + More Adventure
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCustomizationsChange(customizations + (customizations ? " " : "") + "Add more vibrant colors and lighting effects.")}
                disabled={isGenerating}
              >
                + More Vibrant
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCustomizationsChange(customizations + (customizations ? " " : "") + "Include more emotional expression and warmth.")}
                disabled={isGenerating}
              >
                + More Emotion
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Illustration
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
