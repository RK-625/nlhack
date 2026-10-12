import type { ComponentType } from "react";
import { Scene01Lineup } from "./scenes/Scene01Lineup";
import { Scene02Title } from "./scenes/Scene02Title";
import { TRANSITION_FRAMES, VIDEO } from "./theme/tokens";

/**
 * The storyboard (video/STORYBOARD.md) as data. `seconds` is each scene's slot on the
 * 82 s timeline; the blur-dissolve into the next scene overlaps the first
 * TRANSITION_FRAMES of that next slot, so scene N always *starts* on its storyboard second
 * (which is what the voiceover cues will key off).
 */
export type SceneDef = {
  id: string;
  title: string;
  seconds: number;
  onScreen?: string;
  vo?: string;
  /** null = not built yet (renders a placeholder card). */
  component: ComponentType | null;
};

export const SCENES: SceneDef[] = [
  { id: "01-lineup", title: "Mascot lineup", seconds: 6, vo: "Meet Bot Company.", component: Scene01Lineup },
  {
    id: "02-title",
    title: "Title",
    seconds: 5,
    onScreen: "Bot Company / A company of AI agents that asks before it acts.",
    vo: "A company of AI agents… that asks before it acts.",
    component: Scene02Title,
  },
  { id: "03-team", title: "The team", seconds: 8, onScreen: "One assistant. Nine specialists.", vo: "Ask the Primary Bot anything. It hands the work to the right specialist.", component: null },
  { id: "04-real-work", title: "Real work, real UI", seconds: 8, onScreen: "Real work. Live costs.", vo: "Every turn shows its cost and tokens, live.", component: null },
  { id: "05-guardrails", title: "Guardrails", seconds: 8, onScreen: "Nothing happens without you.", vo: "Hit a limit, or about to change something? It stops — and asks.", component: null },
  { id: "06-neat-bot", title: "Neat Bot returns", seconds: 5, onScreen: "Meet Neat Bot.", vo: "And watching every run… Neat Bot.", component: null },
  { id: "07-roles", title: "Employee vs Admin", seconds: 10, onScreen: "Employees: own runs. Admins: everything.", vo: "Employees see only their own runs. Admins see everything — and even their changes need approval.", component: null },
  { id: "08-debugs", title: "It debugs your agents", seconds: 12, onScreen: "It reads every trace.", vo: "When a run fails, Neat Bot reads the Neatlogs trace, finds the cause, and ranks the fixes.", component: null },
  { id: "09-measured", title: "Fixed. Measured.", seconds: 8, onScreen: "One fix. Measured.", vo: "One fix later, the failure's gone — with a quarter fewer tokens.", component: null },
  { id: "10-receipts", title: "Built with receipts", seconds: 5, onScreen: "Every change, checkpointed.", vo: "Every change, checkpointed with Entire.", component: null },
  { id: "11-end-card", title: "End card", seconds: 7, onScreen: "Try Bot Company", vo: "Bot Company. AI that asks before it acts.", component: null },
];

export const slotFrames = (s: SceneDef) => Math.round(s.seconds * VIDEO.fps);

/** Sequence length: the slot plus the overlap of the outgoing transition (if any). */
export const sequenceFrames = (scenes: SceneDef[], i: number) =>
  slotFrames(scenes[i]!) + (i < scenes.length - 1 ? TRANSITION_FRAMES : 0);

export const totalFrames = (scenes: SceneDef[]) => scenes.reduce((sum, s) => sum + slotFrames(s), 0);

/** Absolute start frame of each scene (= storyboard second × fps) — VO / SFX cue points. */
export const sceneStarts = (scenes: SceneDef[]) => {
  let at = 0;
  return scenes.map((s) => {
    const start = at;
    at += slotFrames(s);
    return start;
  });
};

export const INTRO_SCENES = SCENES.slice(0, 2);
