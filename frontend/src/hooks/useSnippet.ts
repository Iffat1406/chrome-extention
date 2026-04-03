import { useCallback } from "react";
import { useStorage } from "./useStorage";
import type { Snippet } from "../types";

function generateId(): string {
  return `snip_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * useSnippets — full CRUD for the snippets array stored in chrome.storage.sync.
 *
 * @example
 *   const { snippets, addSnippet, updateSnippet, deleteSnippet } = useSnippets();
 */
export function useSnippets() {
  const [snippets, setSnippets, loading] = useStorage<Snippet[]>("snippets", []);

  const addSnippet = useCallback(
    async (data: Omit<Snippet, "id" | "createdAt">) => {
      const newSnippet: Snippet = {
        ...data,
        id: generateId(),
        createdAt: Date.now(),
      };
      await setSnippets([...snippets, newSnippet]);
      return newSnippet;
    },
    [snippets, setSnippets]
  );

  const updateSnippet = useCallback(
    async (id: string, updates: Partial<Omit<Snippet, "id" | "createdAt">>) => {
      const updated = snippets.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      );
      await setSnippets(updated);
    },
    [snippets, setSnippets]
  );

  const deleteSnippet = useCallback(
    async (id: string) => {
      await setSnippets(snippets.filter((s) => s.id !== id));
    },
    [snippets, setSnippets]
  );

  const getSnippet = useCallback(
    (id: string) => snippets.find((s) => s.id === id),
    [snippets]
  );

  const importSnippets = useCallback(
    async (incoming: Snippet[]) => {
      const existingIds = new Set(snippets.map((s) => s.id));
      const merged = [
        ...snippets,
        ...incoming.filter((s) => !existingIds.has(s.id)),
      ];
      await setSnippets(merged);
    },
    [snippets, setSnippets]
  );

  const exportSnippets = useCallback((): string => {
    return JSON.stringify(snippets, null, 2);
  }, [snippets]);

  return {
    snippets,
    loading,
    addSnippet,
    updateSnippet,
    deleteSnippet,
    getSnippet,
    importSnippets,
    exportSnippets,
  };
}