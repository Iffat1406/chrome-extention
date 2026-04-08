import type { AISuggestion, TextAnalysis } from "../types";

export async function callGeminiAPI(
  text: string,
  analysisMode: string,
  apiKey: string,
  context?: string,
  replyContext?: string
): Promise<{ suggestions: AISuggestion[]; analysis: TextAnalysis }> {
  const buildPrompt = (
    mode: string,
    userText: string,
    ctx?: string,
    replyCtx?: string
  ): string => {
    const contextInfo = `\nContext: "${ctx || "general writing"}"`;
    const replyContextInfo = replyCtx ? `\nReply to: "${replyCtx}"` : "";

    const prompts = {
      grammar: `You are a writing assistant helping the user improve their message.

User is writing a message.
Typed text: "${userText}"${contextInfo}${replyContextInfo}

Tasks:
1. Fix any grammar or spelling errors.
2. Improve clarity without changing the tone.
3. Suggest a better version if needed.
4. Keep the tone natural.

Provide only specific, actionable suggestions. Format as:
- [Issue Type]: Original text -> Better text
- Reason: Why this is better`,

      comprehensive: `You are an advanced writing coach helping the user improve their message.

User is writing a message.
Typed text: "${userText}"${contextInfo}${replyContextInfo}

Analyze for:
1. Grammar and spelling errors.
2. Clarity improvements.
3. Tone analysis.
4. Better word choices.
5. Message completeness.
6. Suggested complete reply if appropriate.

Suggestions should be specific and constructive. Format as:
- [Issue Type]: Original text -> Better text
- Reason: Explanation
- Confidence: High/Medium/Low`,

      completion: `You are a writing completion assistant.

User is writing a message.
Typed text: "${userText}"${contextInfo}${replyContextInfo}

Tasks:
1. Suggest next words or sentences to complete the thought.
2. Keep the tone consistent.
3. Provide 2-3 completion options.

Format as:
- Suggestion: Complete text
- Reasoning: Why this completion fits`,
    };

    return prompts[mode as keyof typeof prompts] || prompts.grammar;
  };

  const prompt = buildPrompt(analysisMode, text, context, replyContext);

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + apiKey,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800,
        },
      }),
    }
  );

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

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const formattedMatch = line.match(/^[-*]\s*\[([^\]]+)\]:\s*(.+?)\s*->\s*(.+?)$/);

    if (formattedMatch) {
      suggestionCount++;
      if (suggestionCount > 8) break;

      const [, issueType, original, suggestion] = formattedMatch;
      suggestions.push({
        id: `sugg-${suggestionCount}`,
        position: 0,
        length: 0,
        originalText: original.trim(),
        suggestion: suggestion.trim(),
        reason: normalizeSuggestionReason(issueType),
        confidence: 0.85,
        applied: false,
      });
      continue;
    }

    if (
      line.includes("should be") ||
      line.includes("instead of") ||
      line.includes("replace with") ||
      line.includes("->")
    ) {
      suggestionCount++;
      if (suggestionCount > 8) break;

      suggestions.push({
        id: `sugg-${suggestionCount}`,
        position: 0,
        length: 0,
        originalText: "text",
        suggestion: line,
        reason: line.toLowerCase().includes("grammar") ? "grammar" : "clarity",
        confidence: 0.75,
        applied: false,
      });
    }
  }

  return suggestions;
}

function normalizeSuggestionReason(issueType: string): AISuggestion["reason"] {
  const normalized = issueType.toLowerCase();

  if (normalized.includes("grammar")) return "grammar";
  if (normalized.includes("clarity")) return "clarity";
  if (normalized.includes("spelling")) return "spelling";
  if (normalized.includes("tone")) return "tone";
  if (normalized.includes("completion")) return "completion";

  return "clarity";
}

export function detectReplyContext(text: string): string | undefined {
  const replyPatterns = [
    /^(?:in response to|replying to|regarding|about|re:)\s+(.+?)$/im,
    /^(?:you|they|someone)\s+(?:said|mentioned|asked|wrote):\s*"?(.+?)"?$/im,
  ];

  for (const pattern of replyPatterns) {
    const match = text.match(pattern);
    if (match) {
      return sanitizeReplyContext(match[1]);
    }
  }

  return undefined;
}

export function sanitizeReplyContext(replyContext?: string): string | undefined {
  if (!replyContext) {
    return undefined;
  }

  const cleaned = replyContext.replace(/\s+/g, " ").trim();
  if (cleaned.length < 6) {
    return undefined;
  }

  return cleaned.slice(0, 280);
}

export function parseAnalysis(aiResponse: string): TextAnalysis {
  const lowered = aiResponse.toLowerCase();
  const hasGrammarErrors = /error|incorrect|wrong/.test(lowered);
  const hasSpellingIssues = /spell|typo/.test(lowered);
  const hasClarityIssues = /unclear|confus|improve clarity/.test(lowered);

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
