import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

export const FixedFeedbackButton = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate("/feedback");
  };

  return (
    <Button
      onClick={handleClick}
      className={`fixed z-50 shadow-2xl hover:scale-110 transition-transform duration-200 gap-2 font-semibold ${
        isMobile 
          ? "bottom-4 right-4 px-4 py-5 text-sm" 
          : "bottom-6 right-6 px-6 py-6 text-base"
      }`}
      size={isMobile ? "default" : "lg"}
    >
      <MessageSquare className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
      Feedback
    </Button>
  );
};
