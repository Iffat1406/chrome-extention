import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import { useSnippets } from "../hooks/useSnippet";

export default function Settings() {
  const navigate = useNavigate();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { exportSnippets, importSnippets } = useSnippets();

  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [importError, setImportError] = useState("");

  async function handleSave(patch: Parameters<typeof updateSettings>[0]) {
    try {
      await updateSettings(patch);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1800);
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleReset() {
    if (!confirm("Reset all settings to defaults?")) return;
    await resetSettings();
  }

  function handleExport() {
    const data = exportSnippets();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "snippets-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(parsed)) throw new Error("Invalid format");
        await importSnippets(parsed);
        setImportError("");
      } catch {
        setImportError("Invalid JSON file. Expected an array of snippets.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-100">
        <button
          onClick={() => navigate("/")}
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z"/>
          </svg>
        </button>
        <h1 className="text-sm font-semibold text-gray-800">Settings</h1>
        {saveStatus === "saved" && (
          <span className="ml-auto text-xs text-green-600 font-medium">Saved</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* AI Settings */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            AI Suggestions
          </h2>
          <div className="space-y-3">
            {/* Enable toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-700">Enable AI suggestions</p>
                <p className="text-xs text-gray-400">Uses Claude to suggest completions</p>
              </div>
              <button
                role="switch"
                aria-checked={settings.aiEnabled}
                onClick={() => handleSave({ aiEnabled: !settings.aiEnabled })}
                className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                  settings.aiEnabled ? "bg-violet-600" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    settings.aiEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Anthropic API key
              </label>
              <div className="flex gap-2">
                <input
                  type={apiKeyVisible ? "text" : "password"}
                  placeholder="sk-ant-..."
                  value={settings.geminiApiKey}
                  onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
                  onBlur={() => handleSave({ geminiApiKey: settings.geminiApiKey })}
                  className="flex-1 px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder-gray-400"
                />
                <button
                  onClick={() => setApiKeyVisible((v) => !v)}
                  className="px-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg"
                  title={apiKeyVisible ? "Hide" : "Show"}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    {apiKeyVisible
                      ? <path d="M8 2a6 6 0 110 12A6 6 0 018 2zm0 1.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM8 5a3 3 0 110 6A3 3 0 018 5z"/>
                      : <path d="M8 2C4.5 2 1.5 4.5.1 8c1.4 3.5 4.4 6 7.9 6s6.5-2.5 7.9-6C14.5 4.5 11.5 2 8 2zm0 10a4 4 0 110-8 4 4 0 010 8zm0-6.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z"/>}
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Your key is stored locally in chrome.storage — never sent elsewhere.
              </p>
            </div>

            {/* Max suggestions */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Max suggestions shown: <span className="text-violet-700">{settings.maxSuggestions}</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={settings.maxSuggestions}
                onChange={(e) => updateSettings({ maxSuggestions: Number(e.target.value) })}
                onMouseUp={() => handleSave({ maxSuggestions: settings.maxSuggestions })}
                className="w-full accent-violet-600"
              />
              <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                <span>1</span><span>10</span>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-gray-100" />

        {/* Trigger Settings */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Trigger key
          </h2>
          <div className="flex gap-2">
            {["Space", "Enter", "Tab"].map((key) => (
              <button
                key={key}
                onClick={() => handleSave({ keyboardShortcut: key })}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                  settings.keyboardShortcut === key
                    ? "border-violet-400 bg-violet-50 text-violet-700 font-medium"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Used with Ctrl to open AI suggestions (e.g. Ctrl+Space).
          </p>
        </section>

        <hr className="border-gray-100" />

        {/* Import / Export */}
        <section>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Data
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex-1 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Export snippets
            </button>
            <label className="flex-1 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-center cursor-pointer">
              Import snippets
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
          {importError && (
            <p className="mt-2 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {importError}
            </p>
          )}
        </section>

        <hr className="border-gray-100" />

        {/* Reset */}
        <section>
          <button
            onClick={handleReset}
            className="w-full py-2 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
          >
            Reset all settings
          </button>
        </section>
      </div>
    </div>
  );
}