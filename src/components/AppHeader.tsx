import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Wand2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNav } from "@/components/MobileNav";

interface AppHeaderProps {
  showBackButton?: boolean;
  backPath?: string;
  title?: string;
  rightContent?: React.ReactNode;
  profile?: any;
  isAdmin?: boolean;
}

export const AppHeader = ({ 
  showBackButton = true, 
  backPath = "/home",
  title,
  rightContent,
  profile,
  isAdmin = false
}: AppHeaderProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <header className="border-b border-white/10 bg-black sticky top-0 z-50 shadow-lg">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && !isMobile && (
            <Button variant="ghost" onClick={() => navigate(backPath)} className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          )}
          {!isMobile ? (
            <div>
              <h1 className="text-2xl font-poppins font-bold text-white">Guardian Kids</h1>
              <p className="text-sm text-white/70">
                Welcome back, {profile?.display_name || "Guardian"}!
              </p>
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-poppins font-bold text-white">Guardian Kids</h1>
              <p className="text-xs text-white/70">
                {profile?.display_name || "Guardian"}
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isMobile ? (
            <>
              <Button
                variant="default"
                size="icon"
                onClick={() => navigate("/create/01")}
                className="rounded-full shadow-lg"
              >
                <Wand2 className="w-5 h-5" />
              </Button>
              <MobileNav profile={profile} isAdmin={isAdmin} />
            </>
          ) : (
            <>
              {rightContent}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/profile")}
                className="rounded-full text-white hover:bg-white/10"
              >
                <User className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
