import { useState, useEffect } from "react";
import type { Settings } from "../types";

const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  aiEnabled: true,
  geminiApiKey: "",
  model: "gemini",
  analysisMode: "comprehensive",
  autoSuggest: true,
  suggestionDelay: 1000,
  minTextLength: 10,
  excludedSites: [],
  cloudSyncEnabled: false,
  backendUrl: "http://localhost:4000",
};

export function useSettings() {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load settings from chrome storage
    chrome.storage.sync.get("settings", ({ settings: storedSettings }) => {
      if (storedSettings) {
        setSettingsState(storedSettings as Settings);
      }
      setIsLoading(false);
    });
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettingsState(updated);
    chrome.storage.sync.set({ settings: updated });
  };

  return { settings, updateSettings, isLoading };
}
