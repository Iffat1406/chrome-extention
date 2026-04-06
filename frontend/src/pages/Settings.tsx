import { useState } from "react";
import { useSettings } from "../hooks/useSettings";
import type { Settings } from "../types";

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  async function handleSave(patch: Partial<Settings>) {
    try {
      await updateSettings(patch);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1800);
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleClearHistory() {
    if (!confirm("Delete all writing history? This cannot be undone.")) return;
    await chrome.storage.local.remove("sessions");
    alert("History cleared");
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 space-y-4">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Settings</h1>
          <p className="text-xs text-gray-500">Configure your writing assistant</p>
        </div>

        {saveStatus === "saved" && (
          <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
            ✓ Settings saved
          </div>
        )}

        {/* AI Model */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-600 uppercase">AI Model</h2>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">Model:</label>
            <select
              value={settings.model}
              onChange={(e) => handleSave({ model: e.target.value as "gemini" | "claude" | "gpt4" })}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300"
            >
              <option value="gemini">Google Gemini</option>
              <option value="claude">Anthropic Claude</option>
              <option value="gpt4">OpenAI GPT-4</option>
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">API Key:</label>
            <div className="flex gap-2">
              <input
                type={apiKeyVisible ? "text" : "password"}
                placeholder="Enter your API key..."
                value={settings.geminiApiKey}
                onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
                onBlur={() => handleSave({ geminiApiKey: settings.geminiApiKey })}
                className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              <button
                onClick={() => setApiKeyVisible(!apiKeyVisible)}
                className="px-2 text-gray-400 hover:text-gray-600"
              >
                {apiKeyVisible ? "Hide" : "Show"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Stored locally, never sent elsewhere</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Analysis Mode */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-600 uppercase">Analysis Mode</h2>
          <div className="space-y-1">
            {[
              { value: "grammar", label: "Grammar Only" },
              { value: "comprehensive", label: "Full Analysis (Grammar, Clarity, Tone)" },
              { value: "completion", label: "Text Completion" },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="analysisMode"
                  value={option.value}
                  checked={settings.analysisMode === option.value}
                  onChange={(e) => handleSave({ analysisMode: e.target.value as "grammar" | "comprehensive" | "completion" })}
                  className="w-3 h-3"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Behavior */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-600 uppercase">Behavior</h2>
          <label className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-700">Auto-suggest improvements</span>
            <button
              onClick={() => handleSave({ autoSuggest: !settings.autoSuggest })}
              className={`relative w-8 h-4 rounded-full transition ${
                settings.autoSuggest ? "bg-violet-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition ${
                  settings.autoSuggest ? "translate-x-4" : ""
                }`}
              />
            </button>
          </label>

          <div>
            <label className="text-xs font-medium text-gray-700 block mb-2">
              Suggestion delay: {settings.suggestionDelay}ms
            </label>
            <input
              type="range"
              min="500"
              max="3000"
              step="100"
              value={settings.suggestionDelay}
              onChange={(e) =>
                updateSettings({ suggestionDelay: Number(e.target.value) })
              }
              onMouseUp={(e) =>
                handleSave({
                  suggestionDelay: Number((e.target as HTMLInputElement).value),
                })
              }
              className="w-full accent-violet-600"
            />
            <p className="text-xs text-gray-400 mt-1">Time to wait before analyzing text</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Data */}
        <div className="space-y-2">
          <h2 className="text-xs font-semibold text-gray-600 uppercase">Data</h2>
          <button
            onClick={handleClearHistory}
            className="w-full px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition"
          >
            Clear all writing history
          </button>
          <p className="text-xs text-gray-400">Permanently delete all stored writing sessions</p>
        </div>
      </div>
    </div>
  );
}
