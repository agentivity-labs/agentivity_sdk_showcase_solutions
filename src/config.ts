/**
 * Solutions Portal — developer configuration.
 *
 * This is the ONE file a developer edits to turn this base into a specific client's white-label
 * portal: business name/logo, visual identity, and which entities (agents/teams/workflows,
 * tagged in the Agentivity library) show up as "Solutions" the end customer can pick and use.
 * Nothing else in this app should need touching for a standard deployment — everything else
 * (which Solution was picked, how to talk to it, whether it's an agent/team/workflow) is resolved
 * at runtime from the backend.
 *
 * The backend URL itself lives in `.env.local` (`VITE_AGENTIVITY_BASE_URL`), not here — it's an
 * environment concern (different per deployment target), not a branding one.
 */
export const PORTAL_CONFIG = {
  /** Shown in the header and browser tab. Replace with the client's business name. */
  brandName: 'Solutions Portal',

  /** Optional: URL to the client's logo image, shown instead of the text brand name in the header. */
  logoUrl: undefined as string | undefined,

  /**
   * One of the presets in `theme/themes.ts` (commerce | light | dark | riviera | techno |
   * ledger). This is only the DEFAULT the developer picks for this deployment — the visitor can
   * still switch to another one via the header's style picker (persisted per browser), same as
   * the Trip Manager showcase.
   */
  themeId: 'commerce',

  /**
   * Which entity tags mark something as a "Solution" this portal should list. Usually just
   * `['Solution']` — the tag convention used across the Agentivity library for "a root-level
   * item the end customer can launch directly" (as opposed to a component used only internally,
   * e.g. one member agent of a team).
   */
  solutionTags: ['Solution'],

  /**
   * 'any' = show anything carrying at least one of `solutionTags` (the common case — one tag).
   * 'all' = show only entities carrying every one of `solutionTags` (useful once a portal
   * combines more than one tag, e.g. `['Solution', 'Featured']`).
   */
  tagMode: 'any' as 'any' | 'all',
};
