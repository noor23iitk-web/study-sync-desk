import { Sun, Moon, Award, Flame, Target, Calendar, Clock, Trophy, Zap, Star, BookOpen, Coffee, Brain, Gem, Crown, Shield, Rocket, Heart, Users, CheckCircle, TrendingUp, Timer, Sunrise, Activity, Focus, Diamond, Sparkles } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: "session" | "streak" | "assignment" | "milestone";
  criteria: {
    type: "first_session" | "early_bird" | "night_owl" | "marathoner" | "consistent" | "overachiever" | "total_hours" | "session_count" | "perfect_week" | "speed_demon" | "weekend_warrior" | "month_streak" | "subject_diversity" | "assignment_streak" | "focus_master" | "productivity_beast" | "dawn_warrior" | "midnight_scholar" | "century_club" | "dedication" | "perfectionist" | "multitasker" | "iron_will" | "legend" | "habit_builder" | "time_lord" | "assignment_master" | "study_ninja" | "knowledge_seeker" | "unstoppable";
    value?: number;
  };
  rarity: "common" | "rare" | "epic" | "legendary";
}

export const ACHIEVEMENTS: Achievement[] = [
  // First time achievements
  {
    id: "first_step",
    name: "First Step",
    description: "Complete your first study session",
    icon: Star,
    category: "milestone",
    criteria: { type: "first_session" },
    rarity: "common"
  },
  
  // Time-based achievements
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Complete a study session before 9 AM",
    icon: Sun,
    category: "session",
    criteria: { type: "early_bird" },
    rarity: "common"
  },
  {
    id: "dawn_warrior",
    name: "Dawn Warrior",
    description: "Complete a study session before 6 AM",
    icon: Sunrise,
    category: "session",
    criteria: { type: "dawn_warrior" },
    rarity: "rare"
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Complete a study session after 9 PM",
    icon: Moon,
    category: "session",
    criteria: { type: "night_owl" },
    rarity: "common"
  },
  {
    id: "midnight_scholar",
    name: "Midnight Scholar",
    description: "Complete a study session after midnight",
    icon: Moon,
    category: "session",
    criteria: { type: "midnight_scholar" },
    rarity: "rare"
  },
  
  // Duration achievements
  {
    id: "marathoner",
    name: "Marathoner",
    description: "Complete a study session longer than 2 hours",
    icon: Award,
    category: "session",
    criteria: { type: "marathoner", value: 7200 }, // 2 hours in seconds
    rarity: "rare"
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Complete a focused 25-minute session",
    icon: Zap,
    category: "session",
    criteria: { type: "speed_demon", value: 1500 }, // 25 minutes in seconds
    rarity: "common"
  },
  {
    id: "focus_master",
    name: "Focus Master",
    description: "Complete a 4-hour study session",
    icon: Focus,
    category: "session",
    criteria: { type: "focus_master", value: 14400 }, // 4 hours in seconds
    rarity: "epic"
  },
  {
    id: "time_lord",
    name: "Time Lord",
    description: "Complete an 8-hour study session",
    icon: Timer,
    category: "session",
    criteria: { type: "time_lord", value: 28800 }, // 8 hours in seconds
    rarity: "legendary"
  },
  
  // Streak achievements
  {
    id: "consistent",
    name: "Consistent",
    description: "Maintain a 7-day study streak",
    icon: Flame,
    category: "streak",
    criteria: { type: "consistent", value: 7 },
    rarity: "rare"
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Study every day for a week",
    icon: Trophy,
    category: "streak",
    criteria: { type: "perfect_week", value: 7 },
    rarity: "epic"
  },
  {
    id: "weekend_warrior",
    name: "Weekend Warrior",
    description: "Study on both Saturday and Sunday",
    icon: Shield,
    category: "streak",
    criteria: { type: "weekend_warrior" },
    rarity: "common"
  },
  {
    id: "month_streak",
    name: "Monthly Master",
    description: "Maintain a 30-day study streak",
    icon: Crown,
    category: "streak",
    criteria: { type: "month_streak", value: 30 },
    rarity: "legendary"
  },
  {
    id: "iron_will",
    name: "Iron Will",
    description: "Maintain a 14-day study streak",
    icon: Activity,
    category: "streak",
    criteria: { type: "iron_will", value: 14 },
    rarity: "epic"
  },
  {
    id: "habit_builder",
    name: "Habit Builder",
    description: "Study for 21 consecutive days",
    icon: TrendingUp,
    category: "streak",
    criteria: { type: "habit_builder", value: 21 },
    rarity: "epic"
  },
  
  // Assignment achievements
  {
    id: "overachiever",
    name: "Overachiever",
    description: "Complete an assignment more than 24 hours before its due date",
    icon: Target,
    category: "assignment",
    criteria: { type: "overachiever", value: 86400 }, // 24 hours in seconds
    rarity: "rare"
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Complete 10 assignments on time",
    icon: CheckCircle,
    category: "assignment",
    criteria: { type: "perfectionist", value: 10 },
    rarity: "rare"
  },
  {
    id: "assignment_streak",
    name: "Assignment Streak",
    description: "Complete 5 assignments in a row without missing any",
    icon: Gem,
    category: "assignment",
    criteria: { type: "assignment_streak", value: 5 },
    rarity: "epic"
  },
  {
    id: "assignment_master",
    name: "Assignment Master",
    description: "Complete 50 assignments",
    icon: Diamond,
    category: "assignment",
    criteria: { type: "assignment_master", value: 50 },
    rarity: "legendary"
  },
  
  // Subject diversity achievements
  {
    id: "multitasker",
    name: "Multitasker",
    description: "Study 3 different subjects in one day",
    icon: Users,
    category: "session",
    criteria: { type: "multitasker", value: 3 },
    rarity: "rare"
  },
  {
    id: "subject_diversity",
    name: "Well-Rounded Scholar",
    description: "Study 5 different subjects in one week",
    icon: BookOpen,
    category: "session",
    criteria: { type: "subject_diversity", value: 5 },
    rarity: "epic"
  },
  {
    id: "knowledge_seeker",
    name: "Knowledge Seeker",
    description: "Study 10 different subjects",
    icon: Brain,
    category: "milestone",
    criteria: { type: "knowledge_seeker", value: 10 },
    rarity: "legendary"
  },
  
  // Milestone achievements
  {
    id: "dedicated_learner",
    name: "Dedicated Learner",
    description: "Accumulate 10 hours of total study time",
    icon: Clock,
    category: "milestone",
    criteria: { type: "total_hours", value: 36000 }, // 10 hours in seconds
    rarity: "rare"
  },
  {
    id: "study_master",
    name: "Study Master",
    description: "Complete 50 study sessions",
    icon: Award,
    category: "milestone",
    criteria: { type: "session_count", value: 50 },
    rarity: "epic"
  },
  {
    id: "scholar",
    name: "Scholar",
    description: "Accumulate 100 hours of total study time",
    icon: Trophy,
    category: "milestone",
    criteria: { type: "total_hours", value: 360000 }, // 100 hours in seconds
    rarity: "legendary"
  },
  {
    id: "century_club",
    name: "Century Club",
    description: "Complete 100 study sessions",
    icon: Sparkles,
    category: "milestone",
    criteria: { type: "century_club", value: 100 },
    rarity: "legendary"
  },
  {
    id: "dedication",
    name: "Dedication",
    description: "Accumulate 25 hours of total study time",
    icon: Heart,
    category: "milestone",
    criteria: { type: "dedication", value: 90000 }, // 25 hours in seconds
    rarity: "epic"
  },
  {
    id: "productivity_beast",
    name: "Productivity Beast",
    description: "Study for 10 hours in a single week",
    icon: Rocket,
    category: "milestone",
    criteria: { type: "productivity_beast", value: 36000 }, // 10 hours in seconds
    rarity: "epic"
  },
  {
    id: "study_ninja",
    name: "Study Ninja",
    description: "Complete 20 study sessions",
    icon: Zap,
    category: "milestone",
    criteria: { type: "study_ninja", value: 20 },
    rarity: "rare"
  },
  {
    id: "legend",
    name: "Legend",
    description: "Accumulate 500 hours of total study time",
    icon: Crown,
    category: "milestone",
    criteria: { type: "legend", value: 1800000 }, // 500 hours in seconds
    rarity: "legendary"
  },
  {
    id: "unstoppable",
    name: "Unstoppable",
    description: "Maintain a 60-day study streak",
    icon: Diamond,
    category: "streak",
    criteria: { type: "unstoppable", value: 60 },
    rarity: "legendary"
  },
  {
    id: "coffee_break",
    name: "Coffee Break Champion",
    description: "Complete a 15-minute focused study session",
    icon: Coffee,
    category: "session",
    criteria: { type: "speed_demon", value: 900 }, // 15 minutes in seconds
    rarity: "common"
  }
];

export const getRarityColor = (rarity: Achievement["rarity"]) => {
  switch (rarity) {
    case "common":
      return "text-blue-500";
    case "rare":
      return "text-purple-500";
    case "epic":
      return "text-orange-500";
    case "legendary":
      return "text-yellow-500";
    default:
      return "text-gray-500";
  }
};

export const getRarityBorder = (rarity: Achievement["rarity"]) => {
  switch (rarity) {
    case "common":
      return "border-blue-500/30";
    case "rare":
      return "border-purple-500/30";
    case "epic":
      return "border-orange-500/30";
    case "legendary":
      return "border-yellow-500/30 shadow-yellow-500/20 shadow-lg";
    default:
      return "border-gray-500/30";
  }
};