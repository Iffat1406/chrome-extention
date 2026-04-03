/**
 * Auto-generate shortcuts from text content.
 * Intelligently creates abbreviations like IDE autocomplete does.
 *
 * Examples:
 * - "Hello World" → "/hw"
 * - "Your company name" → "/ycn"
 * - "Email address" → "/ea"
 * - "asynchronous programming" → "/ap"
 */

/**
 * Generate a shortcut from text using multiple strategies.
 * Returns the first available/reasonable shortcut.
 */
export function generateShortcut(text: string): string {
  // Try different strategies in order of preference
  const strategies = [
    firstLettersOfWords,      // "Hello World" → "hw"
    consonantsBased,          // "Email" → "ml"
    beginningChars,           // Long word → "ema"
  ];

  for (const strategy of strategies) {
    const shortcut = strategy(text);
    if (shortcut && shortcut.length > 0) {
      return "/" + shortcut.toLowerCase();
    }
  }

  // Fallback: just use first 2-3 chars
  return "/" + text.substring(0, 3).toLowerCase();
}

/**
 * Strategy 1: First letter of each word
 * "Hello World" → "hw"
 * "The quick brown fox" → "tlbf"
 */
function firstLettersOfWords(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .join("")
    .substring(0, 4);  // Limit to 4 chars
}

/**
 * Strategy 2: Consonants-based (skip vowels)
 * Useful for single-word phrases
 * "Email" → "ml"
 * "Programming" → "prgrm"
 */
function consonantsBased(text: string): string {
  const words = text.trim().split(/\s+/);
  const mainWord = words[0]; // Use first word

  return mainWord
    .replace(/[aeiou]/gi, "")  // Remove vowels
    .substring(0, 4);  // Limit to 4 chars
}

/**
 * Strategy 3: Beginning characters (for long single words)
 * "asynchronous" → "asy"
 */
function beginningChars(text: string): string {
  const words = text.trim().split(/\s+/);
  const mainWord = words[0];

  // Find first 3 chars or first 3 consonants
  let result = "";
  for (const char of mainWord) {
    if (result.length >= 3) break;
    if (char.match(/[a-z]/i)) {
      result += char;
    }
  }
  return result;
}

/**
 * Check if a shortcut conflicts with existing snippets.
 */
export async function checkShortcutAvailable(shortcut: string): Promise<boolean> {
  const { snippets: raw } = await chrome.storage.sync.get("snippets");
  const snippets = (raw as Array<{ shortcut: string }>) || [];

  const normalized = shortcut.toLowerCase().replace(/^\//, "");
  return !snippets.some(
    (s) =>
      s.shortcut.toLowerCase().replace(/^\//, "") === normalized
  );
}

/**
 * Generate a unique shortcut by appending numbers if needed.
 */
export async function generateUniqueShortcut(
  baseText: string
): Promise<string> {
  const shortcut = generateShortcut(baseText);

  // If available, use it as-is
  if (await checkShortcutAvailable(shortcut)) {
    return shortcut;
  }

  // Otherwise, append numbers until we find an available one
  for (let i = 2; i <= 10; i++) {
    const variant = shortcut.replace(/\/$/, "") + i;
    if (await checkShortcutAvailable(variant)) {
      return variant;
    }
  }

  // Fallback: use timestamp-based shortcut
  return "/" + Date.now().toString(36).slice(-3);
}

/**
 * Smart shortcut suggestions - offer multiple options.
 */
export async function suggestShortcuts(text: string): Promise<string[]> {
  const base = generateShortcut(text);
  const suggestions = [base];

  // Add alternative based on word count
  const words = text.trim().split(/\s+/);
  if (words.length > 1) {
    suggestions.push(
      "/" + words.map((w) => w[0]).join("").toLowerCase()
    );
  }

  // Add consonants-based alternative
  if (words[0].length > 4) {
    suggestions.push("/" + consonantsBased(text));
  }

  // Check availability and return first 3 unique available options
  const available: string[] = [];
  for (const suggestion of suggestions) {
    if (
      available.length < 3 &&
      (await checkShortcutAvailable(suggestion))
    ) {
      available.push(suggestion);
    }
  }

  return available.length > 0
    ? available
    : [await generateUniqueShortcut(text)];
}
