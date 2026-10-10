// Modified from rakazo (Apache-2.0), github.com/elie222/rakazo@912c977
// Trimmed to the helpers used by ToolActivityDisclosure (rakazo message-block filters removed).

/**
 * Compact human duration for a tool-activity card summary.
 * Returns null when there is no usable duration (missing, non-finite or negative),
 * so the caller can omit the segment entirely.
 */
export function formatToolActivityDuration(durationMs: number | null | undefined): string | null {
  if (durationMs == null || !Number.isFinite(durationMs) || durationMs < 0) return null;
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`;
  if (durationMs < 10_000) {
    const seconds = Math.round(durationMs / 100) / 10;
    return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
  }
  if (durationMs < 60_000) return `${Math.round(durationMs / 1000)}s`;
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

/** Number of tool calls behind a steps block: the sum of each row's count. */
export function toolStepCount(steps: readonly { count: number }[]): number {
  return steps.reduce((total, step) => total + step.count, 0);
}
