import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHistory } from "../hooks/useHistory";

export default function History() {
  const navigate = useNavigate();
  const { history, loading, clearHistory, removeEntry, stats } = useHistory();
  const [filter, setFilter] = useState<"all" | "ai" | "snippet">("all");

  const filtered = history.filter(
    (e) => filter === "all" || e.source === filter
  );

  function formatTime(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 60_000) return "just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return new Date(ts).toLocaleDateString();
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-100">
        <button
          onClick={() => navigate("/")}
          className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z"/>
          </svg>
        </button>
        <h1 className="text-sm font-semibold text-gray-800">History</h1>
        {history.length > 0 && (
          <button
            onClick={() => confirm("Clear all history?") && clearHistory()}
            className="ml-auto text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Stats strip */}
      {stats.total > 0 && (
        <div className="flex gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100">
          <Stat label="Total" value={stats.total} />
          <Stat label="Snippets" value={stats.snippetCount} color="text-green-600" />
          <Stat label="AI" value={stats.aiCount} color="text-violet-600" />
        </div>
      )}

      {/* Top shortcuts */}
      {stats.topShortcuts.length > 0 && (
        <div className="px-4 py-2 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-1.5">Most used</p>
          <div className="flex flex-wrap gap-1.5">
            {stats.topShortcuts.map(({ shortcut, count }) => (
              <span
                key={shortcut}
                className="text-xs font-mono text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full"
              >
                {shortcut} <span className="text-violet-400">×{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex px-4 py-2 gap-2 border-b border-gray-100">
        {(["all", "snippet", "ai"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-2.5 py-1 rounded-full transition-colors capitalize ${
              filter === f
                ? "bg-violet-100 text-violet-700 font-medium"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {loading && (
          <p className="text-xs text-gray-400 text-center pt-6">Loading…</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center pt-8">
            No expansions recorded yet.
          </p>
        )}
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className="group flex items-start gap-2 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono font-semibold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded">
                  {entry.shortcut}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                    entry.source === "ai"
                      ? "bg-purple-50 text-purple-600"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  {entry.source}
                </span>
                <span className="text-xs text-gray-300 ml-auto">
                  {formatTime(entry.usedAt)}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">{entry.expanded}</p>
              <p className="text-xs text-gray-300 truncate mt-0.5">{entry.site}</p>
            </div>
            <button
              onClick={() => removeEntry(entry.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-400 rounded transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color = "text-gray-700" }: {
  label: string; value: number; color?: string;
}) {
  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
      <span className="text-xs text-gray-400">{label}</span>
    </div>
  );
}