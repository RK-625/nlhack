import type { GrokColorDef } from "../lib/avatar-colors";
import { resolvePersonaColorDef } from "../lib/avatar-colors";
import { SHIPPED_BOT_AVATAR_SHAPE_KEYS, shippedBotAvatarShapePath } from "../lib/avatar-shapes";
import type { Expression } from "../lib/expressions";

/**
 * The cast, in lineup order. Colour + shape come from the app's curated table
 * (web/src/lib/agent-avatar.ts: "<hex>::shape_<n>"), resolved through the same
 * resolvePersonaColorDef() the app uses, so gradients and eye colours match exactly.
 */
type ShapeAgent = {
  kind: "shape";
  id: string;
  name: string;
  /** Raw curated hex from agent-avatar.ts. */
  hex: string;
  shapeIndex: number;
  colorDef: GrokColorDef;
  shapeKey: (typeof SHIPPED_BOT_AVATAR_SHAPE_KEYS)[number];
  shapePath: string;
  /** The face this bot pulls on its beat in the lineup. */
  signature: Expression;
};

type ImageAgent = {
  kind: "neat";
  id: string;
  name: string;
  /** Accent used for glows around the Neatlogs tile. */
  hex: string;
};

export type Agent = ShapeAgent | ImageAgent;
export type { ShapeAgent };

const shape = (
  id: string,
  name: string,
  hex: string,
  shapeIndex: number,
  signature: Expression,
): ShapeAgent => ({
  kind: "shape",
  id,
  name,
  hex,
  shapeIndex,
  colorDef: resolvePersonaColorDef(id, hex),
  shapeKey: SHIPPED_BOT_AVATAR_SHAPE_KEYS[shapeIndex % SHIPPED_BOT_AVATAR_SHAPE_KEYS.length] ?? "hex",
  shapePath: shippedBotAvatarShapePath(shapeIndex),
  signature,
});

export const AGENTS: Agent[] = [
  shape("assistant", "Primary Bot", "#8B5CF6", 0, "happy"),
  shape("market-researcher", "Research Bot", "#06B6D4", 4, "wide"),
  shape("cfo", "CFO Bot", "#10B981", 2, "deadpan"),
  shape("customer-success", "Customer Success Bot", "#F59E0B", 5, "wink"),
  shape("legal", "Legal Bot", "#6366F1", 7, "skeptical"),
  shape("hr", "HR Bot", "#EC4899", 6, "happy"),
  shape("marketing", "Marketing Bot", "#F97316", 4, "wide"),
  shape("sales", "Sales Bot", "#14B8A6", 0, "wink"),
  shape("github", "GitHub Bot", "#64748B", 1, "sleepy"),
  { kind: "neat", id: "neatlogs", name: "Neat Bot", hex: "#E5E7EB" },
];

export const SHAPE_AGENTS = AGENTS.filter((a): a is ShapeAgent => a.kind === "shape");
