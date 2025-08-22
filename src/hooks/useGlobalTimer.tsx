import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import soundTrack from "@/Magical-Moments-chosic.com_.mp3";

interface StudySession {
  id: string;
  name: string;
  duration: number;
  date: Date;
}

interface GlobalTimerState {
  isRunning: boolean;
  time: number;
  initialTime: number;
  sessionName: string;
  isConfigured: boolean;
  startTimestamp: number | null;
  pauseOffset: number;
  showCompletionDialog: boolean;
}

interface GlobalTimerContextType {
  // State
  isRunning: boolean;
  time: number;
  initialTime: number;
  sessionName: string;
  isConfigured: boolean;
  showCompletionDialog: boolean;
  
  // Actions
  configureTimer: (duration: number, name?: string) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  dismissCompletion: () => void;
  
  // Utils
  formatTime: (seconds: number) => string;
}

const GlobalTimerContext = createContext<GlobalTimerContextType | undefined>(undefined);

export const GlobalTimerProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<GlobalTimerState>({
    isRunning: false,
    time: 0,
    initialTime: 0,
    sessionName: "",
    isConfigured: false,
    startTimestamp: null,
    pauseOffset: 0,
    showCompletionDialog: false,
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load persistent timer state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('studyfocus-timer-state');
    if (saved) {
      try {
        const parsedState = JSON.parse(saved);
        // Only restore if timer was actually running
        if (parsedState.isRunning && parsedState.startTimestamp) {
          const elapsed = Math.floor((Date.now() - parsedState.startTimestamp - parsedState.pauseOffset) / 1000);
          const timeLeft = parsedState.initialTime - elapsed;
          
          if (timeLeft > 0) {
            setState(prev => ({
              ...prev,
              ...parsedState,
              time: timeLeft
            }));
          } else {
            // Timer should have completed while away
            handleTimerComplete(parsedState);
          }
        } else {
          setState(prev => ({
            ...prev,
            ...parsedState,
            isRunning: false
          }));
        }
      } catch (error) {
        console.error('Failed to restore timer state:', error);
      }
    }

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Save timer state to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('studyfocus-timer-state', JSON.stringify(state));
  }, [state]);

  // Main timer effect
  useEffect(() => {
    if (!state.isConfigured || !state.isRunning) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      if (state.startTimestamp !== null) {
        const elapsed = Math.floor((Date.now() - state.startTimestamp - state.pauseOffset) / 1000);
        const left = state.initialTime - elapsed;
        
        if (left <= 0) {
          handleTimerComplete(state);
        } else {
          setState(prev => ({ ...prev, time: left }));
        }
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [state.isRunning, state.isConfigured, state.initialTime, state.startTimestamp]);

  const playPleasantChime = () => {
    try {
      const audio = new Audio(soundTrack);
      audio.loop = true;
      audio.volume = 0.7;
      
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Audio playback failed:', error);
        });
      }
      
      // Store audio reference for stopping
      audioRef.current = audio;
      
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (error) {
        console.log('Error stopping audio:', error);
      }
    }
  };

  const handleTimerComplete = (timerState: GlobalTimerState) => {
    // Stop the timer
    setState(prev => ({
      ...prev,
      isRunning: false,
      time: 0,
      showCompletionDialog: true
    }));
    
    clearInterval(intervalRef.current);

    // Play pleasant alarm
    playPleasantChime();
    
    // Show system notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('StudyFocus - Session Complete!', {
        body: `Your ${Math.floor(timerState.initialTime / 60)}-minute study session is complete!`,
        icon: '/favicon.ico'
      });
    }

    // Auto-save session
    const session: StudySession = {
      id: Date.now().toString(),
      name: timerState.sessionName || `${Math.floor(timerState.initialTime / 60)} min Study Session`,
      duration: timerState.initialTime,
      date: new Date()
    };

    // Save to localStorage
    const existingSessions = JSON.parse(localStorage.getItem('studyfocus-sessions') || '[]');
    const updatedSessions = [...existingSessions, session];
    localStorage.setItem('studyfocus-sessions', JSON.stringify(updatedSessions));
    
    // Dispatch event for UI updates
    window.dispatchEvent(new Event('sessionSaved'));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const configureTimer = (duration: number, name: string = "") => {
    const timeInSeconds = duration * 60;
    setState(prev => ({
      ...prev,
      time: timeInSeconds,
      initialTime: timeInSeconds,
      sessionName: name,
      isConfigured: true,
      isRunning: false,
      startTimestamp: null,
      pauseOffset: 0,
      showCompletionDialog: false
    }));
  };

  const startTimer = () => {
    if (!state.isConfigured) return;
    
    const now = Date.now();
    setState(prev => ({
      ...prev,
      isRunning: true,
      startTimestamp: prev.startTimestamp === null ? now : prev.startTimestamp,
      pauseOffset: prev.startTimestamp === null ? 0 : prev.pauseOffset + (now - (prev.startTimestamp + (prev.initialTime - prev.time) * 1000 + prev.pauseOffset))
    }));
  };

  const pauseTimer = () => {
    setState(prev => ({ ...prev, isRunning: false }));
  };

  const stopTimer = () => {
    setState(prev => ({ ...prev, isRunning: false }));
    
    // If some time passed, could ask to save, but for now just reset
    if (state.initialTime > state.time && state.time > 0) {
      const studiedTime = state.initialTime - state.time;
      const session: StudySession = {
        id: Date.now().toString(),
        name: state.sessionName || `${Math.floor(studiedTime / 60)} min Study Session`,
        duration: studiedTime,
        date: new Date()
      };

      const existingSessions = JSON.parse(localStorage.getItem('studyfocus-sessions') || '[]');
      const updatedSessions = [...existingSessions, session];
      localStorage.setItem('studyfocus-sessions', JSON.stringify(updatedSessions));
      window.dispatchEvent(new Event('sessionSaved'));
    }
    
    resetTimer();
  };

  const resetTimer = () => {
    setState({
      isRunning: false,
      time: 0,
      initialTime: 0,
      sessionName: "",
      isConfigured: false,
      startTimestamp: null,
      pauseOffset: 0,
      showCompletionDialog: false
    });
    clearInterval(intervalRef.current);
  };

  const dismissCompletion = () => {
    stopAlarm();
    setState(prev => ({ ...prev, showCompletionDialog: false }));
    resetTimer();
  };

  return (
    <GlobalTimerContext.Provider
      value={{
        isRunning: state.isRunning,
        time: state.time,
        initialTime: state.initialTime,
        sessionName: state.sessionName,
        isConfigured: state.isConfigured,
        showCompletionDialog: state.showCompletionDialog,
        configureTimer,
        startTimer,
        pauseTimer,
        stopTimer,
        resetTimer,
        dismissCompletion,
        formatTime,
      }}
    >
      {children}
    </GlobalTimerContext.Provider>
  );
};

export const useGlobalTimer = () => {
  const context = useContext(GlobalTimerContext);
  if (context === undefined) {
    throw new Error('useGlobalTimer must be used within a GlobalTimerProvider');
  }
  return context;
};