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
import { Menu, Wand2, Library, User, MessageSquare, LogOut, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DesktopNavProps {
  profile: any;
  isAdmin?: boolean;
}

export const DesktopNav = ({ profile, isAdmin = false }: DesktopNavProps) => {
  const navigate = useNavigate();
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
          className="rounded-full text-yellow-500 hover:bg-white/10 hover:text-yellow-400"
        >
          <Menu className="w-6 h-6" strokeWidth={2.5} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-2xl font-poppins">Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-8">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-lg py-6"
            onClick={() => handleNavigation("/create/01")}
          >
            <Wand2 className="w-5 h-5" />
            Create a Story
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-lg py-6"
            onClick={() => handleNavigation("/library")}
          >
            <Library className="w-5 h-5" />
            My Library
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-lg py-6"
            onClick={() => handleNavigation("/profile")}
          >
            <User className="w-5 h-5" />
            Profile
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-lg py-6 border-yellow-500/30 hover:bg-yellow-500/10"
            onClick={() => handleNavigation("/feedback")}
          >
            <MessageSquare className="w-5 h-5" />
            Beta Feedback
          </Button>

          {isAdmin && (
            <>
              <div className="border-t border-border my-2" />
              <Button
                variant="outline"
                className="w-full justify-start gap-3 text-lg py-6"
                onClick={() => handleNavigation("/admin/dashboard")}
              >
                <Shield className="w-5 h-5" />
                Admin Dashboard
              </Button>
            </>
          )}

          <div className="border-t border-border my-2" />
          
          <Button
            variant="destructive"
            className="w-full justify-start gap-3 text-lg py-6"
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
