import { useState, useEffect, useRef } from "react";
import { FileText, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export const QuickNotes = () => {
  const [notes, setNotes] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load notes from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('studyfocus-notes');
    if (saved) {
      const data = JSON.parse(saved);
      setNotes(data.content || "");
      setLastSaved(data.lastSaved ? new Date(data.lastSaved) : null);
    }
  }, []);

  // Auto-save functionality
  const saveNotes = async () => {
    setIsSaving(true);
    const now = new Date();
    const data = {
      content: notes,
      lastSaved: now.toISOString()
    };
    
    localStorage.setItem('studyfocus-notes', JSON.stringify(data));
    setLastSaved(now);
    
    // Simulate slight delay to show saving indicator
    setTimeout(() => setIsSaving(false), 500);
  };

  // Debounced auto-save on text change
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      if (notes.trim()) {
        saveNotes();
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [notes]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <Card className="card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Quick Notes</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {isSaving && (
              <Badge variant="secondary" className="text-xs">
                <Save className="h-3 w-3 mr-1 animate-pulse" />
                Saving...
              </Badge>
            )}
            {lastSaved && !isSaving && (
              <Badge variant="outline" className="text-xs">
                Saved {formatLastSaved(lastSaved)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Type your notes, reminders, formulas, or any quick thoughts here..."
          value={notes}
          onChange={handleNotesChange}
          className="min-h-[200px] resize-none border-border focus:border-primary transition-colors"
          style={{ fontFamily: 'inherit' }}
        />
        <p className="text-xs text-foreground-secondary mt-2">
          Notes auto-save every 2 seconds while typing
        </p>
      </CardContent>
    </Card>
  );
};