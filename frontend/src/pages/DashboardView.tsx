import { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
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
    <Box sx={{ p: 2, display: "grid", gap: 1.5 }}>
      <Card
        sx={{
          borderRadius: 3,
          color: "common.white",
          bgcolor: "#172338",
          backgroundImage:
            "radial-gradient(circle at 85% 10%, rgba(76,162,165,0.35), transparent 35%), radial-gradient(circle at 10% 100%, rgba(227,154,65,0.25), transparent 40%)",
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          <Chip
            size="small"
            label="Writing cockpit"
            sx={{
              mb: 1.5,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              bgcolor: "rgba(255,255,255,0.12)",
              color: "common.white",
              border: "1px solid rgba(255,255,255,0.18)",
            }}
          />
          <Typography variant="h6" sx={{ mb: 0.5, color: "common.white" }}>
            Write with clarity and confidence
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.78)", mb: 2 }}>
            Track drafts, review suggestions, and monitor progress in one place.
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
            <MetricTile label="Sessions" value={stats.totalSessions} />
            <MetricTile label="Suggestions" value={stats.totalSuggestionsMade} />
            <MetricTile label="Applied" value={`${stats.acceptanceRate}%`} />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 1.5 }}>
        <StatCard
          label="Characters tracked"
          value={stats.totalTextWritten.toLocaleString()}
          hint="Across all captured drafts"
        />
        <StatCard
          label="Suggestions accepted"
          value={stats.totalApplied}
          hint="Applied writing improvements"
        />
      </Box>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack
            direction="row"
            sx={{ mb: 1.5, justifyContent: "space-between", alignItems: "center" }}
          >
            <Box>
              <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 1.4, color: "text.secondary" }}>
                Recent activity
              </Typography>
              <Typography variant="subtitle1">Latest writing sessions</Typography>
            </Box>
            <Chip label={`${sessions.length} total`} size="small" variant="outlined" />
          </Stack>

          {recentSessions.length > 0 ? (
            <Stack spacing={1}>
              {recentSessions.map((session) => (
                <Paper
                  key={session.id}
                  variant="outlined"
                  sx={{ p: 1.25, borderRadius: 2.2, bgcolor: "rgba(248,250,252,0.9)" }}
                >
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {session.siteName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(session.startTime).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                        {(session.content || "Draft started but no text captured yet.").slice(0, 120)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {session.suggestions.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        suggestions
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, textAlign: "center", bgcolor: "rgba(248,250,252,0.85)" }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                No writing sessions yet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Start typing in chat, email, or comments to populate this dashboard.
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function MetricTile({ label, value }: { label: string; value: string | number }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1,
        borderRadius: 2,
        bgcolor: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.15)",
      }}
    >
      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
        {label}
      </Typography>
      <Typography variant="subtitle1" sx={{ color: "common.white" }}>
        {value}
      </Typography>
    </Paper>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 1.4, color: "text.secondary" }}>
          {label}
        </Typography>
        <Typography variant="h6" sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      </CardContent>
    </Card>
  );
}
