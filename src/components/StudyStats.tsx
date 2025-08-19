import { useState, useEffect } from "react";
import { TrendingUp, Clock, Target, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StudySession {
  id: string;
  name: string;
  duration: number; // in seconds
  date: Date;
}

export const StudyStats = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);

  useEffect(() => {
    // Load sessions from localStorage
    const saved = localStorage.getItem('studyfocus-sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSessions(parsed.map((s: any) => ({
        ...s,
        date: new Date(s.date)
      })));
    }

    // Listen for localStorage changes (when sessions are added)
    const handleStorageChange = () => {
      const updated = localStorage.getItem('studyfocus-sessions');
      if (updated) {
        const parsed = JSON.parse(updated);
        setSessions(parsed.map((s: any) => ({
          ...s,
          date: new Date(s.date)
        })));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-tab updates
    const handleSessionUpdate = () => {
      handleStorageChange();
    };
    
    window.addEventListener('sessionSaved', handleSessionUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionSaved', handleSessionUpdate);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Calculate today's stats
  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(session => 
      session.date.toDateString() === today
    );
    
    const totalTime = todaySessions.reduce((sum, session) => sum + session.duration, 0);
    const avgTime = todaySessions.length > 0 ? totalTime / todaySessions.length : 0;
    
    return {
      time: totalTime,
      sessions: todaySessions.length,
      average: avgTime
    };
  };

  // Calculate this week's stats
  const getWeekStats = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weekSessions = sessions.filter(session => 
      session.date >= startOfWeek
    );
    
    const totalTime = weekSessions.reduce((sum, session) => sum + session.duration, 0);
    const avgTime = weekSessions.length > 0 ? totalTime / weekSessions.length : 0;
    
    return {
      time: totalTime,
      sessions: weekSessions.length,
      average: avgTime
    };
  };

  // Calculate all-time stats
  const getTotalStats = () => {
    const totalTime = sessions.reduce((sum, session) => sum + session.duration, 0);
    const avgTime = sessions.length > 0 ? totalTime / sessions.length : 0;
    
    return {
      time: totalTime,
      sessions: sessions.length,
      average: avgTime
    };
  };

  const todayStats = getTodayStats();
  const weekStats = getWeekStats();
  const totalStats = getTotalStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {todayStats.time > 0 ? formatTime(todayStats.time) : '0m'}
              </p>
              <p className="text-sm text-foreground-secondary">Today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {weekStats.time > 0 ? formatTime(weekStats.time) : '0m'}
              </p>
              <p className="text-sm text-foreground-secondary">This Week</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {totalStats.sessions}
              </p>
              <p className="text-sm text-foreground-secondary">Total Sessions</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {totalStats.average > 0 ? formatTime(Math.round(totalStats.average)) : '0m'}
              </p>
              <p className="text-sm text-foreground-secondary">Avg Session</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};