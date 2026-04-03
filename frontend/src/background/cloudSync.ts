import type { Settings, Snippet } from "../types";

export async function syncToCloud(
  settings: Settings,
  token: string
): Promise<{ success: boolean; synced?: number; error?: string }> {
  try {
    const { snippets: raw } = await chrome.storage.sync.get("snippets");
    const snippets: Snippet[] = (raw as Snippet[] | undefined) ?? [];

    const res = await fetch(`${settings.backendUrl}/api/snippets/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ snippets }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Merge server response back (server may have merged from other devices)
    if (data.snippets) {
      const merged = mergeSnippets(snippets, data.snippets);
      await chrome.storage.sync.set({ snippets: merged });
    }

    return { success: true, synced: snippets.length };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function syncFromCloud(
  settings: Settings,
  token: string
): Promise<{ success: boolean; received?: number; error?: string }> {
  try {
    const res = await fetch(`${settings.backendUrl}/api/snippets`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { snippets: remoteSnippets } = await res.json();

    const { snippets: local } = await chrome.storage.sync.get("snippets");
    const merged = mergeSnippets((local as Snippet[] | undefined) ?? [], remoteSnippets);
    await chrome.storage.sync.set({ snippets: merged });

    return { success: true, received: remoteSnippets.length };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Last-write-wins merge by updatedAt timestamp.
 * Remote wins on conflict (latest updatedAt takes precedence).
 */
function mergeSnippets(local: Snippet[], remote: Snippet[]): Snippet[] {
  const map = new Map<string, Snippet>();

  for (const s of local) map.set(s.id, s);
  for (const s of remote) {
    const existing = map.get(s.id);
    if (!existing || s.updatedAt > existing.updatedAt) {
      map.set(s.id, s);
    }
  }

  return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
}