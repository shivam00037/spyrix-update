/* =========================================================
   SPYRIX INVOICE — CENTRAL THEME CONFIGURATION
   File: client/src/themeConfig.js
   ========================================================= */

/* Default theme */
export const DEFAULT_SPYRIX_THEME = "neon-green";

/* All available themes */
export const SPYRIX_THEMES = [
  {
    id: "neon-green",
    name: "Neon Green",
    mode: "light",
    accent: "#65e62e",
    darkAccent: "#248a16",
    accentContrast: "#10220a",
    accentSoft: "#e8ffdf",
    accentPale: "#f4fff0",
    accentBorder: "#b5f19e",
    accentShadow: "rgba(68, 210, 36, 0.22)",
    surface: "#ffffff",
    surfaceSoft: "#f5faf3",
    text: "#182118",
    muted: "#687568",
    line: "#e1e9de",
    pageBg: "#f4f7f2",
  },
  {
    id: "white-red",
    name: "White & Red",
    mode: "light",
    accent: "#e53945",
    darkAccent: "#b91c2b",
    accentContrast: "#ffffff",
    accentSoft: "#ffe8eb",
    accentPale: "#fff5f5",
    accentBorder: "#ffc1c7",
    accentShadow: "rgba(229, 57, 69, 0.18)",
    surface: "#ffffff",
    surfaceSoft: "#fff7f7",
    text: "#242124",
    muted: "#777078",
    line: "#eee1e3",
    pageBg: "#f8f6f6",
  },
  {
    id: "yellow-black",
    name: "Yellow & Black",
    mode: "light",
    accent: "#f5c400",
    darkAccent: "#9b7600",
    accentContrast: "#171717",
    accentSoft: "#fff3b8",
    accentPale: "#fffbeb",
    accentBorder: "#f1d66a",
    accentShadow: "rgba(245, 196, 0, 0.2)",
    surface: "#ffffff",
    surfaceSoft: "#faf9f4",
    text: "#171717",
    muted: "#716c5b",
    line: "#e9e4d3",
    pageBg: "#f6f5ef",
  },
  {
    id: "black-red",
    name: "Black & Red",
    mode: "dark",
    accent: "#ff424f",
    darkAccent: "#d91e32",
    accentContrast: "#ffffff",
    accentSoft: "#3a1c22",
    accentPale: "#211619",
    accentBorder: "#77313a",
    accentShadow: "rgba(255, 66, 79, 0.2)",
    surface: "#202124",
    surfaceSoft: "#292a2e",
    text: "#f6f6f7",
    muted: "#b1b1ba",
    line: "#3c3d43",
    pageBg: "#151619",
  },
  {
    id: "purple-white",
    name: "Purple & White",
    mode: "light",
    accent: "#8755e8",
    darkAccent: "#6030b9",
    accentContrast: "#ffffff",
    accentSoft: "#efe6ff",
    accentPale: "#faf7ff",
    accentBorder: "#d3baff",
    accentShadow: "rgba(135, 85, 232, 0.2)",
    surface: "#ffffff",
    surfaceSoft: "#faf7ff",
    text: "#252033",
    muted: "#777087",
    line: "#e8e0f3",
    pageBg: "#f7f5fa",
  },
  {
    id: "skyblue-white",
    name: "Sky Blue & White",
    mode: "light",
    accent: "#22a7e8",
    darkAccent: "#0875b3",
    accentContrast: "#ffffff",
    accentSoft: "#dff4ff",
    accentPale: "#f2fbff",
    accentBorder: "#a9def7",
    accentShadow: "rgba(34, 167, 232, 0.18)",
    surface: "#ffffff",
    surfaceSoft: "#f3faff",
    text: "#192832",
    muted: "#687d8a",
    line: "#dceaf1",
    pageBg: "#f3f8fb",
  },
  {
    id: "white-black",
    name: "White & Black",
    mode: "light",
    accent: "#252525",
    darkAccent: "#000000",
    accentContrast: "#ffffff",
    accentSoft: "#eaeaea",
    accentPale: "#f8f8f8",
    accentBorder: "#d2d2d2",
    accentShadow: "rgba(0, 0, 0, 0.12)",
    surface: "#ffffff",
    surfaceSoft: "#f7f7f7",
    text: "#171717",
    muted: "#707070",
    line: "#e4e4e4",
    pageBg: "#f4f4f4",
  },
];

/* Valid theme IDs */
export const SPYRIX_THEME_IDS = SPYRIX_THEMES.map((theme) => theme.id);

/* Normalize and validate a theme ID */
export function normalizeSpyrixTheme(value) {
  const themeId = typeof value === "string" ? value.trim() : "";

  return SPYRIX_THEME_IDS.includes(themeId) ? themeId : DEFAULT_SPYRIX_THEME;
}

/* Get the initial theme */
export function getInitialSpyrixTheme(preferredValue) {
  return normalizeSpyrixTheme(preferredValue);
}

/* Save the selected theme */
export function persistSpyrixThemeChoice(value) {
  const themeId = normalizeSpyrixTheme(value);

  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("spyrix-theme", themeId);
    }
  } catch (error) {
    console.warn("SPYRIX could not save the selected theme.", error);
  }

  return themeId;
}

/* Retrieve a complete theme object */
export function getSpyrixTheme(value) {
  const themeId = normalizeSpyrixTheme(value);

  return (
    SPYRIX_THEMES.find((theme) => theme.id === themeId) ||
    SPYRIX_THEMES.find((theme) => theme.id === DEFAULT_SPYRIX_THEME) ||
    SPYRIX_THEMES[0]
  );
}

/* CSS variables shared by the application */
export function getSpyrixThemeStyle(value) {
  const theme = getSpyrixTheme(value);

  return {
    "--accent": theme.accent,
    "--accent-dark": theme.darkAccent,
    "--accent-contrast": theme.accentContrast,
    "--accent-soft": theme.accentSoft,
    "--accent-pale": theme.accentPale,
    "--accent-border": theme.accentBorder,
    "--accent-shadow": theme.accentShadow,
    "--surface": theme.surface,
    "--surface-soft": theme.surfaceSoft,
    "--text": theme.text,
    "--muted": theme.muted,
    "--line": theme.line,
    "--page-bg": theme.pageBg,
    "--theme-mode": theme.mode,
    "--red": theme.darkAccent,
  };
}
