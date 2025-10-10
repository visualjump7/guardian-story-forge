import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Library, Wand2, User, MessageSquare, LogOut, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MobileNavProps {
  profile: any;
  isAdmin?: boolean;
}

export const MobileNav = ({ profile, isAdmin = false }: MobileNavProps) => {
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
        <Button variant="ghost" size="icon">
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-4 mt-6">
          {/* Profile Section */}
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

          {/* Menu Items */}
          <Button
            variant="outline"
            className="justify-start h-12 text-base border-gray-700 text-gray-400"
            onClick={() => handleNavigation("/create/01")}
          >
            <Wand2 className="w-5 h-5 mr-3" />
            Create A Story
          </Button>
          
          <Button
            variant="outline"
            className="justify-start h-12 text-base border-gray-700 text-gray-400"
            onClick={() => handleNavigation("/library")}
          >
            <Library className="w-5 h-5 mr-3" />
            My Library
          </Button>
          
          <Button
            variant="outline"
            className="justify-start h-12 text-base border-gray-700 text-gray-400"
            onClick={() => handleNavigation("/profile")}
          >
            <User className="w-5 h-5 mr-3" />
            Profile
          </Button>
          
          <Button
            variant="outline"
            className="justify-start h-12 text-base border-gray-700 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
            onClick={() => handleNavigation("/feedback")}
          >
            <MessageSquare className="w-5 h-5 mr-3" />
            Send Feedback
          </Button>

          {isAdmin && (
              <Button
                variant="outline"
                className="justify-start h-12 text-base border-gray-700 text-gray-400"
                onClick={() => handleNavigation("/admin/dashboard")}
              >
                <Shield className="w-5 h-5 mr-3" />
                Admin Dashboard
              </Button>
          )}

          <div className="mt-auto pt-4 border-t">
            <Button
              variant="ghost"
              className="justify-start h-12 text-base w-full text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
