import type { AISuggestion, TextAnalysis } from "../types";

const OVERLAY_ID = "ai-suggestions-overlay";

let overlayEl: HTMLDivElement | null = null;

export interface OverlayData {
  text: string;
  suggestions: AISuggestion[];
  analysis: TextAnalysis;
  position: { x: number; y: number };
}

export function showOverlay(data: OverlayData): void {
  hideOverlay();

  injectStyles();

  overlayEl = document.createElement("div");
  overlayEl.id = OVERLAY_ID;
  overlayEl.className = "ai-overlay";

  const html = `
    <div class="ai-overlay-content">
      <div class="ai-header">
        <span class="ai-title">✨ Writing Suggestions</span>
        <button class="ai-close" onclick="removeOverlay()">×</button>
      </div>
      
      <div class="ai-analysis">
        <div class="ai-metric">
          <span>Grammar: <strong>${data.analysis.grammarScore}%</strong></span>
          <div class="ai-bar" style="width: ${data.analysis.grammarScore}%"></div>
        </div>
        <div class="ai-metric">
          <span>Clarity: <strong>${data.analysis.clarityScore}%</strong></span>
          <div class="ai-bar" style="width: ${data.analysis.clarityScore}%"></div>
        </div>
      </div>

      <div class="ai-suggestions">
        ${data.suggestions
          .slice(0, 3)
          .map(
            (sugg, i) => `
          <div class="ai-suggestion" data-index="${i}">
            <div class="ai-reason">${sugg.reason}</div>
            <div class="ai-text">"${sugg.originalText}" → "${sugg.suggestion}"</div>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="ai-footer">
        <p class="ai-tone">Tone: <strong>${data.analysis.toneAnalysis}</strong></p>
      </div>
    </div>
  `;

  overlayEl.innerHTML = html;
  overlayEl.style.position = "fixed";
  overlayEl.style.left = data.position.x + "px";
  overlayEl.style.top = data.position.y + "px";
  overlayEl.style.zIndex = "999999";

  document.body.appendChild(overlayEl);

  // Add event listeners to suggestions
  const suggestions = overlayEl.querySelectorAll(".ai-suggestion");
  suggestions.forEach((el) => {
    el.addEventListener("click", () => {
      hideOverlay();
    });
  });
}

export function hideOverlay(): void {
  if (overlayEl) {
    overlayEl.remove();
    overlayEl = null;
  }
}

function injectStyles(): void {
  if (document.getElementById("ai-overlay-styles")) return;

  const style = document.createElement("style");
  style.id = "ai-overlay-styles";
  style.textContent = `
    #ai-suggestions-overlay {
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #1f2937;
      max-width: 400px;
      padding: 0;
      animation: slideUp 0.2s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .ai-overlay-content {
      background: white;
      border-radius: 8px;
      overflow: hidden;
    }

    .ai-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: linear-gradient(135deg, #7c3aed, #6366f1);
      color: white;
      font-weight: 600;
      font-size: 14px;
    }

    .ai-title {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .ai-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 20px;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ai-close:hover {
      opacity: 0.8;
    }

    .ai-analysis {
      padding: 12px 16px;
      border-bottom: 1px solid #f3f4f6;
      background: #f9fafb;
    }

    .ai-metric {
      margin-bottom: 8px;
      font-size: 12px;
    }

    .ai-metric:last-child {
      margin-bottom: 0;
    }

    .ai-metric span {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      color: #6b7280;
    }

    .ai-metric strong {
      color: #1f2937;
    }

    .ai-bar {
      height: 4px;
      background: #dbeafe;
      border-radius: 2px;
      background: linear-gradient(90deg, #7c3aed, #6366f1);
    }

    .ai-suggestions {
      max-height: 240px;
      overflow-y: auto;
      padding: 8px;
    }

    .ai-suggestion {
      padding: 10px;
      margin-bottom: 8px;
      background: #f3f4f6;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 13px;
      border-left: 3px solid #7c3aed;
    }

    .ai-suggestion:hover {
      background: #e5e7eb;
      transform: translateX(4px);
    }

    .ai-suggestion:last-child {
      margin-bottom: 0;
    }

    .ai-reason {
      font-size: 11px;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      font-weight: 600;
    }

    .ai-text {
      color: #374151;
      font-weight: 500;
      line-height: 1.4;
    }

    .ai-footer {
      padding: 10px 16px;
      border-top: 1px solid #f3f4f6;
      background: #f9fafb;
      font-size: 12px;
      color: #6b7280;
    }

    .ai-tone {
      margin: 0;
    }

    .ai-tone strong {
      color: #1f2937;
    }
  `;

  document.head.appendChild(style);
}

// Make hideOverlay globally accessible
declare global {
  function removeOverlay(): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).removeOverlay = hideOverlay;
