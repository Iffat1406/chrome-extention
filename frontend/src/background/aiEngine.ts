import type { AISuggestion, TextAnalysis } from "../types";

export async function callGeminiAPI(
  text: string,
  analysisMode: string,
  apiKey: string
): Promise<{ suggestions: AISuggestion[]; analysis: TextAnalysis }> {
  const prompts = {
    grammar: "Check grammar and spelling. Provide corrections.",
    comprehensive: `Analyze the text for:
1. Grammar and spelling errors
2. Clarity improvements
3. Tone assessment
4. Reading level

Provide specific suggestions for each.`,
    completion: "Suggest next words/sentences to complete the user's thought.",
  };

  const prompt = prompts[analysisMode as keyof typeof prompts] || prompts.grammar;

  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `${prompt}\n\nText to analyze: "${text}"`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  return {
    suggestions: parseSuggestions(responseText),
    analysis: parseAnalysis(responseText),
  };
}

export function parseSuggestions(aiResponse: string): AISuggestion[] {
  const suggestions: AISuggestion[] = [];
  const lines = aiResponse.split("\n");

  let suggestionCount = 0;
  for (const line of lines) {
    if (
      line.includes("should be") ||
      line.includes("instead of") ||
      line.includes("replace")
    ) {
      suggestionCount++;
      if (suggestionCount > 5) break;

      suggestions.push({
        id: `sugg-${suggestionCount}`,
        position: 0,
        length: 0,
        originalText: "text",
        suggestion: line.trim(),
        reason: "grammar",
        confidence: 0.8,
        applied: false,
      });
    }
  }

  return suggestions;
}

export function parseAnalysis(aiResponse: string): TextAnalysis {
  const hasGrammarErrors = /error|incorrect|wrong/.test(aiResponse.toLowerCase());
  const hasSpellingIssues = /spell|typo/.test(aiResponse.toLowerCase());
  const hasClarityIssues = /unclear|confus|improve clarity/.test(aiResponse.toLowerCase());

  return {
    grammarScore: hasGrammarErrors ? 50 : 85,
    spellingErrors: hasSpellingIssues ? 1 : 0,
    clarityScore: hasClarityIssues ? 60 : 80,
    toneAnalysis: "formal",
    suggestedImprovements: aiResponse.split("\n").slice(0, 3),
    readingLevel: "intermediate",
  };
}

export function getDefaultAnalysis(): TextAnalysis {
  return {
    grammarScore: 75,
    spellingErrors: 0,
    clarityScore: 75,
    toneAnalysis: "neutral",
    suggestedImprovements: [],
    readingLevel: "intermediate",
  };
}
