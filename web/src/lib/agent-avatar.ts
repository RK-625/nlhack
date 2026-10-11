import { resolvePersonaColorDef, SHIPPED_BOT_AVATAR_SHAPE_KEYS, shippedHash } from "@/lib/avatar";

/**
 * BotAvatar's `color` prop is rakazo's stored avatar value: "<hex>" or "<hex>::shape_<n>".
 * An empty value falls back to one fixed orange (so every agent looked the same), which is
 * why each agent gets an explicit value here: a curated color + mascot shape for our known
 * agents, and a value derived from the id for anything else.
 */
const CURATED: Record<string, string> = {
  assistant: "#8B5CF6::shape_0", // violet hex
  "market-researcher": "#06B6D4::shape_4", // cyan pebble
  cfo: "#10B981::shape_2", // green squircle
  github: "#64748B::shape_1", // slate wedge
  neatlogs: "#F43F5E::shape_3", // rose tablet
};

export function agentAvatarValue(agentId: string): string {
  const curated = CURATED[agentId];
  if (curated) return curated;
  const color = resolvePersonaColorDef(agentId).hex;
  const shape = shippedHash(agentId) % SHIPPED_BOT_AVATAR_SHAPE_KEYS.length;
  return `${color}::shape_${shape}`;
}
