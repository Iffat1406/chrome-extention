import type { Snippet, AISuggestion } from "../types";

/**
 * Normalize a string for fuzzy comparison:
 * lowercase + collapse whitespace
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Simple fuzzy score between query and target.
 * Returns a value between 0 (no match) and 1 (exact match).
 */
function fuzzyScore(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);

  if (t === q) return 1;
  if (t.startsWith(q)) return 0.9;
  if (t.includes(q)) return 0.7;

  // Character-level subsequence check
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  if (qi === q.length) {
    return 0.4 + 0.3 * (q.length / t.length);
  }

  return 0;
}

/**
 * Exact shortcut match — e.g. user typed "/addr" → find snippet with shortcut "addr" or "/addr"
 */
function matchByShortcut(
  context: string,
  snippets: Snippet[]
): Array<{ text: string; confidence: number; source: "history" }> {
  // Extract shortcut token: leading "/" followed by word chars
  const shortcutMatch = context.match(/\/(\w+)$/);
  if (!shortcutMatch) return [];

  const typed = shortcutMatch[1].toLowerCase();

  return snippets
    .filter((s) => {
      const normalized = s.shortcut.replace(/^\//, "").toLowerCase();
      return normalized === typed || normalized.startsWith(typed);
    })
    .map((s) => ({
      text: s.content,
      confidence: s.shortcut.replace(/^\//, "").toLowerCase() === typed ? 1 : 0.85,
      source: "history" as const,
    }));
}

/**
 * Fuzzy content match — e.g. user typed partial text that resembles a snippet's label or content
 */
function matchByContent(
  context: string,
  snippets: Snippet[]
): Array<{ text: string; confidence: number; source: "history" }> {
  const query = context.slice(-60); // use last 60 chars as query window

  return snippets
    .map((s) => {
      const labelScore = fuzzyScore(query, s.label);
      const contentScore = fuzzyScore(query, s.content.slice(0, 80));
      const score = Math.max(labelScore, contentScore);
      return { snippet: s, score };
    })
    .filter(({ score }) => score >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ snippet, score }) => ({
      text: snippet.content,
      confidence: score,
      source: "history" as const,
    }));
}

/**
 * Main matcher — tries shortcut match first, falls back to fuzzy content match.
 *
 * @param context  The raw text buffer from the content script (last N chars before cursor)
 * @param snippets All stored snippets from chrome.storage
 * @returns        Ranked AISuggestion array, best matches first
 */
export function matchSnippets(
  context: string,
  snippets: Snippet[]
): AISuggestion[] {
  if (!snippets || snippets.length === 0) return [];

  const shortcutResults = matchByShortcut(context, snippets);

  // If we got strong shortcut hits, return those directly
  if (shortcutResults.length > 0) {
    return shortcutResults
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  // Otherwise fall back to fuzzy content matching
  return matchByContent(context, snippets);
}

/**
 * Replace the typed shortcut in a target string with the expanded content.
 * Used by textInserter.ts after the user selects a suggestion.
 *
 * @example
 *   applyExpansion("Hello /addr", "/addr", "123 Main St") → "Hello 123 Main St"
 */
export function applyExpansion(
  currentText: string,
  shortcut: string,
  expansion: string
): string {
  const normalized = shortcut.startsWith("/") ? shortcut : `/${shortcut}`;
  // Match shortcut optionally followed by a space
  const pattern = new RegExp(
    normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s?$"
  );
  return currentText.replace(pattern, expansion);
}

/**
 * Deduplicate suggestions — remove entries with identical `.text` values,
 * keeping the one with the highest confidence.
 */
export function deduplicateSuggestions(
  suggestions: AISuggestion[]
): AISuggestion[] {
  const seen = new Map<string, AISuggestion>();
  for (const s of suggestions) {
    const existing = seen.get(s.text);
    if (!existing || s.confidence > existing.confidence) {
      seen.set(s.text, s);
    }
  }
  return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence);
}