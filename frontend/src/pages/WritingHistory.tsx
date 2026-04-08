import { useState } from "react";
import type { WritingSession, AISuggestion } from "../types";

interface WritingHistoryProps {
  sessions: WritingSession[];
}

export default function WritingHistory({ sessions }: WritingHistoryProps) {
  const [selectedSession, setSelectedSession] = useState<WritingSession | null>(null);

  if (selectedSession) {
    return <SessionDetail session={selectedSession} onBack={() => setSelectedSession(null)} />;
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 space-y-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Writing History</h1>
          <p className="text-xs text-gray-500">{sessions.length} sessions recorded</p>
        </div>

        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-3xl mb-2">📚</div>
            <p className="text-sm font-medium text-gray-600">No writing sessions</p>
            <p className="text-xs text-gray-500 mt-1">Your writing history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {sessions
              .slice()
              .reverse()
              .map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className="w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{session.siteName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(session.startTime).toLocaleString()}
                      </p>
                      {session.replyContext && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          Replying to: {session.replyContext}
                        </p>
                      )}
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">{session.content}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-violet-600">
                        {session.suggestions.length} suggestions
                      </div>
                      <div className="text-xs text-gray-500">
                        {session.appliedCount} applied
                      </div>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionDetail({
  session,
  onBack,
}: {
  session: WritingSession;
  onBack: () => void;
}) {
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <div className="flex-1 overflow-auto">
      <SessionDetailContent session={session} onBack={onBack} now={now} />
    </div>
  );
}

function SessionDetailContent({
  session,
  onBack,
  now,
}: {
  session: WritingSession;
  onBack: () => void;
  now: number;
}) {
  const duration = ((session.endTime ?? now) - session.startTime) / 1000;
  const durationStr =
    duration < 60 ? `${Math.round(duration)}s` : `${Math.round(duration / 60)}m`;

  return (
    <div className="flex-1 overflow-auto">
      <div className="sticky top-0 flex items-center gap-2 p-4 bg-white border-b border-gray-100">
        <button
          onClick={onBack}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 001.06 1.06L4.81 7.25h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z"/>
          </svg>
        </button>
        <div>
          <h2 className="font-medium text-gray-900">{session.siteName}</h2>
          <p className="text-xs text-gray-500">{durationStr}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Analysis */}
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Analysis</h3>
          <div className="space-y-2">
            <AnalysisRow
              label="Grammar"
              value={session.textAnalysis.grammarScore}
              max={100}
            />
            <AnalysisRow
              label="Clarity"
              value={session.textAnalysis.clarityScore}
              max={100}
            />
            <div className="text-xs">
              <p className="text-gray-600">Tone: <span className="font-medium text-gray-900">{session.textAnalysis.toneAnalysis}</span></p>
            </div>
          </div>
        </div>

        {/* Suggestions */}
        {session.suggestions.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-600 uppercase">Suggestions</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {session.suggestions.map((suggestion) => (
                <SuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 text-center bg-violet-50 rounded-lg">
            <p className="text-xs text-gray-600">No suggestions made for this session</p>
          </div>
        )}

        {/* Full Text */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-600 uppercase">Text Written</h3>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-700 leading-relaxed max-h-32 overflow-y-auto">
              {session.content}
            </p>
          </div>
        </div>

        {session.replyContext && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-600 uppercase">Reply Context</h3>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-700 leading-relaxed max-h-24 overflow-y-auto">
                {session.replyContext}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalysisRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const percentage = (value / max) * 100;
  const color =
    percentage >= 80 ? "bg-green-500" : percentage >= 60 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value}%</span>
      </div>
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SuggestionItem({ suggestion }: { suggestion: AISuggestion }) {
  const reasonLabels: Record<string, string> = {
    grammar: "Grammar",
    spelling: "Spelling",
    clarity: "Clarity",
    tone: "Tone",
    completion: "Completion",
  };

  return (
    <div
      className={`p-2 rounded-lg border text-xs ${
        suggestion.applied
          ? "bg-green-50 border-green-200"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className="font-medium text-gray-900">"{suggestion.originalText}"</span>
        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 whitespace-nowrap">
          {reasonLabels[suggestion.reason]}
        </span>
      </div>
      <p className="text-gray-700">→ "{suggestion.suggestion}"</p>
      {suggestion.applied && (
        <p className="text-green-600 mt-1">✓ Applied</p>
      )}
    </div>
  );
}
