"use client";

import { createTheme } from "@mui/material/styles";

// MUI theme mapped onto the Moeko Works tokens (plan §6.9, Appendix B).
export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "light",
    primary: { main: "#FFB4E3", light: "#FFE9F7", dark: "#B42A6C", contrastText: "#2E2A36" },
    secondary: { main: "#A0CFFC", light: "#E1F3FF", dark: "#1665AE", contrastText: "#2E2A36" },
    success: { main: "#2E7D4F" },
    warning: { main: "#946200" },
    error: { main: "#C2333B" },
    info: { main: "#1665AE" },
    background: { default: "#F6F7FB", paper: "#FFFFFF" },
    text: { primary: "#2E2A36", secondary: "#5D5869" },
    divider: "#E4E6EE",
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: "var(--font-fredoka), system-ui, sans-serif",
    fontWeightRegular: 400,
    fontWeightMedium: 400,
    fontWeightBold: 700,
    button: { textTransform: "none", fontWeight: 700, letterSpacing: "0.01em" },
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
  components: {
    // CssBaseline's `*, *::before, *::after { box-sizing: inherit }` makes every element's style depend on its parent,
    // and with it Chrome restarted the compositor animations (falling flowers, stage) on every frame: ~0.5–0.8 s of
    // style work per second on an idle page. Same computed result as before (html is border-box, so everything
    // inherited border-box), declared directly; MUI's own class rules (e.g. inputs) still win. PERFORMANCE_PLAN §7.
    MuiCssBaseline: {
      styleOverrides: { "*, *::before, *::after": { boxSizing: "border-box" } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 22,
          transition: "transform 120ms cubic-bezier(.22,1,.36,1), background-color 200ms",
          "&:active": { transform: "scale(.96)" },
        },
      },
      variants: [
        { props: { variant: "contained", color: "primary" }, style: { color: "#2E2A36", "&:hover": { backgroundColor: "#F49CC5" } } },
        { props: { variant: "contained", color: "secondary" }, style: { color: "#2E2A36" } },
        // pastel mains are too light for text: outlined/text buttons use the strong shades (≥ 4.5:1)
        { props: { variant: "outlined", color: "primary" }, style: { color: "#B42A6C", borderColor: "#F49CC5" } },
        { props: { variant: "text", color: "primary" }, style: { color: "#B42A6C" } },
        { props: { variant: "outlined", color: "secondary" }, style: { color: "#1665AE", borderColor: "#7ECEF3" } },
        { props: { variant: "text", color: "secondary" }, style: { color: "#1665AE" } },
      ],
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 24 } } },
    MuiCard: { styleOverrides: { root: { borderRadius: 24 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 12, fontWeight: 700 } } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: "#FFFFFF",
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#B42A6C", borderWidth: 2 },
        },
        notchedOutline: { borderColor: "#CDD0DC" },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { "&.Mui-focused": { color: "#B42A6C" } } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 32 } } },
    MuiTooltip: { styleOverrides: { tooltip: { borderRadius: 12, backgroundColor: "#2E2A36", fontSize: 13 } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 16 } } },
  },
});
