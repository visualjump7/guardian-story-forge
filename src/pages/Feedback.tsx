import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Feedback = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    loadJotFormScript();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    setProfile(profileData);
    setLoading(false);
  };

  const loadJotFormScript = () => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jotfor.ms/s/umd/latest/for-form-embed-handler.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.jotformEmbedHandler) {
        window.jotformEmbedHandler(
          "iframe[id='JotFormIFrame-252323717423048']", 
          "https://form.jotform.com/"
        );
      }
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <AppHeader 
        profile={profile}
        isAdmin={isAdmin}
        showBackButton={true}
        backPath="/home"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-poppins font-bold text-foreground">
              Beta Feedback
            </h1>
            <p className="text-muted-foreground text-lg">
              Help us improve Guardian Kids by sharing your thoughts and suggestions!
            </p>
          </div>

          <div className="bg-card rounded-lg shadow-lg overflow-hidden">
            <iframe
              id="JotFormIFrame-252323717423048"
              title="Beta Feedback Form"
              onLoad={() => {
                window.parent.scrollTo(0, 0);
              }}
              allowTransparency={true}
              allow="geolocation; microphone; camera; fullscreen; payment"
              src="https://form.jotform.com/252323717423048"
              frameBorder="0"
              className="w-full min-h-[539px] md:min-h-[600px] border-none"
              scrolling="no"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Feedback;
