import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Wand2 } from "lucide-react";
import logo from "@/assets/guardian-kids-logo.png";
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
    <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button variant="ghost" onClick={() => navigate(backPath)}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          )}
          {title && (
            <div className="flex items-center gap-2">
              <img src={logo} alt="Guardian Kids" className="w-8 h-8" />
              <h1 className="text-xl font-bold text-primary">{title}</h1>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isMobile ? (
            <>
              <Button
                variant="default"
                size="icon"
                onClick={() => navigate("/create")}
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
                className="rounded-full"
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
