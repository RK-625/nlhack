import type { ShotSource } from "../components/UICard";

/**
 * Real app captures (copied from docs/demo/evidence/2026-10-12 into public/evidence).
 * Regions are in each screenshot's own pixels, measured from the PNGs.
 * Honesty: shots 22/23 (answer text with a runway miscalculation) are deliberately not used.
 */
export const SHOTS = {
  /** 19 — live run: the US-expansion question, Research + CFO delegations working, $0.017 / 138k. */
  usRunning: { src: "evidence/19-live-us-expansion-question-running-cost-cap.png", w: 3024, h: 1738 },
  /** 20 — same turn a little later: $0.024 / $0.03 and 254k / 300k (bars amber). */
  usNearCap: { src: "evidence/20-live-token-usage-approaching-cap.png", w: 3024, h: 1738 },
  /** 21 — same run: "hit its 300k token limit after 302k" card, Approved, Primary Bot thinking again. */
  capApproved: { src: "evidence/21-live-cap-card-approved-continuing.png", w: 3024, h: 1738 },
  /** 01 — Northwind run: the pending budget card with Approve / Deny (1× capture). */
  capPending: { src: "evidence/01-northwind-budget-extension-pending-desktop.png", w: 1500, h: 850 },
  cappedTrace: { src: "evidence/17-neatlogs-capped-trace-error.png", w: 2000, h: 1146 },
  diagnosis: { src: "evidence/08-neatbot-diagnosis-verdict.png", w: 2000, h: 1147 },
  waste: { src: "evidence/10-neatbot-diagnosis-waste.png", w: 2000, h: 1151 },
  fixes: { src: "evidence/11-neatbot-diagnosis-ranked-fixes.png", w: 2000, h: 1153 },
  comparison: { src: "evidence/12-neatbot-compare-before-after.png", w: 2000, h: 1151 },
  continuation: { src: "evidence/18-neatlogs-approved-continuation-trace.png", w: 2000, h: 1149 },
  /** 36 — CFO Bot chat: five finished cfo.ai tools and the page-created line. */
  cfoPlanTools: { src: "evidence/36-cfoai-business-plan-tools.png", w: 1925, h: 1250 },
  /** 37 — approval card for cfo_edit_pages. The JSON body is not the subject. */
  cfoPlanApproval: { src: "evidence/37-cfoai-business-plan-approval.png", w: 1925, h: 1250 },
  /** 38 — the plan page open in cfo.ai, under Main Scenario only. */
  cfoPlanPage: { src: "evidence/38-cfoai-business-plan-page.png", w: 2000, h: 1144 },
} satisfies Record<string, ShotSource>;

export type Rect = { x: number; y: number; w: number; h: number };

/** Shots 19 / 20 (identical layout). */
export const US_RUN = {
  /** The question exactly as the user typed it. */
  question: "can make a check the coo bot with these data about can expand the business here and what is the current business situation in us",
  userBubble: { x: 1054, y: 904, w: 1913, h: 89 },
  /** "Working… · 2 tools" + the two "Delegated to …" rows. */
  delegations: { x: 646, y: 1382, w: 420, h: 132 },
  researchRow: { x: 702, y: 1449 },
  cfoRow: { x: 702, y: 1492 },
  /** The usage popover under the chat header. */
  popover: { x: 1416, y: 114, w: 760, h: 170 },
  meter: {
    cap: { cost: 0.03, tokens: 300_000 },
    from: { cost: 0.017, tokens: 138_000 },
    to: { cost: 0.024, tokens: 254_000 },
    /** Right edge + baseline of each value, and each bar's box. */
    costValue: { right: 1779, baseline: 165.5 },
    tokensValue: { right: 2145, baseline: 165.5 },
    costBar: { x: 1446, y: 184, w: 334, h: 8 },
    tokensBar: { x: 1812, y: 184, w: 334, h: 8 },
    fontSize: 25,
    ink: "#3c3c3b",
    track: "#f0f0ed",
    normal: "#7a7a79",
    warn: "#b7791f",
  },
} as const;

/** Shot 21. */
export const CAP_APPROVED = {
  card: { x: 623, y: 1225, w: 1203, h: 148 },
  approvedLine: { x: 660, y: 1310, w: 470, h: 40 },
  delegationsDone: { x: 646, y: 1080, w: 420, h: 120 },
  thinking: { x: 640, y: 1420, w: 300, h: 80 },
} as const;

/**
 * Shots 36–38. Rects measured from the PNG pixels (not a preview).
 * Shot 36's user prompt (the 3-scenario ask) sits above `tools` and is not the subject.
 * Shot 37's Approve control is the black button; the point is its centre.
 */
export const CFO_PLAN = {
  tools: { x: 400, y: 788, w: 960, h: 256 },
  title: { x: 408, y: 626, w: 280, h: 108 },
  approve: { x: 431, y: 1049, w: 111, h: 33 },
  approvePoint: { x: 486.5, y: 1065.5 },
  page: { x: 360, y: 70, w: 1280, h: 560 },
} as const;

/** Shot 01. */
export const CAP_PENDING = {
  card: { x: 312, y: 242, w: 1021, h: 129 },
  approve: { x: 332, y: 331, w: 88, h: 25 },
  popover: { x: 703, y: 57, w: 378, h: 106 },
} as const;
