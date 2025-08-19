import { useState, useEffect, useRef } from "react";
import { Play, Pause, Square, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface StudySession {
  id: string;
  name: string;
  duration: number; // in seconds
  date: Date;
}

interface StudyTimerProps {
  compact?: boolean;
  onSessionSaved?: (session: StudySession) => void;
}

export const StudyTimer = ({ compact = false, onSessionSaved }: StudyTimerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [initialTime, setInitialTime] = useState(0);
  const [sessionName, setSessionName] = useState("");
  const [customDuration, setCustomDuration] = useState(25); // in minutes
  const [isConfigured, setIsConfigured] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  // New refs for accurate timing
  const startTimestamp = useRef<number | null>(null); // in ms
  const pauseOffset = useRef<number>(0); // ms spent paused
  const intervalRef = useRef<NodeJS.Timeout>();

  // Load sessions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('studyfocus-sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed.map((s: any) => ({
        ...s,
        date: new Date(s.date)
      })));
    }
  }, []);

  // Save sessions to localStorage when updated
  useEffect(() => {
    localStorage.setItem('studyfocus-sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Timer effect: always computes time left using wall clock so it's accurate
  useEffect(() => {
    if (!isConfigured || !isRunning) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      if (startTimestamp.current !== null) {
        const elapsed = Math.floor((Date.now() - startTimestamp.current - pauseOffset.current) / 1000);
        const left = initialTime - elapsed;
        if (left <= 0) {
          setIsRunning(false);
          setTime(0);
          handleTimerComplete();
          clearInterval(intervalRef.current);
        } else {
          setTime(left);
        }
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
    // Don't add time to deps; let the tick control updates
    // eslint-disable-next-line
  }, [isRunning, isConfigured, initialTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfigureTimer = () => {
    if (customDuration <= 0) return;

    const timeInSeconds = customDuration * 60;
    setTime(timeInSeconds);
    setInitialTime(timeInSeconds);
    setIsConfigured(true);
    setIsRunning(false);
    startTimestamp.current = null;
    pauseOffset.current = 0;
  };

  const handleStart = () => {
    if (!isConfigured) return;
    setIsRunning(true);

    // If not started yet, record start, else resume from pause
    if (startTimestamp.current === null) {
      startTimestamp.current = Date.now();
      pauseOffset.current = 0;
    } else {
      // Was paused, so subtract the paused duration
      pauseOffset.current += Date.now() - (startTimestamp.current + (initialTime - time) * 1000 + pauseOffset.current);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    // pauseOffset will be handled on resume
  };

  const handleStop = () => {
    setIsRunning(false);
    if (initialTime > time && time > 0) {
      // Some time passed, ask to save
      setShowSaveDialog(true);
    } else {
      handleReset();
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setInitialTime(0);
    setIsConfigured(false);
    setSessionName("");
    setCustomDuration(25);
    startTimestamp.current = null;
    pauseOffset.current = 0;
  };

  const handleTimerComplete = () => {
    // Timer completed naturally - auto-save
    const completedSession = createSession(initialTime);
    saveSession(completedSession);
  };

  const createSession = (duration: number): StudySession => {
    return {
      id: Date.now().toString(),
      name: sessionName || `${Math.floor(duration / 60)} min Study Session`,
      duration: duration,
      date: new Date()
    };
  };

  const saveSession = (session: StudySession) => {
    setSessions(prev => [...prev, session]);
    onSessionSaved?.(session);
    handleReset();
  };

  const handleSaveSession = () => {
    const studiedTime = initialTime - time;
    const session = createSession(studiedTime);
    saveSession(session);
    setShowSaveDialog(false);
  };

  const handleDiscardSession = () => {
    setShowSaveDialog(false);
    handleReset();
  };

  const getTodaySessions = () => {
    const today = new Date().toDateString();
    return sessions.filter(session => session.date.toDateString() === today);
  };

  const getTodayStudyTime = () => {
    return getTodaySessions().reduce((total, session) => total + session.duration, 0);
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
                <div className={`text-3xl font-mono countdown-text ${isRunning ? 'text-primary timer-glow' : 'text-foreground'}`}>
                  {formatTime(time)}
                </div>
                <p className="text-sm text-foreground-secondary mt-1">
                  {time === 0 ? 'Session Complete!' : isRunning ? 'Session in progress' : 'Ready to start'}
                </p>
              </div>
              
              <div className="flex justify-center space-x-2">
                {!isRunning ? (
                  <Button size="sm" onClick={handleStart} className="w-16" disabled={time === 0}>
                    <Play className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={handlePause} className="w-16">
                    <Pause className="h-4 w-4" />
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={handleStop} className="w-16">
                  <Square className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleReset} className="w-16">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
          
          <div className="text-center pt-2 border-t border-border">
            <p className="text-sm text-foreground-secondary">
              Today: {formatTime(getTodayStudyTime())} ({getTodaySessions().length} sessions)
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
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
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
                <div className={`text-6xl font-mono countdown-text mb-4 ${isRunning ? 'text-primary timer-glow' : 'text-foreground'}`}>
                  {formatTime(time)}
                </div>
                
                <div className="mb-6">
                  <p className="text-lg text-foreground-secondary">
                    {sessionName || `${Math.floor(initialTime / 60)} Minute Study Session`}
                  </p>
                  {time === 0 && (
                    <p className="text-green-500 font-medium mt-2">Session Complete! 🎉</p>
                  )}
                </div>
                
                <div className="flex justify-center space-x-3">
                  {!isRunning ? (
                    <Button size="lg" onClick={handleStart} className="px-8" disabled={time === 0}>
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
            </>
          )}

          {sessions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
              <div className="text-center">
                <p className="text-2xl font-semibold text-primary">{formatTime(getTodayStudyTime())}</p>
                <p className="text-sm text-foreground-secondary">Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-primary">{getTodaySessions().length}</p>
                <p className="text-sm text-foreground-secondary">Sessions Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-semibold text-primary">
                  {getTodaySessions().length > 0 
                    ? formatTime(Math.round(getTodayStudyTime() / getTodaySessions().length))
                    : '00:00'}
                </p>
                <p className="text-sm text-foreground-secondary">Avg Today</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Session Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Study Session?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-foreground-secondary">
              You studied for {formatTime(initialTime - time)}. Would you like to save this session?
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleDiscardSession}>
                No, Discard
              </Button>
              <Button onClick={handleSaveSession}>
                Yes, Save Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
              {sessions.slice(-10).reverse().map((session, index) => (
                <div key={session.id} className="flex justify-between items-center p-3 rounded-lg bg-background-secondary">
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
