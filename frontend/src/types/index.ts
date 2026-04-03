export interface HistoryPhrase {
  text: string;          // full phrase the user typed
  count: number;         // how many times they typed it
  lastUsed: number;      // timestamp
  context: string;       // "email" | "search" | "general"
}

export interface Suggestion {
  text: string;          // the completion (suffix after what user typed)
  full: string;          // full phrase
  score: number;         // ranking score 0–1
  source: "history" | "ai";
}

export interface Settings {
  enabled: boolean;
  aiEnabled: boolean;
  apiKey: string;
  minChars: number;      // min chars before suggesting (default: 3)
  maxHistory: number;    // max phrases to store (default: 500)
  excludedSites: string[];
}

export type MessageType =
  | { type: "GET_SUGGESTIONS"; prefix: string; context: string }
  | { type: "RECORD_PHRASE"; text: string; context: string }
  | { type: "SUGGESTIONS_RESULT"; suggestions: Suggestion[] }
  | { type: "GET_SETTINGS" }
  | { type: "SETTINGS_RESULT"; settings: Settings };