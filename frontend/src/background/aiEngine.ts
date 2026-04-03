import type { Suggestion } from "../types";

export async function getAISuggestions(
  prefix: string,
  context: string,
  apiKey: string
): Promise<Suggestion[]> {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system: `You are an autocomplete engine. Given the user's partial text, 
suggest up to 3 natural completions. Context: ${context}.
Reply ONLY with a JSON array, no markdown:
[{"full": "complete phrase", "score": 0.9}, ...]`,
        messages: [{ role: "user", content: `Complete this: "${prefix}"` }],
      }),
    });

    const data = await res.json();
    const raw = JSON.parse(data.content[0].text);

    return raw.map((item: { full: string; score: number }) => ({
      text: item.full.startsWith(prefix) ? item.full.slice(prefix.length) : item.full,
      full: item.full,
      score: item.score * 0.8, // slightly lower than history matches
      source: "ai" as const,
    }));
  } catch {
    return [];
  }
}