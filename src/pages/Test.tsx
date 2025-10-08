import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";

const Test = () => {
  const [profile, setProfile] = useState<any>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      setProfile(profileData);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <AppHeader profile={profile} isAdmin={isAdmin} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Test Page - Kids Breakout
            </h1>
            <p className="text-muted-foreground">
              Temporary test page for embedded content
            </p>
          </div>

          {/* Genially Embed */}
          <div className="w-full bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="relative pb-[56.25%] pt-0 h-0">
              <iframe 
                title="Kids Breakout" 
                frameBorder="0" 
                width="1200" 
                height="675" 
                className="absolute top-0 left-0 w-full h-full"
                src="https://view.genially.com/68e5cb84af8013d95a80cd98" 
                allowFullScreen={true}
                scrolling="yes"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Test;
