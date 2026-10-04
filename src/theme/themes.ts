import {
  dark as darkPreset,
  ledger as ledgerPreset,
  light as lightPreset,
  riviera as rivieraPreset,
  techno as technoPreset,
  type ArtifactsThemeData,
} from '@agentivity-labs/sdk-react';

/**
 * One selectable visual identity for this portal: the `ArtifactsThemeData` handed to the SDK's
 * `ArtifactsThemeProvider` (drives every widget's own theming, including its own `cardRadius` —
 * shape, not just color, varies per theme there too) plus this app's own raw CSS custom
 * properties (`tokens`) applied by `useTheme`. Both halves of one theme are defined together here
 * so they can never drift out of sync with each other.
 *
 * `artifactsTheme` below is always one of the SDK's own presets (`light`/`dark`/`riviera`/
 * `techno`/`ledger`, the same five the Flutter SDK's `AgArtifactsThemes` offers), not redefined
 * here. `tokens` below is what's genuinely specific to THIS app — its own chrome (header, Solution
 * cards, chat) has no SDK widget equivalent, so there is nothing to import for it.
 */
export interface PortalTheme {
  id: string;
  name: string;
  colorScheme: 'light' | 'dark';
  artifactsTheme: ArtifactsThemeData;
  tokens: {
    ink: string;
    inkSoft: string;
    inkDim: string;
    line: string;
    paper: string;
    paperSoft: string;
    /** Primary accent — eyebrow labels, badges, selected states. */
    accent: string;
    /** Secondary accent — also doubles as the semantic "attention" color (errors). */
    attention: string;
    fontDisplay: string;
    fontBody: string;
    fontMono: string;
    /** Corner radius roles — this app's own shape language, independent of
     *  `artifactsTheme.cardRadius` (which only shapes SDK widget cards). */
    radiusCard: string;
    radiusPill: string;
    radiusBubble: string;
    radiusSmall: string;
  };
}

const light: PortalTheme = {
  id: 'light',
  name: 'Light',
  colorScheme: 'light',
  artifactsTheme: lightPreset,
  tokens: {
    ink: '#14161A',
    inkSoft: '#52565E',
    inkDim: '#9498A0',
    line: '#E4E6EA',
    paper: '#FFFFFF',
    paperSoft: '#F6F7F9',
    accent: '#4F46E5',
    attention: '#E4483D',
    fontDisplay: '"Manrope", sans-serif',
    fontBody: '"Karla", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    radiusCard: '18px',
    radiusPill: '999px',
    radiusBubble: '14px',
    radiusSmall: '8px',
  },
};

const dark: PortalTheme = {
  id: 'dark',
  name: 'Dark',
  colorScheme: 'dark',
  artifactsTheme: darkPreset,
  tokens: {
    ink: '#F2F3F5',
    inkSoft: '#B7BAC2',
    inkDim: '#74777F',
    line: '#2A2D33',
    paper: '#1A1C20',
    paperSoft: '#121316',
    accent: '#818CF8',
    attention: '#F87171',
    fontDisplay: '"Manrope", sans-serif',
    fontBody: '"Karla", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    radiusCard: '18px',
    radiusPill: '999px',
    radiusBubble: '14px',
    radiusSmall: '8px',
  },
};

const riviera: PortalTheme = {
  id: 'riviera',
  name: 'Riviera',
  colorScheme: 'light',
  artifactsTheme: rivieraPreset,
  tokens: {
    ink: '#171A1D',
    inkSoft: '#4E5359',
    inkDim: '#9CA0A6',
    line: '#EDEBE5',
    paper: '#FFFFFF',
    paperSoft: '#F5F3EE',
    accent: '#E3A94F',
    attention: '#F1633B',
    fontDisplay: '"Instrument Serif", serif',
    fontBody: '"Karla", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    radiusCard: '28px',
    radiusPill: '999px',
    radiusBubble: '16px',
    radiusSmall: '10px',
  },
};

const techno: PortalTheme = {
  id: 'techno',
  name: 'Techno',
  colorScheme: 'dark',
  artifactsTheme: technoPreset,
  tokens: {
    ink: '#E8EAED',
    inkSoft: '#A7ACB5',
    inkDim: '#6B707A',
    line: '#262A31',
    paper: '#16181C',
    paperSoft: '#0D0E10',
    accent: '#7C7CFF',
    attention: '#34D5C4',
    fontDisplay: '"JetBrains Mono", monospace',
    fontBody: '"Karla", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    radiusCard: '6px',
    radiusPill: '6px',
    radiusBubble: '5px',
    radiusSmall: '3px',
  },
};

const ledger: PortalTheme = {
  id: 'ledger',
  name: 'Ledger',
  colorScheme: 'light',
  artifactsTheme: ledgerPreset,
  tokens: {
    ink: '#1A1A18',
    inkSoft: '#5A5A52',
    inkDim: '#8C8C82',
    line: '#D8D6CC',
    paper: '#FAF9F5',
    paperSoft: '#F1EFE6',
    accent: '#B34700',
    attention: '#B3261E',
    fontDisplay: '"JetBrains Mono", monospace',
    fontBody: '"Karla", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    radiusCard: '3px',
    radiusPill: '4px',
    radiusBubble: '3px',
    radiusSmall: '2px',
  },
};

/**
 * "Commerce" — this app's own theme, not one of the 5 SDK-wide presets above. Modeled on a
 * clean, minimal e-commerce app style: near-black solid pill CTAs, soft neutral grey ground,
 * generously rounded cards, quiet borders instead of heavy shadows. Reuses `lightPreset` for the
 * SDK widget half (closest match — light surface, neutral) since the SDK doesn't ship a matching
 * preset; everything distinctive about this look lives in `tokens` below.
 */
const commerce: PortalTheme = {
  id: 'commerce',
  name: 'Commerce',
  colorScheme: 'light',
  artifactsTheme: lightPreset,
  tokens: {
    // Cool neutrals, deliberately — a warm/cream grey (this theme's first pass used #F2F2EF,
    // #E7E7E4) read as "yellowed"/dirty against pure white, not as a clean, considered neutral.
    ink: '#111111',
    inkSoft: '#5C5C5C',
    inkDim: '#9C9C9C',
    line: '#E5E7EB',
    paper: '#FFFFFF',
    paperSoft: '#F4F5F6',
    accent: '#111111',
    attention: '#E14848',
    fontDisplay: '"Manrope", sans-serif',
    fontBody: '"Karla", sans-serif',
    fontMono: '"JetBrains Mono", monospace',
    radiusCard: '22px',
    radiusPill: '999px',
    radiusBubble: '18px',
    radiusSmall: '14px',
  },
};

export const themes: readonly PortalTheme[] = [commerce, light, dark, riviera, techno, ledger];
export const defaultThemeId = commerce.id;
