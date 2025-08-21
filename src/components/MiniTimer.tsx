import { Clock, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGlobalTimer } from "@/hooks/useGlobalTimer";

export const MiniTimer = () => {
  const { isConfigured, isRunning, time, formatTime, startTimer, pauseTimer } = useGlobalTimer();

  if (!isConfigured) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3 flex items-center space-x-3 z-50">
      <div className={`text-sm font-mono ${
        time === 0 ? 'text-green-500 animate-pulse' : 
        isRunning ? 'text-primary' : 'text-foreground'
      }`}>
        {formatTime(time)}
      </div>
      
      {time > 0 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={isRunning ? pauseTimer : startTimer}
          className="h-6 w-6 p-0"
        >
          {isRunning ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>
      )}
      
      <Clock className={`h-4 w-4 ${
        time === 0 ? 'text-green-500' : 
        isRunning ? 'text-primary animate-pulse' : 'text-foreground-secondary'
      }`} />
    </div>
  );
};