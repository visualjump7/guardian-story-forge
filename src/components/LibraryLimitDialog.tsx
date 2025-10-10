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
import { BookOpen, Trash2 } from "lucide-react";

interface LibraryLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: number;
  onGoToLibrary: () => void;
}

export function LibraryLimitDialog({ 
  open, 
  onOpenChange, 
  currentCount,
  onGoToLibrary 
}: LibraryLimitDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-2xl">
            <BookOpen className="h-6 w-6 text-primary" />
            Library Full!
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base space-y-3 pt-2">
            <p className="font-semibold text-foreground">
              You have {currentCount}/10 stories in your library.
            </p>
            <p>
              To create a new story, you'll need to delete at least one existing story from your library first.
            </p>
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg mt-3">
              <Trash2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">
                Deleted stories cannot be recovered
              </span>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onGoToLibrary}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            Go to Library
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
