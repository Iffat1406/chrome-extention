import { MemoryRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "../pages/DashboardView";
import Settings from "../pages/SettingsView";
import WritingHistory from "../pages/WritingHistoryView";
import type { WritingSession } from "../types";

export default function Popup() {
  const [sessions, setSessions] = useState<WritingSession[]>([]);

  // Load writing history and listen for changes
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const { sessions: raw } = await chrome.storage.local.get("sessions");
        const sessionList = (raw as WritingSession[] | undefined) ?? [];
        console.log("[Popup] 📊 Loaded sessions:", sessionList.length, "sessions found");
        setSessions(sessionList);
      } catch (err) {
        console.error("[Popup] ❌ Failed to load sessions:", err);
      }
    };

    // Load sessions on mount
    console.log("[Popup] 🚀 Popup component mounted, loading sessions...");
    loadSessions();

    // Listen for storage changes from content script
    const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.sessions) {
        console.log("[Popup] 🔄 Storage changed! New sessions:", changes.sessions.newValue);
        setSessions((changes.sessions.newValue as WritingSession[]) ?? []);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Also poll for changes every 2 seconds to ensure we always have fresh data
    const pollInterval = setInterval(() => {
      console.log("[Popup] 🔄 Polling for updates...");
      loadSessions();
    }, 2000);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <MemoryRouter initialEntries={["/"]}>
      <div className="relative h-[640px] w-[560px] overflow-hidden rounded-[28px] border border-white/50 bg-white/60 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <div className="flex h-full flex-col bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(247,250,252,0.92)_100%)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(22,124,128,0.16),transparent_65%)]" />
        <Routes>
          <Route path="/" element={<Dashboard sessions={sessions} />} />
          <Route path="/history" element={<WritingHistory sessions={sessions} />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomNav />
        </div>
      </div>
    </MemoryRouter>
  );
}

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    {
      path: "/",
      label: "Dashboard",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 2.75A.75.75 0 012.75 2h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 2.75zm0 5A.75.75 0 012.75 7h10.5a.75.75 0 010 1.5H2.75A.75.75 0 012 7.75zM2.75 12a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-4.5z"/>
        </svg>
      ),
    },
    {
      path: "/history",
      label: "History",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z"/>
        </svg>
      ),
    },
    {
      path: "/settings",
      label: "Settings",
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M7.429 1.525a6.593 6.593 0 011.142 0c.036.003.108.036.137.146l.289 1.105c.147.56.55.967.997 1.189.174.086.341.183.501.29.417.278.97.423 1.53.27l1.102-.303c.11-.03.175.016.205.065.15.24.287.492.41.752.124.26.227.531.308.807.032.107-.004.188-.087.228l-.99.5c-.5.254-.836.705-.954 1.189-.029.12-.064.239-.104.357-.144.422-.091.895.197 1.286l.642.866c.068.091.063.171.027.228a6.588 6.588 0 01-.808.808c-.057.036-.137.041-.228-.027l-.866-.642c-.39-.288-.863-.34-1.286-.196-.118.04-.237.075-.357.104-.484.118-.935.454-1.189.953l-.5.99c-.04.084-.12.12-.228.088a6.584 6.584 0 01-.752-.308 6.586 6.586 0 01-.752-.41c-.049-.03-.095-.095-.065-.205l.303-1.102c.153-.56.008-1.113-.27-1.53a4.587 4.587 0 01-.29-.501c-.222-.447-.629-.85-1.189-.997L2.144 9.14c-.11-.029-.176-.091-.146-.137a6.59 6.59 0 010-1.142c.03-.046.035-.108.146-.137l1.105-.289c.56-.147.967-.55 1.189-.997.086-.174.183-.341.29-.501.278-.417.423-.97.27-1.53L4.695 3.306c-.03-.11.016-.175.065-.205.24-.15.492-.287.752-.41.26-.124.531-.227.807-.308.107-.032.188.004.228.087l.5.99c.254.5.705.836 1.189.954.12.029.239.064.357.104.422.144.895.091 1.286-.197l.866-.642c.091-.068.171-.063.228-.027zM8 10.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
        </svg>
      ),
    },
  ];

  return (
    <nav className="border-t border-slate-200/70 bg-white/75 px-3 py-3 backdrop-blur">
      {tabs.map((tab) => {
        const active =
          tab.path === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex-1 rounded-2xl px-2 py-2 text-xs transition-all ${
              active
                ? "bg-slate-900 text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)]"
                : "text-slate-500 hover:bg-white/80 hover:text-slate-800"
            }`}
          >
            <span className={`mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full ${
              active ? "bg-white/12 text-white" : "bg-slate-100 text-slate-500"
            }`}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
