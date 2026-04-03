export async function getGeminiSuggestions(
  prefix: string,
  context: string,
  apiKey: string
): Promise<{ text: string; confidence: number; source: "ai" }[]> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a smart text expander. The user is typing in a ${context} context.
Given their partial text, suggest up to 3 short, practical completions they might want to insert.
Reply ONLY with a JSON array, no markdown, no explanation:
[{"text": "full completion text", "confidence": 0.9}, ...]

Partial text: "${prefix}"`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.3,
          },
        }),
      }
    );

    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return parsed.map((item: { text: string; confidence: number }) => ({
      text: item.text,
      confidence: Math.min(0.8, item.confidence ?? 0.7), // cap below history matches
      source: "ai" as const,
    }));
  } catch (err) {
    console.error("[Gemini] Error:", err);
    return [];
  }
}