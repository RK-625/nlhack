import { Scene00Chaos } from "./scenes/Scene00Chaos";
import { SceneResearchDemo } from "./scenes/SceneResearchDemo";
import { SceneGithubDemo } from "./scenes/SceneGithubDemo";
import { SceneCfoDemo } from "./scenes/SceneCfoDemo";
import { Scene11EndCard } from "./scenes/Scene11EndCard";
import { Scene10Checkpoints } from "./scenes/Scene10Checkpoints";
import { Scene09Measured } from "./scenes/Scene09Measured";
import { Scene08Diagnosis } from "./scenes/Scene08Diagnosis";
import { Scene07Roles } from "./scenes/Scene07Roles";
import { Scene06NeatBot } from "./scenes/Scene06NeatBot";
import type { ComponentType } from "react";
import { Scene01Lineup } from "./scenes/Scene01Lineup";
import { Scene02Title } from "./scenes/Scene02Title";
import { Scene03Team } from "./scenes/Scene03Team";
import { Scene04RealWork } from "./scenes/Scene04RealWork";
import { Scene05Guardrails } from "./scenes/Scene05Guardrails";
import { TRANSITION_FRAMES, VIDEO } from "./theme/tokens";

/**
 * The storyboard (video/STORYBOARD.md) as data. `seconds` is each scene's slot on the
 * 160 s timeline; the blur-dissolve into the next scene overlaps the first
 * TRANSITION_FRAMES of that next slot, so scene N always *starts* on its storyboard second
 * (which also anchors any future sound-effect cues).
 */
export type SceneDef = {
  id: string;
  title: string;
  seconds: number;
  onScreen?: string;
  /** null = not built yet (renders a placeholder card). */
  component: ComponentType | null;
};

export const SCENES: SceneDef[] = [
  { id: "00-chaos", title: "Enterprise chaos", seconds: 24, component: Scene00Chaos },
  { id: "01-lineup", title: "Meet the cast", seconds: 6, component: Scene01Lineup },
  { id: "02-title", title: "Bot Company", seconds: 5, component: Scene02Title },
  { id: "04-real-work", title: "Primary Bot", seconds: 8, component: Scene04RealWork },
  { id: "05-guardrails", title: "Cap and approve", seconds: 8, component: Scene05Guardrails },
  { id: "research-demo", title: "Research Bot demonstration", seconds: 16, component: SceneResearchDemo },
  { id: "github-demo", title: "GitHub Bot demonstration", seconds: 16, component: SceneGithubDemo },
  { id: "cfo-demo", title: "CFO Bot demonstration", seconds: 16, component: SceneCfoDemo },
  { id: "03-team", title: "Across departments", seconds: 8, component: Scene03Team },
  { id: "06-neat-bot", title: "Meet Neat Bot", seconds: 5, component: Scene06NeatBot },
  { id: "07-roles", title: "Role-aware investigation", seconds: 16, component: Scene07Roles },
  { id: "08-debugs", title: "Diagnosis and fixes", seconds: 12, component: Scene08Diagnosis },
  { id: "09-measured", title: "Measured results", seconds: 8, component: Scene09Measured },
  { id: "10-receipts", title: "Entire checkpoint", seconds: 5, component: Scene10Checkpoints },
  { id: "11-end-card", title: "Try Bot Company", seconds: 7, component: Scene11EndCard },
];

export const slotFrames = (s: SceneDef) => Math.round(s.seconds * VIDEO.fps);

/** Sequence length: the slot plus the overlap of the outgoing transition (if any). */
export const sequenceFrames = (scenes: SceneDef[], i: number) =>
  slotFrames(scenes[i]!) + (i < scenes.length - 1 ? TRANSITION_FRAMES : 0);

export const totalFrames = (scenes: SceneDef[]) => scenes.reduce((sum, s) => sum + slotFrames(s), 0);

/** Absolute start frame of each scene (= storyboard second × fps) — scene / SFX cue points. */
export const sceneStarts = (scenes: SceneDef[]) => {
  let at = 0;
  return scenes.map((s) => {
    const start = at;
    at += slotFrames(s);
    return start;
  });
};

export const INTRO_SCENES = SCENES.filter(s => ["01-lineup", "02-title"].includes(s.id));

export const SPRINT3_SCENES = ["01-lineup", "02-title", "03-team", "04-real-work", "05-guardrails"].map(id => SCENES.find(s => s.id === id)!);
