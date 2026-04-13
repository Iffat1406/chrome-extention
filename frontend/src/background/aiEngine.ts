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

Return JSON only (no markdown, no prose), with this schema:
{
  "suggestions": [
    {
      "originalText": "string",
      "suggestion": "string",
      "reason": "grammar|spelling|clarity|tone|completion",
      "confidence": 0.0
    }
  ],
  "analysis": {
    "grammarScore": 0,
    "spellingErrors": 0,
    "clarityScore": 0,
    "toneAnalysis": "string",
    "suggestedImprovements": ["string"],
    "readingLevel": "basic|intermediate|advanced"
  }
}`,

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

Return JSON only (no markdown, no prose), with this schema:
{
  "suggestions": [
    {
      "originalText": "string",
      "suggestion": "string",
      "reason": "grammar|spelling|clarity|tone|completion",
      "confidence": 0.0
    }
  ],
  "analysis": {
    "grammarScore": 0,
    "spellingErrors": 0,
    "clarityScore": 0,
    "toneAnalysis": "string",
    "suggestedImprovements": ["string"],
    "readingLevel": "basic|intermediate|advanced"
  }
}`,

      completion: `You are a writing completion assistant.

User is writing a message.
Typed text: "${userText}"${contextInfo}${replyContextInfo}

Tasks:
1. Suggest next words or sentences to complete the thought.
2. Keep the tone consistent.
3. Provide 2-3 completion options.

Return JSON only (no markdown, no prose), with this schema:
{
  "suggestions": [
    {
      "originalText": "string",
      "suggestion": "string",
      "reason": "completion",
      "confidence": 0.0
    }
  ],
  "analysis": {
    "grammarScore": 0,
    "spellingErrors": 0,
    "clarityScore": 0,
    "toneAnalysis": "string",
    "suggestedImprovements": ["string"],
    "readingLevel": "basic|intermediate|advanced"
  }
}`,
    };

    return prompts[mode as keyof typeof prompts] || prompts.grammar;
  };

  const prompt = buildPrompt(analysisMode, text, context, replyContext);

  const body = JSON.stringify({
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
      temperature: 0.4,
      maxOutputTokens: 800,
      responseMimeType: "application/json",
    },
  });

  const modelCandidates = [
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
  ];

  let lastError: string | null = null;

  for (const modelName of modelCandidates) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      }
    );

    if (!response.ok) {
      lastError = `${modelName}: ${response.status} ${response.statusText}`;
      continue;
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const parsed = parseStructuredGeminiResponse(responseText, text);

    if (parsed.suggestions.length > 0) {
      return parsed;
    }

    return {
      suggestions: parseSuggestions(responseText, text),
      analysis: parseAnalysis(responseText),
    };
  }

  throw new Error(lastError ?? "Gemini API request failed");
}

export function parseSuggestions(aiResponse: string, sourceText = ""): AISuggestion[] {
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
        position: findSuggestionPosition(sourceText, original.trim()),
        length: original.trim().length,
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

type StructuredResponse = {
  suggestions?: Array<{
    originalText?: string;
    suggestion?: string;
    reason?: AISuggestion["reason"];
    confidence?: number;
  }>;
  analysis?: Partial<TextAnalysis>;
};

function parseStructuredGeminiResponse(
  responseText: string,
  sourceText: string
): { suggestions: AISuggestion[]; analysis: TextAnalysis } {
  const parsed = safeJsonParse(extractJsonBlock(responseText)) as StructuredResponse | null;
  if (!parsed) {
    return {
      suggestions: [],
      analysis: getDefaultAnalysis(),
    };
  }

  const suggestions = (parsed.suggestions ?? [])
    .filter((item) => item.originalText && item.suggestion)
    .slice(0, 8)
    .map((item, index) => {
      const original = (item.originalText ?? "").trim();
      const replacement = (item.suggestion ?? "").trim();
      return {
        id: `sugg-${index + 1}`,
        position: findSuggestionPosition(sourceText, original),
        length: original.length,
        originalText: original,
        suggestion: replacement,
        reason: normalizeSuggestionReason(item.reason ?? "clarity"),
        confidence: clampConfidence(item.confidence ?? 0.82),
        applied: false,
      } satisfies AISuggestion;
    });

  const fallbackAnalysis = parseAnalysis(responseText);
  const incomingAnalysis = parsed.analysis ?? {};

  const analysis: TextAnalysis = {
    grammarScore: coercePercent(incomingAnalysis.grammarScore, fallbackAnalysis.grammarScore),
    spellingErrors: coerceWhole(incomingAnalysis.spellingErrors, fallbackAnalysis.spellingErrors),
    clarityScore: coercePercent(incomingAnalysis.clarityScore, fallbackAnalysis.clarityScore),
    toneAnalysis: incomingAnalysis.toneAnalysis ?? fallbackAnalysis.toneAnalysis,
    suggestedImprovements:
      Array.isArray(incomingAnalysis.suggestedImprovements) &&
      incomingAnalysis.suggestedImprovements.length > 0
        ? incomingAnalysis.suggestedImprovements.slice(0, 3)
        : fallbackAnalysis.suggestedImprovements,
    readingLevel: incomingAnalysis.readingLevel ?? fallbackAnalysis.readingLevel,
  };

  return { suggestions, analysis };
}

function safeJsonParse(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function extractJsonBlock(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  return trimmed;
}

function coercePercent(value: unknown, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function coerceWhole(value: unknown, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.round(value));
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0.8;
  return Math.max(0.1, Math.min(1, value));
}

function findSuggestionPosition(text: string, original: string): number {
  if (!text || !original) return 0;
  const index = text.toLowerCase().indexOf(original.toLowerCase());
  return index >= 0 ? index : 0;
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

export function getLocalFallbackResult(
  text: string,
  analysisMode: string,
  replyContext?: string
): { suggestions: AISuggestion[]; analysis: TextAnalysis } {
  const suggestions: AISuggestion[] = [];
  const normalized = text.replace(/\s+/g, " ").trim();
  let suggestionId = 1;

  const addSuggestion = (
    originalText: string,
    suggestion: string,
    reason: AISuggestion["reason"],
    confidence: number
  ) => {
    if (!originalText || !suggestion || suggestions.length >= 8) return;
    suggestions.push({
      id: `local-${suggestionId++}`,
      position: findSuggestionPosition(text, originalText),
      length: originalText.length,
      originalText,
      suggestion,
      reason,
      confidence,
      applied: false,
    });
  };

  const replacements: Array<[RegExp, string, AISuggestion["reason"], number]> = [
    [/\bdont\b/gi, "don't", "grammar", 0.9],
    [/\bcant\b/gi, "can't", "grammar", 0.9],
    [/\bdidnt\b/gi, "didn't", "grammar", 0.9],
    [/\bwont\b/gi, "won't", "grammar", 0.9],
    [/\bim\b/gi, "I'm", "grammar", 0.85],
    [/\bi\b/g, "I", "grammar", 0.7],
    [/\bteh\b/gi, "the", "spelling", 0.92],
    [/\brecieve\b/gi, "receive", "spelling", 0.92],
    [/\bdefinately\b/gi, "definitely", "spelling", 0.92],
  ];

  for (const [pattern, replacement, reason, confidence] of replacements) {
    const match = normalized.match(pattern);
    if (match?.[0]) {
      addSuggestion(match[0], replacement, reason, confidence);
    }
    if (suggestions.length >= 8) break;
  }

  if (/\s{2,}/.test(text)) {
    addSuggestion("extra spaces", "Use single spaces between words.", "clarity", 0.8);
  }

  if (normalized.length > 25 && !/[.!?]$/.test(normalized)) {
    addSuggestion(normalized.slice(Math.max(0, normalized.length - 20)), `${normalized}.`, "clarity", 0.76);
  }

  if (analysisMode === "completion" && normalized.length >= 8) {
    addSuggestion(
      normalized,
      `${normalized}${/[.!?]$/.test(normalized) ? "" : "."} Let me know your thoughts.`,
      "completion",
      0.7
    );
  }

  if (replyContext && normalized.length > 0 && normalized.length < 18) {
    addSuggestion(
      normalized,
      `${normalized} Thanks for sharing this.`,
      "tone",
      0.68
    );
  }

  const spellingErrors = suggestions.filter((s) => s.reason === "spelling").length;
  const grammarIssues = suggestions.filter((s) => s.reason === "grammar").length;
  const clarityIssues = suggestions.filter((s) => s.reason === "clarity").length;

  const analysis: TextAnalysis = {
    grammarScore: Math.max(45, 90 - grammarIssues * 12),
    spellingErrors,
    clarityScore: Math.max(50, 88 - clarityIssues * 10),
    toneAnalysis: replyContext ? "conversational" : "neutral",
    suggestedImprovements: suggestions.map((s) => s.suggestion).slice(0, 3),
    readingLevel: "intermediate",
  };

  return { suggestions, analysis };
}
