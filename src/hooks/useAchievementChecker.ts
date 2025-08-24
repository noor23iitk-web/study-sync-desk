import { useEffect, useCallback } from "react";
import { ACHIEVEMENTS, Achievement } from "@/data/achievements";
import { getHours, differenceInHours, startOfDay, differenceInDays, parseISO, format, startOfWeek, endOfWeek, getDay } from "date-fns";

interface StudySession {
  id: string;
  name?: string;
  duration: number;
  date: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

interface UnlockedAchievement {
  id: string;
  unlockedAt: Date;
}

export const useAchievementChecker = () => {
  const checkAndAwardAchievements = useCallback((
    sessions: StudySession[],
    assignments: Assignment[] = [],
    newSessionId?: string,
    newAssignmentId?: string
  ) => {
    const savedAchievements = localStorage.getItem("studyfocus-achievements");
    const unlockedAchievements: UnlockedAchievement[] = savedAchievements 
      ? JSON.parse(savedAchievements) 
      : [];
    
    const unlockedIds = new Set(unlockedAchievements.map(a => a.id));
    const newlyUnlocked: Achievement[] = [];

    // Get the new session or assignment if provided
    const newSession = newSessionId ? sessions.find(s => s.id === newSessionId) : null;
    const newAssignment = newAssignmentId ? assignments.find(a => a.id === newAssignmentId) : null;

    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.criteria.type) {
        case "first_session":
          shouldUnlock = sessions.length >= 1;
          break;

        case "early_bird":
          if (newSession) {
            const sessionHour = getHours(parseISO(newSession.date));
            shouldUnlock = sessionHour < 9;
          }
          break;

        case "dawn_warrior":
          if (newSession) {
            const sessionHour = getHours(parseISO(newSession.date));
            shouldUnlock = sessionHour < 6;
          }
          break;

        case "night_owl":
          if (newSession) {
            const sessionHour = getHours(parseISO(newSession.date));
            shouldUnlock = sessionHour >= 21;
          }
          break;

        case "midnight_scholar":
          if (newSession) {
            const sessionHour = getHours(parseISO(newSession.date));
            shouldUnlock = sessionHour >= 0 && sessionHour < 3; // Midnight to 3 AM
          }
          break;

        case "marathoner":
        case "focus_master":
        case "time_lord":
          if (newSession && achievement.criteria.value) {
            shouldUnlock = newSession.duration >= achievement.criteria.value;
          }
          break;

        case "speed_demon":
          if (newSession && achievement.criteria.value) {
            const targetDuration = achievement.criteria.value;
            // Check if session is within 5 minutes of target
            shouldUnlock = Math.abs(newSession.duration - targetDuration) <= 300;
          }
          break;

        case "consistent":
        case "iron_will":
        case "habit_builder":
        case "month_streak":
        case "unstoppable":
          shouldUnlock = calculateCurrentStreak(sessions) >= (achievement.criteria.value || 7);
          break;

        case "perfect_week":
          shouldUnlock = checkPerfectWeek(sessions);
          break;

        case "weekend_warrior":
          shouldUnlock = checkWeekendWarrior(sessions);
          break;

        case "overachiever":
          if (newAssignment && newAssignment.completed && newAssignment.completedAt) {
            const completedAt = parseISO(newAssignment.completedAt);
            const dueDate = parseISO(newAssignment.dueDate);
            const hoursEarly = differenceInHours(dueDate, completedAt);
            shouldUnlock = hoursEarly >= 24;
          }
          break;

        case "perfectionist":
          const onTimeAssignments = assignments.filter(a => 
            a.completed && a.completedAt && parseISO(a.completedAt) <= parseISO(a.dueDate)
          );
          shouldUnlock = onTimeAssignments.length >= (achievement.criteria.value || 10);
          break;

        case "assignment_streak":
          shouldUnlock = checkAssignmentStreak(assignments) >= (achievement.criteria.value || 5);
          break;

        case "assignment_master":
          const completedAssignments = assignments.filter(a => a.completed);
          shouldUnlock = completedAssignments.length >= (achievement.criteria.value || 50);
          break;

        case "multitasker":
          if (newSession) {
            shouldUnlock = checkMultitasker(sessions, newSession.date);
          }
          break;

        case "subject_diversity":
          shouldUnlock = checkSubjectDiversity(sessions) >= (achievement.criteria.value || 5);
          break;

        case "knowledge_seeker":
          shouldUnlock = getTotalSubjectsStudied(sessions) >= (achievement.criteria.value || 10);
          break;

        case "total_hours":
        case "dedication":
        case "legend":
          const totalSeconds = sessions.reduce((sum, session) => sum + session.duration, 0);
          shouldUnlock = totalSeconds >= (achievement.criteria.value || 0);
          break;

        case "session_count":
        case "study_ninja":
        case "century_club":
          shouldUnlock = sessions.length >= (achievement.criteria.value || 0);
          break;

        case "productivity_beast":
          shouldUnlock = checkProductivityBeast(sessions);
          break;
      }

      if (shouldUnlock) {
        newlyUnlocked.push(achievement);
        unlockedAchievements.push({
          id: achievement.id,
          unlockedAt: new Date()
        });
      }
    }

    // Save updated achievements
    if (newlyUnlocked.length > 0) {
      localStorage.setItem("studyfocus-achievements", JSON.stringify(unlockedAchievements));
      
      // Trigger achievement unlocked events
      newlyUnlocked.forEach(achievement => {
        window.dispatchEvent(new CustomEvent("achievementUnlocked", {
          detail: achievement
        }));
      });
    }

    return newlyUnlocked;
  }, []);

  const calculateCurrentStreak = (sessions: StudySession[]) => {
    if (sessions.length === 0) return 0;

    // Group sessions by date and check if each day has at least 15 minutes (900 seconds)
    const dailyTotals = new Map<string, number>();
    
    sessions.forEach(session => {
      const dateKey = startOfDay(parseISO(session.date)).toISOString();
      const currentTotal = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, currentTotal + session.duration);
    });

    // Filter days with at least 15 minutes of study time
    const studyDays = Array.from(dailyTotals.entries())
      .filter(([_, duration]) => duration >= 900)
      .map(([date, _]) => new Date(date))
      .sort((a, b) => b.getTime() - a.getTime());

    if (studyDays.length === 0) return 0;

    let streak = 0;
    const today = startOfDay(new Date());
    const mostRecentStudyDay = studyDays[0];
    const daysSinceLastStudy = differenceInDays(today, mostRecentStudyDay);
    
    if (daysSinceLastStudy <= 1) {
      let currentDate = mostRecentStudyDay;
      
      for (let i = 0; i < studyDays.length; i++) {
        const studyDay = studyDays[i];
        const expectedDate = new Date(currentDate);
        expectedDate.setDate(expectedDate.getDate() - i);
        
        if (studyDay.getTime() === expectedDate.getTime()) {
          streak++;
        } else {
          break;
        }
      }
    }

    return streak;
  };

  const checkPerfectWeek = (sessions: StudySession[]) => {
    if (sessions.length === 0) return false;

    const dailyTotals = new Map<string, number>();
    
    sessions.forEach(session => {
      const dateKey = startOfDay(parseISO(session.date)).toISOString();
      const currentTotal = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, currentTotal + session.duration);
    });

    const studyDays = Array.from(dailyTotals.entries())
      .filter(([_, duration]) => duration >= 900)
      .map(([date, _]) => new Date(date))
      .sort((a, b) => b.getTime() - a.getTime());

    if (studyDays.length < 7) return false;

    // Check for 7 consecutive days
    for (let i = 0; i <= studyDays.length - 7; i++) {
      let consecutive = true;
      for (let j = 0; j < 6; j++) {
        const currentDay = studyDays[i + j];
        const nextDay = studyDays[i + j + 1];
        const dayDiff = differenceInDays(currentDay, nextDay);
        if (dayDiff !== 1) {
          consecutive = false;
          break;
        }
      }
      if (consecutive) return true;
    }

    return false;
  };

  const checkWeekendWarrior = (sessions: StudySession[]) => {
    const dailyTotals = new Map<string, number>();
    
    sessions.forEach(session => {
      const dateKey = startOfDay(parseISO(session.date)).toISOString();
      const currentTotal = dailyTotals.get(dateKey) || 0;
      dailyTotals.set(dateKey, currentTotal + session.duration);
    });

    const studyDays = Array.from(dailyTotals.entries())
      .filter(([_, duration]) => duration >= 900)
      .map(([date, _]) => new Date(date));

    // Check if there's a weekend where both Saturday and Sunday were study days
    const weekends = new Map<string, Set<number>>();
    
    studyDays.forEach(date => {
      const weekStart = startOfWeek(date);
      const weekKey = weekStart.toISOString();
      const dayOfWeek = getDay(date); // 0 = Sunday, 6 = Saturday
      
      if (!weekends.has(weekKey)) {
        weekends.set(weekKey, new Set());
      }
      
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        weekends.get(weekKey)!.add(dayOfWeek);
      }
    });

    // Check if any weekend has both Saturday and Sunday
    for (const [_, days] of weekends) {
      if (days.has(0) && days.has(6)) {
        return true;
      }
    }

    return false;
  };

  const checkAssignmentStreak = (assignments: Assignment[]) => {
    const completedAssignments = assignments
      .filter(a => a.completed && a.completedAt)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());

    if (completedAssignments.length < 5) return 0;

    let maxStreak = 0;
    let currentStreak = 0;

    for (const assignment of completedAssignments) {
      const completedAt = parseISO(assignment.completedAt!);
      const dueDate = parseISO(assignment.dueDate);
      
      if (completedAt <= dueDate) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return maxStreak;
  };

  const checkMultitasker = (sessions: StudySession[], sessionDate: string) => {
    const sessionDay = startOfDay(parseISO(sessionDate));
    const sameDaySessions = sessions.filter(session => {
      const sessionDayCheck = startOfDay(parseISO(session.date));
      return sessionDayCheck.getTime() === sessionDay.getTime();
    });

    const subjects = new Set(sameDaySessions.map(s => s.name || 'Untagged'));
    return subjects.size >= 3;
  };

  const checkSubjectDiversity = (sessions: StudySession[]) => {
    const weeklySubjects = new Map<string, Set<string>>();
    
    sessions.forEach(session => {
      const weekStart = startOfWeek(parseISO(session.date));
      const weekKey = weekStart.toISOString();
      const subject = session.name || 'Untagged';
      
      if (!weeklySubjects.has(weekKey)) {
        weeklySubjects.set(weekKey, new Set());
      }
      weeklySubjects.get(weekKey)!.add(subject);
    });

    let maxSubjectsInWeek = 0;
    for (const [_, subjects] of weeklySubjects) {
      maxSubjectsInWeek = Math.max(maxSubjectsInWeek, subjects.size);
    }

    return maxSubjectsInWeek;
  };

  const getTotalSubjectsStudied = (sessions: StudySession[]) => {
    const allSubjects = new Set(sessions.map(s => s.name || 'Untagged'));
    return allSubjects.size;
  };

  const checkProductivityBeast = (sessions: StudySession[]) => {
    const weeklyTotals = new Map<string, number>();
    
    sessions.forEach(session => {
      const weekStart = startOfWeek(parseISO(session.date));
      const weekKey = weekStart.toISOString();
      const currentTotal = weeklyTotals.get(weekKey) || 0;
      weeklyTotals.set(weekKey, currentTotal + session.duration);
    });

    // Check if any week has 10+ hours (36000 seconds)
    for (const [_, total] of weeklyTotals) {
      if (total >= 36000) {
        return true;
      }
    }

    return false;
  };

  // Check achievements when localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "studyfocus-sessions") {
        const sessions = e.newValue ? JSON.parse(e.newValue) : [];
        checkAndAwardAchievements(sessions);
      }
    };

    const handleSessionSaved = () => {
      const savedSessions = localStorage.getItem("studyfocus-sessions");
      const savedAssignments = localStorage.getItem("studyfocus-assignments");
      
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions);
        const assignments = savedAssignments ? JSON.parse(savedAssignments) : [];
        
        // Get the most recently added session
        const mostRecentSession = sessions[sessions.length - 1];
        checkAndAwardAchievements(sessions, assignments, mostRecentSession?.id);
      }
    };

    const handleAssignmentUpdated = () => {
      const savedSessions = localStorage.getItem("studyfocus-sessions");
      const savedAssignments = localStorage.getItem("studyfocus-assignments");
      
      if (savedAssignments) {
        const sessions = savedSessions ? JSON.parse(savedSessions) : [];
        const assignments = JSON.parse(savedAssignments);
        
        // Find the most recently completed assignment
        const recentlyCompleted = assignments
          .filter((a: Assignment) => a.completed && a.completedAt)
          .sort((a: Assignment, b: Assignment) => 
            new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
          )[0];
        
        checkAndAwardAchievements(sessions, assignments, undefined, recentlyCompleted?.id);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("sessionSaved", handleSessionSaved);
    window.addEventListener("assignmentUpdated", handleAssignmentUpdated);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("sessionSaved", handleSessionSaved);
      window.removeEventListener("assignmentUpdated", handleAssignmentUpdated);
    };
  }, [checkAndAwardAchievements]);

  return { checkAndAwardAchievements };
};