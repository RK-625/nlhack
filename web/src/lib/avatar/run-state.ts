// Modified from rakazo (Apache-2.0), github.com/elie222/rakazo@912c977
// Only ACTIVE_RUN_STATUSES is kept from packages/core/src/run-state.ts.

export const ACTIVE_RUN_STATUSES = [
  "queued",
  "leased",
  "running",
  "waiting_input",
  "waiting_takeover",
] as const;
