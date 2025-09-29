import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, Sparkles, Heart, Shield, Wand2 } from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";
import logo from "@/assets/logo.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      {/* Hero Section */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/60 to-primary/80 backdrop-blur-sm" />
        
        <div className="relative z-10 container mx-auto px-4 text-center space-y-8 py-20">
          <div className="flex justify-center mb-8">
            <img
              src={logo}
              alt="Guardian Kids Logo"
              className="w-32 h-32 animate-bounce drop-shadow-2xl"
            />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg animate-fade-in">
            Welcome to Guardian Kids
          </h1>
          
          <p className="text-2xl md:text-3xl text-white/90 max-w-3xl mx-auto drop-shadow-md">
            Where magical stories teach important life lessons
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button
              variant="warm"
              size="lg"
              onClick={() => navigate("/auth")}
              className="shadow-2xl text-xl px-12 py-8"
            >
              <Sparkles className="w-6 h-6" />
              Start Your Adventure
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-white/90 hover:bg-white shadow-xl text-xl px-12 py-8"
            >
              <BookOpen className="w-6 h-6" />
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Why Guardian Kids?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center space-y-4 p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-[var(--shadow-magical)] transition-all hover:scale-105">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-primary to-primary-glow">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Curated Stories</h3>
              <p className="text-lg text-muted-foreground">
                Enjoy beautifully crafted stories with audio, video, and text formats
              </p>
            </div>

            <div className="text-center space-y-4 p-8 rounded-3xl bg-gradient-to-br from-secondary/10 to-secondary/5 hover:shadow-[var(--shadow-warm)] transition-all hover:scale-105">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-secondary to-accent">
                  <Wand2 className="w-12 h-12 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground">AI-Powered Creation</h3>
              <p className="text-lg text-muted-foreground">
                Create personalized stories with your child as the hero using AI magic
              </p>
            </div>

            <div className="text-center space-y-4 p-8 rounded-3xl bg-gradient-to-br from-accent/10 to-accent/5 hover:shadow-[var(--shadow-magical)] transition-all hover:scale-105">
              <div className="flex justify-center">
                <div className="p-4 rounded-full bg-gradient-to-br from-accent to-primary">
                  <Heart className="w-12 h-12 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-foreground">Life Lessons</h3>
              <p className="text-lg text-muted-foreground">
                Every story teaches important values like honesty, kindness, and courage
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary via-primary-glow to-accent">
        <div className="container mx-auto px-4 text-center space-y-8">
          <Shield className="w-20 h-20 text-white mx-auto animate-pulse" />
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Ready to Begin?
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto">
            Join Guardian Kids today and unlock a world of magical stories that teach, inspire, and entertain!
          </p>
          <Button
            variant="warm"
            size="lg"
            onClick={() => navigate("/auth")}
            className="shadow-2xl text-xl px-12 py-8 bg-white text-primary hover:bg-white/90"
          >
            <Sparkles className="w-6 h-6" />
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-card border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2025 Guardian Kids. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
