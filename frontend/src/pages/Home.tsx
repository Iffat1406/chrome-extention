import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnippets } from "../hooks/useSnippet";
import type { Snippet } from "../types";

export default function Home() {
  const navigate = useNavigate();
  const { snippets, loading, deleteSnippet } = useSnippets();
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = snippets.filter(
    (s) =>
      s.label.toLowerCase().includes(search.toLowerCase()) ||
      s.shortcut.toLowerCase().includes(search.toLowerCase()) ||
      s.content.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteSnippet(id);
    setDeletingId(null);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
        <h1 className="text-sm font-semibold text-gray-800">My Snippets</h1>
        <button
          onClick={() => navigate("/add")}
          className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors"
        >
          <span className="text-base leading-none">+</span> New
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <input
          type="text"
          placeholder="Search snippets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent placeholder-gray-400"
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {loading && (
          <p className="text-xs text-gray-400 text-center pt-6">Loading...</p>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center pt-8">
            <p className="text-xs text-gray-400">
              {search ? "No snippets match your search." : "No snippets yet."}
            </p>
            {!search && (
              <button
                onClick={() => navigate("/add")}
                className="mt-2 text-xs text-violet-600 hover:underline"
              >
                Create your first snippet
              </button>
            )}
          </div>
        )}

        {filtered.map((snippet) => (
          <SnippetCard
            key={snippet.id}
            snippet={snippet}
            isDeleting={deletingId === snippet.id}
            onEdit={() => navigate(`/edit/${snippet.id}`)}
            onDelete={() => handleDelete(snippet.id)}
          />
        ))}
      </div>
    </div>
  );
}

function SnippetCard({
  snippet,
  isDeleting,
  onEdit,
  onDelete,
}: {
  snippet: Snippet;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-violet-200 hover:bg-violet-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-mono font-semibold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded">
            {snippet.shortcut}
          </span>
          <span className="text-xs font-medium text-gray-700 truncate">
            {snippet.label}
          </span>
        </div>
        <p className="text-xs text-gray-400 truncate">{snippet.content}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1 text-gray-400 hover:text-violet-600 rounded transition-colors"
          title="Edit"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zm1.414 1.06a.25.25 0 00-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 000-.354l-1.086-1.086zM11.189 6.25L9.75 4.81l-6.286 6.287a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.25.25 0 00.108-.064L11.19 6.25z"/>
          </svg>
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors disabled:opacity-40"
          title="Delete"
        >
          <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.5 1.75a.25.25 0 01.25-.25h2.5a.25.25 0 01.25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 010 1.5H2.75a.75.75 0 010-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 00.249.225h5.19a.25.25 0 00.249-.225l.66-6.6a.75.75 0 111.492.149l-.66 6.6A1.748 1.748 0 0110.595 15h-5.19a1.75 1.75 0 01-1.741-1.575l-.66-6.6a.75.75 0 111.492-.15z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}