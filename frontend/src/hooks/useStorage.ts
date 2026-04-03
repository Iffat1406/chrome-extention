import { useState, useEffect, useCallback } from "react";

/**
 * useStorage — wraps chrome.storage.sync as React state.
 * Automatically syncs across tabs via chrome.storage.onChanged.
 *
 * @example
 *   const [apiKey, setApiKey] = useStorage<string>("apiKey", "");
 */
export function useStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => Promise<void>, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chrome.storage.sync.get(key, (data) => {
      if (data[key] !== undefined) setValue(data[key] as T);
      setLoading(false);
    });

    // Keep in sync when another popup/tab writes the same key
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (key in changes) {
        setValue(changes[key].newValue as T);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [key]);

  const set = useCallback(
    async (newValue: T) => {
      setValue(newValue);
      await chrome.storage.sync.set({ [key]: newValue });
    },
    [key]
  );

  return [value, set, loading];
}