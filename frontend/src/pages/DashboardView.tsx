import { useMemo } from "react";
import type { WritingSession } from "../types";

interface DashboardProps {
  sessions: WritingSession[];
}

export default function DashboardView({ sessions }: DashboardProps) {
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalTextWritten = sessions.reduce((sum, session) => sum + session.content.length, 0);
    const totalSuggestionsMade = sessions.reduce(
      (sum, session) => sum + session.suggestions.length,
      0
    );
    const totalApplied = sessions.reduce((sum, session) => sum + session.appliedCount, 0);
    const acceptanceRate =
      totalSuggestionsMade > 0
        ? ((totalApplied / totalSuggestionsMade) * 100).toFixed(1)
        : "0";

    return {
      totalSessions,
      totalTextWritten,
      totalSuggestionsMade,
      totalApplied,
      acceptanceRate,
    };
  }, [sessions]);

  const recentSessions = sessions.slice(-4).reverse();

  return (
    <div className="flex-1 overflow-auto">
      <div className="space-y-4 p-4">
        <section className="relative overflow-hidden rounded-[26px] border border-white/60 bg-slate-900 px-5 py-5 text-white shadow-[0_20px_50px_rgba(15,23,42,0.22)]">
          <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-teal-400/20 blur-2xl" />
          <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-amber-200/20 blur-2xl" />
          <div className="relative space-y-3">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-200">
              Writing cockpit
            </div>
            <div className="space-y-1">
              <h1 className="text-[22px] font-semibold leading-tight">
                Write with more clarity, less friction.
              </h1>
              <p className="max-w-[280px] text-xs leading-5 text-slate-300">
                Track every draft, review AI feedback, and keep your writing sessions in one calm
                place.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              <MiniMetric label="Sessions" value={stats.totalSessions} />
              <MiniMetric label="Suggestions" value={stats.totalSuggestionsMade} />
              <MiniMetric label="Applied" value={`${stats.acceptanceRate}%`} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <StatCard
            label="Characters tracked"
            value={stats.totalTextWritten.toLocaleString()}
            hint="Across all saved drafts"
            tone="teal"
          />
          <StatCard
            label="Suggestions accepted"
            value={stats.totalApplied}
            hint="Applied improvements"
            tone="amber"
          />
        </section>

        <section className="rounded-[24px] border border-slate-200/70 bg-white/85 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Recent activity
              </p>
              <h2 className="mt-1 text-sm font-semibold text-slate-900">Latest writing sessions</h2>
            </div>
            <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {sessions.length} total
            </div>
          </div>

          {recentSessions.length > 0 ? (
            <div className="space-y-2">
              {recentSessions.map((session) => (
                <article
                  key={session.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 transition-colors hover:border-teal-200 hover:bg-teal-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{session.siteName}</p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {new Date(session.startTime).toLocaleString()}
                      </p>
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-600">
                        {session.content || "Draft started but no text captured yet."}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {session.suggestions.length}
                      </p>
                      <p className="text-[11px] text-slate-500">suggestions</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-700">No writing sessions yet</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Open a chat, email, or comment box and start typing to populate your dashboard.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-teal-100 bg-[linear-gradient(135deg,rgba(215,240,239,0.85)_0%,rgba(255,255,255,0.9)_100%)] p-4 shadow-[0_16px_35px_rgba(22,124,128,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-700/80">
            Workflow
          </p>
          <h2 className="mt-1 text-sm font-semibold text-slate-900">How the assistant helps</h2>
          <div className="mt-3 grid gap-2">
            <WorkflowRow text="Captures your draft while you type across supported sites." />
            <WorkflowRow text="Scores grammar and clarity, then suggests tighter wording." />
            <WorkflowRow text="Keeps a searchable trail of your recent writing sessions." />
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur">
      <p className="text-[11px] text-slate-300">{label}</p>
      <p className="mt-1 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string | number;
  hint: string;
  tone: "teal" | "amber";
}) {
  const toneClasses =
    tone === "teal"
      ? "border-teal-100 bg-teal-50/80"
      : "border-amber-100 bg-amber-50/90";

  return (
    <div className={`rounded-[22px] border p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] ${toneClasses}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

function WorkflowRow({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/70 px-3 py-3">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
        ✓
      </span>
      <p className="text-xs leading-5 text-slate-700">{text}</p>
    </div>
  );
}
