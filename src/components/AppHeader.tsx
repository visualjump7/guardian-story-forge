import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Wand2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileNav } from "@/components/MobileNav";
import headerLogo from "@/assets/guardian-kids-logo-header.png";

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
            <Button variant="ghost" onClick={() => navigate(backPath)} className="text-yellow-500 hover:bg-white/10 hover:text-yellow-400">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          )}
          {!isMobile ? (
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/home')}>
              <img src={headerLogo} alt="Guardian Kids" className="h-12 w-auto" />
              <div>
                <p className="text-sm text-white/70">
                  Welcome back, {profile?.display_name || "Guardian"}!
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
              <img src={headerLogo} alt="Guardian Kids" className="h-8 w-auto" />
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
            </>
          )}
        </div>
      </div>
    </header>
  );
};
