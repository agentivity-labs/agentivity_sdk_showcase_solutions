import { useCallback, useEffect, useState } from 'react';
import { PORTAL_CONFIG } from '../config';
import { themes, type PortalTheme } from './themes';

const STORAGE_KEY = 'solutions-portal-theme';

// One entry per PortalTheme['tokens'] key → the CSS custom property it drives (declared with
// their Commerce defaults in index.css's bare :root, so the app renders correctly even before
// this effect runs). One map, generic for any theme — adding a theme to themes.ts is enough on
// its own, nothing to touch here.
const TOKEN_CSS_VARS: Record<keyof PortalTheme['tokens'], string> = {
  ink: '--ink',
  inkSoft: '--ink-soft',
  inkDim: '--ink-dim',
  line: '--line',
  paper: '--paper',
  paperSoft: '--paper-soft',
  accent: '--accent',
  attention: '--attention',
  fontDisplay: '--font-display',
  fontBody: '--font-body',
  fontMono: '--font-mono',
  radiusCard: '--radius-card',
  radiusPill: '--radius-pill',
  radiusBubble: '--radius-bubble',
  radiusSmall: '--radius-small',
};

function readStoredThemeId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && themes.some((t) => t.id === stored) ? stored : PORTAL_CONFIG.themeId;
  } catch {
    // Private browsing / blocked storage: fall back silently, nothing persists this session.
    return PORTAL_CONFIG.themeId;
  }
}

/**
 * The portal's visual identity. `PORTAL_CONFIG.themeId` is the developer's chosen default for
 * this deployment — the brand a visitor sees on their first visit — but the visitor can still
 * pick a different one from the picker (see `ThemeSwitcher`), persisted per browser so a reload
 * keeps whatever they last chose, same as the Trip Manager showcase. Writes every token in
 * `theme.tokens` as an inline CSS custom property on <html>, which overrides index.css's `:root`
 * defaults regardless of which theme is active; components never touch these properties directly.
 */
export function useTheme(): { theme: PortalTheme; setThemeId: (id: string) => void } {
  const [themeId, setThemeIdState] = useState(readStoredThemeId);
  const theme = themes.find((t) => t.id === themeId) ?? themes[0];

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme.id;
    root.style.colorScheme = theme.colorScheme;
    for (const [key, cssVar] of Object.entries(TOKEN_CSS_VARS) as [keyof PortalTheme['tokens'], string][]) {
      root.style.setProperty(cssVar, theme.tokens[key]);
    }
  }, [theme]);

  const setThemeId = useCallback((id: string) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Nothing to persist across reloads in this browser — the in-memory choice still applies.
    }
  }, []);

  return { theme, setThemeId };
}
