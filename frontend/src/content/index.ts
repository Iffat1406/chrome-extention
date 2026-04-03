import { TriggerDetector } from "./triggerDetector";
import { showOverlay, hideOverlay } from "./overLayout";
import { insertText } from "./textInserter";
import type { AISuggestion } from "../types";

const detector = new TriggerDetector();

document.addEventListener("keydown", (e) => {
  const target = e.target as HTMLElement;
  const isEditable =
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA";

  if (!isEditable) return;

  detector.onKeydown(e, async (context) => {
    const suggestions: AISuggestion[] = await chrome.runtime.sendMessage({
      type: "GET_SUGGESTIONS",
      context,
    });

    if (suggestions.length === 0) return;

    showOverlay(suggestions, target, (chosen: string) => {
      insertText(target, chosen);
      hideOverlay();
      detector.reset();
    });
  });
});