import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChoiceButton } from '@/components/create/ChoiceButton';
import { useStoryNodes, StoryNode } from '@/hooks/useStoryNodes';
import { useStoryChoices } from '@/hooks/useStoryChoices';
import { useStoryProgress } from '@/hooks/useStoryProgress';
import { Loader2, RotateCcw, Share2 } from 'lucide-react';
import { ShareDialog } from '@/components/ShareDialog';
import { cn } from '@/lib/utils';

interface InteractiveStoryViewerProps {
  storyId: string;
  storyTitle: string;
  heroImageUrl?: string;
  onBack?: () => void;
}

export const InteractiveStoryViewer = ({
  storyId,
  storyTitle,
  heroImageUrl,
}: InteractiveStoryViewerProps) => {
  const { nodes, loading: nodesLoading, getStartNode } = useStoryNodes(storyId);
  const [currentNode, setCurrentNode] = useState<StoryNode | null>(null);
  const { choices, loading: choicesLoading } = useStoryChoices(currentNode?.id);
  const { progress, saveProgress, resetProgress } = useStoryProgress(storyId);
  const [visitedNodes, setVisitedNodes] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Initialize story with start node or saved progress
  useEffect(() => {
    if (nodesLoading || nodes.length === 0) return;

    if (progress && progress.current_node_id) {
      // Resume from saved progress
      const savedNode = nodes.find(n => n.id === progress.current_node_id);
      if (savedNode) {
        setCurrentNode(savedNode);
        const pathHistory = Array.isArray(progress.path_history) ? progress.path_history : [];
        setVisitedNodes(pathHistory as string[]);
        return;
      }
    }

    // Start from beginning
    const startNode = getStartNode();
    if (startNode) {
      setCurrentNode(startNode);
      setVisitedNodes([startNode.node_key]);
    }
  }, [nodes, progress, nodesLoading]);

  // Auto-continue for linear nodes (no choices, not an ending)
  useEffect(() => {
    if (!currentNode || currentNode.is_ending_node || choices.length > 0 || isTransitioning) return;

    const findNextSequentialNode = (currentKey: string) => {
      const sequence: Record<string, string> = {
        'start': 'build_up',
        'build_up': 'first_decision',
        'path_a': 'second_decision_a',
        'path_b': 'second_decision_b'
      };
      const nextKey = sequence[currentKey];
      return nodes.find(n => n.node_key === nextKey);
    };

    const nextNode = findNextSequentialNode(currentNode.node_key);
    if (nextNode) {
      const timer = setTimeout(() => {
        handleChoiceClick(nextNode.id);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentNode, choices, isTransitioning, nodes]);

  const handleChoiceClick = async (toNodeId: string) => {
    const nextNode = nodes.find(n => n.id === toNodeId);
    if (!nextNode) return;

    // Trigger fade-out animation
    setIsTransitioning(true);

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 300));

    // Update content
    setCurrentNode(nextNode);
    const newVisitedNodes = [...visitedNodes, nextNode.node_key];
    setVisitedNodes(newVisitedNodes);

    // Save progress
    await saveProgress(nextNode.id, newVisitedNodes);

    // Trigger fade-in
    setIsTransitioning(false);

    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRestart = async () => {
    await resetProgress();
    const startNode = getStartNode();
    if (startNode) {
      setCurrentNode(startNode);
      setVisitedNodes([startNode.node_key]);
      setIsTransitioning(false);
    }
  };

  if (nodesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentNode) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">This interactive story is not yet configured.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Fixed Hero Image Frame */}
        {heroImageUrl && (
          <div className="relative w-full h-[400px] rounded-xl overflow-hidden shadow-lg">
            <img
              src={heroImageUrl}
              alt={storyTitle}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}

        {/* Dynamic Content Area */}
        <Card>
          <CardContent className="p-8 space-y-6">
            {/* Current Node Content with Fade Transition */}
            <div
              className={cn(
                'transition-all duration-300 space-y-4',
                isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
              )}
            >
              {currentNode.title && (
                <h2 className="text-2xl font-poppins font-bold text-foreground">
                  {currentNode.title}
                </h2>
              )}

              <div className="prose prose-lg max-w-none text-foreground/90">
                {currentNode.content.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>

              {currentNode.image_url && (
                <div className="relative w-full h-[300px] rounded-lg overflow-hidden my-6">
                  <img
                    src={currentNode.image_url}
                    alt="Scene illustration"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Decision Point */}
            {!currentNode.is_ending_node && choices.length > 0 && (
              <div className="pt-6 border-t space-y-4">
                <p className="text-lg font-semibold text-foreground">
                  What do you do?
                </p>
                <div className="grid gap-3">
                  {choices.map((choice) => (
                    <ChoiceButton
                      key={choice.id}
                      text={choice.choice_text}
                      onClick={() => handleChoiceClick(choice.to_node_id)}
                      disabled={isTransitioning || choicesLoading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Ending Actions */}
            {currentNode.is_ending_node && (
              <div className="pt-6 border-t space-y-6 text-center">
                <p className="text-3xl font-poppins font-bold text-primary">
                  ~ The End ~
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={handleRestart} size="lg" variant="magical">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Start Over
                  </Button>
                  <Button onClick={() => setShareDialogOpen(true)} size="lg" variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Story
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        storyId={storyId}
        storyTitle={storyTitle}
      />
    </>
  );
};
