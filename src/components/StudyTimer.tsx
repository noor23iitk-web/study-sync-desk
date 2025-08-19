'use client';

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
  duration: number; // seconds
  date: Date;
}

interface StudyTimerProps {
  compact?: boolean;
  onSessionSaved?: (session: StudySession) => void;
}

const ACTIVE_KEY = "studyfocus-active";
const SESSIONS_KEY = "studyfocus-sessions";

export const StudyTimer = ({ compact = false, onSessionSaved }: StudyTimerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0);
  const [initialTime, setInitialTime] = useState(0);
  const [sessionName, setSessionName] = useState("");
  const [customDuration, setCustomDuration] = useState(25);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  // Core timing refs
  const endAtRef = useRef<number | null>(null);          // absolute epoch ms when timer hits 0
  const pauseStartRef = useRef<number | null>(null);     // epoch ms when pause started
  const completedOnceRef = useRef<boolean>(false);       // avoid double-complete

  // Load sessions & active timer from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SESSIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed.map((s: any) => ({ ...s, date: new Date(s.date) })));
    }

    const activeRaw = localStorage.getItem(ACTIVE_KEY);
    if (activeRaw) {
      try {
        const a = JSON.parse(activeRaw);
        if (a.initialTime && a.endAt) {
          setIsConfigured(true);
          setInitialTime(a.initialTime);
          setSessionName(a.sessionName ?? "");
          endAtRef.current = a.endAt as number;
          pauseStartRef.current = a.paused ? (a.pauseStart ?? null) : null;

          // set running state & current time left
          const now = Date.now();
          if (!a.paused && now < a.endAt) {
            setIsRunning(true);
            setTime(Math.max(0, Math.ceil((a.endAt - now) / 1000)));
          } else {
            // paused or completed
            const left = Math.max(0, Math.ceil(((a.paused ? a.endAt + (now - (a.pauseStart ?? now)) : a.endAt) - now) / 1000)));
            setTime(left);
            setIsRunning(false);
          }
        }
      } catch {
        // ignore bad JSON
      }
    }
  }, []);

  // Persist sessions
  useEffect(() => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const persistActive = (data: Partial<{ initialTime: number; endAt: number | null; paused: boolean; pauseStart: number | null; sessionName: string }>) => {
    const existing = localStorage.getItem(ACTIVE_KEY);
    const base = existing ? JSON.parse(existing) : {};
    const merged = { ...base, ...data };
    if (merged.endAt == null) {
      localStorage.removeItem(ACTIVE_KEY);
    } else {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(merged));
    }
  };

  const updateFromClock = () => {
    if (!endAtRef.current) return;
    const leftSec = Math.ceil((endAtRef.current - Date.now()) / 1000);
    if (leftSec <= 0) {
      setTime(0);
      if (isRunning) {
        // transition to completed exactly once
        setIsRunning(false);
        if (!completedOnceRef.current) {
          completedOnceRef.current = true;
          // clear active state before calling complete
          persistActive({ endAt: null });
          handleTimerComplete();
        }
      }
    } else {
      setTime(leftSec);
    }
  };

  // Main ticking effect: relies on wall clock, not interval accuracy
  useEffect(() => {
    if (!isConfigured || !isRunning) return;

    completedOnceRef.current = false;

    updateFromClock(); // immediate
    const id = setInterval(updateFromClock, 250); // display update; can be throttled, but we use wall clock

    const onVis = () => updateFromClock(); // snap on tab switch
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isConfigured, initialTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Controls
  const handleConfigureTimer = () => {
    if (customDuration <= 0) return;
    const secs = customDuration * 60;
    setTime(secs);
    setInitialTime(secs);
    setIsConfigured(true);
    setIsRunning(false);
    endAtRef.current = null;
    pauseStartRef.current = null;
    persistActive({ initialTime: secs, endAt: null, paused: false, pauseStart: null, sessionName });
  };

  const handleStart = () => {
    if (!isConfigured) return;

    const now = Date.now();

    // If starting fresh, schedule deadline from remaining time
    if (!endAtRef.current) {
      endAtRef.current = now + time * 1000;
    }

    // If resuming from pause, push deadline forward by paused duration
    if (pauseStartRef.current) {
      endAtRef.current += now - pauseStartRef.current;
      pauseStartRef.current = null;
    }

    setIsRunning(true);
    persistActive({
      initialTime,
      endAt: endAtRef.current,
      paused: false,
      pauseStart: null,
      sessionName,
    });
    updateFromClock();
  };

  const handlePause = () => {
    if (!isRunning) return;
    pauseStartRef.current = Date.now();
    setIsRunning(false);
    persistActive({
      initialTime,
      endAt: endAtRef.current!,
      paused: true,
      pauseStart: pauseStartRef.current,
      sessionName,
    });
    updateFromClock();
  };

  const handleStop = () => {
    setIsRunning(false);
    updateFromClock();
    if (initialTime > time && time > 0) {
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
    endAtRef.current = null;
    pauseStartRef.current = null;
    completedOnceRef.current = false;
    localStorage.removeItem(ACTIVE_KEY);
  };

  const handleTimerComplete = () => {
    const completedSession = createSession(initialTime);
    saveSession(completedSession);
  };

  const createSession = (duration: number): StudySession => ({
    id: Date.now().toString(),
    name: sessionName || `${Math.floor(duration / 60)} min Study Session`,
    duration,
    date: new Date(),
  });

  const saveSession = (session: StudySession) => {
    setSessions((prev) => [...prev, session]);
    onSessionSaved?.(session);
    handleReset();
  };

  const handleSaveSession = () => {
    const studiedTime = Math.max(0, initialTime - time);
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
    return sessions.filter((s) => s.date.toDateString() === today);
  };
  const getTodayStudyTime = () => getTodaySessions().reduce((t, s) => t + s.duration, 0);

  // UI (unchanged from yours)
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
              <Button onClick={handleConfigureTimer} className="w-full" size="sm" disabled={customDuration <= 0}>
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
                <Button onClick={handleConfigureTimer} size="lg" className="px-8" disabled={customDuration <= 0}>
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
                  {time === 0 && <p className="text-green-500 font-medium mt-2">Session Complete! 🎉</p>}
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
                    : "00:00"}
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
              You studied for {formatTime(Math.max(0, initialTime - time))}. Save this session?
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={handleDiscardSession}>No, Discard</Button>
              <Button onClick={handleSaveSession}>Yes, Save Session</Button>
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
              {sessions.slice(-10).reverse().map((s) => (
                <div key={s.id} className="flex justify-between items-center p-3 rounded-lg bg-background-secondary">
                  <div>
                    <p className="font-medium text-foreground">{s.name}</p>
                    <p className="text-sm text-foreground-secondary">
                      {s.date.toLocaleDateString()} at {s.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-primary">{formatTime(s.duration)}</p>
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
