import { useCallback } from "react";
import { useStorage } from "./useStorage";

export interface HistoryEntry {
  id: string;
  shortcut: string;
  expanded: string;
  source: "snippet" | "ai";
  usedAt: number;
  site: string;
}

const MAX_HISTORY = 100;

/**
 * useHistory — tracks recent text expansions for the History page.
 */
export function useHistory() {
  const [history, setHistory, loading] = useStorage<HistoryEntry[]>(
    "history",
    []
  );

  const addEntry = useCallback(
    async (entry: Omit<HistoryEntry, "id" | "usedAt">) => {
      const newEntry: HistoryEntry = {
        ...entry,
        id: `hist_${Date.now()}`,
        usedAt: Date.now(),
      };
      const trimmed = [newEntry, ...history].slice(0, MAX_HISTORY);
      await setHistory(trimmed);
    },
    [history, setHistory]
  );

  const clearHistory = useCallback(async () => {
    await setHistory([]);
  }, [setHistory]);

  const removeEntry = useCallback(
    async (id: string) => {
      await setHistory(history.filter((e) => e.id !== id));
    },
    [history, setHistory]
  );

  // Aggregate stats
  const stats = {
    total: history.length,
    aiCount: history.filter((e) => e.source === "ai").length,
    snippetCount: history.filter((e) => e.source === "snippet").length,
    topShortcuts: getTopShortcuts(history, 5),
  };

  return { history, loading, addEntry, clearHistory, removeEntry, stats };
}

function getTopShortcuts(
  history: HistoryEntry[],
  n: number
): { shortcut: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const e of history) {
    counts[e.shortcut] = (counts[e.shortcut] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([shortcut, count]) => ({ shortcut, count }));
}