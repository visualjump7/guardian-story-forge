import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import logo from "@/assets/guardian-kids-logo.png";
import bgImage from "@/assets/BG-Sign_In.jpg";
import { z } from "zod";
import { FixedFeedbackButton } from "@/components/FixedFeedbackButton";

// Input validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  password: z.string().min(1, 'Password is required'),
});

const signupSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  displayName: z.string().trim().min(1, 'Display name is required').max(50, 'Display name too long'),
  authorName: z.string().trim().max(50, 'Author name too long').optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("mode") !== "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const mode = searchParams.get("mode");
    setIsLogin(mode !== "signup");
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs before submission
      if (isLogin) {
        const validation = loginSchema.safeParse({ email, password });
        if (!validation.success) {
          const firstError = validation.error.errors[0];
          toast.error(firstError.message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: validation.data.email,
          password: validation.data.password,
        });
        if (error) throw error;
        sessionStorage.setItem('showWelcomeVideo', 'true');
        toast.success("Welcome back to Guardian Kids!");
        navigate("/home");
      } else {
        const validation = signupSchema.safeParse({ 
          email, 
          password, 
          displayName, 
          authorName: authorName || undefined 
        });
        
        if (!validation.success) {
          const firstError = validation.error.errors[0];
          toast.error(firstError.message);
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email: validation.data.email,
          password: validation.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: {
              display_name: validation.data.displayName,
              author_name: validation.data.authorName || null,
            },
          },
        });
        if (error) throw error;
        sessionStorage.setItem('showWelcomeVideo', 'true');
        toast.success("Welcome to Guardian Kids! Your account is ready.");
        navigate("/home");
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-bottom bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <Card className="w-full max-w-md shadow-2xl border-0 bg-black/80">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-3xl font-poppins font-bold text-white">
            {isLogin ? "Welcome Back!" : "Join Guardian Kids"}
          </CardTitle>
          <CardDescription className="text-base text-gray-300">
            {isLogin
              ? "Ready for more magical stories?"
              : "Start your storytelling adventure today"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-gray-200">Your Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Enter your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="authorName" className="text-gray-200">Your Author Display Name</Label>
                  <Input
                    id="authorName"
                    type="text"
                    placeholder="Enter your author name (optional)"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="rounded-xl h-12"
                  />
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-xl h-12"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              variant="magical"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                "Loading..."
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {isLogin ? "Sign In" : "Create Account"}
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-gray-300 hover:text-white hover:underline font-medium"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
            
            {/* Powered by Phantom Link */}
            <div className="mt-4">
              <a
                href="https://www.phantomservices.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
              >
                Powered by Phantom
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
      <FixedFeedbackButton />
    </div>
  );
};

export default Auth;
