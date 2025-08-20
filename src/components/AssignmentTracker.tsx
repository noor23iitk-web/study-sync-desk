import { useState, useEffect } from "react";
import { Plus, Calendar, Clock, Check, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  createdAt: Date;
}

export const AssignmentTracker = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    dueDate: ""
  });

  // Load assignments from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('studyfocus-assignments');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAssignments(parsed.map((a: any) => ({
        ...a,
        dueDate: new Date(a.dueDate),
        createdAt: new Date(a.createdAt)
      })));
    }
  }, []);

  // Save assignments to localStorage when updated
  useEffect(() => {
    localStorage.setItem('studyfocus-assignments', JSON.stringify(assignments));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('assignmentUpdated'));
  }, [assignments]);

  const handleAddAssignment = () => {
    if (!newAssignment.title || !newAssignment.dueDate) return;

    const assignment: Assignment = {
      id: Date.now().toString(),
      title: newAssignment.title,
      description: newAssignment.description,
      dueDate: new Date(newAssignment.dueDate),
      completed: false,
      createdAt: new Date()
    };

    setAssignments(prev => [...prev, assignment]);
    setNewAssignment({ title: "", description: "", dueDate: "" });
    setIsDialogOpen(false);
  };

  const toggleComplete = (id: string) => {
    setAssignments(prev => prev.map(assignment => 
      assignment.id === id 
        ? { ...assignment, completed: !assignment.completed }
        : assignment
    ));
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

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

  const sortedAssignments = [...assignments].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  const upcomingCount = assignments.filter(a => !a.completed && a.dueDate > new Date()).length;
  const overdueCount = assignments.filter(a => !a.completed && a.dueDate < new Date()).length;
  const completedCount = assignments.filter(a => a.completed).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{upcomingCount}</p>
                <p className="text-sm text-foreground-secondary">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{overdueCount}</p>
                <p className="text-sm text-foreground-secondary">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{completedCount}</p>
                <p className="text-sm text-foreground-secondary">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Assignment */}
      <Card className="card-hover">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Assignments</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Assignment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Assignment title"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Assignment details..."
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date & Time</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAssignment}>
                    Add Assignment
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground-secondary">No assignments yet. Add your first assignment to get started!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {sortedAssignments.map((assignment) => {
                const timeRemaining = getTimeRemaining(assignment.dueDate);
                
                return (
                  <div
                    key={assignment.id}
                    className={`p-4 rounded-lg border transition-all ${
                      assignment.completed 
                        ? 'bg-background-secondary border-border opacity-75' 
                        : timeRemaining.isOverdue
                        ? 'bg-warning/5 border-warning/20'
                        : 'bg-card border-border hover:bg-card-hover'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComplete(assignment.id)}
                          className={`mt-1 h-6 w-6 p-0 rounded-full border-2 ${
                            assignment.completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-border hover:border-primary'
                          }`}
                        >
                          {assignment.completed && <Check className="h-3 w-3" />}
                        </Button>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-medium ${assignment.completed ? 'line-through text-foreground-secondary' : 'text-foreground'}`}>
                            {assignment.title}
                          </h3>
                          {assignment.description && (
                            <p className={`text-sm mt-1 ${assignment.completed ? 'line-through text-foreground-secondary' : 'text-foreground-secondary'}`}>
                              {assignment.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1 text-sm text-foreground-secondary">
                              <Calendar className="h-3 w-3" />
                              <span>{assignment.dueDate.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm text-foreground-secondary">
                              <Clock className="h-3 w-3" />
                              <span>{assignment.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!assignment.completed && (
                          <Badge 
                            variant={timeRemaining.isOverdue ? "destructive" : "secondary"}
                            className="countdown-text"
                          >
                            {timeRemaining.text}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAssignment(assignment.id)}
                          className="text-foreground-secondary hover:text-warning"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};