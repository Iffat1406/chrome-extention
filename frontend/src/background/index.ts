import type {
  AISuggestion,
  MessageType,
  Settings,
  TextAnalysis,
  WritingSession,
} from "../types";
import {
  callGeminiAPI,
  getDefaultAnalysis,
  detectReplyContext,
  sanitizeReplyContext,
} from "./aiEngine";

console.log("[Background Worker] Service worker starting...");

// In-memory session cache for fast responses
const sessionsCache: WritingSession[] = [];

// Track last analysis text to reduce unnecessary API calls
const lastAnalyzedText: Map<string, { text: string; timestamp: number }> = new Map();

// Load sessions from storage on startup
console.log("[Background Worker] Loading sessions from storage on startup...");
chrome.storage.local.get("sessions", ({ sessions }) => {
  if (sessions && Array.isArray(sessions)) {
    sessionsCache.push(...(sessions as WritingSession[]));
    console.log("[Background Worker] ✅ Loaded", sessionsCache.length, "sessions from storage");
  } else {
    console.log("[Background Worker] 📭 No sessions in storage yet");
  }
});

const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  aiEnabled: true,
  geminiApiKey: "",
  model: "gemini",
  analysisMode: "comprehensive",
  autoSuggest: true,
  suggestionDelay: 1000,
  minTextLength: 10,
  excludedSites: [],
  cloudSyncEnabled: false,
  backendUrl: "http://localhost:4000",
};

// Initialize chrome message listener
try {
  console.log("[Background Worker] 📋 Registering onMessage listener...");
  
  chrome.runtime.onMessage.addListener((message: MessageType, sender, sendResponse) => {
    console.log("[Background Worker] 📨 MESSAGE RECEIVED:", {
      type: message.type,
      from: sender?.url,
      timestamp: new Date().toISOString(),
    });

    // PING - simple connectivity test
    if (message.type === "PING") {
      console.log("[Background Worker] 🏓 PING received, responding...");
      sendResponse({ pong: true, timestamp: Date.now() });
      return true;
    }

    if (message.type === "CONTENT_SCRIPT_READY") {
      console.log("[Background Worker] Content script ready:", {
        url: message.url,
        title: message.title,
        frameUrl: message.frameUrl,
      });
      sendResponse({ success: true });
      return true;
    }

    if (message.type === "ANALYZE_TEXT") {
      console.log("[Background Worker] 🔍 Analyzing text:", message.text?.substring(0, 50));
      // ✅ Pass sessionId and context to analyzeText
      analyzeText(
        message.text,
        message.sessionId,
        message.context,
        message.replyContext
      )
        .then((result) => {
          console.log("[Background Worker] ✅ Analysis complete, sending response with", result.suggestions.length, "suggestions");
          sendResponse(result);
        })
        .catch((err) => {
          console.error("[Background Worker] ❌ Analysis failed:", err);
          const defaultAnalysis = getDefaultAnalysis();
          sendResponse({ error: err.message, suggestions: [], analysis: defaultAnalysis });
        });
      return true;
    }

    if (message.type === "UPDATE_SESSION_DRAFT") {
      storeSessionContent(
        message.sessionId,
        message.text,
        message.context,
        message.replyContext
      );
      sendResponse({ success: true });
      return true;
    }

    if (message.type === "GET_SESSIONS") {
      console.log("[Background Worker] 📋 GET_SESSIONS - returning", sessionsCache.length, "sessions");
      sendResponse(sessionsCache);
      return true;
    }

    if (message.type === "CREATE_SESSION") {
      console.log("[Background Worker] 🆕 CREATE_SESSION for:", message.siteName);
      
      const session: WritingSession = {
        id: crypto.randomUUID(),
        siteUrl: message.siteUrl,
        siteName: message.siteName,
        startTime: Date.now(),
        content: "",
        replyContext: undefined,
        suggestions: [],
        appliedCount: 0,
        textAnalysis: {
          grammarScore: 75,
          spellingErrors: 0,
          clarityScore: 75,
          toneAnalysis: "neutral",
          suggestedImprovements: [],
          readingLevel: "intermediate",
        },
      };
      
      console.log("[Background Worker] 📝 Session created:", session.id);
      
      // Add to cache immediately
      sessionsCache.push(session);
      console.log("[Background Worker] 💾 Added to cache. Total sessions:", sessionsCache.length);
      
      // Respond immediately (don't wait for storage)
      console.log("[Background Worker] ✅ SENDING RESPONSE NOW");
      sendResponse({ success: true, sessionId: session.id });
      
      // Persist to storage in background (fire and forget)
      chrome.storage.local.set({ sessions: sessionsCache }, () => {
        if (chrome.runtime.lastError) {
          console.error("[Background Worker] ❌ Storage save failed:", chrome.runtime.lastError);
          return;
        }
        console.log("[Background Worker] ✅ Persisted to storage successfully");
      });
      
      return true;
    }

    if (message.type === "UPDATE_SETTINGS") {
      console.log("[Background Worker] ⚙️ Updating settings");
      chrome.storage.sync.set({ settings: message.settings }, () => {
        console.log("[Background Worker] ✅ Settings updated");
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.type === "GET_SETTINGS") {
      console.log("[Background Worker] ⚙️ GET_SETTINGS requested");
      chrome.storage.sync.get("settings", ({ settings }) => {
        console.log("[Background Worker] ✅ Returning settings");
        sendResponse(settings ?? DEFAULT_SETTINGS);
      });
      return true;
    }

    if (message.type === "CLEAR_HISTORY") {
      console.log("[Background Worker] 🗑️ Clearing history");
      sessionsCache.length = 0;
      chrome.storage.local.remove("sessions", () => {
        console.log("[Background Worker] ✅ History cleared");
        sendResponse({ success: true });
      });
      return true;
    }

    console.warn("[Background Worker] ⚠️ Unknown message type:", message.type);
    sendResponse({ error: "Unknown message type" });
    return true;
  });
  
  console.log("[Background Worker] ✅ Message listener registered successfully");
} catch (err) {
  console.error("[Background Worker] ❌ CRITICAL ERROR - Failed to register message listener:", err);
}

async function getStorageSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get("settings", ({ settings }) => {
      resolve((settings as Settings) ?? DEFAULT_SETTINGS);
    });
  });
}

// ✅ NEW: Store session content immediately (before AI call)
function storeSessionContent(
  sessionId: string,
  content: string,
  context?: string,
  replyContext?: string
): void {
  const session = sessionsCache.find(s => s.id === sessionId);
  if (!session) {
    console.warn("[Background Worker] ⚠️ Session not found:", sessionId);
    return;
  }

  // Update in-memory cache
  session.content = content;
  if (context) {
    session.context = context;
  }
  session.replyContext = sanitizeReplyContext(replyContext);

  // Persist immediately to storage
  chrome.storage.local.set({ sessions: sessionsCache }, () => {
    if (chrome.runtime.lastError) {
      console.error("[Background Worker] ❌ Storage save failed:", chrome.runtime.lastError);
      return;
    }
    console.log("[Background Worker] ✅ Session content stored immediately");
  });
}

// ✅ NEW: Update session after AI analysis
function updateSessionAnalysis(
  sessionId: string,
  suggestions: AISuggestion[],
  analysis: TextAnalysis
): void {
  const session = sessionsCache.find(s => s.id === sessionId);
  if (!session) {
    console.warn("[Background Worker] ⚠️ Session not found for analysis update:", sessionId);
    return;
  }

  session.suggestions = suggestions || [];
  session.textAnalysis = analysis;

  chrome.storage.local.set({ sessions: sessionsCache }, () => {
    if (chrome.runtime.lastError) {
      console.error("[Background Worker] ❌ Storage update failed:", chrome.runtime.lastError);
      return;
    }
    console.log("[Background Worker] ✅ Session analysis stored after AI response");
  });
}

// ✅ NEW: Check if text changed significantly (reduce API calls)
function shouldAnalyzeText(sessionId: string, text: string): boolean {
  const lastAnalysis = lastAnalyzedText.get(sessionId);
  const now = Date.now();

  // Always analyze if never analyzed before
  if (!lastAnalysis) {
    return true;
  }

  // Don't re-analyze same text within 2 seconds
  if (lastAnalysis.text === text && now - lastAnalysis.timestamp < 2000) {
    console.log("[Background Worker] ⏭️ Skipping analysis - text unchanged");
    return false;
  }

  // Analyze if significant change (10+ characters added/removed)
  const textDifference = Math.abs(text.length - lastAnalysis.text.length);
  if (textDifference < 10 && now - lastAnalysis.timestamp < 3000) {
    console.log("[Background Worker] ⏭️ Skipping analysis - minimal text change");
    return false;
  }

  return true;
}

async function analyzeText(
  text: string,
  sessionId: string,
  context?: string,
  replyContext?: string
): Promise<{ suggestions: AISuggestion[]; analysis: TextAnalysis }> {
  const settings = await getStorageSettings();

  // ✅ STORE TEXT IMMEDIATELY - even if AI doesn't run
  console.log("[Background Worker] 💾 Storing text immediately (before AI call)");
  storeSessionContent(sessionId, text, context, replyContext);

  if (!settings.aiEnabled || !settings.geminiApiKey) {
    console.log("[Background Worker] ℹ️ AI disabled, returning default analysis");
    return {
      suggestions: [],
      analysis: getDefaultAnalysis(),
    };
  }

  // ✅ Check if we should analyze (reduce API calls)
  if (!shouldAnalyzeText(sessionId, text)) {
    console.log("[Background Worker] ⏭️ Skipping AI call - text not significantly changed");
    return {
      suggestions: [],
      analysis: getDefaultAnalysis(),
    };
  }

  try {
    // Detect reply context from the text
    const effectiveReplyContext =
      sanitizeReplyContext(replyContext) ?? detectReplyContext(text);
    
    console.log("[Background Worker] 🚀 Calling Gemini API with context detection...");
    const response = await callGeminiAPI(
      text,
      settings.analysisMode,
      settings.geminiApiKey,
      context,
      effectiveReplyContext
    );

    // Track this analysis
    lastAnalyzedText.set(sessionId, { text, timestamp: Date.now() });

    // ✅ STORE SUGGESTIONS AFTER AI RESPONSE
    console.log("[Background Worker] 💾 Storing AI suggestions (after AI response)");
    updateSessionAnalysis(sessionId, response.suggestions, response.analysis);

    return {
      suggestions: response.suggestions || [],
      analysis: response.analysis || getDefaultAnalysis(),
    };
  } catch (err) {
    console.error("[Background Worker] ❌ AI analysis failed:", err);
    return {
      suggestions: [],
      analysis: getDefaultAnalysis(),
    };
  }
}
