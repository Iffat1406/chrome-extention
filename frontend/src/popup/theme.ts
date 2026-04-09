import { createTheme, alpha } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#136f74",
      dark: "#0f5a5e",
      light: "#4ca2a5",
    },
    secondary: {
      main: "#e39a41",
      dark: "#b8792f",
      light: "#f0bd7f",
    },
    success: {
      main: "#21865f",
    },
    error: {
      main: "#c14f4f",
    },
    background: {
      default: "#edf2f6",
      paper: "#ffffff",
    },
    text: {
      primary: "#182336",
      secondary: "#5e6a7b",
    },
    divider: alpha("#8ea0b8", 0.22),
  },
  shape: {
    borderRadius: 16,
  },
  typography: {
    fontFamily: '"Segoe UI", "Inter", "Helvetica Neue", Arial, sans-serif',
    h6: {
      fontWeight: 700,
      letterSpacing: 0.2,
    },
    subtitle2: {
      fontWeight: 600,
      letterSpacing: 0.2,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: `1px solid ${alpha("#93a4bb", 0.2)}`,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
        },
      },
    },
  },
});

export default theme;
