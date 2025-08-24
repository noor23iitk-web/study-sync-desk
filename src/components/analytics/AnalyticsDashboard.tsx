import { useState, useEffect } from "react";
import { BarChart3, TrendingUp, Clock, Target, Flame, Calendar, Award, Zap, TrendingDown, Eye } from "lucide-react";
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

  // Get insights
  const getInsights = () => {
    const insights = [];
    const streak = calculateCurrentStreak();
    const weeklyTotal = weeklyData.reduce((total, day) => total + day.hours, 0);
    
    if (streak >= 7) {
      insights.push({
        type: 'positive',
        icon: Award,
        title: 'Amazing Streak!',
        description: `${streak} days of consistent studying. Keep it up!`
      });
    } else if (streak > 0) {
      insights.push({
        type: 'encouraging',
        icon: Zap,
        title: 'Building Momentum',
        description: `${streak} day streak. Aim for 7 days to build a strong habit!`
      });
    }

    if (weeklyTotal > 10) {
      insights.push({
        type: 'positive',
        icon: TrendingUp,
        title: 'Great Weekly Progress',
        description: `${weeklyTotal.toFixed(1)} hours this week. You're on track!`
      });
    } else if (weeklyTotal > 0) {
      insights.push({
        type: 'encouraging',
        icon: Eye,
        title: 'Room for Growth',
        description: 'Try to increase your weekly study time gradually.'
      });
    }

    return insights;
  };

  const insights = getInsights();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-hover">
          Study Analytics
        </h1>
        <p className="text-foreground-secondary">Understand your study patterns and improve your productivity</p>
      </div>

      {/* Insights Section */}
      {insights.length > 0 && (
        <Card className="relative overflow-hidden bg-gradient-to-br from-card to-background-tertiary border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
          <CardHeader className="relative">
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-primary" />
              <span>Insights & Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-3">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-background/50 backdrop-blur-sm">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <insight.icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground">{insight.title}</h4>
                  <p className="text-sm text-foreground-secondary">{insight.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20 hover:border-warning/40 transition-all duration-300 hover:shadow-lg hover:shadow-warning/10">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground mb-1">{calculateCurrentStreak()}</p>
                <p className="text-sm text-foreground-secondary font-medium">Day Streak</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-warning/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Flame className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground mb-1">{totalStudyHours.toFixed(1)}h</p>
                <p className="text-sm text-foreground-secondary font-medium">Total Hours</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20 hover:border-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-accent/10">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground mb-1">{averageSessionLength.toFixed(0)}m</p>
                <p className="text-sm text-foreground-secondary font-medium">Avg Session</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Target className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20 hover:border-green-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-foreground mb-1">{completionRate.toFixed(0)}%</p>
                <p className="text-sm text-foreground-secondary font-medium">Completion Rate</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Trend Chart */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-background-tertiary border-border/50 hover:border-primary/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="relative pb-6">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <span className="text-lg font-semibold">Weekly Study Trend</span>
              </div>
              <div className="text-sm text-foreground-secondary">
                {weeklyData.reduce((total, day) => total + day.hours, 0).toFixed(1)}h total
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {weeklyData.some(d => d.hours > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={weeklyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--foreground-secondary))"
                    fontSize={12}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--foreground-secondary))"
                    fontSize={12}
                    tickFormatter={(value) => `${value}h`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      color: 'hsl(var(--foreground))',
                      boxShadow: '0 10px 25px -5px hsl(var(--background) / 0.1)'
                    }}
                    formatter={(value: number) => [formatTime(value), 'Study Time']}
                    labelStyle={{ color: 'hsl(var(--foreground-secondary))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, stroke: 'hsl(var(--primary))', strokeWidth: 2, fill: 'hsl(var(--background))' }}
                    fill="url(#colorGradient)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">No study sessions this week</p>
                    <p className="text-sm text-foreground-secondary">Start studying to see your progress!</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subject Distribution */}
        <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-background-tertiary border-border/50 hover:border-accent/30 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <CardHeader className="relative pb-6">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-accent" />
                </div>
                <span className="text-lg font-semibold">Subject Distribution</span>
              </div>
              <div className="text-sm text-foreground-secondary">
                {subjectData.length} subjects
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {subjectData.length > 0 ? (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={subjectData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {subjectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                        color: 'hsl(var(--foreground))',
                        boxShadow: '0 10px 25px -5px hsl(var(--background) / 0.1)'
                      }}
                      formatter={(value: number) => [formatTime(value), 'Study Time']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {subjectData.slice(0, 5).map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between p-2 rounded-lg bg-background/50 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full ring-2 ring-background"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        />
                        <span className="text-foreground font-medium">{entry.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-foreground font-semibold">{formatTime(entry.value)}</span>
                        <div className="text-xs text-foreground-secondary">
                          {((entry.value / subjectData.reduce((total, item) => total + item.value, 0)) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-foreground font-medium">No study sessions recorded</p>
                    <p className="text-sm text-foreground-secondary">Complete sessions to see subject breakdown</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Time of Day Analysis */}
      <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-background-tertiary border-border/50 hover:border-warning/30 transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-warning/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <CardHeader className="relative pb-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-warning" />
              </div>
              <span className="text-lg font-semibold">Study Time by Hour</span>
            </div>
            <div className="text-sm text-foreground-secondary">
              Peak: {timeOfDayData.length > 0 ? timeOfDayData.reduce((max, curr) => curr.hours > max.hours ? curr : max, timeOfDayData[0])?.hour : 'N/A'}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {timeOfDayData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={timeOfDayData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis 
                  dataKey="hour" 
                  stroke="hsl(var(--foreground-secondary))"
                  fontSize={11}
                  axisLine={false}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="hsl(var(--foreground-secondary))"
                  fontSize={12}
                  tickFormatter={(value) => `${value}h`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    color: 'hsl(var(--foreground))',
                    boxShadow: '0 10px 25px -5px hsl(var(--background) / 0.1)'
                  }}
                  formatter={(value: number) => [formatTime(value), 'Study Time']}
                  labelStyle={{ color: 'hsl(var(--foreground-secondary))' }}
                />
                <Bar 
                  dataKey="hours" 
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  strokeWidth={0}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <div>
                  <p className="text-foreground font-medium">No study sessions recorded</p>
                  <p className="text-sm text-foreground-secondary">Track sessions to see your peak study hours</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};