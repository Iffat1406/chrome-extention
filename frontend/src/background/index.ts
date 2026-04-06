import type { Settings, WritingSession, AISuggestion, TextAnalysis, MessageType } from "../types";

console.log("[Background Worker] Service worker starting...");

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
  chrome.runtime.onMessage.addListener((message: MessageType, sender, sendResponse) => {
    console.log("[Background Worker] 📨 Received message:", message.type, "from", sender?.url);

    if (message.type === "ANALYZE_TEXT") {
      console.log("[Background Worker] 🔍 Analyzing text:", message.text?.substring(0, 50));
      analyzeText(message.text)
        .then((result) => {
          console.log("[Background Worker] ✅ Analysis complete, sending response");
          sendResponse(result);
        })
        .catch((err) => {
          console.error("[Background Worker] ❌ Analysis failed:", err);
          sendResponse({ error: err.message, suggestions: [], analysis: getDefaultAnalysis() });
        });
      return true;
    }

    if (message.type === "GET_SESSIONS") {
      console.log("[Background Worker] 📋 GET_SESSIONS requested");
      chrome.storage.local.get("sessions", ({ sessions }) => {
        const sessionList = (sessions as WritingSession[]) ?? [];
        console.log("[Background Worker] ✅ Returning", sessionList.length, "sessions");
        sendResponse(sessionList);
      });
      return true;
    }

    if (message.type === "CREATE_SESSION") {
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
      console.log("[Background Worker] 🆕 Creating session for:", message.siteName);
      chrome.storage.local.get("sessions", ({ sessions = [] }) => {
        const allSessions = (sessions as WritingSession[]) || [];
        allSessions.push(session);
        chrome.storage.local.set({ sessions: allSessions }, () => {
          console.log("[Background Worker] ✅ Session created and stored. ID:", session.id);
          sendResponse({ success: true, sessionId: session.id });
        });
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
): Promise<{ suggestions: AISuggestion[]; analysis: TextAnalysis }> {
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

function getDefaultAnalysis(): TextAnalysis {
  return {
    grammarScore: 75,
    spellingErrors: 0,
    clarityScore: 75,
    toneAnalysis: "neutral",
    suggestedImprovements: [],
    readingLevel: "intermediate",
  };
}

async function callGeminiAPI(
  text: string,
  analysisMode: string,
  apiKey: string
): Promise<{ suggestions: AISuggestion[]; analysis: TextAnalysis }> {
  const prompts = {
    grammar: "Check grammar and spelling. Provide corrections.",
    comprehensive: `Analyze the text for:
1. Grammar and spelling errors
2. Clarity improvements
3. Tone assessment
4. Reading level

Provide specific suggestions for each.`,
    completion: "Suggest next words/sentences to complete the user's thought.",
  };

  const prompt = prompts[analysisMode as keyof typeof prompts] || prompts.grammar;

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${prompt}\n\nText to analyze: "${text}"`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return {
    suggestions: parseSuggestions(responseText),
    analysis: parseAnalysis(responseText),
  };
}

function parseSuggestions(aiResponse: string): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const lines = aiResponse.split("\n");

  let suggestionCount = 0;
  for (const line of lines) {
    if (
      line.includes("should be") ||
      line.includes("instead of") ||
      line.includes("replace")
    ) {
      suggestionCount++;
      if (suggestionCount > 5) break;

      suggestions.push({
        id: `sugg-${suggestionCount}`,
        position: 0,
        length: 0,
        originalText: "text",
        suggestion: line.trim(),
        reason: "grammar",
        confidence: 0.8,
        applied: false,
      });
    }
  }

  return suggestions;
}

function parseAnalysis(aiResponse: string): TextAnalysis {
  const hasGrammarErrors = /error|incorrect|wrong/.test(aiResponse.toLowerCase());
  const hasSpellingIssues = /spell|typo/.test(aiResponse.toLowerCase());
  const hasClarityIssues = /unclear|confus|improve clarity/.test(aiResponse.toLowerCase());

  return {
    grammarScore: hasGrammarErrors ? 50 : 85,
    spellingErrors: hasSpellingIssues ? 1 : 0,
    clarityScore: hasClarityIssues ? 60 : 80,
    toneAnalysis: "formal",
    suggestedImprovements: aiResponse.split("\n").slice(0, 3),
    readingLevel: "intermediate",
  };
}
