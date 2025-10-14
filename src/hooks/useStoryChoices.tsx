import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoryChoice {
  id: string;
  from_node_id: string;
  to_node_id: string;
  choice_text: string;
  choice_order: number;
  created_at: string;
}

export const useStoryChoices = (nodeId: string | undefined) => {
  const [choices, setChoices] = useState<StoryChoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!nodeId) {
      setChoices([]);
      return;
    }
    loadChoices();
  }, [nodeId]);

  const loadChoices = async () => {
    if (!nodeId) return;
    
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('story_choices')
        .select('*')
        .eq('from_node_id', nodeId)
        .order('choice_order');
      
      if (fetchError) throw fetchError;
      setChoices(data || []);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading story choices:', err);
    } finally {
      setLoading(false);
    }
  };

  return { choices, loading, error, refetch: loadChoices };
};
