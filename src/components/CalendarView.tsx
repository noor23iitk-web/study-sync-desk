import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, ChevronRight, Plus, Clock, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  createdAt: Date;
}

export const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDayDialog, setShowDayDialog] = useState(false);
  const [selectedDayAssignments, setSelectedDayAssignments] = useState<Assignment[]>([]);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    dueDate: ""
  });

  // Load assignments from localStorage
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

    // Listen for assignment updates
    const handleAssignmentUpdate = () => {
      loadAssignments();
    };

    window.addEventListener('assignmentUpdated', handleAssignmentUpdate);
    return () => window.removeEventListener('assignmentUpdated', handleAssignmentUpdate);
  }, []);

  // Get assignments for a specific date
  const getAssignmentsForDate = (date: Date) => {
    return assignments.filter(assignment => 
      isSameDay(assignment.dueDate, date)
    );
  };

  // Get days with assignments for highlighting
  const getDaysWithAssignments = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    return daysInMonth.filter(day => 
      getAssignmentsForDate(day).length > 0
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDate(date);
    const dayAssignments = getAssignmentsForDate(date);
    
    if (dayAssignments.length > 0) {
      setSelectedDayAssignments(dayAssignments);
      setShowDayDialog(true);
    } else {
      // No assignments, show add dialog with pre-filled date
      setNewAssignment({
        title: "",
        description: "",
        dueDate: format(date, "yyyy-MM-dd'T'HH:mm")
      });
      setShowAddDialog(true);
    }
  };

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

    const updatedAssignments = [...assignments, assignment];
    setAssignments(updatedAssignments);
    localStorage.setItem('studyfocus-assignments', JSON.stringify(updatedAssignments));
    window.dispatchEvent(new Event('assignmentUpdated'));
    
    setNewAssignment({ title: "", description: "", dueDate: "" });
    setShowAddDialog(false);
  };

  const toggleComplete = (id: string) => {
    const updatedAssignments = assignments.map(assignment => 
      assignment.id === id 
        ? { ...assignment, completed: !assignment.completed }
        : assignment
    );
    setAssignments(updatedAssignments);
    localStorage.setItem('studyfocus-assignments', JSON.stringify(updatedAssignments));
    window.dispatchEvent(new Event('assignmentUpdated'));
    
    // Update the selected day assignments if dialog is open
    if (showDayDialog) {
      setSelectedDayAssignments(prev => 
        prev.map(assignment => 
          assignment.id === id 
            ? { ...assignment, completed: !assignment.completed }
            : assignment
        )
      );
    }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Calendar</h2>
          <p className="text-foreground-secondary">View and manage your assignments by date</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Assignment
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card className="card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <div className="flex items-center space-x-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              modifiers={{
                hasAssignments: getDaysWithAssignments()
              }}
              modifiersStyles={{
                hasAssignments: {
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                  color: 'hsl(var(--primary))',
                  fontWeight: 'bold',
                  border: '2px solid hsl(var(--primary) / 0.3)'
                }
              }}
              className="w-full"
            />
            <div className="mt-4 text-sm text-foreground-secondary">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-primary/10 border-2 border-primary/30"></div>
                <span>Days with assignments</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Info */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle>
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getAssignmentsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground-secondary mb-4">No assignments for this date</p>
                <Button onClick={() => {
                  setNewAssignment({
                    title: "",
                    description: "",
                    dueDate: format(selectedDate, "yyyy-MM-dd'T'HH:mm")
                  });
                  setShowAddDialog(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assignment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {getAssignmentsForDate(selectedDate).map((assignment) => {
                  const timeRemaining = getTimeRemaining(assignment.dueDate);
                  
                  return (
                    <div
                      key={assignment.id}
                      className={`p-3 rounded-lg border transition-all ${
                        assignment.completed 
                          ? 'bg-background-secondary border-border opacity-75' 
                          : timeRemaining.isOverdue
                          ? 'bg-warning/5 border-warning/20'
                          : 'bg-card border-border hover:bg-card-hover'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleComplete(assignment.id)}
                            className={`mt-1 h-5 w-5 p-0 rounded-full border-2 ${
                              assignment.completed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-border hover:border-primary'
                            }`}
                          >
                            {assignment.completed && <span className="text-xs">✓</span>}
                          </Button>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium ${assignment.completed ? 'line-through text-foreground-secondary' : 'text-foreground'}`}>
                              {assignment.title}
                            </h4>
                            {assignment.description && (
                              <p className={`text-sm mt-1 ${assignment.completed ? 'line-through text-foreground-secondary' : 'text-foreground-secondary'}`}>
                                {assignment.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-1 text-sm text-foreground-secondary mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{assignment.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                        
                        {!assignment.completed && (
                          <Badge 
                            variant={timeRemaining.isOverdue ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {timeRemaining.text}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Assignment Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
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
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAssignment}>
                Add Assignment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Day Assignments Dialog */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Assignments for {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedDayAssignments.map((assignment) => {
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
                    <div className="flex items-start space-x-3 flex-1">
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
                        {assignment.completed && <span className="text-sm">✓</span>}
                      </Button>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium ${assignment.completed ? 'line-through text-foreground-secondary' : 'text-foreground'}`}>
                          {assignment.title}
                        </h4>
                        {assignment.description && (
                          <p className={`text-sm mt-1 ${assignment.completed ? 'line-through text-foreground-secondary' : 'text-foreground-secondary'}`}>
                            {assignment.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-1 text-sm text-foreground-secondary mt-2">
                          <Clock className="h-3 w-3" />
                          <span>{assignment.dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    {!assignment.completed && (
                      <Badge 
                        variant={timeRemaining.isOverdue ? "destructive" : "secondary"}
                      >
                        {timeRemaining.text}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowDayDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};