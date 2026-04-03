import { getAISuggestions } from "./aiEngine";
import { matchSnippets } from "./snipMatcher";
import type { MessageType, Settings, Snippet } from "../types";

chrome.runtime.onMessage.addListener((msg: MessageType, _sender, reply) => {
  if (msg.type === "GET_SUGGESTIONS") {
    handleSuggestions(msg.context).then(reply);
    return true; // async response
  }
});

async function handleSuggestions(context: string) {
  const { snippets, settings } = await chrome.storage.sync.get([
    "snippets",
    "settings",
  ]) as { snippets?: unknown[]; settings?: Settings };

  const snippetMatches = matchSnippets(context, (snippets as Snippet[]) ?? []);
  const aiSuggestions = await getAISuggestions(context, settings ?? { apiKey: "", aiEnabled: false, triggerKey: "", maxSuggestions: 5 });

  // Snippet exact matches take priority over AI
  return [...snippetMatches, ...aiSuggestions].slice(0, settings?.maxSuggestions ?? 5);
}