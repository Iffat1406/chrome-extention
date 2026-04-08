import { useState } from "react";
import type { AISuggestion, WritingSession } from "../types";

interface WritingHistoryProps {
  sessions: WritingSession[];
}

export default function WritingHistoryView({ sessions }: WritingHistoryProps) {
  const [selectedSession, setSelectedSession] = useState<WritingSession | null>(null);

  if (selectedSession) {
    return <SessionDetail session={selectedSession} onBack={() => setSelectedSession(null)} />;
  }

  const orderedSessions = sessions.slice().reverse();

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-4 p-4">
        <section className="rounded-[24px] border border-white/60 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            History
          </p>
          <h1 className="mt-1 text-lg font-semibold text-slate-900">Writing timeline</h1>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Review how the assistant responded across your recent drafts and replies.
          </p>
        </section>

        {orderedSessions.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-200 bg-white/70 px-5 py-10 text-center">
            <p className="text-sm font-medium text-slate-700">No writing sessions yet</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Your activity will appear here as soon as the extension captures a draft.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orderedSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className="w-full rounded-[24px] border border-slate-200/80 bg-white/85 p-4 text-left shadow-[0_14px_34px_rgba(15,23,42,0.06)] transition hover:border-teal-200 hover:bg-teal-50/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{session.siteName}</p>
                      {session.context && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
                          {session.context}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {new Date(session.startTime).toLocaleString()}
                    </p>
                    {session.replyContext && (
                      <p className="mt-2 line-clamp-1 text-[11px] text-teal-700">
                        Replying to: {session.replyContext}
                      </p>
                    )}
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                      {session.content || "No text captured for this draft."}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-900">{session.suggestions.length}</p>
                    <p className="text-[11px] text-slate-500">suggestions</p>
                    <p className="mt-2 text-[11px] text-slate-500">{session.appliedCount} applied</p>
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
  const now = Date.now();
  const duration = ((session.endTime ?? now) - session.startTime) / 1000;
  const durationStr =
    duration < 60 ? `${Math.round(duration)}s active` : `${Math.round(duration / 60)}m active`;

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_8px_20px_rgba(15,23,42,0.08)] transition hover:border-slate-300 hover:text-slate-900"
            title="Back"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 001.06 1.06L4.81 7.25h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z" />
            </svg>
          </button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Session detail
            </p>
            <h2 className="text-sm font-semibold text-slate-900">{session.siteName}</h2>
            <p className="text-[11px] text-slate-500">{durationStr}</p>
          </div>
        </div>

        <section className="rounded-[24px] border border-slate-200/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Analysis
          </h3>
          <div className="mt-3 space-y-3">
            <AnalysisRow label="Grammar" value={session.textAnalysis.grammarScore} />
            <AnalysisRow label="Clarity" value={session.textAnalysis.clarityScore} />
            <div className="rounded-2xl bg-slate-50 px-3 py-3 text-xs text-slate-600">
              Tone:
              <span className="ml-1 font-medium text-slate-900">{session.textAnalysis.toneAnalysis}</span>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Suggestions
          </h3>
          <div className="mt-3 space-y-2">
            {session.suggestions.length > 0 ? (
              session.suggestions.map((suggestion) => (
                <SuggestionItem key={suggestion.id} suggestion={suggestion} />
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                No suggestions were generated for this session.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Draft text
          </h3>
          <div className="mt-3 rounded-2xl bg-slate-50 px-3 py-3 text-xs leading-6 text-slate-700">
            {session.content || "No text captured for this draft."}
          </div>
        </section>

        {session.replyContext && (
          <section className="rounded-[24px] border border-teal-100 bg-teal-50/70 p-4 shadow-[0_16px_35px_rgba(22,124,128,0.08)]">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700/80">
              Reply context
            </h3>
            <div className="mt-3 rounded-2xl bg-white/80 px-3 py-3 text-xs leading-6 text-slate-700">
              {session.replyContext}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function AnalysisRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-3">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#167c80_0%,#7ec7c0_100%)]"
          style={{ width: `${value}%` }}
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
      className={`rounded-2xl border px-3 py-3 text-xs ${
        suggestion.applied
          ? "border-emerald-200 bg-emerald-50/80"
          : "border-slate-200 bg-slate-50/80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-slate-500">Original</p>
          <p className="mt-1 font-medium text-slate-900">"{suggestion.originalText}"</p>
        </div>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500">
          {reasonLabels[suggestion.reason]}
        </span>
      </div>
      <div className="mt-3 rounded-xl bg-white/85 px-3 py-2 text-slate-700">
        {suggestion.suggestion}
      </div>
      {suggestion.applied && (
        <p className="mt-2 text-[11px] font-medium text-emerald-700">Applied</p>
      )}
    </div>
  );
}
