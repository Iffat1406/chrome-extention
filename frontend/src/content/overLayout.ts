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

    .ai-overlay-content {
      padding: 16px;
    }

    .ai-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .ai-title {
      font-weight: 600;
      font-size: 14px;
    }

    .ai-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #6b7280;
    }

    .ai-analysis {
      margin-bottom: 12px;
    }

    .ai-metric {
      margin-bottom: 8px;
      font-size: 12px;
    }

    .ai-bar {
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      margin-top: 4px;
      background: linear-gradient(90deg, #10b981, #3b82f6);
    }

    .ai-suggestions {
      margin-bottom: 12px;
    }

    .ai-suggestion {
      padding: 8px;
      background: #f9fafb;
      border-radius: 4px;
      margin-bottom: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .ai-suggestion:hover {
      background: #e5e7eb;
    }

    .ai-reason {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
    }

    .ai-text {
      font-size: 13px;
      margin-top: 4px;
      color: #1f2937;
    }

    .ai-footer {
      font-size: 11px;
      color: #6b7280;
    }

    .ai-tone {
      margin: 0;
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
  `;

  document.head.appendChild(style);
}
