import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, GlobalStyles, ThemeProvider } from "@mui/material";
import Popup from "./Popup";
import theme from "./theme";
import "../index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles
        styles={{
          body: {
            margin: 0,
            minWidth: 760,
            minHeight: 560,
            background:
              "radial-gradient(circle at top left, rgba(19,111,116,0.18), transparent 38%), radial-gradient(circle at top right, rgba(235,185,112,0.24), transparent 34%), linear-gradient(180deg, #f8fbfd 0%, #edf2f6 100%)",
          },
          "#root": {
            minWidth: 760,
            minHeight: 560,
          },
        }}
      />
      <Popup />
    </ThemeProvider>
  </React.StrictMode>
);
