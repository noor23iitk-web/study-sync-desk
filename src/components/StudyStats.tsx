import { useState, useEffect } from "react";
import { TrendingUp, Clock, Target, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const StudyStats = () => {
  const [stats, setStats] = useState({
    todayTime: 0,
    weekTime: 0,
    totalSessions: 0,
    averageSession: 0
  });

  useEffect(() => {
    // This would normally fetch from your data storage
    // For now, we'll simulate some stats
    const mockStats = {
      todayTime: 2 * 60 * 60 + 15 * 60, // 2h 15m in seconds
      weekTime: 12 * 60 * 60 + 30 * 60, // 12h 30m in seconds
      totalSessions: 15,
      averageSession: 45 * 60 // 45 minutes in seconds
    };
    
    setStats(mockStats);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

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
                {formatTime(stats.todayTime)}
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
                {formatTime(stats.weekTime)}
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
                {stats.totalSessions}
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
                {formatTime(stats.averageSession)}
              </p>
              <p className="text-sm text-foreground-secondary">Avg Session</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};