import { Sun, Moon, Award, Flame, Target, Calendar, Clock, Trophy, Zap, Star } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: "session" | "streak" | "assignment" | "milestone";
  criteria: {
    type: "first_session" | "early_bird" | "night_owl" | "marathoner" | "consistent" | "overachiever" | "total_hours" | "session_count" | "perfect_week" | "speed_demon";
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
    id: "night_owl",
    name: "Night Owl",
    description: "Complete a study session after 9 PM",
    icon: Moon,
    category: "session",
    criteria: { type: "night_owl" },
    rarity: "common"
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