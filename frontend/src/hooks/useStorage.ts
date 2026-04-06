import { useState, useEffect } from "react";

export function useStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    chrome.storage.local.get(key, (result) => {
      if (result && result[key] !== undefined) {
        setValue(result[key] as T);
      }
      setIsLoading(false);
    });
  }, [key]);

  const setStorageValue = (newValue: T) => {
    setValue(newValue);
    chrome.storage.local.set({ [key]: newValue });
  };

  return [value, setStorageValue, isLoading] as const;
}
