import { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, startOfDay, differenceInDays, isToday, parseISO } from "date-fns";

interface StudySession {
  id: string;
  name?: string;
  duration: number;
  date: string;
}

export const StreakWidget = () => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streakStartDate, setStreakStartDate] = useState<Date | null>(null);

  const calculateStreak = () => {
    const savedSessions = localStorage.getItem('studyfocus-sessions');
    if (!savedSessions) {
      setCurrentStreak(0);
      setStreakStartDate(null);
      return;
    }

    const sessions: StudySession[] = JSON.parse(savedSessions);
    if (sessions.length === 0) {
      setCurrentStreak(0);
      setStreakStartDate(null);
      return;
    }

    // Group sessions by date and check if each day has at least 15 minutes (900 seconds)
    const dailyTotals = new Map<string, number>();
    
    sessions.forEach(session => {
      const dateKey = startOfDay(parseISO(session.date)).toISOString();
      const currentTotal = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, currentTotal + session.duration);
    });

    // Filter days with at least 15 minutes of study time
    const studyDays = Array.from(dailyTotals.entries())
      .filter(([_, duration]) => duration >= 900) // 15 minutes
      .map(([date, _]) => new Date(date))
      .sort((a, b) => b.getTime() - a.getTime()); // Sort descending (most recent first)

    if (studyDays.length === 0) {
      setCurrentStreak(0);
      setStreakStartDate(null);
      return;
    }

    let streak = 0;
    let streakStart: Date | null = null;
    const today = startOfDay(new Date());
    
    // Check if today or yesterday has study time (allows for streak to continue)
    const mostRecentStudyDay = studyDays[0];
    const daysSinceLastStudy = differenceInDays(today, mostRecentStudyDay);
    
    if (daysSinceLastStudy <= 1) {
      // Start counting from the most recent study day
      let currentDate = mostRecentStudyDay;
      
      for (let i = 0; i < studyDays.length; i++) {
        const studyDay = studyDays[i];
        const expectedDate = new Date(currentDate);
        expectedDate.setDate(expectedDate.getDate() - i);
        
        if (studyDay.getTime() === expectedDate.getTime()) {
          streak++;
          streakStart = studyDay;
        } else {
          break;
        }
      }
    }

    setCurrentStreak(streak);
    setStreakStartDate(streakStart);
  };

  useEffect(() => {
    calculateStreak();

    // Listen for storage changes and custom events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'studyfocus-sessions') {
        calculateStreak();
      }
    };

    const handleSessionSaved = () => {
      calculateStreak();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sessionSaved', handleSessionSaved);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionSaved', handleSessionSaved);
    };
  }, []);

  const getStreakGradient = () => {
    if (currentStreak === 0) return "bg-card";
    if (currentStreak < 3) return "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20";
    if (currentStreak < 7) return "bg-gradient-to-br from-orange-500/15 to-red-500/15 border-orange-500/30";
    if (currentStreak < 14) return "bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-500/40";
    return "bg-gradient-to-br from-pink-500/25 to-purple-500/25 border-pink-500/50 shadow-lg shadow-pink-500/20";
  };

  const getMotivationText = () => {
    if (currentStreak === 0) return "Start your streak today!";
    if (currentStreak === 1) return "Great start! Keep it up!";
    if (currentStreak < 7) return "Building momentum! 🔥";
    if (currentStreak < 14) return "You're on fire! Keep going!";
    if (currentStreak < 30) return "Incredible dedication! 🚀";
    return "You're unstoppable! 🏆";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={`card-hover transition-all duration-300 ${getStreakGradient()}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>Study Streak</span>
                <Flame 
                  className={`h-5 w-5 transition-all duration-300 ${
                    currentStreak > 0 
                      ? "text-orange-500 animate-pulse" 
                      : "text-muted-foreground"
                  }`} 
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-center">
                <div className={`text-4xl font-bold transition-all duration-300 ${
                  currentStreak > 0 ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {currentStreak}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentStreak === 1 ? "day streak" : "day streak"}
                </p>
                <p className="text-xs text-primary mt-2 font-medium">
                  {getMotivationText()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">Study Streak</p>
            <p className="text-xs text-muted-foreground">
              Days with at least 15 minutes of study time
            </p>
            {streakStartDate && currentStreak > 0 && (
              <p className="text-xs">
                Started: {format(streakStartDate, "MMM d, yyyy")}
              </p>
            )}
            <p className="text-xs font-medium text-primary">
              {getMotivationText()}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};