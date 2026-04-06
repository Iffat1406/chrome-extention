import { TriggerDetector } from "./triggerDetector";
import { showOverlay, hideOverlay } from "./overLayout";
import type { WritingSession } from "../types";

console.log("[AI Writing Assistant] Content script loaded on:", window.location.hostname);

// Initialize trigger detector (not currently used but available for future enhancements)
void new TriggerDetector();
let currentSession: WritingSession | null = null;
let analysisTimeout: number | null = null;

// Initialize writing session when extension loads
async function initializeSession() {
  const hostname = window.location.hostname;
  const siteName = hostname.replace(/^www\./, "").split(".")[0];

  console.log("[AI Writing Assistant] Starting CREATE_SESSION message...");

  try {
    return new Promise<void>((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "CREATE_SESSION",
          siteUrl: window.location.href,
          siteName: siteName,
        },
        (response) => {
          console.log("[AI Writing Assistant] CREATE_SESSION response received:", response);
          
          if (!response) {
            console.error("[AI Writing Assistant] Empty response from CREATE_SESSION");
            resolve();
            return;
          }

          if (response && response.success && response.sessionId) {
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
            console.log("[AI Writing Assistant] ✅ Session created successfully:", session);
          } else {
            console.error("[AI Writing Assistant] ❌ CREATE_SESSION failed:", response);
          }
          resolve();
        }
      );
    });
  } catch (err) {
    console.error("[AI Writing Assistant] ❌ Failed to create writing session:", err);
  }
}

// Initialize session when page loads
console.log("[AI Writing Assistant] Calling initializeSession on page load...");
initializeSession().then(() => {
  console.log("[AI Writing Assistant] initializeSession completed. currentSession:", currentSession);
});

// Also reinitialize if page changes (for SPAs like ChatGPT, Gmail)
window.addEventListener("load", () => {
  console.log("[AI Writing Assistant] Page load event fired");
  initializeSession();
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !currentSession) {
    console.log("[AI Writing Assistant] Page became visible, reinitializing session");
    initializeSession();
  }
});

// Listen for text input and analyze it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
document.addEventListener("keyup", async (e: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target = e.target as any;
  
  // Check if element is editable (handles ChatGPT, Gmail, input, textarea, etc.)
  const isEditable =
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.closest('[contenteditable="true"]') !== null;

  if (!isEditable) {
    return;
  }
  
  // Create session if it doesn't exist
  if (!currentSession) {
    console.log("[AI Writing Assistant] 🔄 Session not found, creating new one...");
    await initializeSession();
    if (!currentSession) {
      console.warn("[AI Writing Assistant] ❌ Failed to create session after retry");
      return;
    }
  }

  const textElement = target as HTMLInputElement | HTMLTextAreaElement | HTMLDivElement;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = ((textElement as any).innerText || (textElement as any).value || "") as string;

  if (text.length < 3) {
    return;
  }
  
  console.log("[AI Writing Assistant] ✍️ Text detected:", text.substring(0, 50) + (text.length > 50 ? "..." : ""));

  if (analysisTimeout !== null) {
    clearTimeout(analysisTimeout);
  }

  // Debounce analysis - wait 1.5 seconds after user stops typing
  analysisTimeout = window.setTimeout(async () => {
    console.log("[AI Writing Assistant] 📤 Sending ANALYZE_TEXT message...");
    
    try {
      const result = await chrome.runtime.sendMessage({
        type: "ANALYZE_TEXT",
        text: text,
        context: "writing",
        siteUrl: window.location.href,
      });

      console.log("[AI Writing Assistant] 📥 ANALYZE_TEXT response received:", result);

      if (result.suggestions && result.suggestions.length > 0) {
        console.log("[AI Writing Assistant] 💡 Showing overlay with", result.suggestions.length, "suggestions");
        // Show suggestions to user
        showOverlay({
          text: text,
          suggestions: result.suggestions,
          analysis: result.analysis,
          position: getCaretCoordinates(textElement),
        });
      }

      // Store analysis in session and persist to storage
      if (currentSession) {
        currentSession.content = text;
        currentSession.textAnalysis = result.analysis;
        currentSession.suggestions = result.suggestions;
        
        // Save session to chrome storage
        try {
          const { sessions = [] } = await chrome.storage.local.get("sessions");
          const allSessions = (sessions as WritingSession[]) || [];
          const sessionIndex = allSessions.findIndex(s => s.id === currentSession!.id);
          
          if (sessionIndex >= 0) {
            allSessions[sessionIndex] = currentSession;
            console.log("[AI Writing Assistant] 💾 Updated existing session in storage");
          } else {
            allSessions.push(currentSession);
            console.log("[AI Writing Assistant] ✨ Saved new session to storage");
          }
          
          await chrome.storage.local.set({ sessions: allSessions });
          console.log("[AI Writing Assistant] ✅ Session persisted:", {
            id: currentSession.id,
            content: currentSession.content.substring(0, 50),
            totalSessions: allSessions.length,
          });
        } catch (storageErr) {
          console.error("[AI Writing Assistant] ❌ Failed to save session:", storageErr);
        }
      }
    } catch (err) {
      console.error("[AI Writing Assistant] ❌ Error analyzing text:", err);
    }
  }, 1500);
});

// Handle escape key to hide suggestions
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideOverlay();
  }
});

function getCaretCoordinates(element: HTMLInputElement | HTMLTextAreaElement | HTMLDivElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.bottom + 10,
  };
}
