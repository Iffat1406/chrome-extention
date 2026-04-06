import { useMemo } from "react";
import type { WritingSession } from "../types";

interface DashboardProps {
  sessions: WritingSession[],
}

export default function Dashboard({ sessions }: DashboardProps) {
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const totalTextWritten = sessions.reduce((sum, s) => sum + s.content.length, 0);
    const totalSuggestionsMade = sessions.reduce((sum, s) => sum + s.suggestions.length, 0);
    const totalApplied = sessions.reduce((sum, s) => sum + s.appliedCount, 0);
    const acceptanceRate = totalSuggestionsMade > 0 ? ((totalApplied / totalSuggestionsMade) * 100).toFixed(1) : "0";

    return {
      totalSessions,
      totalTextWritten,
      totalSuggestionsMade,
      totalApplied,
      acceptanceRate,
    };
  }, [sessions]);

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-gray-900">Writing Assistant</h1>
          <p className="text-xs text-gray-500">AI-powered suggestions for better writing</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            label="Writing Sessions"
            value={stats.totalSessions}
            icon="📝"
          />
          <StatCard
            label="Suggestions Made"
            value={stats.totalSuggestionsMade}
            icon="💡"
          />
          <StatCard
            label="Suggestions Applied"
            value={stats.totalApplied}
            icon="✨"
          />
          <StatCard
            label="Applied Rate"
            value={`${stats.acceptanceRate}%`}
            icon="📊"
          />
        </div>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-gray-600 uppercase">Recent Sessions</h2>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {sessions.slice(-5).reverse().map((session) => (
                <div
                  key={session.id}
                  className="p-2 bg-gray-50 rounded-lg border border-gray-100 hover:border-violet-200 hover:bg-violet-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">{session.siteName}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(session.startTime).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-medium text-gray-900">{session.suggestions.length}</p>
                      <p className="text-gray-500">suggestions</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-3xl mb-2">✍️</div>
            <p className="text-sm font-medium text-gray-600">No writing sessions yet</p>
            <p className="text-xs text-gray-500 mt-1">
              Start typing and the assistant will analyze your text
            </p>
          </div>
        )}

        {/* Info */}
        <div className="p-3 bg-violet-50 border border-violet-200 rounded-lg space-y-1">
          <p className="text-xs font-medium text-violet-900">✨ How it works</p>
          <p className="text-xs text-violet-700">
            The extension analyzes your writing in real-time, suggesting grammar fixes, clarity improvements, and better wording as you type.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg border border-violet-200">
      <div className="text-lg mb-1">{icon}</div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-lg font-bold text-violet-700">{value}</p>
    </div>
  );
}
