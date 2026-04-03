import type { TextPattern } from "../types";

/**
 * Pattern detector - learns frequently-used text patterns from user typing.
 * Automatically detects when text repeats 3+ times and suggests creating snippets.
 */

const MIN_PATTERN_LENGTH = 5;  // Minimum chars to track
const MIN_OCCURRENCES = 3;     // Create suggestion after 3 repeats
const PATTERN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Track text patterns from user typing.
 * Stores in chrome.storage.local to avoid sync conflicts.
 */
export async function recordPattern(text: string): Promise<void> {
  if (text.length < MIN_PATTERN_LENGTH) return;

  const normalized = normalizeText(text);
  const { patterns: rawPatterns } = await chrome.storage.local.get("patterns");
  const patterns = (rawPatterns as Record<string, TextPattern>) || {};

  if (patterns[normalized]) {
    patterns[normalized].count++;
    patterns[normalized].lastSeen = Date.now();
  } else {
    patterns[normalized] = {
      text,
      count: 1,
      lastSeen: Date.now(),
    };
  }

  await chrome.storage.local.set({ patterns });
}

/**
 * Get all detected patterns that haven't expired.
 */
export async function getPatterns(): Promise<TextPattern[]> {
  const { patterns: rawPatterns } = await chrome.storage.local.get("patterns");
  const patterns = (rawPatterns as Record<string, TextPattern>) || {};
  const now = Date.now();

  return Object.values(patterns)
    .filter(
      (p) =>
        p.count >= MIN_OCCURRENCES &&
        now - p.lastSeen < PATTERN_EXPIRY_MS
    )
    .sort((a, b) => b.count - a.count);
}

/**
 * Get patterns that should be suggested as snippet candidates.
 */
export async function getSuggestionPatterns(): Promise<TextPattern[]> {
  const patterns = await getPatterns();
  // Filter for patterns that are good snippet candidates
  // (not too long, not numbers or special chars only)
  return patterns.filter(
    (p) =>
      p.text.length <= 200 &&  // Not too long
      p.count >= MIN_OCCURRENCES &&
      /[a-zA-Z]{2,}/.test(p.text)  // Contains at least 2 consecutive letters
  );
}

/**
 * Clear all patterns (for privacy/reset).
 */
export async function clearPatterns(): Promise<void> {
  await chrome.storage.local.set({ patterns: {} });
}

/**
 * Remove a specific pattern.
 */
export async function removePattern(text: string): Promise<void> {
  const normalized = normalizeText(text);
  const { patterns: rawPatterns } = await chrome.storage.local.get("patterns");
  const patterns = (rawPatterns as Record<string, TextPattern>) || {};
  delete patterns[normalized];
  await chrome.storage.local.set({ patterns });
}

/**
 * Normalize text for storage and comparison.
 * (lowercase, trim, collapse whitespace)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}
