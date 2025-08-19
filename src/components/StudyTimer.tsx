import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StudyTimerProps {
  compact?: boolean;
}

export const StudyTimer = ({ compact = false }: StudyTimerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(25 * 60); // 25 minutes default
  const [sessionName, setSessionName] = useState("");
  const [sessions, setSessions] = useState<Array<{
    name: string;
    duration: number;
    date: Date;
  }>>([]);
  
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = setInterval(() => {
        setTime(prev => prev - 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      if (time === 0 && isRunning) {
        // Session completed
        setSessions(prev => [...prev, {
          name: sessionName || "Study Session",
          duration: 25 * 60 - time,
          date: new Date()
        }]);
        setIsRunning(false);
        // Reset timer
        setTime(25 * 60);
      }
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, time, sessionName]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    if (time < 25 * 60) {
      // Save partial session
      setSessions(prev => [...prev, {
        name: sessionName || "Study Session (Partial)",
        duration: 25 * 60 - time,
        date: new Date()
      }]);
    }
    setTime(25 * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(25 * 60);
  };

  const getTodayStudyTime = () => {
    const today = new Date().toDateString();
    return sessions
      .filter(session => session.date.toDateString() === today)
      .reduce((total, session) => total + session.duration, 0);
  };

  if (compact) {
    return (
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="text-lg">Today's Focus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className={`text-3xl font-mono countdown-text ${isRunning ? 'text-primary timer-glow' : 'text-foreground'}`}>
              {formatTime(time)}
            </div>
            <p className="text-sm text-foreground-secondary mt-1">
              {isRunning ? 'Session in progress' : 'Ready to start'}
            </p>
          </div>
          
          <div className="flex justify-center space-x-2">
            {!isRunning ? (
              <Button size="sm" onClick={handleStart} className="w-16">
                <Play className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={handlePause} className="w-16">
                <Pause className="h-4 w-4" />
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleReset} className="w-16">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-center pt-2 border-t border-border">
            <p className="text-sm text-foreground-secondary">
              Today: {formatTime(getTodayStudyTime())}
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="session-name">Session Name (Optional)</Label>
              <Input
                id="session-name"
                placeholder="e.g., Math Homework, Reading..."
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="text-center">
            <div className={`text-6xl font-mono countdown-text mb-4 ${isRunning ? 'text-primary timer-glow' : 'text-foreground'}`}>
              {formatTime(time)}
            </div>
            
            <div className="flex justify-center space-x-3">
              {!isRunning ? (
                <Button size="lg" onClick={handleStart} className="px-8">
                  <Play className="h-5 w-5 mr-2" />
                  Start
                </Button>
              ) : (
                <Button size="lg" variant="secondary" onClick={handlePause} className="px-8">
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </Button>
              )}
              
              <Button size="lg" variant="outline" onClick={handleStop} className="px-6">
                <Square className="h-5 w-5 mr-2" />
                Stop
              </Button>
              
              <Button size="lg" variant="outline" onClick={handleReset} className="px-6">
                <RotateCcw className="h-5 w-5 mr-2" />
                Reset
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-semibold text-primary">{formatTime(getTodayStudyTime())}</p>
              <p className="text-sm text-foreground-secondary">Today</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-primary">{sessions.length}</p>
              <p className="text-sm text-foreground-secondary">Total Sessions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-primary">
                {sessions.length > 0 ? formatTime(Math.round(sessions.reduce((acc, s) => acc + s.duration, 0) / sessions.length)) : '00:00'}
              </p>
              <p className="text-sm text-foreground-secondary">Average Session</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
              {sessions.slice(-10).reverse().map((session, index) => (
                <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-background-secondary">
                  <div>
                    <p className="font-medium text-foreground">{session.name}</p>
                    <p className="text-sm text-foreground-secondary">
                      {session.date.toLocaleDateString()} at {session.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-primary">{formatTime(session.duration)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};