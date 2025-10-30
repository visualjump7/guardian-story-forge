import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingAnimation } from '@/components/LoadingAnimation';

interface Story {
  id: string;
  title: string;
  hero_name: string;
  genre: string;
  art_style: string;
  current_part: number;
  is_complete: boolean;
}

interface StoryPart {
  id: string;
  part_number: number;
  content: string;
}

interface StoryChoice {
  id: string;
  after_part: number;
  choice_number: number;
  choice_text: string;
  was_selected: boolean;
}

export default function InteractiveStory() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [story, setStory] = useState<Story | null>(null);
  const [parts, setParts] = useState<StoryPart[]>([]);
  const [choices, setChoices] = useState<StoryChoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadStory();
  }, [storyId]);

  const loadStory = async () => {
    try {
      // Load story metadata
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single();

      if (storyError) throw storyError;
      setStory(storyData);

      // Load story parts
      const { data: partsData, error: partsError } = await supabase
        .from('story_parts')
        .select('*')
        .eq('story_id', storyId)
        .order('part_number', { ascending: true });

      if (partsError) throw partsError;
      setParts(partsData || []);

      // Load choices
      const { data: choicesData, error: choicesError } = await supabase
        .from('story_choices')
        .select('*')
        .eq('story_id', storyId)
        .order('after_part', { ascending: true })
        .order('choice_number', { ascending: true });

      if (choicesError) throw choicesError;
      setChoices(choicesData || []);

      // If no parts exist, generate Part 1
      if (!partsData || partsData.length === 0) {
        await generatePart1(storyData);
      }
    } catch (error: any) {
      console.error('Error loading story:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load story',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePart1 = async (storyData: Story) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-story-part-1', {
        body: { storyId: storyData.id },
      });

      if (error) throw error;

      // Reload story data
      await loadStory();

      toast({
        title: 'Story Started!',
        description: 'Your adventure begins...',
      });
    } catch (error: any) {
      console.error('Error generating Part 1:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate story',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChoiceClick = async (choiceId: string, afterPart: number) => {
    setIsGenerating(true);
    try {
      const functionName = afterPart === 1 ? 'generate-story-part-2' : 'generate-story-part-3';
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { storyId, selectedChoiceId: choiceId },
      });

      if (error) throw error;

      // Reload story data
      await loadStory();

      toast({
        title: 'Story Continues!',
        description: afterPart === 1 ? 'Part 2 generated' : 'Your story is complete!',
      });
    } catch (error: any) {
      console.error('Error generating next part:', error);
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to continue story',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingAnimation />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8">
          <p className="text-xl mb-4">Story not found</p>
          <Button onClick={() => navigate('/home')}>Return Home</Button>
        </Card>
      </div>
    );
  }

  const currentChoices = choices.filter(
    (c) => c.after_part === story.current_part && !c.was_selected
  );

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{story.title}</h1>
            <p className="text-muted-foreground">
              Part {story.current_part} of 3 • {story.genre} Story
            </p>
          </div>

          {/* Story Content */}
          {isGenerating ? (
            <div className="py-12">
              <LoadingAnimation />
              <p className="text-center mt-4 text-muted-foreground">
                Generating your story...
              </p>
            </div>
          ) : (
            <>
              <div className="prose prose-lg max-w-none mb-8">
                {parts.map((part) => (
                  <div key={part.id} className="mb-6">
                    <p className="whitespace-pre-wrap">{part.content}</p>
                  </div>
                ))}
              </div>

              {/* Choices */}
              {!story.is_complete && currentChoices.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">What happens next?</h3>
                  <div className="grid gap-4">
                    {currentChoices.map((choice) => (
                      <Button
                        key={choice.id}
                        onClick={() => handleChoiceClick(choice.id, choice.after_part)}
                        className="p-6 h-auto text-left justify-start"
                        variant="outline"
                      >
                        <span className="text-lg">{choice.choice_text}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete */}
              {story.is_complete && (
                <div className="text-center py-8">
                  <h3 className="text-2xl font-bold mb-4">The End</h3>
                  <p className="text-muted-foreground mb-6">
                    Your adventure with {story.hero_name} is complete!
                  </p>
                  <Button onClick={() => navigate('/home')}>Create Another Story</Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
