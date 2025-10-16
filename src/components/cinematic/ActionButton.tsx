import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  icon: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "default" | "secondary" | "dark";
}

export const ActionButton = ({ 
  icon: Icon, 
  children, 
  onClick, 
  disabled, 
  loading,
  variant = "default" 
}: ActionButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "px-6 py-6 rounded-full font-semibold text-base transition-all duration-300",
        variant === "default" && "bg-gradient-to-br from-accent to-primary hover:shadow-[0_8px_24px_rgba(255,140,66,0.4),0_0_40px_rgba(255,140,66,0.2)] hover:-translate-y-1",
        variant === "secondary" && "bg-card hover:bg-card/80",
        variant === "dark" && "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-[#000] hover:shadow-[0_0_20px_rgba(255,184,0,0.5)] active:scale-95"
      )}
    >
      {loading ? (
        <Icon className="w-5 h-5 animate-spin" />
      ) : (
        <Icon className="w-5 h-5" />
      )}
      <span className="ml-2">{children}</span>
    </Button>
  );
};
