import { useState, useEffect } from "react";
import { Clock, BookOpen, Target, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssignmentTracker } from "./AssignmentTracker";
import { StudyTimer } from "./StudyTimer";
import { StudyStats } from "./StudyStats";
import { PendingAssignments } from "./PendingAssignments";
import { QuickNotes } from "./QuickNotes";

interface StudySession {
  id: string;
  name: string;
  duration: number;
  date: Date;
}

export const StudyDashboard = () => {
  const [activeView, setActiveView] = useState<"dashboard" | "assignments" | "timer" | "notes">("dashboard");

  const handleSessionSaved = (session: StudySession) => {
    // Trigger a custom event to update stats
    window.dispatchEvent(new Event('sessionSaved'));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background-secondary/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">StudyFocus</h1>
            </div>
            
            <nav className="flex items-center space-x-2">
              <Button
                variant={activeView === "dashboard" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView("dashboard")}
                className="text-sm"
              >
                <Target className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant={activeView === "assignments" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView("assignments")}
                className="text-sm"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Assignments
              </Button>
              <Button
                variant={activeView === "timer" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView("timer")}
                className="text-sm"
              >
                <Clock className="h-4 w-4 mr-2" />
                Study Timer
              </Button>
              <Button
                variant={activeView === "notes" ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveView("notes")}
                className="text-sm"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Notes
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {activeView === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <StudyStats />
              
              {/* Pending Assignments */}
              <PendingAssignments />
              
              {/* Quick Actions */}
              <Card className="card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5 text-primary" />
                    <span>Quick Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-12" 
                    onClick={() => setActiveView("assignments")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Add Assignment
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-12"
                    onClick={() => setActiveView("timer")}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Start Study Session
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              <StudyTimer compact onSessionSaved={handleSessionSaved} />
              <QuickNotes />
            </div>
          </div>
        )}

        {activeView === "assignments" && <AssignmentTracker />}
        {activeView === "timer" && <StudyTimer onSessionSaved={handleSessionSaved} />}
        {activeView === "notes" && <QuickNotes />}
      </main>
    </div>
  );
};