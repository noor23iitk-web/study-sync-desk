import { useState, useEffect } from "react";
import { ACHIEVEMENTS, Achievement, getRarityColor, getRarityBorder } from "@/data/achievements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export const AchievementsPage = () => {
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);

  useEffect(() => {
    const savedAchievements = localStorage.getItem("studyfocus-achievements");
    if (savedAchievements) {
      setUnlockedAchievements(JSON.parse(savedAchievements));
    }

    const handleAchievementUnlocked = () => {
      const updatedAchievements = localStorage.getItem("studyfocus-achievements");
      if (updatedAchievements) {
        setUnlockedAchievements(JSON.parse(updatedAchievements));
      }
    };

    window.addEventListener("achievementUnlocked", handleAchievementUnlocked);

    return () => {
      window.removeEventListener("achievementUnlocked", handleAchievementUnlocked);
    };
  }, []);

  const unlockedIds = new Set(unlockedAchievements.map(a => a.id));
  const unlockedCount = unlockedIds.size;
  const totalAchievements = ACHIEVEMENTS.length;

  const getAchievementDate = (achievementId: string) => {
    const achievement = unlockedAchievements.find(a => a.id === achievementId);
    return achievement ? new Date(achievement.unlockedAt) : null;
  };

  const groupedAchievements = ACHIEVEMENTS.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categoryTitles = {
    milestone: "Milestones",
    session: "Study Sessions",
    streak: "Consistency",
    assignment: "Assignments"
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Achievements</h1>
              <p className="text-muted-foreground">Track your study milestones and accomplishments</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{unlockedCount}</div>
              <div className="text-sm text-muted-foreground">Unlocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">{totalAchievements}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {Math.round((unlockedCount / totalAchievements) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
        </div>

        {/* Achievement Categories */}
        {Object.entries(groupedAchievements).map(([category, achievements]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
              <span>{categoryTitles[category as keyof typeof categoryTitles]}</span>
              <Badge variant="secondary" className="text-xs">
                {achievements.filter(a => unlockedIds.has(a.id)).length}/{achievements.length}
              </Badge>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {achievements.map((achievement) => {
                const isUnlocked = unlockedIds.has(achievement.id);
                const unlockedDate = getAchievementDate(achievement.id);
                const IconComponent = achievement.icon;
                
                return (
                  <Tooltip key={achievement.id}>
                    <TooltipTrigger asChild>
                      <Card 
                        className={`card-hover transition-all duration-300 ${
                          isUnlocked 
                            ? `${getRarityBorder(achievement.rarity)} bg-gradient-to-br from-background to-background-secondary/30` 
                            : "border-muted bg-muted/10 grayscale"
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="text-center space-y-3">
                            <div className={`h-16 w-16 rounded-full mx-auto flex items-center justify-center ${
                              isUnlocked 
                                ? "bg-primary/10" 
                                : "bg-muted/20"
                            }`}>
                              {isUnlocked ? (
                                <IconComponent className={`h-8 w-8 ${getRarityColor(achievement.rarity)}`} />
                              ) : (
                                <Lock className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            
                            <div>
                              <h3 className={`font-semibold ${
                                isUnlocked ? "text-foreground" : "text-muted-foreground"
                              }`}>
                                {achievement.name}
                              </h3>
                              <p className={`text-xs mt-1 ${
                                isUnlocked ? "text-muted-foreground" : "text-muted-foreground/70"
                              }`}>
                                {achievement.description}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-center space-x-2">
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getRarityColor(achievement.rarity)} border-current`}
                              >
                                {achievement.rarity}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-medium">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {achievement.description}
                        </p>
                        {isUnlocked && unlockedDate && (
                          <p className="text-xs text-primary">
                            Unlocked on {format(unlockedDate, "MMM d, yyyy")}
                          </p>
                        )}
                        {!isUnlocked && (
                          <p className="text-xs text-muted-foreground">
                            {getHintText(achievement)}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
};

const getHintText = (achievement: Achievement): string => {
  switch (achievement.criteria.type) {
    case "first_session":
      return "Complete your first study session to unlock";
    case "early_bird":
      return "Start a study session before 9 AM";
    case "night_owl":
      return "Study after 9 PM to unlock";
    case "marathoner":
      return "Complete a study session longer than 2 hours";
    case "speed_demon":
      return "Complete a focused 25-minute session";
    case "consistent":
      return "Maintain a 7-day study streak";
    case "perfect_week":
      return "Study every day for a week";
    case "overachiever":
      return "Complete an assignment 24+ hours early";
    case "total_hours":
      return `Accumulate ${(achievement.criteria.value || 0) / 3600} hours of study time`;
    case "session_count":
      return `Complete ${achievement.criteria.value} study sessions`;
    default:
      return "Keep studying to unlock this achievement";
  }
};