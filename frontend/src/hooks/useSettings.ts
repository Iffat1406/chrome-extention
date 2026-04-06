import { useCallback } from "react";
import { useStorage } from "./useStorage";
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

/**
 * useSettings — reads and writes the extension Settings object.
 *
 * @example
 *   const { settings, updateSettings } = useSettings();
 */
export function useSettings() {
  const [settings, setSettings] = useStorage<Settings>(
    "settings",
    DEFAULT_SETTINGS
  );

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      await setSettings({ ...settings, ...patch });
    },
    [settings, setSettings]
  );

  return { settings, updateSettings };
}