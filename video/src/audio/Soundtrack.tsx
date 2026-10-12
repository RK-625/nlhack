import type { SceneDef } from "../timeline";
import { sceneStarts } from "../timeline";

/**
 * AUDIO SLOT — intentionally silent in Sprint 2.
 *
 * A later sprint drops files into public/audio/ and renders them here, e.g.
 *   public/audio/music.mp3            Pixabay bed (user picks 1 of 3), ducked under VO
 *   public/audio/vo/<scene-id>.wav    Kokoro VO line per scene (text = SceneDef.vo)
 *   public/audio/sfx/whoosh.wav       on every scene change (cue = scene start)
 * using <Audio src={staticFile(...)} /> from "remotion" inside <Sequence from={cue}>.
 * Cue points come from voCues() so audio always follows the storyboard timing.
 */
export const voCues = (scenes: SceneDef[]) => {
  const starts = sceneStarts(scenes);
  return scenes.map((s, i) => ({ sceneId: s.id, from: starts[i]!, text: s.vo ?? "" }));
};

export const Soundtrack = (_props: { scenes: SceneDef[] }) => null;
