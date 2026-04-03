import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnippets } from "../hooks/useSnippet";

export default function AddSnippet() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addSnippet, updateSnippet, getSnippet } = useSnippets();
  const isEditing = Boolean(id);

  const [label, setLabel] = useState("");
  const [shortcut, setShortcut] = useState("/");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (id) {
      const snippet = getSnippet(id);
      if (snippet) {
        setLabel(snippet.label);
        setShortcut(snippet.shortcut);
        setContent(snippet.content);
      }
    }
  }, [id, getSnippet]);

  function validate(): boolean {
    if (!label.trim()) { setError("Label is required."); return false; }
    if (!shortcut.trim() || shortcut === "/") { setError("Shortcut is required."); return false; }
    if (!shortcut.startsWith("/")) { setError("Shortcut must start with /."); return false; }
    if (!/^\/\w+$/.test(shortcut.trim())) { setError("Shortcut can only contain letters, numbers, and underscores."); return false; }
    if (!content.trim()) { setError("Content is required."); return false; }
    setError("");
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEditing && id) {
        await updateSnippet(id, { label: label.trim(), shortcut: shortcut.trim(), content: content.trim() });
      } else {
        await addSnippet({
          label: label.trim(),
          shortcut: shortcut.trim(),
          content: content.trim(),
          tags: [],
          usageCount: 0,
          lastUsed: null,
          updatedAt: Date.now(),
        });
      }
      navigate("/");
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
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
        <h1 className="text-sm font-semibold text-gray-800">
          {isEditing ? "Edit Snippet" : "New Snippet"}
        </h1>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Label */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Label
          </label>
          <input
            type="text"
            placeholder="e.g. My address"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent placeholder-gray-400"
          />
        </div>

        {/* Shortcut */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Shortcut
          </label>
          <input
            type="text"
            placeholder="/addr"
            value={shortcut}
            onChange={(e) => {
              const val = e.target.value;
              setShortcut(val.startsWith("/") ? val : `/${val}`);
            }}
            className="w-full px-3 py-2 text-xs font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent placeholder-gray-400"
          />
          <p className="mt-1 text-xs text-gray-400">
            Type this shortcut followed by a space to expand.
          </p>
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Expanded text
          </label>
          <textarea
            rows={5}
            placeholder="The text that will be inserted when triggered..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent placeholder-gray-400 resize-none"
          />
          <p className="mt-1 text-xs text-gray-400">
            {content.length} characters
          </p>
        </div>

        {/* Preview */}
        {shortcut.length > 1 && content.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-400 mb-1">Preview</p>
            <p className="text-xs text-gray-500">
              Typing{" "}
              <span className="font-mono font-semibold text-violet-700 bg-violet-100 px-1 rounded">
                {shortcut}
              </span>{" "}
              → <span className="text-gray-700">{content.slice(0, 60)}{content.length > 60 ? "…" : ""}</span>
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
        <button
          onClick={() => navigate("/")}
          className="flex-1 py-2 text-xs font-medium text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 text-xs font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : isEditing ? "Update" : "Save Snippet"}
        </button>
      </div>
    </div>
  );
}