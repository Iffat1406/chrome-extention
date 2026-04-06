import { TriggerDetector } from "./triggerDetector";
import { showOverlay, hideOverlay } from "./overLayout";
import type { WritingSession } from "../types";

console.log("[AI Writing Assistant] Content script loaded on:", window.location.hostname);

// Initialize trigger detector
void new TriggerDetector();
let currentSession: WritingSession | null = null;
let analysisTimeout: number | null = null;

// Helper to safely send messages with error handling and timeout
function sendMessageSafe(message: unknown, callback: (response: any) => void, timeoutMs = 5000): void {
  console.log("[AI Writing Assistant] 📨 Preparing to send message:", (message as any).type);
  
  let timeoutId: number | null = null;
  let responsedAlready = false;

  const wrappedCallback = (response: any) => {
    if (responsedAlready) {
      console.log("[AI Writing Assistant] ⚠️ Callback fired but already responded");
      return;
    }
    responsedAlready = true;
    
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    console.log("[AI Writing Assistant] ✅ Callback received for:", (message as any).type, "Response:", response);
    callback(response);
  };

  timeoutId = window.setTimeout(() => {
    if (!responsedAlready) {
      responsedAlready = true;
      console.error("[AI Writing Assistant] ❌ TIMEOUT: No response from background worker after", timeoutMs, "ms");
      callback(null);
    }
  }, timeoutMs);

  console.log("[AI Writing Assistant] 🚀 Sending message to background worker...");
  
  try {
    chrome.runtime.sendMessage(message, wrappedCallback);
  } catch (err: any) {
    if (timeoutId) clearTimeout(timeoutId);
    responsedAlready = true;
    const errorMsg = String(err?.message || err);
    console.error("[AI Writing Assistant] ❌ sendMessage failed:", errorMsg);
    callback(null);
  }
}

// Initialize writing session when extension loads
function initializeSession(): void {
  const hostname = window.location.hostname;
  const siteName = hostname.replace(/^www\./, "").split(".")[0];

  console.log("[AI Writing Assistant] 🔄 initializeSession called for:", siteName);

  if (currentSession) {
    console.log("[AI Writing Assistant] ℹ️ Session already exists, skipping initialization");
    return;
  }

  console.log("[AI Writing Assistant] 📤 Sending CREATE_SESSION message...");

  sendMessageSafe(
    {
      type: "CREATE_SESSION",
      siteUrl: window.location.href,
      siteName: siteName,
    },
    (response) => {
      if (!response) {
        console.error("[AI Writing Assistant] ❌ No response from CREATE_SESSION");
        return;
      }

      console.log("[AI Writing Assistant] 📥 CREATE_SESSION response:", response);

      if (response.success && response.sessionId) {
        const session: WritingSession = {
          id: response.sessionId,
          siteUrl: window.location.href,
          siteName: siteName,
          startTime: Date.now(),
          endTime: undefined,
          content: "",
          suggestions: [],
          appliedCount: 0,
          textAnalysis: {
            grammarScore: 0,
            spellingErrors: 0,
            clarityScore: 0,
            toneAnalysis: "neutral",
            suggestedImprovements: [],
            readingLevel: "intermediate",
          },
        };
        currentSession = session;
        console.log("[AI Writing Assistant] ✅ Session initialized successfully");
      } else {
        console.error("[AI Writing Assistant] ❌ Invalid response:", response);
      }
    }
  );
}

// Test PING connectivity
function testBackgroundWorker(): void {
  console.log("[AI Writing Assistant] 🔍 Testing background worker connectivity...");
  
  chrome.runtime.sendMessage(
    { type: "PING" },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("[AI Writing Assistant] ❌ PING failed:", chrome.runtime.lastError);
        return;
      }
      if (response) {
        console.log("[AI Writing Assistant] ✅ PING successful:", response);
      }
    }
  );
}

console.log("[AI Writing Assistant] 🚀 Page loaded, testing connectivity...");
testBackgroundWorker();

setTimeout(() => {
  initializeSession();
}, 500);

window.addEventListener("load", initializeSession);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !currentSession) {
    console.log("[AI Writing Assistant] 📄 Page became visible, reinitializing...");
    initializeSession();
  }
});

// Listen for text input
document.addEventListener("keyup", (e: any) => {
  const target = e.target as any;
  
  const isEditable =
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.closest('[contenteditable="true"]') !== null;

  if (!isEditable) {
    return;
  }
  
  if (!currentSession) {
    console.log("[AI Writing Assistant] 🔄 Session not found, initializing...");
    initializeSession();
  }

  const text = ((target as any).innerText || (target as any).value || "") as string;

  if (text.length < 3) {
    return;
  }
  
  console.log("[AI Writing Assistant] ✍️ Text detected:", text.substring(0, 50));

  if (analysisTimeout !== null) {
    clearTimeout(analysisTimeout);
  }

  analysisTimeout = window.setTimeout(() => {
    if (!currentSession) {
      console.warn("[AI Writing Assistant] ⚠️ No session available, skipping analysis");
      return;
    }

    console.log("[AI Writing Assistant] 📤 Sending ANALYZE_TEXT message...");
    
    sendMessageSafe(
      {
        type: "ANALYZE_TEXT",
        text: text,
        context: "writing",
        siteUrl: window.location.href,
      },
      (result) => {
        if (!result) {
          console.error("[AI Writing Assistant] ❌ No response from ANALYZE_TEXT");
          return;
        }

        console.log("[AI Writing Assistant] 📥 ANALYZE_TEXT response received");

        if (result.suggestions && result.suggestions.length > 0) {
          console.log("[AI Writing Assistant] 💡 Showing overlay with", result.suggestions.length, "suggestions");
          showOverlay({
            text: text,
            suggestions: result.suggestions,
            analysis: result.analysis,
            position: getCaretCoordinates(target),
          });
        }

        // Store analysis in session and persist
        if (currentSession && result.analysis) {
          const session = currentSession;
          session.content = text;
          session.textAnalysis = result.analysis;
          session.suggestions = result.suggestions || [];
          
          chrome.storage.local.get("sessions", ({ sessions = [] }) => {
            const allSessions = (sessions as WritingSession[]) || [];
            const sessionIndex = allSessions.findIndex(s => s.id === session.id);
            
            if (sessionIndex >= 0) {
              allSessions[sessionIndex] = session;
              console.log("[AI Writing Assistant] 💾 Updated session in storage");
            } else {
              allSessions.push(session);
              console.log("[AI Writing Assistant] ✨ Saved session to storage");
            }
            
            chrome.storage.local.set({ sessions: allSessions }, () => {
              if (chrome.runtime.lastError) {
                console.error("[AI Writing Assistant] ❌ Storage error:", chrome.runtime.lastError.message);
                return;
              }
              console.log("[AI Writing Assistant] ✅ Session persisted");
            });
          });
        }
      }
    );
  }, 1500);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideOverlay();
  }
});

function getCaretCoordinates(element: any): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.bottom + 10,
  };
}
