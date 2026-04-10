import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
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
    <Box sx={{ p: 2, display: "grid", gap: 1.5 }}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 1.4, color: "text.secondary" }}>
            History
          </Typography>
          <Typography variant="h6">Writing timeline</Typography>
          <Typography variant="body2" color="text.secondary">
            Review how the assistant responded across your recent drafts and replies.
          </Typography>
        </CardContent>
      </Card>

      {orderedSessions.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            No writing sessions yet
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Your activity will appear here once the extension captures a draft.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.2}>
          {orderedSessions.map((session) => (
            <Paper
              key={session.id}
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 3, cursor: "pointer", transition: "all 0.2s", '&:hover': { borderColor: "primary.light", bgcolor: "rgba(19,111,116,0.04)" } }}
              onClick={() => setSelectedSession(session)}
            >
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      {session.siteName}
                    </Typography>
                    {session.context && <Chip size="small" label={session.context.toUpperCase()} variant="outlined" />}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(session.startTime).toLocaleString()}
                  </Typography>
                  {session.replyContext && (
                    <Typography variant="caption" sx={{ display: "block", color: "primary.main", mt: 0.5 }}>
                      Replying to: {session.replyContext.slice(0, 90)}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    {(session.content || "No text captured for this draft.").slice(0, 140)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {session.suggestions.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    suggestions
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    {session.appliedCount} applied
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function SessionDetail({
  session,
  onBack,
}: {
  session: WritingSession;
  onBack: () => void;
}) {
  const durationStr = session.endTime
    ? (() => {
        const duration = (session.endTime - session.startTime) / 1000;
        return duration < 60
          ? `${Math.round(duration)}s active`
          : `${Math.round(duration / 60)}m active`;
      })()
    : "Active";

  return (
    <Box sx={{ p: 2, display: "grid", gap: 1.5 }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
        <Button variant="outlined" size="small" startIcon={<ArrowBackRoundedIcon />} onClick={onBack}>
          Back
        </Button>
        <Box>
          <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 1.4, color: "text.secondary" }}>
            Session detail
          </Typography>
          <Typography variant="subtitle1">{session.siteName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {durationStr}
          </Typography>
        </Box>
      </Stack>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Analysis
          </Typography>
          <Stack spacing={1}>
            <AnalysisRow label="Grammar" value={session.textAnalysis.grammarScore} />
            <AnalysisRow label="Clarity" value={session.textAnalysis.clarityScore} />
            <Typography variant="caption" color="text.secondary">
              Tone: <strong>{session.textAnalysis.toneAnalysis}</strong>
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Suggestions
          </Typography>
          <Stack spacing={1}>
            {session.suggestions.length > 0 ? (
              session.suggestions.map((suggestion) => (
                <SuggestionItem key={suggestion.id} suggestion={suggestion} />
              ))
            ) : (
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  No suggestions were generated for this session.
                </Typography>
              </Paper>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Draft text
          </Typography>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
            <Typography variant="caption" sx={{ whiteSpace: "pre-wrap" }}>
              {session.content || "No text captured for this draft."}
            </Typography>
          </Paper>
        </CardContent>
      </Card>

      {session.replyContext && (
        <Card sx={{ borderRadius: 3, borderColor: "primary.light", border: "1px solid" }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Reply context
            </Typography>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="caption" sx={{ whiteSpace: "pre-wrap" }}>
                {session.replyContext}
              </Typography>
            </Paper>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function AnalysisRow({ label, value }: { label: string; value: number }) {
  return (
    <Box>
      <Stack
        direction="row"
        sx={{ mb: 0.5, justifyContent: "space-between", alignItems: "center" }}
      >
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="caption" sx={{ fontWeight: 700 }}>
          {value}%
        </Typography>
      </Stack>
      <Box sx={{ height: 8, borderRadius: 99, bgcolor: "#d8e0ea", overflow: "hidden" }}>
        <Box
          sx={{
            width: `${value}%`,
            height: "100%",
            bgcolor: "primary.main",
            backgroundImage: "linear-gradient(90deg, #136f74 0%, #7ec7c0 100%)",
          }}
        />
      </Box>
    </Box>
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
    <Paper
      variant="outlined"
      sx={{
        p: 1.25,
        borderRadius: 2.2,
        bgcolor: suggestion.applied ? "rgba(33,134,95,0.08)" : "rgba(248,250,252,0.85)",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            Original
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            "{suggestion.originalText}"
          </Typography>
        </Box>
        <Chip size="small" label={reasonLabels[suggestion.reason]} variant="outlined" />
      </Stack>
      <Paper variant="outlined" sx={{ mt: 1, p: 1, borderRadius: 1.5, bgcolor: "#ffffff" }}>
        <Typography variant="caption">{suggestion.suggestion}</Typography>
      </Paper>
      {suggestion.applied && (
        <Typography variant="caption" sx={{ color: "success.main", mt: 0.75, display: "block", fontWeight: 600 }}>
          Applied
        </Typography>
      )}
    </Paper>
  );
}
