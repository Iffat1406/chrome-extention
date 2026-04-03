export interface Snippet {
  id: string;
  shortcut: string;
  label: string;
  content: string;
  tags: string[];
  usageCount: number;
  lastUsed: number | null;
  createdAt: number;
  updatedAt: number;
  syncedAt?: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  token: string;
}

export interface Settings {
  enabled: boolean;
  aiEnabled: boolean;
  geminiApiKey: string;
  minChars: number;
  maxSuggestions: number;
  keyboardShortcut: string;
  excludedSites: string[];
  cloudSyncEnabled: boolean;
  backendUrl: string;
}

export interface AnalyticsEntry {
  snippetId: string;
  usedAt: number;
  site: string;
  trigger: "shortcut" | "keyboard" | "ai";
}

export interface AISuggestion {
  text: string;
  confidence: number;
  source: "history" | "ai";
}

export type MessageType =
  | { type: "GET_SUGGESTIONS"; prefix: string; context: string }
  | { type: "INSERT_SNIPPET"; snippetId: string; trigger: string }
  | { type: "RECORD_USAGE"; snippetId: string; site: string; trigger: string }
  | { type: "SYNC_TO_CLOUD" }
  | { type: "GET_SETTINGS" }
  | { type: "OPEN_POPUP" };