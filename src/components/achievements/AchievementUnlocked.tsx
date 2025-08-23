import { useState, useEffect } from "react";
import { Achievement } from "@/data/achievements";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AchievementUnlocked = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const handleAchievementUnlocked = (event: CustomEvent<Achievement>) => {
      const achievement = event.detail;
      setAchievements(prev => [...prev, achievement]);
      
      // Play achievement sound
      playAchievementSound();
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        dismissAchievement(achievement.id);
      }, 5000);
    };

    window.addEventListener("achievementUnlocked", handleAchievementUnlocked as EventListener);

    return () => {
      window.removeEventListener("achievementUnlocked", handleAchievementUnlocked as EventListener);
    };
  }, []);

  const playAchievementSound = () => {
    // Create a pleasant chime sound using Web Audio API
    try {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a sequence of pleasant tones
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 chord
      
      frequencies.forEach((freq, index) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.setValueAtTime(freq, context.currentTime);
        oscillator.type = "sine";
        
        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + 0.01 + index * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.3 + index * 0.1);
        
        oscillator.start(context.currentTime + index * 0.1);
        oscillator.stop(context.currentTime + 0.3 + index * 0.1);
      });
    } catch (error) {
      console.log("Could not play achievement sound:", error);
    }
  };

  const dismissAchievement = (achievementId: string) => {
    setAchievements(prev => prev.filter(a => a.id !== achievementId));
  };

  if (achievements.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {achievements.map((achievement) => {
        const IconComponent = achievement.icon;
        return (
          <Card 
            key={achievement.id}
            className="w-80 bg-card border-primary/50 shadow-lg animate-slide-in-right"
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">
                        Achievement Unlocked!
                      </h3>
                      <p className="font-medium text-primary mt-1">
                        {achievement.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 flex-shrink-0"
                      onClick={() => dismissAchievement(achievement.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};