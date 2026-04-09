import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import type { ReactNode } from "react";
import { useSettings } from "../hooks/useSettings";
import type { Settings } from "../types";

export default function SettingsView() {
  const { settings, updateSettings } = useSettings();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [apiKeyVisible, setApiKeyVisible] = useState(false);

  async function handleSave(patch: Partial<Settings>) {
    try {
      await updateSettings(patch);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 1800);
    } catch {
      setSaveStatus("error");
    }
  }

  async function handleClearHistory() {
    if (!confirm("Delete all writing history? This cannot be undone.")) return;
    await chrome.storage.local.remove("sessions");
    alert("History cleared");
  }

  return (
    <Box sx={{ p: 2, display: "grid", gap: 1.5 }}>
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 1.4, color: "text.secondary" }}>
            Preferences
          </Typography>
          <Typography variant="h6">Assistant settings</Typography>
          <Typography variant="body2" color="text.secondary">
            Control model behavior, timing, and local data settings.
          </Typography>
        </CardContent>
      </Card>

      {saveStatus === "saved" && <Alert severity="success">Settings saved successfully.</Alert>}
      {saveStatus === "error" && <Alert severity="error">Something went wrong while saving.</Alert>}

      <SettingsCard
        eyebrow="AI model"
        title="Model and credentials"
        description="Choose your provider and manage the API key used for writing assistance."
      >
        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="model-label">Model</InputLabel>
            <Select
              labelId="model-label"
              value={settings.model}
              label="Model"
              onChange={(event) =>
                handleSave({ model: event.target.value as "gemini" | "claude" | "gpt4" })
              }
            >
              <MenuItem value="gemini">Google Gemini</MenuItem>
              <MenuItem value="claude">Anthropic Claude</MenuItem>
              <MenuItem value="gpt4">OpenAI GPT-4</MenuItem>
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="API key"
            type={apiKeyVisible ? "text" : "password"}
            value={settings.geminiApiKey}
            onChange={(event) => updateSettings({ geminiApiKey: event.target.value })}
            onBlur={() => handleSave({ geminiApiKey: settings.geminiApiKey })}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      size="small"
                      onClick={() => setApiKeyVisible((value) => !value)}
                      startIcon={apiKeyVisible ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                    >
                      {apiKeyVisible ? "Hide" : "Show"}
                    </Button>
                  </InputAdornment>
                ),
              },
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Stored locally for now. We can switch this to secure backend storage next.
          </Typography>
        </Stack>
      </SettingsCard>

      <SettingsCard
        eyebrow="Analysis"
        title="Suggestion depth"
        description="Tune how much help the assistant gives while analyzing text."
      >
        <ToggleButtonGroup
          exclusive
          value={settings.analysisMode}
          onChange={(_, value) => {
            if (!value) return;
            handleSave({ analysisMode: value as "grammar" | "comprehensive" | "completion" });
          }}
          size="small"
          sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        >
          <ToggleButton value="grammar">Grammar</ToggleButton>
          <ToggleButton value="comprehensive">Comprehensive</ToggleButton>
          <ToggleButton value="completion">Completion</ToggleButton>
        </ToggleButtonGroup>
      </SettingsCard>

      <SettingsCard
        eyebrow="Behavior"
        title="Timing and automation"
        description="Control suggestion timing and auto-analyze behavior."
      >
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.autoSuggest}
                onChange={() => handleSave({ autoSuggest: !settings.autoSuggest })}
              />
            }
            label="Auto-suggest improvements"
          />

          <Box>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="body2">Suggestion delay</Typography>
              <Typography variant="caption" color="text.secondary">
                {settings.suggestionDelay} ms
              </Typography>
            </Stack>
            <Slider
              min={500}
              max={3000}
              step={100}
              value={settings.suggestionDelay}
              onChange={(_, value) => updateSettings({ suggestionDelay: Number(value) })}
              onChangeCommitted={(_, value) => handleSave({ suggestionDelay: Number(value) })}
              size="small"
            />
          </Box>
        </Stack>
      </SettingsCard>

      <SettingsCard
        eyebrow="Data"
        title="Local history"
        description="Manage the writing sessions currently saved in this extension."
      >
        <Button color="error" variant="outlined" fullWidth onClick={handleClearHistory}>
          Clear all writing history
        </Button>
      </SettingsCard>
    </Box>
  );
}

function SettingsCard({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: 1.4, color: "text.secondary" }}>
          {eyebrow}
        </Typography>
        <Typography variant="subtitle1">{title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {description}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}
