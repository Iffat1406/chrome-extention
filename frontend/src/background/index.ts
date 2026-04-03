import type { MessageType, Settings, Snippet, AnalyticsEntry, User } from "../types";
import { getGeminiSuggestions } from "./geminiEngine";
import { syncToCloud, syncFromCloud } from "./cloudSync";

const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  aiEnabled: false,
  geminiApiKey: "",
  minChars: 3,
  maxSuggestions: 5,
  keyboardShortcut: "Ctrl+Shift+Y",
  excludedSites: [],
  cloudSyncEnabled: false,
  backendUrl: "http://localhost:4000",
};

// ── Keyboard commands ─────────────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "insert-snippet") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    chrome.tabs.sendMessage(tab.id, { type: "OPEN_POPUP" });
  }

  if (command === "toggle-extension") {
    const { settings: raw } = await chrome.storage.sync.get("settings");
    const settings: Settings = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
    const next = { ...settings, enabled: !settings.enabled };
    await chrome.storage.sync.set({ settings: next });

    // Show badge to confirm state
    chrome.action.setBadgeText({ text: next.enabled ? "" : "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
  }
});

// ── Messages from content script & popup ─────────────────────────────────────

chrome.runtime.onMessage.addListener((msg: MessageType, _sender, reply) => {
  if (msg.type === "GET_SUGGESTIONS") {
    handleSuggestions(msg.prefix, msg.context).then(reply);
    return true;
  }

  if (msg.type === "RECORD_USAGE") {
    handleRecordUsage(msg.snippetId, msg.site, msg.trigger).then(reply);
    return true;
  }

  if (msg.type === "SYNC_TO_CLOUD") {
    handleCloudSync().then(reply);
    return true;
  }

  if (msg.type === "GET_SETTINGS") {
    chrome.storage.sync.get("settings", (data) => {
      reply({ settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) } });
    });
    return true;
  }
});

// ── Sync on startup ───────────────────────────────────────────────────────────

chrome.runtime.onStartup.addListener(async () => {
  const { settings: raw, user: rawUser } = await chrome.storage.sync.get(["settings", "user"]);
  const settings: Settings = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  const user = rawUser as User | undefined;
  if (settings.cloudSyncEnabled && user?.token) {
    await syncFromCloud(settings, user.token);
  }
});

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleSuggestions(prefix: string, context: string) {
  const { settings: raw, snippets: rawSnippets } = await chrome.storage.sync.get([
    "settings", "snippets",
  ]);
  const settings: Settings = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  const snippets: Snippet[] = (rawSnippets as Snippet[] | undefined) ?? [];

  if (!settings.enabled || prefix.length < settings.minChars) {
    return { suggestions: [] };
  }

  // 1. Exact shortcut match
  const shortcutMatch = snippets.find(
    (s) => s.shortcut.replace(/^\//, "") === prefix.replace(/^\//, "")
  );
  if (shortcutMatch) {
    return {
      suggestions: [{ text: shortcutMatch.content, confidence: 1, source: "history" }],
    };
  }

  // 2. Prefix match on label/shortcut
  const prefixMatches = snippets
    .filter(
      (s) =>
        s.label.toLowerCase().startsWith(prefix.toLowerCase()) ||
        s.shortcut.toLowerCase().includes(prefix.toLowerCase()) ||
        s.content.toLowerCase().startsWith(prefix.toLowerCase())
    )
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 3)
    .map((s) => ({ text: s.content, snippetId: s.id, confidence: 0.85, source: "history" as const }));

  // 3. Gemini AI fallback
  let aiResults: { text: string; confidence: number; source: "ai" }[] = [];
  if (prefixMatches.length < 2 && settings.aiEnabled && settings.geminiApiKey) {
    aiResults = await getGeminiSuggestions(prefix, context, settings.geminiApiKey);
  }

  return { suggestions: [...prefixMatches, ...aiResults].slice(0, settings.maxSuggestions) };
}

async function handleRecordUsage(snippetId: string, site: string, trigger: string) {
  // Update snippet usage count
  const { snippets: raw } = await chrome.storage.sync.get("snippets");
  const snippets: Snippet[] = (raw as Snippet[] | undefined) ?? [];
  const updated = snippets.map((s) =>
    s.id === snippetId
      ? { ...s, usageCount: s.usageCount + 1, lastUsed: Date.now() }
      : s
  );
  await chrome.storage.sync.set({ snippets: updated });

  // Append to analytics log
  const { analytics: rawA } = await chrome.storage.local.get("analytics");
  const analytics: AnalyticsEntry[] = (rawA as AnalyticsEntry[] | undefined) ?? [];
  const validTrigger = (trigger === "shortcut" || trigger === "keyboard" || trigger === "ai") ? trigger : "shortcut";
  analytics.push({ snippetId, usedAt: Date.now(), site, trigger: validTrigger });
  // Keep last 500 entries
  await chrome.storage.local.set({ analytics: analytics.slice(-500) });
}

async function handleCloudSync() {
  const { settings: raw, user: rawUser } = await chrome.storage.sync.get(["settings", "user"]);
  const settings: Settings = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  const user = rawUser as User | undefined;
  if (!settings.cloudSyncEnabled || !user?.token) {
    return { success: false, error: "Cloud sync not configured" };
  }
  return syncToCloud(settings, user.token);
}