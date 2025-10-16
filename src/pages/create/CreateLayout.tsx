import { Outlet } from 'react-router-dom';
import { StoryConfigProvider } from '@/contexts/StoryConfigContext';
import { AppHeader } from '@/components/AppHeader';
import { CreateNav } from '@/components/CreateNav';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FixedFeedbackButton } from '@/components/FixedFeedbackButton';

export const CreateLayout = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    setProfile(profileData);
  };

  return (
    <StoryConfigProvider>
      <div className="min-h-screen bg-background">
        <AppHeader 
          profile={profile} 
          isAdmin={isAdmin} 
          showBackButton={false}
          rightContent={<CreateNav profile={profile} isAdmin={isAdmin} />}
        />
        <main className="container max-w-4xl mx-auto px-4 py-4 md:py-6">
          <Outlet />
        </main>
        <FixedFeedbackButton />
      </div>
    </StoryConfigProvider>
  );
};
