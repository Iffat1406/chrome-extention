import React, { useState, useEffect, useRef } from "react";
import type { Snippet, TextPattern } from "../types";

interface QuickOpenProps {
  isOpen: boolean;
  onClose: () => void;
  snippets: Snippet[];
  patterns: TextPattern[];
  onSelectSnippet: (snippet: Snippet) => void;
  onCreateFromPattern: (pattern: TextPattern) => void;
}

/**
 * Quick-open modal (Cmd+K / Ctrl+Shift+P style)
 * Search and filter snippets + suggested patterns
 */
export function QuickOpen({
  isOpen,
  onClose,
  snippets,
  patterns,
  onSelectSnippet,
  onCreateFromPattern,
}: QuickOpenProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter snippets and patterns based on query
  const filtered = filterResults(query, snippets, patterns);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[selectedIndex];
      if (item) {
        if ("snippetId" in item) {
          // It's a snippet result
          const snippet = snippets.find((s) => s.id === item.snippetId);
          if (snippet) {
            onSelectSnippet(snippet);
            onClose();
          }
        } else if ("pattern" in item) {
          // It's a pattern result
          const pattern = patterns.find((p) => p.text === item.pattern);
          if (pattern) {
            onCreateFromPattern(pattern);
            onClose();
          }
        }
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-96">
        {/* Input */}
        <div className="border-b border-gray-200 p-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search snippets or create from patterns... (ESC to close)"
            defaultValue=""
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full outline-none text-sm font-mono"
          />
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              {query ? "No snippets or patterns found" : "Start typing to search"}
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const isPattern = "pattern" in item;

              return (
                <div
                  key={isPattern ? `pattern-${item.pattern}` : `snippet-${item.snippetId}`}
                  className={`px-4 py-2 cursor-pointer border-l-2 ${
                    isSelected
                      ? "bg-violet-50 border-l-violet-500"
                      : "border-l-transparent hover:bg-gray-50"
                  }`}
                  onClick={() => {
                    setSelectedIndex(idx);
                    setTimeout(() => {
                      const clicked = filtered[idx];
                      if (clicked) {
                        if ("snippetId" in clicked) {
                          const snippet = snippets.find((s) => s.id === clicked.snippetId);
                          if (snippet) {
                            onSelectSnippet(snippet);
                            onClose();
                          }
                        } else if ("pattern" in clicked) {
                          const pattern = patterns.find((p) => p.text === clicked.pattern);
                          if (pattern) {
                            onCreateFromPattern(pattern);
                            onClose();
                          }
                        }
                      }
                    }, 50);
                  }}
                >
                  {isPattern ? (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                          LEARN
                        </span>
                        <span className="text-sm text-gray-700 font-medium truncate">
                          {item.pattern}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Seen {item.count} times • Press Enter to create snippet
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded">
                          {item.shortcut}
                        </code>
                        <span className="text-sm text-gray-700 font-medium flex-1 truncate">
                          {item.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 truncate mt-0.5">{item.content}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-400 border-t border-gray-200 p-2 bg-gray-50 text-center">
          <span className="text-gray-500">↑↓</span>
          <span>·</span>
          <span className="text-gray-500">Enter</span>
          <span>·</span>
          <span className="text-gray-500">ESC</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Filter and rank results based on query
 */
function filterResults(
  query: string,
  snippets: Snippet[],
  patterns: TextPattern[]
): Array<
  | { snippetId: string; shortcut: string; label: string; content: string; score: number }
  | { pattern: string; count: number; score: number }
> {
  if (!query) {
    // Show top patterns when no query
    return patterns.slice(0, 5).map((p) => ({ pattern: p.text, count: p.count, score: 0 }));
  }

  const q = query.toLowerCase();
  const results: ReturnType<typeof filterResults> = [];

  // Search snippets
  snippets.forEach((s) => {
    let score = 0;

    // Shortcut match (highest priority)
    if (s.shortcut.toLowerCase().replace(/^\//, "").includes(q.replace(/^\//, ""))) {
      score = 1;
    }
    // Label match
    else if (s.label.toLowerCase().includes(q)) {
      score = 0.8;
    }
    // Content match
    else if (s.content.toLowerCase().includes(q)) {
      score = 0.5;
    }

    if (score > 0) {
      results.push({
        snippetId: s.id,
        shortcut: s.shortcut,
        label: s.label,
        content: s.content,
        score,
      });
    }
  });

  // Search patterns
  patterns.forEach((p) => {
    if (p.text.toLowerCase().includes(q)) {
      results.push({
        pattern: p.text,
        count: p.count,
        score: 0.7,
      });
    }
  });

  // Sort by score (descending)
  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}
