import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  completed: boolean;
  subject?: string;
}

export const CalendarView = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    subject: "",
  });

  // Load assignments from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('studyfocus-assignments');
    if (saved) {
      const parsed = JSON.parse(saved);
      setAssignments(parsed.map((a: any) => ({
        ...a,
        dueDate: new Date(a.dueDate)
      })));
    }

    // Listen for assignment updates
    const handleAssignmentUpdate = () => {
      const updated = localStorage.getItem('studyfocus-assignments');
      if (updated) {
        const parsed = JSON.parse(updated);
        setAssignments(parsed.map((a: any) => ({
          ...a,
          dueDate: new Date(a.dueDate)
        })));
      }
    };

    window.addEventListener('assignmentUpdated', handleAssignmentUpdate);
    return () => window.removeEventListener('assignmentUpdated', handleAssignmentUpdate);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getAssignmentsForDate = (date: Date) => {
    return assignments.filter(assignment => {
      const assignmentDate = new Date(assignment.dueDate);
      return (
        assignmentDate.getDate() === date.getDate() &&
        assignmentDate.getMonth() === date.getMonth() &&
        assignmentDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddAssignment = () => {
    if (!selectedDate || !newAssignment.title.trim()) return;

    const assignment: Assignment = {
      id: Date.now().toString(),
      title: newAssignment.title.trim(),
      description: newAssignment.description.trim(),
      subject: newAssignment.subject.trim(),
      dueDate: selectedDate,
      completed: false,
    };

    const updatedAssignments = [...assignments, assignment];
    setAssignments(updatedAssignments);
    localStorage.setItem('studyfocus-assignments', JSON.stringify(updatedAssignments));
    window.dispatchEvent(new Event('assignmentUpdated'));

    // Reset form
    setNewAssignment({ title: "", description: "", subject: "" });
    setShowAddDialog(false);
    setSelectedDate(null);
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const selectedDateAssignments = selectedDate ? getAssignmentsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>Assignment Calendar</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold min-w-[180px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {dayNames.map(day => (
              <div key={day} className="text-center text-sm font-medium text-foreground-secondary p-2">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-2" />;
              }

              const dayAssignments = getAssignmentsForDate(day);
              const isToday = new Date().toDateString() === day.toDateString();
              const isSelected = selectedDate?.toDateString() === day.toDateString();
              const hasAssignments = dayAssignments.length > 0;
              const hasOverdue = dayAssignments.some(a => !a.completed && new Date(a.dueDate) < new Date());

              return (
                <button
                  key={index}
                  onClick={() => handleDateClick(day)}
                  className={`
                    relative p-3 text-sm rounded-lg border transition-all hover:bg-background-secondary
                    ${isSelected ? 'bg-primary/10 border-primary' : 'border-border'}
                    ${isToday ? 'font-bold text-primary' : 'text-foreground'}
                  `}
                >
                  <span>{day.getDate()}</span>
                  {hasAssignments && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      {hasOverdue ? (
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      ) : (
                        <div className="w-2 h-2 bg-primary rounded-full" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="card-hover">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardTitle>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Assignment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Assignment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newAssignment.title}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Assignment title..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject (Optional)</Label>
                      <Input
                        id="subject"
                        value={newAssignment.subject}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Math, Science, etc..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={newAssignment.description}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Assignment details..."
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddAssignment} disabled={!newAssignment.title.trim()}>
                        Add Assignment
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {selectedDateAssignments.length > 0 ? (
              <div className="space-y-3">
                {selectedDateAssignments.map(assignment => {
                  const isOverdue = !assignment.completed && new Date(assignment.dueDate) < new Date();
                  
                  return (
                    <div 
                      key={assignment.id} 
                      className={`p-3 rounded-lg border ${
                        isOverdue ? 'border-red-200 bg-red-50' : 'border-border bg-background-secondary'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`font-medium ${isOverdue ? 'text-red-700' : 'text-foreground'}`}>
                            {assignment.title}
                          </h4>
                          {assignment.subject && (
                            <p className="text-sm text-primary font-medium mt-1">
                              {assignment.subject}
                            </p>
                          )}
                          {assignment.description && (
                            <p className="text-sm text-foreground-secondary mt-1">
                              {assignment.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-foreground-secondary'}`} />
                          <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-foreground-secondary'}`}>
                            {isOverdue ? 'Overdue' : 'Due'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-foreground-secondary">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No assignments due on this date</p>
                <p className="text-sm mt-1">Click "Add Assignment" to create one</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};