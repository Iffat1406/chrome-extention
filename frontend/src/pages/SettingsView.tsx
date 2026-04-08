import { useState } from "react";
import { useSettings } from "../hooks/useSettings";
import type { Settings } from "../types";

export default function SettingsView() {
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
      <div className="space-y-4 p-4">
        <section className="rounded-[24px] border border-white/60 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Preferences
          </p>
          <h1 className="mt-1 text-lg font-semibold text-slate-900">Assistant settings</h1>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Control the model, timing, and privacy behavior of your writing assistant.
          </p>
        </section>

        {saveStatus === "saved" && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            Settings saved successfully.
          </div>
        )}

        {saveStatus === "error" && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
            Something went wrong while saving.
          </div>
        )}

        <SettingsCard
          eyebrow="AI model"
          title="Model and credentials"
          description="Choose the provider and keep your key ready for real-time writing help."
        >
          <div className="space-y-3">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-slate-700">Model</span>
              <select
                value={settings.model}
                onChange={(event) =>
                  handleSave({ model: event.target.value as "gemini" | "claude" | "gpt4" })
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-300 focus:bg-white"
              >
                <option value="gemini">Google Gemini</option>
                <option value="claude">Anthropic Claude</option>
                <option value="gpt4">OpenAI GPT-4</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-slate-700">API key</span>
              <div className="flex gap-2">
                <input
                  type={apiKeyVisible ? "text" : "password"}
                  placeholder="Enter your API key"
                  value={settings.geminiApiKey}
                  onChange={(event) => updateSettings({ geminiApiKey: event.target.value })}
                  onBlur={() => handleSave({ geminiApiKey: settings.geminiApiKey })}
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-300 focus:bg-white"
                />
                <button
                  onClick={() => setApiKeyVisible(!apiKeyVisible)}
                  className="rounded-2xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  {apiKeyVisible ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">
                Stored locally for now. We can switch this to secure server storage in the backend
                phase.
              </p>
            </label>
          </div>
        </SettingsCard>

        <SettingsCard
          eyebrow="Analysis"
          title="Suggestion depth"
          description="Tune how much help the assistant gives when it analyzes a draft."
        >
          <div className="space-y-2">
            {[
              {
                value: "grammar",
                label: "Grammar only",
                detail: "Lightweight proofreading for spelling and grammar.",
              },
              {
                value: "comprehensive",
                label: "Full analysis",
                detail: "Grammar, clarity, tone, and higher quality rewrites.",
              },
              {
                value: "completion",
                label: "Text completion",
                detail: "Focus on helping finish thoughts and reply drafts.",
              },
            ].map((option) => {
              const active = settings.analysisMode === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() =>
                    handleSave({
                      analysisMode: option.value as "grammar" | "comprehensive" | "completion",
                    })
                  }
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                    active
                      ? "border-teal-300 bg-teal-50"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{option.label}</p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">{option.detail}</p>
                    </div>
                    <span
                      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                        active
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-slate-300 bg-white text-transparent"
                      }`}
                    >
                      •
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </SettingsCard>

        <SettingsCard
          eyebrow="Behavior"
          title="Timing and automation"
          description="Control how quickly suggestions appear and whether help is automatic."
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">Auto-suggest improvements</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Show writing help automatically while the user is typing.
                </p>
              </div>
              <button
                onClick={() => handleSave({ autoSuggest: !settings.autoSuggest })}
                className={`relative h-7 w-12 rounded-full transition ${
                  settings.autoSuggest ? "bg-teal-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                    settings.autoSuggest ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Suggestion delay</p>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500">
                    Wait time before analyzing a fresh input.
                  </p>
                </div>
                <div className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  {settings.suggestionDelay} ms
                </div>
              </div>
              <input
                type="range"
                min="500"
                max="3000"
                step="100"
                value={settings.suggestionDelay}
                onChange={(event) =>
                  updateSettings({ suggestionDelay: Number(event.target.value) })
                }
                onMouseUp={(event) =>
                  handleSave({
                    suggestionDelay: Number((event.target as HTMLInputElement).value),
                  })
                }
                className="w-full accent-teal-600"
              />
            </div>
          </div>
        </SettingsCard>

        <SettingsCard
          eyebrow="Data"
          title="Local history"
          description="Manage the writing sessions currently stored in the extension."
        >
          <button
            onClick={handleClearHistory}
            className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            Clear all writing history
          </button>
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
      <h2 className="mt-1 text-sm font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
