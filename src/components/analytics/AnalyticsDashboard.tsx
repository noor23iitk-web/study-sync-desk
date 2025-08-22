import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Clock, Target, Flame, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, isSameDay, getHours, differenceInDays } from "date-fns";

interface StudySession {
  id: string;
  name: string;
  duration: number; // in seconds
  date: Date;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  createdAt: Date;
}

export const AnalyticsDashboard = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    // Load sessions from localStorage
    const savedSessions = localStorage.getItem('studyfocus-sessions');
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      setSessions(parsed.map((s: any) => ({
        ...s,
        date: new Date(s.date)
      })));
    }

    // Load assignments from localStorage
    const savedAssignments = localStorage.getItem('studyfocus-assignments');
    if (savedAssignments) {
      const parsed = JSON.parse(savedAssignments);
      setAssignments(parsed.map((a: any) => ({
        ...a,
        dueDate: new Date(a.dueDate),
        createdAt: new Date(a.createdAt)
      })));
    }

    // Listen for updates
    const handleStorageChange = () => {
      const updatedSessions = localStorage.getItem('studyfocus-sessions');
      if (updatedSessions) {
        const parsed = JSON.parse(updatedSessions);
        setSessions(parsed.map((s: any) => ({
          ...s,
          date: new Date(s.date)
        })));
      }

      const updatedAssignments = localStorage.getItem('studyfocus-assignments');
      if (updatedAssignments) {
        const parsed = JSON.parse(updatedAssignments);
        setAssignments(parsed.map((a: any) => ({
          ...a,
          dueDate: new Date(a.dueDate),
          createdAt: new Date(a.createdAt)
        })));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sessionSaved', handleStorageChange);
    window.addEventListener('assignmentUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sessionSaved', handleStorageChange);
      window.removeEventListener('assignmentUpdated', handleStorageChange);
    };
  }, []);

  // Calculate current streak
  const calculateCurrentStreak = () => {
    if (sessions.length === 0) return 0;

    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);

    while (true) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTotal = sessions
        .filter(session => isWithinInterval(session.date, { start: dayStart, end: dayEnd }))
        .reduce((total, session) => total + session.duration, 0);

      // If day has at least 15 minutes (900 seconds) of study time
      if (dayTotal >= 900) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // If today has no study time, don't break the streak yet
        if (isSameDay(currentDate, today) && dayTotal === 0) {
          currentDate.setDate(currentDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    return streak;
  };

  // Calculate total study hours
  const totalStudyHours = sessions.reduce((total, session) => total + session.duration, 0) / 3600;

  // Calculate average session length
  const averageSessionLength = sessions.length > 0 
    ? sessions.reduce((total, session) => total + session.duration, 0) / sessions.length / 60
    : 0;

  // Calculate assignment completion rate
  const completionRate = assignments.length > 0
    ? (assignments.filter(a => a.completed).length / assignments.length) * 100
    : 0;

  // Prepare weekly trend data
  const getWeeklyTrendData = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

    return daysOfWeek.map(day => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTotal = sessions
        .filter(session => isWithinInterval(session.date, { start: dayStart, end: dayEnd }))
        .reduce((total, session) => total + session.duration, 0);

      return {
        day: format(day, 'EEE'),
        hours: Math.round(dayTotal / 360) / 10, // Convert to hours with 1 decimal
        date: day
      };
    });
  };

  // Prepare subject distribution data
  const getSubjectDistributionData = () => {
    const subjectMap = new Map<string, number>();

    sessions.forEach(session => {
      const subject = session.name || 'Untagged';
      const currentTotal = subjectMap.get(subject) || 0;
      subjectMap.set(subject, currentTotal + session.duration);
    });

    const data = Array.from(subjectMap.entries()).map(([name, duration]) => ({
      name,
      value: Math.round(duration / 360) / 10, // Convert to hours
      duration: duration
    }));

    return data.sort((a, b) => b.duration - a.duration);
  };

  // Prepare time of day data
  const getTimeOfDayData = () => {
    const hourMap = new Map<number, number>();

    sessions.forEach(session => {
      const hour = getHours(session.date);
      const currentTotal = hourMap.get(hour) || 0;
      hourMap.set(hour, currentTotal + session.duration);
    });

    const data = [];
    for (let hour = 0; hour < 24; hour++) {
      const duration = hourMap.get(hour) || 0;
      data.push({
        hour: hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
        hours: Math.round(duration / 360) / 10,
        rawHour: hour
      });
    }

    return data.filter(d => d.hours > 0); // Only show hours with study time
  };

  const weeklyData = getWeeklyTrendData();
  const subjectData = getSubjectDistributionData();
  const timeOfDayData = getTimeOfDayData();

  // Colors for charts
  const colors = ['hsl(213, 94%, 68%)', 'hsl(0, 79%, 70%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(271, 81%, 56%)', 'hsl(342, 75%, 51%)'];

  const formatTime = (hours: number) => {
    if (hours >= 1) {
      return `${hours.toFixed(1)}h`;
    }
    return `${Math.round(hours * 60)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Flame className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{calculateCurrentStreak()}</p>
                <p className="text-sm text-foreground-secondary">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{totalStudyHours.toFixed(1)}h</p>
                <p className="text-sm text-foreground-secondary">Total Hours</p>
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
                <p className="text-2xl font-semibold text-foreground">{averageSessionLength.toFixed(0)}m</p>
                <p className="text-sm text-foreground-secondary">Avg Session</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{completionRate.toFixed(0)}%</p>
                <p className="text-sm text-foreground-secondary">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend Chart */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Weekly Study Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.some(d => d.hours > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--foreground-secondary))"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="hsl(var(--foreground-secondary))"
                    fontSize={12}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number) => [formatTime(value), 'Study Time']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-foreground-secondary">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No study sessions this week</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Distribution */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span>Subject Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subjectData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number) => [formatTime(value), 'Study Time']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-foreground-secondary">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No study sessions recorded</p>
                </div>
              </div>
            )}
            {subjectData.length > 0 && (
              <div className="mt-4 space-y-2">
                {subjectData.slice(0, 5).map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colors[index % colors.length] }}
                      />
                      <span className="text-foreground">{entry.name}</span>
                    </div>
                    <span className="text-foreground-secondary">{formatTime(entry.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time of Day Analysis */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>Study Time by Hour</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeOfDayData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeOfDayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="hour" 
                  stroke="hsl(var(--foreground-secondary))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--foreground-secondary))"
                  fontSize={12}
                  tickFormatter={(value) => `${value}h`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value: number) => [formatTime(value), 'Study Time']}
                />
                <Bar 
                  dataKey="hours" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-foreground-secondary">
              <div className="text-center">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No study sessions recorded</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};