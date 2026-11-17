import { SPYRIX_THEMES, DEFAULT_SPYRIX_THEME, normalizeSpyrixTheme } from '../../../themeConfig';

// Theme settings page shares every palette with the topbar, auth screen and landing page.
export const DEFAULT_WORKSPACE_THEME = DEFAULT_SPYRIX_THEME;
export const WORKSPACE_THEMES = Object.freeze(SPYRIX_THEMES.map(({ id, label, accent }) => Object.freeze([id, label, accent])));
export const normalizeWorkspaceTheme = normalizeSpyrixTheme;
