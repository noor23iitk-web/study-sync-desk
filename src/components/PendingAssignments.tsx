import { useState, useEffect } from "react";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  createdAt: Date;
}

export const PendingAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  // Load assignments from localStorage and listen for changes
  useEffect(() => {
    const loadAssignments = () => {
      const saved = localStorage.getItem('studyfocus-assignments');
      if (saved) {
        const parsed = JSON.parse(saved);
        setAssignments(parsed.map((a: any) => ({
          ...a,
          dueDate: new Date(a.dueDate),
          createdAt: new Date(a.createdAt)
        })));
      }
    };

    loadAssignments();

    // Listen for storage changes
    const handleStorageChange = () => loadAssignments();
    window.addEventListener('storage', handleStorageChange);

    // Listen for custom events from assignment tracker
    const handleAssignmentUpdate = () => loadAssignments();
    window.addEventListener('assignmentUpdated', handleAssignmentUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('assignmentUpdated', handleAssignmentUpdate);
    };
  }, []);

  const getTimeRemaining = (dueDate: Date) => {
    const now = new Date();
    const diff = dueDate.getTime() - now.getTime();
    
    if (diff < 0) return { text: "Overdue", isOverdue: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return { text: `${days}d ${hours}h`, isOverdue: false };
    } else if (hours > 0) {
      return { text: `${hours}h ${minutes}m`, isOverdue: false };
    } else {
      return { text: `${minutes}m`, isOverdue: false };
    }
  };

  // Get pending assignments sorted by due date
  const pendingAssignments = assignments
    .filter(a => !a.completed)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5); // Show only the next 5 upcoming assignments

  return (
    <Card className="card-hover">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-primary" />
          <span>Pending Assignments</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingAssignments.length === 0 ? (
          <div className="text-center py-4">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-foreground-secondary">No pending assignments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAssignments.map((assignment) => {
              const timeRemaining = getTimeRemaining(assignment.dueDate);
              
              return (
                <div
                  key={assignment.id}
                  className={`p-3 rounded-lg border transition-all ${
                    timeRemaining.isOverdue
                      ? 'bg-warning/5 border-warning/20'
                      : 'bg-background-secondary border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">
                        {assignment.title}
                      </h4>
                      <div className="flex items-center space-x-3 mt-1">
                        <div className="flex items-center space-x-1 text-xs text-foreground-secondary">
                          <Calendar className="h-3 w-3" />
                          <span>{assignment.dueDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-foreground-secondary">
                          <Clock className="h-3 w-3" />
                          <span>{assignment.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Badge 
                      variant={timeRemaining.isOverdue ? "destructive" : "secondary"}
                      className="countdown-text text-xs ml-2 flex-shrink-0"
                    >
                      {timeRemaining.isOverdue && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {timeRemaining.text}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};