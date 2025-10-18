import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, BookOpen } from "lucide-react";
import logo from "@/assets/guardian-kids-logo.png";
import { FixedFeedbackButton } from "@/components/FixedFeedbackButton";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex items-center justify-center">
        <div className="relative z-10 container mx-auto px-4 text-center space-y-12">
          {/* Guardian Kids Logo */}
          <div className="flex justify-center animate-fade-in">
            <img 
              src={logo} 
              alt="Guardian Kids" 
              className="w-[500px] md:w-[700px] max-w-full h-auto"
            />
          </div>
          
          {/* Buttons */}
          <div className="flex flex-col items-center justify-center gap-6 pt-8">
            <Button
              variant="warm"
              size="lg"
              onClick={() => navigate("/auth?mode=signup")}
              className="shadow-2xl text-xl px-16 py-8 min-w-[300px]"
            >
              <Sparkles className="w-6 h-6" />
              Start Your Adventure
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/auth?mode=login")}
              className="bg-transparent border-2 border-primary text-primary hover:bg-primary/10 shadow-xl text-xl px-16 py-8 min-w-[300px]"
            >
              <BookOpen className="w-6 h-6" />
              Sign In
            </Button>
            
            {/* Forgot Password Link */}
            <button
              onClick={() => navigate("/auth")}
              className="text-primary/80 hover:text-primary text-sm mt-2 underline-offset-4 hover:underline transition-colors"
            >
              Forgot your password?
            </button>
            
            {/* Beta Version */}
            <div className="text-sm font-medium mt-3 bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 bg-clip-text text-transparent">
              Beta Preview v0.7
            </div>
            
            {/* Powered by Phantom Link */}
            <a
              href="https://www.phantomservices.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/60 hover:text-primary/80 text-xs mt-4 transition-colors"
            >
              Powered by Phantom
            </a>
          </div>
        </div>
      </section>
      <FixedFeedbackButton />
    </div>
  );
};

export default Index;
