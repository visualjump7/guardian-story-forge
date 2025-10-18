import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { configManager, AgeBandConfig } from '@/services/configManager';
import { toast } from 'sonner';

interface AgeBandContextType {
  selectedBand: 'A' | 'B';
  activeStoryConfig: AgeBandConfig | null;
  isConfigLoaded: boolean;
  refreshBand: () => Promise<void>;
}

const AgeBandContext = createContext<AgeBandContextType | undefined>(undefined);

export const AgeBandProvider = ({ children }: { children: ReactNode }) => {
  const [selectedBand, setSelectedBand] = useState<'A' | 'B'>('A');
  const [activeStoryConfig, setActiveStoryConfig] = useState<AgeBandConfig | null>(null);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);

  const loadBandConfig = async (band: 'A' | 'B') => {
    try {
      const config = await configManager.loadConfig(band);
      setActiveStoryConfig(config);
      setSelectedBand(band);
      setIsConfigLoaded(true);
      console.log(`✓ Age band ${band} config loaded`);
    } catch (error: any) {
      console.error('Failed to load band config:', error);
      toast.error('Story configuration failed to load. Please reload the app.');
      setIsConfigLoaded(false);
    }
  };

  const refreshBand = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Not logged in - default to A
      await loadBandConfig('A');
      return;
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('age_band')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Failed to load profile age_band:', error);
      await loadBandConfig('A'); // Fallback
      return;
    }

    const band = (profile?.age_band === 'B' ? 'B' : 'A') as 'A' | 'B';
    
    // If age_band is null, persist 'A' as default
    if (!profile?.age_band) {
      await supabase
        .from('profiles')
        .update({ age_band: 'A' })
        .eq('id', session.user.id);
    }

    await loadBandConfig(band);
  };

  useEffect(() => {
    refreshBand();
  }, []);

  // Listen for auth changes to reload band
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        refreshBand();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AgeBandContext.Provider value={{ selectedBand, activeStoryConfig, isConfigLoaded, refreshBand }}>
      {children}
    </AgeBandContext.Provider>
  );
};

export const useAgeBand = () => {
  const context = useContext(AgeBandContext);
  if (!context) {
    throw new Error('useAgeBand must be used within AgeBandProvider');
  }
  return context;
};
