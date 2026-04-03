/**
 * Inserts expanded text into the currently focused editable element,
 * replacing the typed shortcut (if any) in the process.
 *
 * Works across:
 *  - <input> / <textarea>
 *  - contenteditable divs (Gmail, Notion, VS Code Web, etc.)
 *  - Monaco editor (VS Code Web) via execCommand fallback
 */

const SHORTCUT_PATTERN = /\/\w+\s?$/;

/**
 * Main entry point called from overlayUI after the user picks a suggestion.
 *
 * @param target     The editable DOM element that currently has focus
 * @param expansion  The full text to insert
 */
export function insertText(target: HTMLElement, expansion: string): void {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    insertIntoInput(target, expansion);
  } else if (target.isContentEditable || target.getAttribute("role") === "textbox") {
    insertIntoContentEditable(target, expansion);
  } else {
    // Last-resort fallback — works in Monaco / CodeMirror
    execCommandInsert(expansion);
  }

  // Dispatch input + change events so framework bindings (React, Vue, etc.) pick up the change
  target.dispatchEvent(new Event("input", { bubbles: true }));
  target.dispatchEvent(new Event("change", { bubbles: true }));
}

// ─── Input / Textarea ──────────────────────────────────────────────────────────

function insertIntoInput(
  el: HTMLInputElement | HTMLTextAreaElement,
  expansion: string
): void {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;

  // Remove the shortcut that triggered expansion
  const beforeCursor = el.value.slice(0, start);
  const afterCursor = el.value.slice(end);
  const cleanedBefore = beforeCursor.replace(SHORTCUT_PATTERN, "");

  const newValue = cleanedBefore + expansion + afterCursor;
  const newCursor = cleanedBefore.length + expansion.length;

  // Use nativeInputValueSetter to bypass React's synthetic event system
  const nativeSetter = Object.getOwnPropertyDescriptor(
    el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype,
    "value"
  )?.set;

  if (nativeSetter) {
    nativeSetter.call(el, newValue);
  } else {
    el.value = newValue;
  }

  el.setSelectionRange(newCursor, newCursor);
}

// ─── ContentEditable ───────────────────────────────────────────────────────────

function insertIntoContentEditable(el: HTMLElement, expansion: string): void {
  el.focus();
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) {
    execCommandInsert(expansion);
    return;
  }

  const range = sel.getRangeAt(0);

  // Walk back through the current text node to find and remove the shortcut
  const { node: textNode, offset } = getCaretTextNode(sel);
  if (textNode) {
    const text = textNode.textContent ?? "";
    const before = text.slice(0, offset);
    const match = before.match(SHORTCUT_PATTERN);

    if (match) {
      const removeStart = offset - match[0].length;
      textNode.textContent =
        text.slice(0, removeStart) + expansion + text.slice(offset);

      // Reposition caret after inserted text
      const newRange = document.createRange();
      newRange.setStart(textNode, removeStart + expansion.length);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
      return;
    }
  }

  // No shortcut found — just insert at caret
  range.deleteContents();
  const textNodeInsert = document.createTextNode(expansion);
  range.insertNode(textNodeInsert);
  range.setStartAfter(textNodeInsert);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
}

function getCaretTextNode(sel: Selection): { node: Text | null; offset: number } {
  const node = sel.anchorNode;
  if (node?.nodeType === Node.TEXT_NODE) {
    return { node: node as Text, offset: sel.anchorOffset };
  }
  return { node: null, offset: 0 };
}

// ─── execCommand fallback (Monaco, legacy editors) ────────────────────────────

function execCommandInsert(text: string): void {
  // Delete the shortcut first via execCommand
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const textNode = range.startContainer;
    if (textNode.nodeType === Node.TEXT_NODE) {
      const content = textNode.textContent ?? "";
      const offset = range.startOffset;
      const before = content.slice(0, offset);
      const match = before.match(SHORTCUT_PATTERN);
      if (match) {
        const newRange = document.createRange();
        newRange.setStart(textNode, offset - match[0].length);
        newRange.setEnd(textNode, offset);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    }
  }
  document.execCommand("insertText", false, text);
}