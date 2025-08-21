import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useGlobalTimer } from "@/hooks/useGlobalTimer";

export const TimerCompletionDialog = () => {
  const { showCompletionDialog, dismissCompletion, initialTime, sessionName, formatTime } = useGlobalTimer();

  return (
    <Dialog open={showCompletionDialog} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <div className="text-center space-y-6 py-4">
          <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-500 animate-pulse" />
          </div>
          
          <div>
            <h2 className="text-2xl font-bold text-green-500 mb-2 animate-pulse">
              🎉 SESSION COMPLETE! 🎉
            </h2>
            <p className="text-lg text-foreground">
              {sessionName || `${Math.floor(initialTime / 60)} Minute Study Session`}
            </p>
            <p className="text-sm text-foreground-secondary mt-1">
              You studied for {formatTime(initialTime)}
            </p>
          </div>

          <div className="bg-green-500/10 rounded-lg p-4">
            <p className="text-sm text-foreground-secondary mb-2">
              Your session has been automatically saved!
            </p>
          </div>

          <Button 
            onClick={dismissCompletion}
            size="lg"
            className="w-full bg-green-500 hover:bg-green-600 text-white animate-pulse"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Session Completed - Stop Alarm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};