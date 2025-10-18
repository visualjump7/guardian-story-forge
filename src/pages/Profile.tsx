import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Save, LogOut, Info } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { FixedFeedbackButton } from "@/components/FixedFeedbackButton";
import { useStoryConfig } from "@/contexts/StoryConfigContext";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  display_name: string;
  author_name: string | null;
  age_band: 'A' | 'B' | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { storyConfig } = useStoryConfig();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [ageBand, setAgeBand] = useState<'A' | 'B'>('B');
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBandSwitchDialog, setShowBandSwitchDialog] = useState(false);
  const [pendingBand, setPendingBand] = useState<'A' | 'B' | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setEmail(session.user.email || "");

    const { data: profileData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      toast.error("Failed to load profile");
      return;
    }

    if (profileData) {
      setProfile(profileData as Profile);
      setDisplayName(profileData.display_name);
      setAuthorName(profileData.author_name || "");
      setAgeBand((profileData.age_band as 'A' | 'B') || 'B');
    }

    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          author_name: authorName.trim() || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      loadProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Strong password validation (aligned with Auth.tsx)
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      toast.error("Password must contain at least one uppercase letter");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      toast.error("Password must contain at least one number");
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleBandChange = (newBand: 'A' | 'B') => {
    // Check if there's an active story configuration
    const hasActiveStory = storyConfig.characterName.length > 0;
    
    if (hasActiveStory && newBand !== ageBand) {
      setPendingBand(newBand);
      setShowBandSwitchDialog(true);
    } else {
      setAgeBand(newBand);
    }
  };

  const confirmBandSwitch = () => {
    if (pendingBand) {
      setAgeBand(pendingBand);
      setPendingBand(null);
    }
    setShowBandSwitchDialog(false);
  };

  const handleSaveAgeBand = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ age_band: ageBand })
        .eq("id", profile.id);

      if (error) throw error;

      // Emit analytics event
      console.log('Age band changed:', { band: ageBand });
      
      toast.success(`Age band updated to ${ageBand === 'A' ? '5-7' : '8-10'} years!`, {
        description: 'This will apply to all new stories you create.'
      });
      
      loadProfile(); // Refresh to sync state
      
      // Reload the page to apply new config
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Failed to update age band");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">✨</div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <AppHeader profile={profile} isAdmin={isAdmin} />

      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Card className="shadow-2xl border-2">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary to-accent">
                <User className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-4xl font-chewy bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Your Profile
            </CardTitle>
            <CardDescription className="text-lg">
              Manage your account and author information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-chewy">Personal Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Your Name</Label>
                <Input
                  id="displayName"
                  placeholder="Your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  Your name as shown in the app
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorName">Your Author Display Name</Label>
                <Input
                  id="authorName"
                  placeholder="Your author name (optional)"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  This will appear as "Created by [Author Name]" in your stories
                </p>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>

            <Separator />

            {/* Age Band Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-chewy">Age Band</h3>
              <p className="text-sm text-muted-foreground">
                Your choice sets story length, sentence complexity, style packs, art caps, and safety rules.
              </p>
              
              {/* Segmented Toggle Control */}
              <div role="radiogroup" aria-label="Age band selection" className="grid grid-cols-2 gap-4">
                <button
                  role="radio"
                  aria-checked={ageBand === 'A'}
                  onClick={() => handleBandChange('A')}
                  className={cn(
                    "p-4 border-2 rounded-lg transition-all",
                    "focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    ageBand === 'A' 
                      ? "border-primary bg-primary/10 shadow-md" 
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold">A</div>
                    <div className="font-semibold">Ages 5–7</div>
                    <div className="text-xs text-muted-foreground">
                      Shorter pages, simpler vocab, more dialog
                    </div>
                  </div>
                </button>
                
                <button
                  role="radio"
                  aria-checked={ageBand === 'B'}
                  onClick={() => handleBandChange('B')}
                  className={cn(
                    "p-4 border-2 rounded-lg transition-all",
                    "focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    ageBand === 'B' 
                      ? "border-primary bg-primary/10 shadow-md" 
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <div className="text-center space-y-1">
                    <div className="text-2xl font-bold">B</div>
                    <div className="font-semibold">Ages 8–10</div>
                    <div className="text-xs text-muted-foreground">
                      Longer pages, richer vocab, light subplots
                    </div>
                  </div>
                </button>
              </div>

              {/* Info Tooltip */}
              <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
                <Info className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <p className="text-muted-foreground">
                  The age band controls story length, sentence targets, style packs, image caps, and kid-safe rules.
                </p>
              </div>

              <Button
                onClick={handleSaveAgeBand}
                disabled={saving || ageBand === profile?.age_band}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Age Band"}
              </Button>
            </div>

            <Separator />

            {/* Change Password Section */}
            <div className="space-y-4">
              <h3 className="text-xl font-chewy">Change Password</h3>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={saving || !newPassword || !confirmPassword}
                variant="outline"
                className="w-full"
              >
                Change Password
              </Button>
            </div>

            <Separator />

            {/* Sign Out Section */}
            <div className="space-y-4">
              <Button
                onClick={handleSignOut}
                variant="destructive"
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={showBandSwitchDialog} onOpenChange={setShowBandSwitchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch Age Band?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching age band will change style and safety rules for new generations. 
              This applies only to new stories, not existing ones. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingBand(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBandSwitch}>
              Yes, Switch Band
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FixedFeedbackButton />
    </div>
  );
};

export default Profile;
