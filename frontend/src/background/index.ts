import type { Settings, WritingSession, MessageType } from "../types";
import { callGeminiAPI, getDefaultAnalysis } from "./aiEngine";

console.log("[Background Worker] Service worker starting...");

// In-memory session cache for fast responses
const sessionsCache: WritingSession[] = [];

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

    if (message.type === "ANALYZE_TEXT") {
      console.log("[Background Worker] 🔍 Analyzing text:", message.text?.substring(0, 50));
      analyzeText(message.text)
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

async function analyzeText(
  text: string
): Promise<{ suggestions: any[]; analysis: any }> {
  const settings = await getStorageSettings();

  if (!settings.aiEnabled || !settings.geminiApiKey) {
    return {
      suggestions: [],
      analysis: getDefaultAnalysis(),
    };
  }

  try {
    const response = await callGeminiAPI(text, settings.analysisMode, settings.geminiApiKey);
    return {
      suggestions: response.suggestions || [],
      analysis: response.analysis || getDefaultAnalysis(),
    };
  } catch (err) {
    console.error("AI analysis failed:", err);
    return {
      suggestions: [],
      analysis: getDefaultAnalysis(),
    };
  }
}
