import { TriggerDetector } from "./triggerDetector";
import { showOverlay, hideOverlay } from "./overLayout";
import type { AISuggestion, MessageType, TextAnalysis, WritingSession } from "../types";

console.log("[AI Writing Assistant] Content script loaded on:", window.location.hostname);

void new TriggerDetector();
let currentSession: WritingSession | null = null;
let analysisTimeout: number | null = null;
let activeEditor: EditableElement | null = null;
let pendingDraftSync = false;

type EditableElement = HTMLInputElement | HTMLTextAreaElement | HTMLElement;
type CreateSessionResponse = { success?: boolean; sessionId?: string } | null;
type AnalyzeTextResponse =
  | {
      suggestions?: AISuggestion[];
      analysis?: TextAnalysis;
    }
  | null;

function sendMessageSafe(
  message: MessageType,
  callback: (response: unknown) => void,
  timeoutMs = 5000
): void {
  console.log("[AI Writing Assistant] Preparing to send message:", message.type);

  let timeoutId: number | null = null;
  let respondedAlready = false;

  const wrappedCallback = (response: unknown) => {
    if (respondedAlready) {
      return;
    }
    respondedAlready = true;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    callback(response);
  };

  timeoutId = window.setTimeout(() => {
    if (!respondedAlready) {
      respondedAlready = true;
      console.error("[AI Writing Assistant] Background worker timeout for", message.type);
      callback(null);
    }
  }, timeoutMs);

  try {
    chrome.runtime.sendMessage(message, wrappedCallback);
  } catch (err: unknown) {
    if (timeoutId) clearTimeout(timeoutId);
    respondedAlready = true;
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[AI Writing Assistant] sendMessage failed:", errorMessage);
    callback(null);
  }
}

function initializeSession(): void {
  const hostname = window.location.hostname;
  const siteName = hostname.replace(/^www\./, "").split(".")[0];

  if (currentSession) {
    return;
  }

  sendMessageSafe(
    {
      type: "CREATE_SESSION",
      siteUrl: window.location.href,
      siteName,
    },
    (response) => {
      const createResponse = response as CreateSessionResponse;

      if (!createResponse?.success || !createResponse.sessionId) {
        console.error("[AI Writing Assistant] CREATE_SESSION failed:", createResponse);
        return;
      }

      currentSession = {
        id: createResponse.sessionId,
        siteUrl: window.location.href,
        siteName,
        startTime: Date.now(),
        endTime: undefined,
        content: "",
        context: undefined,
        replyContext: undefined,
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

      if (pendingDraftSync && activeEditor) {
        pendingDraftSync = false;
        handleEditorChange(activeEditor);
      }
    }
  );
}

function testBackgroundWorker(): void {
  chrome.runtime.sendMessage({ type: "PING" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("[AI Writing Assistant] PING failed:", chrome.runtime.lastError);
      return;
    }

    if (response) {
      console.log("[AI Writing Assistant] PING successful");
    }
  });
}

function announceContentScriptReady(): void {
  sendMessageSafe(
    {
      type: "CONTENT_SCRIPT_READY",
      url: window.location.href,
      title: document.title,
      frameUrl: window.location.href,
    },
    () => {}
  );
}

function getEditableElement(target: EventTarget | null): EditableElement | null {
  if (!(target instanceof HTMLElement)) {
    return null;
  }

  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return target;
  }

  if (target.isContentEditable) {
    return target;
  }

  const contentEditableHost = target.closest('[contenteditable="true"], [role="textbox"]');
  return contentEditableHost instanceof HTMLElement ? contentEditableHost : null;
}

function getEventEditableTarget(event: Event): EditableElement | null {
  const path = typeof event.composedPath === "function" ? event.composedPath() : [];

  for (const pathTarget of path) {
    const editable = getEditableElement(pathTarget);
    if (editable) {
      return editable;
    }
  }

  return getEditableElement(event.target);
}

function findLikelyEditable(): EditableElement | null {
  const active = getEditableElement(document.activeElement);
  if (active) {
    return active;
  }

  const selectors = [
    '[contenteditable="true"]',
    '[role="textbox"]',
    'textarea',
    'input[type="text"]',
    'input:not([type])',
    '[data-lexical-editor="true"]',
    '.ProseMirror',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    const editable = getEditableElement(element);
    if (editable) {
      return editable;
    }
  }

  return null;
}

function readEditorText(element: EditableElement): string {
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    return element.value;
  }

  return element.innerText || element.textContent || "";
}

function detectContextType(element: EditableElement): string {
  const lowerHint = [
    element.getAttribute("aria-label"),
    element.getAttribute("placeholder"),
    element.getAttribute("name"),
    element.id,
    element.className,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/reply|respond/.test(lowerHint) || element.closest('[class*="reply"], [data-testid*="reply"]')) {
    return "reply";
  }

  if (/comment/.test(lowerHint) || element.closest('[class*="comment"], [data-testid*="comment"]')) {
    return "comment";
  }

  if (element instanceof HTMLTextAreaElement || /subject|email|mail|compose/.test(lowerHint)) {
    return "email";
  }

  return "general";
}

function extractReplyContext(element: EditableElement): string | undefined {
  const editorText = readEditorText(element).replace(/\s+/g, " ").trim();
  const containers = [
    element.closest('[class*="reply"]'),
    element.closest('[class*="comment"]'),
    element.closest('[role="dialog"]'),
    element.closest('article'),
    element.parentElement,
    element.parentElement?.parentElement,
  ].filter(Boolean) as HTMLElement[];

  const candidates: string[] = [];

  for (const container of containers) {
    const queryTargets = [
      ...Array.from(
        container.querySelectorAll(
          'blockquote, [class*="quoted"], [class*="reply"], [class*="comment"], [class*="message"], [data-testid*="reply"], [data-testid*="comment"], [role="article"]'
        )
      ),
      container.previousElementSibling,
    ].filter(Boolean) as Element[];

    for (const candidate of queryTargets) {
      if (candidate === element || candidate.contains(element)) {
        continue;
      }

      const text = (candidate.textContent || "").replace(/\s+/g, " ").trim();
      if (!text || text === editorText || text.length < 12) {
        continue;
      }

      candidates.push(text.slice(0, 280));
    }

    if (candidates.length > 0) {
      break;
    }
  }

  return candidates[0];
}

function syncDraftToBackground(text: string, context: string, replyContext?: string): void {
  if (!currentSession) {
    pendingDraftSync = true;
    initializeSession();
    return;
  }

  currentSession.content = text;
  currentSession.context = context;
  currentSession.replyContext = replyContext;

  sendMessageSafe(
    {
      type: "UPDATE_SESSION_DRAFT",
      sessionId: currentSession.id,
      text,
      context,
      replyContext,
    },
    () => {}
  );
}

function handleEditorChange(target: EditableElement): void {
  const text = readEditorText(target);
  const normalizedText = text.replace(/\s+/g, " ").trim();
  const contextType = detectContextType(target);
  const replyContext = extractReplyContext(target);

  if (!currentSession) {
    pendingDraftSync = true;
    initializeSession();
  }

  syncDraftToBackground(text, contextType, replyContext);

  if (normalizedText.length < 3) {
    hideOverlay();
    return;
  }

  if (analysisTimeout !== null) {
    clearTimeout(analysisTimeout);
  }

  analysisTimeout = window.setTimeout(() => {
    if (!currentSession) {
      pendingDraftSync = true;
      return;
    }

    sendMessageSafe(
      {
        type: "ANALYZE_TEXT",
        text,
        sessionId: currentSession.id,
        context: contextType,
        siteUrl: window.location.href,
        replyContext,
      },
      (result) => {
        const analysisResult = result as AnalyzeTextResponse;
        if (!analysisResult) {
          console.error("[AI Writing Assistant] No response from ANALYZE_TEXT");
          return;
        }

        currentSession = currentSession
          ? {
              ...currentSession,
              content: text,
              context: contextType,
              replyContext,
              suggestions: analysisResult.suggestions || [],
              textAnalysis: analysisResult.analysis ?? currentSession.textAnalysis,
            }
          : currentSession;

        if (analysisResult.suggestions && analysisResult.suggestions.length > 0) {
          const overlayAnalysis = analysisResult.analysis ?? currentSession?.textAnalysis;
          if (!overlayAnalysis) {
            hideOverlay();
            return;
          }

          showOverlay({
            text,
            suggestions: analysisResult.suggestions,
            analysis: overlayAnalysis,
            position: getCaretCoordinates(target),
          });
          return;
        }

        hideOverlay();
      }
    );
  }, 1200);
}

console.log("[AI Writing Assistant] Page loaded, testing connectivity...");
testBackgroundWorker();
announceContentScriptReady();

setTimeout(() => {
  initializeSession();
  const initialEditor = findLikelyEditable();
  if (initialEditor) {
    activeEditor = initialEditor;
  }
}, 500);

window.addEventListener("load", initializeSession);

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && !currentSession) {
    initializeSession();
  }
});

document.addEventListener("focusin", (event) => {
  const target = getEventEditableTarget(event);
  if (!target) {
    return;
  }

  activeEditor = target;
  if (!currentSession) {
    initializeSession();
  }
}, true);

document.addEventListener("beforeinput", (event) => {
  const target = getEventEditableTarget(event);
  if (!target) {
    return;
  }

  activeEditor = target;
  handleEditorChange(target);
}, true);

document.addEventListener("input", (event) => {
  const target = getEventEditableTarget(event);
  if (!target) {
    return;
  }

  activeEditor = target;
  handleEditorChange(target);
}, true);

document.addEventListener("keyup", (event) => {
  const target = getEventEditableTarget(event);
  if (!target) {
    return;
  }

  activeEditor = target;
  handleEditorChange(target);
}, true);

document.addEventListener("selectionchange", () => {
  const target = findLikelyEditable();
  if (!target) {
    return;
  }

  activeEditor = target;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideOverlay();
  }
});

function getCaretCoordinates(element: EditableElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left,
    y: rect.bottom + 10,
  };
}
