import { useState, useEffect } from "react";
import type { WritingSession } from "../types";

export function useHistory() {
  const [sessions, setSessions] = useState<WritingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();

    // Listen for storage changes
    const handleStorageChange = (changes: any) => {
      if (changes.sessions) {
        setSessions(changes.sessions.newValue || []);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const loadSessions = () => {
    chrome.storage.local.get("sessions", ({ sessions = [] }) => {
      setSessions(sessions as WritingSession[]);
      setIsLoading(false);
    });
  };

  const clearHistory = () => {
    chrome.storage.local.remove("sessions", () => {
      setSessions([]);
    });
  };

  const deleteSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    chrome.storage.local.set({ sessions: updated });
  };

  return {
    sessions,
    isLoading,
    clearHistory,
    deleteSession,
    refresh: loadSessions,
  };
}
