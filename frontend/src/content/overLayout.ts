import type { AISuggestion } from "../types";

type SelectCallback = (text: string) => void;

const OVERLAY_ID = "ste-overlay";
const ITEM_CLASS = "ste-item";
const ACTIVE_CLASS = "ste-item--active";

let overlayEl: HTMLDivElement | null = null;
let currentItems: AISuggestion[] = [];
let activeIndex = 0;
let selectCallback: SelectCallback | null = null;
let keydownHandler: ((e: KeyboardEvent) => void) | null = null;
let clickOutsideHandler: ((e: MouseEvent) => void) | null = null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Render the suggestion dropdown near the caret / active element.
 *
 * @param suggestions  Ranked list from matchSnippets + AI engine
 * @param anchor       The editable element the user is typing in
 * @param onSelect     Called with the chosen text when user picks a suggestion
 */
export function showOverlay(
  suggestions: AISuggestion[],
  anchor: HTMLElement,
  onSelect: SelectCallback
): void {
  if (suggestions.length === 0) return;

  hideOverlay();

  currentItems = suggestions;
  activeIndex = 0;
  selectCallback = onSelect;

  injectStyles();

  overlayEl = document.createElement("div");
  overlayEl.id = OVERLAY_ID;
  overlayEl.setAttribute("role", "listbox");
  overlayEl.setAttribute("aria-label", "Text expansion suggestions");

  renderItems();
  positionOverlay(anchor);

  document.body.appendChild(overlayEl);

  // Keyboard nav
  keydownHandler = (e: KeyboardEvent) => handleKeydown(e);
  document.addEventListener("keydown", keydownHandler, true);

  // Click outside to dismiss
  clickOutsideHandler = (e: MouseEvent) => {
    if (overlayEl && !overlayEl.contains(e.target as Node)) {
      hideOverlay();
    }
  };
  setTimeout(() => {
    document.addEventListener("mousedown", clickOutsideHandler!, true);
  }, 0);
}

/**
 * Destroy the overlay and clean up all listeners.
 */
export function hideOverlay(): void {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
  if (keydownHandler) {
    document.removeEventListener("keydown", keydownHandler, true);
    keydownHandler = null;
  }
  if (clickOutsideHandler) {
    document.removeEventListener("mousedown", clickOutsideHandler, true);
    clickOutsideHandler = null;
  }
  currentItems = [];
  selectCallback = null;
  activeIndex = 0;
}

/**
 * Returns true if the overlay is currently visible.
 */
export function isOverlayVisible(): boolean {
  return overlayEl !== null;
}

// ─── Rendering ────────────────────────────────────────────────────────────────

function renderItems(): void {
  if (!overlayEl) return;
  overlayEl.innerHTML = "";

  currentItems.forEach((suggestion, index) => {
    const item = document.createElement("div");
    item.className = ITEM_CLASS + (index === activeIndex ? ` ${ACTIVE_CLASS}` : "");
    item.setAttribute("role", "option");
    item.setAttribute("aria-selected", String(index === activeIndex));
    item.dataset.index = String(index);

    // Source badge
    const badge = document.createElement("span");
    badge.className = "ste-badge ste-badge--" + suggestion.source;
    badge.textContent = suggestion.source === "ai" ? "AI" : "snippet";

    // Preview text (truncated)
    const preview = document.createElement("span");
    preview.className = "ste-preview";
    preview.textContent = truncate(suggestion.text, 72);

    // Confidence bar
    const bar = document.createElement("span");
    bar.className = "ste-bar";
    bar.style.width = Math.round(suggestion.confidence * 100) + "%";

    item.append(badge, preview, bar);

    item.addEventListener("mousedown", (e) => {
      e.preventDefault(); // prevent blur on anchor
      commitSelection(index);
    });

    item.addEventListener("mousemove", () => {
      if (activeIndex !== index) {
        activeIndex = index;
        refreshActive();
      }
    });

    overlayEl!.appendChild(item);
  });
}

function refreshActive(): void {
  if (!overlayEl) return;
  overlayEl.querySelectorAll("." + ITEM_CLASS).forEach((el, i) => {
    el.classList.toggle(ACTIVE_CLASS, i === activeIndex);
    el.setAttribute("aria-selected", String(i === activeIndex));
  });
}

// ─── Positioning ──────────────────────────────────────────────────────────────

function positionOverlay(anchor: HTMLElement): void {
  if (!overlayEl) return;

  const caretRect = getCaretRect(anchor);
  const OFFSET = 6;

  overlayEl.style.position = "fixed";
  overlayEl.style.zIndex = "2147483647";

  // Temporarily render off-screen to measure
  overlayEl.style.visibility = "hidden";
  overlayEl.style.top = "0";
  overlayEl.style.left = "0";
  document.body.appendChild(overlayEl);

  const { width: ow, height: oh } = overlayEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = caretRect.bottom + OFFSET;
  let left = caretRect.left;

  // Flip above caret if not enough room below
  if (top + oh > vh - 8) top = caretRect.top - oh - OFFSET;
  // Clamp horizontally
  if (left + ow > vw - 8) left = vw - ow - 8;
  if (left < 8) left = 8;

  overlayEl.style.top = top + "px";
  overlayEl.style.left = left + "px";
  overlayEl.style.visibility = "visible";
}

/**
 * Get caret bounding rect from input/textarea or contenteditable.
 */
function getCaretRect(anchor: HTMLElement): DOMRect {
  // Try Selection API first (works in contenteditable + most browsers)
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0).cloneRange();
    range.collapse(true);
    const rect = range.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) return rect;
  }

  // Fallback: use the anchor element's bounding rect
  return anchor.getBoundingClientRect();
}

// ─── Keyboard navigation ──────────────────────────────────────────────────────

function handleKeydown(e: KeyboardEvent): void {
  if (!overlayEl) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      activeIndex = (activeIndex + 1) % currentItems.length;
      refreshActive();
      break;

    case "ArrowUp":
      e.preventDefault();
      activeIndex = (activeIndex - 1 + currentItems.length) % currentItems.length;
      refreshActive();
      break;

    case "Enter":
    case "Tab":
      e.preventDefault();
      commitSelection(activeIndex);
      break;

    case "Escape":
      e.preventDefault();
      hideOverlay();
      break;
  }
}

function commitSelection(index: number): void {
  const item = currentItems[index];
  if (!item || !selectCallback) return;
  const cb = selectCallback;
  hideOverlay();
  cb(item.text);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1) + "…";
}

// ─── Styles (injected once into the page) ────────────────────────────────────

let stylesInjected = false;

function injectStyles(): void {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement("style");
  style.textContent = `
    #ste-overlay {
      background: #ffffff;
      border: 1px solid #e2e2e2;
      border-radius: 10px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      min-width: 260px;
      max-width: 420px;
      max-height: 260px;
      overflow-y: auto;
      padding: 4px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 13px;
      line-height: 1.4;
    }

    @media (prefers-color-scheme: dark) {
      #ste-overlay {
        background: #1e1e1e;
        border-color: #3a3a3a;
        box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        color: #d4d4d4;
      }
    }

    .ste-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 10px;
      border-radius: 7px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .ste-item--active {
      background: #f0f0ff;
    }

    @media (prefers-color-scheme: dark) {
      .ste-item--active { background: #2a2a40; }
    }

    .ste-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 5px;
      border-radius: 4px;
      flex-shrink: 0;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .ste-badge--ai {
      background: #ede9fe;
      color: #5b21b6;
    }

    .ste-badge--snippet {
      background: #d1fae5;
      color: #065f46;
    }

    @media (prefers-color-scheme: dark) {
      .ste-badge--ai    { background: #3b2f6e; color: #c4b5fd; }
      .ste-badge--snippet { background: #064e3b; color: #6ee7b7; }
    }

    .ste-preview {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #111;
    }

    @media (prefers-color-scheme: dark) {
      .ste-preview { color: #d4d4d4; }
    }

    .ste-bar {
      display: block;
      height: 2px;
      background: #7c3aed;
      border-radius: 1px;
      position: absolute;
      bottom: 3px;
      left: 10px;
      opacity: 0.3;
      transition: width 0.2s;
    }
  `;
  document.head.appendChild(style);
}