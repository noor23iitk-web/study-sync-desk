import { useState } from "react";
import { Play, Pause, Square, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGlobalTimer } from "@/hooks/useGlobalTimer";

interface StudyTimerProps {
  compact?: boolean;
}

export const StudyTimer = ({ compact = false }: StudyTimerProps) => {
  const [customDuration, setCustomDuration] = useState(25); // in minutes
  const [inputSessionName, setInputSessionName] = useState("");
  
  const { 
    isRunning, 
    time, 
    initialTime, 
    sessionName, 
    isConfigured, 
    configureTimer, 
    startTimer, 
    pauseTimer, 
    stopTimer, 
    resetTimer, 
    formatTime 
  } = useGlobalTimer();

  const handleConfigureTimer = () => {
    if (customDuration <= 0) return;
    configureTimer(customDuration, inputSessionName);
    setInputSessionName("");
  };

  // Rendering as before, using `time` state

  if (compact) {
    return (
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg">Study Timer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConfigured ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="compact-duration" className="text-sm">Duration (minutes)</Label>
                  <Input
                    id="compact-duration"
                    type="number"
                    min="1"
                    max="180"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
              </div>
              <Button 
                onClick={handleConfigureTimer} 
                className="w-full" 
                size="sm"
                disabled={customDuration <= 0}
              >
                <Clock className="h-4 w-4 mr-2" />
                Set Timer
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className={`text-3xl font-mono countdown-text ${
                  time === 0 ? 'text-green-500 animate-pulse' : 
                  isRunning ? 'text-primary timer-glow' : 'text-foreground'
                }`}>
                  {formatTime(time)}
                </div>
                <p className={`text-sm mt-1 ${
                  time === 0 ? 'text-green-500 font-semibold animate-pulse' : 'text-foreground-secondary'
                }`}>
                  {time === 0 ? '🎉 Session Complete!' : isRunning ? 'Session in progress' : 'Ready to start'}
                </p>
              </div>
              
              <div className="flex justify-center space-x-2">
                {!isRunning ? (
                  <Button size="sm" onClick={startTimer} className="w-16" disabled={time === 0}>
                    <Play className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={pauseTimer} className="w-16">
                    <Pause className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={stopTimer} className="w-16">
                  <Square className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={resetTimer} className="w-16">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
          
          <div className="text-center pt-2 border-t border-border">
            <p className="text-sm text-foreground-secondary">
              {isConfigured && (
                <>Status: {isRunning ? 'Running' : time === 0 ? 'Complete' : 'Paused'}</>
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-xl">Study Timer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isConfigured ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="session-name">Session Name (Optional)</Label>
                  <Input
                    id="session-name"
                    placeholder="e.g., Math Homework, Reading..."
                    value={inputSessionName}
                    onChange={(e) => setInputSessionName(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="180"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="text-center">
                <Button 
                  onClick={handleConfigureTimer} 
                  size="lg" 
                  className="px-8"
                  disabled={customDuration <= 0}
                >
                  <Clock className="h-5 w-5 mr-2" />
                  Set Timer ({customDuration} min)
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center">
                <div className={`text-6xl font-mono countdown-text mb-4 ${
                  time === 0 ? 'text-green-500 animate-pulse' : 
                  isRunning ? 'text-primary timer-glow' : 'text-foreground'
                }`}>
                  {formatTime(time)}
                </div>
                
                <div className="mb-6">
                  <p className="text-lg text-foreground-secondary">
                    {sessionName || `${Math.floor(initialTime / 60)} Minute Study Session`}
                  </p>
                  {time === 0 && (
                    <p className="text-green-500 font-medium mt-2 animate-pulse text-lg">
                      🎉 TIME'S UP! Session Complete! 🎉
                    </p>
                  )}
                </div>
                
                <div className="flex justify-center space-x-3">
                  {!isRunning ? (
                    <Button size="lg" onClick={startTimer} className="px-8" disabled={time === 0}>
                      <Play className="h-5 w-5 mr-2" />
                      Start
                    </Button>
                  ) : (
                    <Button size="lg" variant="secondary" onClick={pauseTimer} className="px-8">
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </Button>
                  )}
                  
                  <Button size="lg" variant="outline" onClick={stopTimer} className="px-6">
                    <Square className="h-5 w-5 mr-2" />
                    Stop
                  </Button>
                  
                  <Button size="lg" variant="outline" onClick={resetTimer} className="px-6">
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </>
          )}

          {isConfigured && (
            <div className="text-center pt-6 border-t border-border">
              <p className="text-lg text-foreground-secondary">
                Current Session: {sessionName || `${Math.floor(initialTime / 60)} Minute Study Session`}
              </p>
              <p className="text-sm text-foreground-secondary mt-1">
                Status: {isRunning ? 'Running' : time === 0 ? 'Complete' : 'Paused'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};
