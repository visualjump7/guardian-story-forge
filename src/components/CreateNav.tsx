import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, User, MessageSquare, LogOut, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface CreateNavProps {
  profile: any;
  isAdmin?: boolean;
}

export const CreateNav = ({ profile, isAdmin = false }: CreateNavProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={isMobile ? "" : "rounded-full text-yellow-500 hover:bg-white/10 hover:text-yellow-400"}
        >
          <Menu className="w-6 h-6" strokeWidth={isMobile ? 2 : 2.5} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className={isMobile ? "w-[280px]" : "w-[300px] sm:w-[400px]"}>
        <SheetHeader>
          <SheetTitle className={isMobile ? "" : "text-2xl font-poppins"}>Menu</SheetTitle>
        </SheetHeader>
        <div className={`flex flex-col gap-4 ${isMobile ? 'mt-6' : 'mt-8'}`}>
          {/* Profile Section (Mobile Only) */}
          {isMobile && (
            <div className="flex items-center gap-3 pb-4 border-b">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {profile?.display_name || "Guardian"}
                </p>
              </div>
            </div>
          )}

          {/* Menu Items - NO Create Story or Library buttons */}
          <Button
            variant="outline"
            className={`w-full justify-start gap-3 ${isMobile ? 'h-12 text-base' : 'text-lg py-6'} border-gray-700 text-gray-400`}
            onClick={() => handleNavigation("/profile")}
          >
            <User className="w-5 h-5" />
            Profile
          </Button>
          
          <Button
            variant="outline"
            className={`w-full justify-start gap-3 ${isMobile ? 'h-12 text-base' : 'text-lg py-6'} border-gray-700 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400`}
            onClick={() => handleNavigation("/feedback")}
          >
            <MessageSquare className="w-5 h-5" />
            Send Feedback
          </Button>

          {isAdmin && (
            <>
              <div className="border-t border-border my-2" />
              <Button
                variant="outline"
                className={`w-full justify-start gap-3 ${isMobile ? 'h-12 text-base' : 'text-lg py-6'} border-gray-700 text-gray-400`}
                onClick={() => handleNavigation("/admin/dashboard")}
              >
                <Shield className="w-5 h-5" />
                Admin Dashboard
              </Button>
            </>
          )}

          <div className="border-t border-border my-2" />
          
          <Button
            variant={isMobile ? "ghost" : "destructive"}
            className={`w-full justify-start gap-3 ${isMobile ? 'h-12 text-base text-destructive hover:text-destructive' : 'text-lg py-6'}`}
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
