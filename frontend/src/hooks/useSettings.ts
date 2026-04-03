import { useCallback } from "react";
import { useStorage } from "./useStorage";
import type { Settings } from "../types";

const DEFAULT_SETTINGS: Settings = {
  apiKey: "",
  aiEnabled: false,
  triggerKey: "Space",
  maxSuggestions: 5,
};

/**
 * useSettings — reads and writes the extension Settings object.
 *
 * @example
 *   const { settings, updateSettings, resetSettings } = useSettings();
 */
export function useSettings() {
  const [settings, setSettings, loading] = useStorage<Settings>(
    "settings",
    DEFAULT_SETTINGS
  );

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      await setSettings({ ...settings, ...patch });
    },
    [settings, setSettings]
  );

  const resetSettings = useCallback(async () => {
    await setSettings(DEFAULT_SETTINGS);
  }, [setSettings]);

  return { settings, loading, updateSettings, resetSettings };
}