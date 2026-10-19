/**
 * Feature flags for in-progress or future backend capabilities.
 */
export const FEATURES = {
  /** Scheduled guild raids (overlay polling + portal scheduling). Backend routes not live yet. */
  scheduledRaids: false,
  /** Instant raid simulation endpoint (POST /api/raids/:raidId/simulate). Not implemented on backend. */
  raidSimulate: false,
} as const;
