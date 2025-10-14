import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoryNode {
  id: string;
  story_id: string;
  node_key: string;
  title: string | null;
  content: string;
  image_url: string | null;
  is_start_node: boolean;
  is_ending_node: boolean;
  created_at: string;
}

export const useStoryNodes = (storyId: string | undefined) => {
  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!storyId) {
      setLoading(false);
      return;
    }
    loadNodes();
  }, [storyId]);

  const loadNodes = async () => {
    if (!storyId) return;
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('story_nodes')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at');
      
      if (fetchError) throw fetchError;
      setNodes(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading story nodes:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStartNode = () => nodes.find(node => node.is_start_node);

  return { nodes, loading, error, refetch: loadNodes, getStartNode };
};
