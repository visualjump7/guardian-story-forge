import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { ArrowLeft, Loader2 } from 'lucide-react';

interface StoryPart {
  nodeId: string;
  storyText: string;
  imageUrl: string;
  choiceA?: string;
  choiceB?: string;
  isEnding: boolean;
}

interface UserChoice {
  part1?: string;
  part1Text?: string;
  part2?: string;
  part2Text?: string;
}

export const InteractiveStoryView = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [storyParts, setStoryParts] = useState<StoryPart[]>([]);
  const [currentPart, setCurrentPart] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [storyMetadata, setStoryMetadata] = useState<{ 
    genre: string; 
    heroName: string;
    title: string;
  } | null>(null);
  const [userChoices, setUserChoices] = useState<UserChoice>({});
  
  const lastPartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitialStory();
  }, [storyId]);

  useEffect(() => {
    if (lastPartRef.current && storyParts.length > 1) {
      setTimeout(() => {
        lastPartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [storyParts.length]);

  const loadInitialStory = async () => {
    try {
      // Get story metadata
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('hero_name, story_type, title')
        .eq('id', storyId)
        .single();

      if (storyError) throw storyError;

      setStoryMetadata({
        genre: story.story_type || 'Action',
        heroName: story.hero_name || 'Hero',
        title: story.title || 'Your Adventure',
      });

      // Get the start node (Part 1)
      const { data: startNode, error: nodeError } = await supabase
        .from('story_nodes')
        .select('*')
        .eq('story_id', storyId)
        .eq('is_start_node', true)
        .single();

      if (nodeError) throw nodeError;

      // Get choices for Part 1
      const { data: choices, error: choicesError } = await supabase
        .from('story_choices')
        .select('*')
        .eq('from_node_id', startNode.id)
        .order('choice_order');

      if (choicesError) throw choicesError;

      setStoryParts([{
        nodeId: startNode.id,
        storyText: startNode.content,
        imageUrl: startNode.image_url || `https://placehold.co/800x800/1a1a1a/white?text=${story.story_type}`,
        choiceA: choices[0]?.choice_text,
        choiceB: choices[1]?.choice_text,
        isEnding: false,
      }]);

    } catch (error: any) {
      console.error('Error loading story:', error);
      toast({
        title: "Error Loading Story",
        description: "Could not load your story. Please try again.",
        variant: "destructive",
      });
      navigate('/library');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoice = async (choice: 'A' | 'B') => {
    setIsGenerating(true);
    
    const currentNode = storyParts[storyParts.length - 1];
    const choiceText = choice === 'A' ? currentNode.choiceA : currentNode.choiceB;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      if (currentPart === 1) {
        // Generate Part 2
        console.log('Generating Part 2 with choice:', choice);
        
        const { data, error } = await supabase.functions.invoke('generate-story-part-2', {
          body: {
            storyId,
            parentNodeId: currentNode.nodeId,
            selectedChoice: choice,
            choiceText,
            genre: storyMetadata?.genre,
            heroName: storyMetadata?.heroName,
            part1Context: currentNode.storyText,
          },
        });

        if (error) throw error;

        setStoryParts(prev => [...prev, {
          nodeId: data.nodeId,
          storyText: data.storyText,
          imageUrl: data.imageUrl,
          choiceA: data.choiceA,
          choiceB: data.choiceB,
          isEnding: false,
        }]);

        setUserChoices(prev => ({ 
          ...prev, 
          part1: choice,
          part1Text: choiceText,
        }));
        setCurrentPart(2);

      } else if (currentPart === 2) {
        // Generate Part 3 (Ending)
        console.log('Generating Part 3 ending');
        
        const part1 = storyParts[0];
        const part2 = storyParts[1];

        const { data, error } = await supabase.functions.invoke('generate-story-part-3', {
          body: {
            storyId,
            parentNodeId: currentNode.nodeId,
            selectedChoice: choice,
            choiceText,
            genre: storyMetadata?.genre,
            heroName: storyMetadata?.heroName,
            part1Context: part1.storyText,
            part2Context: part2.storyText,
            part1ChoiceMade: userChoices.part1Text,
            part2ChoiceMade: choiceText,
          },
        });

        if (error) throw error;

        setStoryParts(prev => [...prev, {
          nodeId: data.nodeId,
          storyText: data.storyText,
          imageUrl: data.imageUrl,
          isEnding: true,
        }]);

        setUserChoices(prev => ({ 
          ...prev, 
          part2: choice,
          part2Text: choiceText,
        }));
        setCurrentPart(3);
      }

      toast({
        title: "Story Continued!",
        description: "Your adventure grows...",
      });

    } catch (error: any) {
      console.error('Error generating story part:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Unable to continue story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <LoadingAnimation />;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/library')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Library
          </Button>
          <h1 className="font-aoboshi text-lg md:text-xl">
            {storyMetadata?.title}
          </h1>
          <div className="w-24" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Story Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {storyParts.map((part, index) => (
          <div
            key={part.nodeId}
            ref={index === storyParts.length - 1 ? lastPartRef : null}
            className="story-part space-y-6"
          >
            {/* Image */}
            <div className="w-full aspect-square rounded-xl overflow-hidden shadow-2xl">
              <img
                src={part.imageUrl}
                alt={`Part ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Story Text */}
            <div className="prose prose-invert max-w-none">
              <p className="text-lg md:text-xl leading-relaxed whitespace-pre-wrap">
                {part.storyText}
              </p>
            </div>

            {/* Choices (if not ending) */}
            {!part.isEnding && part.choiceA && part.choiceB && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => handleChoice('A')}
                  disabled={isGenerating}
                  className="relative p-6 rounded-xl border-4 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: getGenreColor(storyMetadata?.genre || 'Action'),
                    background: 'rgba(9, 9, 9, 0.9)',
                  }}
                >
                  <div className="text-left">
                    <div className="text-sm font-bold mb-2" style={{ color: getGenreColor(storyMetadata?.genre || 'Action') }}>
                      Choice A
                    </div>
                    <div className="text-white text-base">
                      {part.choiceA}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleChoice('B')}
                  disabled={isGenerating}
                  className="relative p-6 rounded-xl border-4 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    borderColor: getGenreColor(storyMetadata?.genre || 'Action'),
                    background: 'rgba(9, 9, 9, 0.9)',
                  }}
                >
                  <div className="text-left">
                    <div className="text-sm font-bold mb-2" style={{ color: getGenreColor(storyMetadata?.genre || 'Action') }}>
                      Choice B
                    </div>
                    <div className="text-white text-base">
                      {part.choiceB}
                    </div>
                  </div>
                </button>
              </div>
            )}

            {/* Loading state */}
            {isGenerating && index === storyParts.length - 1 && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-lg text-gray-400">Generating your next adventure...</p>
              </div>
            )}
          </div>
        ))}

        {/* End of Story Actions */}
        {storyParts.length > 0 && storyParts[storyParts.length - 1].isEnding && !isGenerating && (
          <div className="flex flex-col md:flex-row gap-4 justify-center pt-8">
            <Button
              size="lg"
              onClick={() => navigate('/create/01')}
              className="text-lg"
            >
              Create Another Story
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/library')}
              className="text-lg"
            >
              Back to Library
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

function getGenreColor(genre: string): string {
  const colors: Record<string, string> = {
    'Action': '#FFE500',
    'Agent': '#6C2C2A',
    'Fantasy': '#005AFF',
    'Fairy Tale': '#9994F8',
    'Explorer': '#94F8B4',
    'Superhero': '#E62222',
  };
  return colors[genre] || '#FFAE00';
}

export default InteractiveStoryView;
