// Writing session - tracks user's writing activity
export interface WritingSession {
  id: string;
  siteUrl: string;
  siteName: string;
  startTime: number;
  endTime?: number;
  content: string;           // Full text written
  context?: string;          // Type of writing (email, comment, reply, etc)
  replyContext?: string;     // The message or post this draft is replying to
  suggestions: AISuggestion[]; // AI suggestions made
  appliedCount: number;       // How many suggestions user accepted
  textAnalysis: TextAnalysis; // Grammar, tone, clarity scores
}

// AI-generated suggestion for improving text
export interface AISuggestion {
  id: string;
  position: number;           // Character offset in text
  length: number;             // Length of text being referenced
  originalText: string;       // The text being suggested to improve
  suggestion: string;         // Improved version
  reason: "grammar" | "spelling" | "clarity" | "tone" | "completion"; // Why it's suggested
  confidence: number;         // 0-1 confidence score
  applied: boolean;           // Did user accept this?
  appliedAt?: number;
}

// Analysis of user's writing
export interface TextAnalysis {
  grammarScore: number;       // 0-100
  spellingErrors: number;
  clarityScore: number;       // 0-100
  toneAnalysis: string;       // "formal", "casual", "technical", etc
  suggestedImprovements: string[];
  readingLevel: string;       // "basic", "intermediate", "advanced"
}

// Settings for the writing assistant
export interface Settings {
  enabled: boolean;
  aiEnabled: boolean;
  geminiApiKey: string;
  model: "gemini" | "claude" | "gpt4";
  analysisMode: "grammar" | "comprehensive" | "completion";
  autoSuggest: boolean;
  suggestionDelay: number;    // ms before showing suggestions
  minTextLength: number;       // characters before analyzing
  excludedSites: string[];
  cloudSyncEnabled: boolean;
  backendUrl: string;
}

// Extended message types for AI writing assistant
export type MessageType =
  | { type: "PING" }
  | { type: "CONTENT_SCRIPT_READY"; url: string; title: string; frameUrl?: string }
  | {
      type: "ANALYZE_TEXT";
      text: string;
      sessionId: string;
      context: string;
      siteUrl: string;
      replyContext?: string;
    }
  | {
      type: "UPDATE_SESSION_DRAFT";
      sessionId: string;
      text: string;
      context?: string;
      replyContext?: string;
    }
  | { type: "GET_SUGGESTIONS"; text: string }
  | { type: "APPLY_SUGGESTION"; suggestionId: string; sessionId: string }
  | { type: "CREATE_SESSION"; siteUrl: string; siteName: string }
  | { type: "END_SESSION"; sessionId: string }
  | { type: "GET_SESSIONS" }
  | { type: "GET_SETTINGS" }
  | { type: "UPDATE_SETTINGS"; settings: Partial<Settings> }
  | { type: "CLEAR_HISTORY" }
