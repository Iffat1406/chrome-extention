import { useEffect, useState } from "react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Chip,
  Paper,
  Toolbar,
  Typography,
} from "@mui/material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import Dashboard from "../pages/DashboardView";
import Settings from "../pages/SettingsView";
import WritingHistory from "../pages/WritingHistoryView";
import type { WritingSession } from "../types";

export default function Popup() {
  const [sessions, setSessions] = useState<WritingSession[]>([]);
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const { sessions: raw } = await chrome.storage.local.get("sessions");
        const sessionList = (raw as WritingSession[] | undefined) ?? [];
        setSessions(sessionList);
        setLastRefreshAt(Date.now());
      } catch (err) {
        console.error("[Popup] Failed to load sessions:", err);
      }
    };

    loadSessions();

    const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.sessions) {
        setSessions((changes.sessions.newValue as WritingSession[]) ?? []);
        setLastRefreshAt(Date.now());
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    const pollInterval = setInterval(() => {
      loadSessions();
    }, 2000);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  const lastSyncLabel =
    lastRefreshAt === null
      ? "--:--"
      : new Date(lastRefreshAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

  return (
    <MemoryRouter initialEntries={["/"]}>
      <Paper
        elevation={0}
        sx={{
          width: 760,
          height: 560,
          overflow: "hidden",
          borderRadius: "28px",
          border: "1px solid rgba(255,255,255,0.55)",
          backdropFilter: "blur(16px)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(247,250,252,0.96) 100%)",
          position: "relative",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            insetInline: 0,
            top: 0,
            height: 130,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at top, rgba(19,111,116,0.18), transparent 65%)",
          }}
        />

        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
          <AppBar
            position="static"
            color="transparent"
            elevation={0}
            sx={{ borderBottom: "1px solid", borderColor: "divider", backdropFilter: "blur(8px)" }}
          >
            <Toolbar sx={{ minHeight: "64px !important", justifyContent: "space-between", px: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 1.6, color: "text.secondary" }}>
                  AI writing assistant
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
                  Workspace
                </Typography>
              </Box>
              <Chip label={`Synced ${lastSyncLabel}`} size="small" variant="outlined" />
            </Toolbar>
          </AppBar>

          <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
            <Routes>
              <Route path="/" element={<Dashboard sessions={sessions} />} />
              <Route path="/history" element={<WritingHistory sessions={sessions} />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>

          <BottomNav />
        </Box>
      </Paper>
    </MemoryRouter>
  );
}

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const current = location.pathname.startsWith("/history")
    ? "/history"
    : location.pathname.startsWith("/settings")
      ? "/settings"
      : "/";

  return (
    <Paper
      square
      elevation={0}
      sx={{ borderTop: "1px solid", borderColor: "divider", bgcolor: "rgba(255,255,255,0.78)", backdropFilter: "blur(8px)" }}
    >
      <BottomNavigation
        value={current}
        onChange={(_, value) => navigate(value)}
        showLabels
        sx={{ height: 70, bgcolor: "transparent" }}
      >
        <BottomNavigationAction label="Dashboard" value="/" icon={<DashboardRoundedIcon />} />
        <BottomNavigationAction label="History" value="/history" icon={<HistoryRoundedIcon />} />
        <BottomNavigationAction label="Settings" value="/settings" icon={<TuneRoundedIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
