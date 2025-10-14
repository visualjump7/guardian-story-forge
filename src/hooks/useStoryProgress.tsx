import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface StoryProgress {
  id: string;
  user_id: string;
  story_id: string;
  current_node_id: string;
  path_history: Json;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useStoryProgress = (storyId: string | undefined) => {
  const [progress, setProgress] = useState<StoryProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storyId) {
      setLoading(false);
      return;
    }
    loadProgress();
  }, [storyId]);

  const loadProgress = async () => {
    if (!storyId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_story_progress')
        .select('*')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      setProgress(data);
    } catch (err) {
      console.error('Error loading story progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (currentNodeId: string, pathHistory: string[]) => {
    if (!storyId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_story_progress')
        .upsert({
          user_id: user.id,
          story_id: storyId,
          current_node_id: currentNodeId,
          path_history: pathHistory as unknown as Json,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,story_id'
        });
      
      if (error) throw error;
      await loadProgress();
    } catch (err) {
      console.error('Error saving story progress:', err);
    }
  };

  const resetProgress = async () => {
    if (!storyId || !progress) return;
    
    try {
      const { error } = await supabase
        .from('user_story_progress')
        .delete()
        .eq('id', progress.id);
      
      if (error) throw error;
      setProgress(null);
    } catch (err) {
      console.error('Error resetting story progress:', err);
    }
  };

  return { progress, loading, saveProgress, resetProgress, refetch: loadProgress };
};
