import { useState } from 'react';
import { ArrowLeft, Plus, RefreshCcw, Edit3, Save, ChevronRight } from 'lucide-react';

interface StoryEditorUIProps {
  initialChapter?: number;
  initialTitle?: string;
  initialContent?: string;
  initialImages?: (string | null)[];
  onSave?: (data: { chapter: number; title: string; content: string }) => void;
  onNext?: () => void;
  onBack?: () => void;
}

export default function StoryEditorUI({
  initialChapter = 1,
  initialTitle = '',
  initialContent = '',
  initialImages = [null, null, null],
  onSave: onSaveProp,
  onNext: onNextProp,
  onBack: onBackProp,
}: StoryEditorUIProps) {
  const [chapter, setChapter] = useState(initialChapter);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [images, setImages] = useState<(string | null)[]>(initialImages);

  const addImage = (index: number) => {
    console.log(`Add image at slot ${index}`);
    // TODO: Open image generation/upload dialog
    // For demo purposes, set a placeholder
    const newImages = [...images];
    newImages[index] = 'placeholder';
    setImages(newImages);
  };

  const onRegen = (index: number) => {
    console.log(`Regenerate image at slot ${index}`);
    // TODO: Call AI regeneration API
  };

  const onPrompt = (index: number) => {
    console.log(`Edit prompt for image at slot ${index}`);
    // TODO: Open prompt editor dialog
  };

  const onSave = () => {
    console.log('Saving story...', { chapter, title, content, images });
    onSaveProp?.({ chapter, title, content });
    // TODO: Save to Supabase stories/story_images tables
  };

  const onNext = () => {
    console.log('Moving to next chapter');
    setChapter(prev => prev + 1);
    onNextProp?.();
    // TODO: Load next chapter data
  };

  const onBack = () => {
    console.log('Back to library');
    onBackProp?.();
    // TODO: Navigate to /library
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Top Bar */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] border-2 border-primary text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
            aria-label="Back to library"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Library</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex-1">
            Edit Your Story: Chapter {chapter}
          </h1>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {images.map((imageUrl, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-xl overflow-hidden bg-secondary/50"
            >
              {!imageUrl ? (
                // Empty state - Add button
                <button
                  onClick={() => addImage(index)}
                  className="w-full h-full flex items-center justify-center border-2 border-dashed border-accent hover:border-accent/80 hover:bg-accent/10 transition-colors"
                  aria-label={`Add image ${index + 1}`}
                >
                  <Plus className="w-12 h-12 text-accent" />
                </button>
              ) : (
                // Filled state - Image with action buttons
                <>
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    {/* Placeholder for actual image */}
                    <span className="text-muted-foreground text-sm">Image {index + 1}</span>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={() => onRegen(index)}
                      className="w-9 h-9 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg hover:bg-background transition-colors"
                      aria-label={`Regenerate image ${index + 1}`}
                    >
                      <RefreshCcw className="w-4 h-4 text-foreground" />
                    </button>
                    <button
                      onClick={() => onPrompt(index)}
                      className="w-9 h-9 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg hover:bg-background transition-colors"
                      aria-label={`Edit prompt for image ${index + 1}`}
                    >
                      <Edit3 className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Title Input */}
        <div className="mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="[Title or Chapter]"
            className="w-full text-2xl md:text-3xl font-bold bg-transparent border-2 border-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/50 focus:outline-none transition-colors"
            aria-label="Chapter title"
          />
        </div>

        {/* Story Content Textarea */}
        <div className="mb-8">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="[Story Content]"
            rows={10}
            className="w-full min-h-[300px] md:min-h-[400px] text-lg md:text-xl leading-relaxed bg-transparent border-2 border-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/50 focus:outline-none transition-colors resize-y"
            aria-label="Story content"
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onSave}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] border-2 border-accent text-accent rounded-xl hover:bg-accent hover:text-accent-foreground transition-colors font-bold text-lg"
            aria-label="Save chapter"
          >
            <Save className="w-5 h-5" />
            <span>Save</span>
          </button>
          <button
            onClick={onNext}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] bg-accent text-accent-foreground rounded-xl hover:bg-accent/90 transition-colors font-bold text-lg"
            aria-label="Go to next chapter"
          >
            <span>Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
