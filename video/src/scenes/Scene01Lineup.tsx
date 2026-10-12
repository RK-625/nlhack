import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame, useVideoConfig } from "remotion";
import type { CameraState } from "../components/Camera";
import { depthOfField, World, WorldItem } from "../components/Camera";
import { AccentGlow, Dust } from "../components/Backdrop";
import { DotMatrixLogo } from "../components/DotMatrixLogo";
import { Mascot } from "../components/Mascot";
import type { ShapeAgent } from "../data/agents";
import { AGENTS } from "../data/agents";
import type { EyePair } from "../lib/expressions";
import { blendExpression, EXPRESSIONS, mixEyes } from "../lib/expressions";
import type { BodyPose, Key } from "../lib/motion";
import {
  blinkAt,
  clamp,
  composePose,
  hop,
  idle,
  idleBlinks,
  path,
  REST,
  springAt,
  springEntrance,
  tween,
} from "../lib/motion";
import { SPRINGS } from "../theme/tokens";

/** World layout: one row of bots standing on y = 0. */
const SPACING = 360;
const SIZE = 270;
const NEAT_SIZE = 236;
const NEAT_GAP = 170;
const X = AGENTS.map((a, i) => (a.kind === "neat" ? i * SPACING + NEAT_GAP : i * SPACING));
const NEAT_X = X[X.length - 1]!;

/** Neat Bot beat (local frames). */
const NEAT = { assembleAt: 112, pulseAt: 152, blinks: [162], pngAt: 176 } as const;

const X_KEYS: Key[] = [
  { f: 0, v: -90 },
  { f: 38, v: -8 },
  { f: 62, v: 1.5 * SPACING },
  { f: 88, v: 4 * SPACING },
  { f: 112, v: 7 * SPACING },
  { f: 140, v: NEAT_X, hold: true },
  { f: 196, v: NEAT_X + 6 },
];
const ZOOM_KEYS: Key[] = [
  { f: 0, v: 1.42 },
  { f: 38, v: 1.3 },
  { f: 62, v: 1.02 },
  { f: 88, v: 0.9 },
  { f: 112, v: 0.92 },
  { f: 140, v: 1.18, hold: true },
  { f: 196, v: 1.4 },
];
const FOCUS_KEYS: Key[] = [
  { f: 0, v: 150 },
  { f: 38, v: 170 },
  { f: 62, v: 420 },
  { f: 88, v: 560 },
  { f: 112, v: 560 },
  { f: 140, v: 210 },
  { f: 196, v: 190 },
];

const cameraAt = (frame: number): CameraState => ({
  x: path(frame, X_KEYS, 0.42),
  y: -SIZE * 0.5 - 6,
  zoom: path(frame, ZOOM_KEYS, 0.42),
  focusRadius: path(frame, FOCUS_KEYS, 0.42),
  maxBlur: 15,
});

/** Each specialist reacts as the camera arrives (so beats always sync with the dolly). */
const TRIGGERS = X.map((x, i) => {
  if (i === 0) return 0;
  for (let f = 0; f < 200; f++) if (cameraAt(f).x >= x - 190) return f;
  return 200;
});

type Perf = { eyes: EyePair; blink: number; look: { x: number; y: number }; body: BodyPose };

/** The beat each bot plays when the camera reaches it. `t` = frames since its trigger. */
const perform = (agent: ShapeAgent, i: number, frame: number, fps: number, cam: CameraState): Perf => {
  const t = frame - TRIGGERS[i]!;
  const sig = agent.signature;
  const into = tween(t, [0, 7], [0, 1]);
  const outOf = tween(t, [62, 74], [0, 1]);
  let eyes = blendExpression("neutral", sig, into * (1 - outOf));
  const blinks = idleBlinks(agent.id, 10, 200).filter((b) => b < TRIGGERS[i]! - 4 || b > TRIGGERS[i]! + 40);
  let blink = blinkAt(frame, blinks);
  // eyes follow the camera as it passes
  const follow = clamp((cam.x - X[i]!) / 700, -1, 1);
  let look = { x: follow * 8, y: 1 };
  let body = composePose(REST, idle(frame, agent.id));

  switch (agent.id) {
    case "assistant": {
      // Primary Bot drops into the lineup, squashes, blinks, then beams.
      const drop = springEntrance(frame, fps, 9, -560, SPRINGS.bouncy);
      body = composePose(body, drop);
      blink = Math.max(blink, blinkAt(frame, [27]));
      eyes = blendExpression("neutral", "happy", tween(frame, [33, 38], [0, 1]) * (1 - tween(frame, [80, 90], [0, 1])));
      const nodOn = frame > 34 ? 1 - springAt(frame, fps, 34, SPRINGS.jelly) : 0;
      body = composePose(body, { sy: 1 - 0.07 * nodOn, sx: 1 + 0.06 * nodOn });
      look = { x: tween(frame, [14, 24], [-6, 0]) + follow * 4, y: tween(frame, [14, 24], [3, 1]) };
      break;
    }
    case "market-researcher": {
      // curious: eyes dart left, right, then go wide
      body = composePose(body, hop(t - 8, fps, 18, 9));
      const dart = t < 0 ? follow * 8 : interpolate(t, [0, 4, 10, 14, 20], [follow * 8, -9, -9, 9, 2], { extrapolateRight: "clamp" });
      look = { x: dart, y: tween(t, [14, 20], [1, -2]) };
      eyes = blendExpression("neutral", "wide", tween(t, [12, 18], [0, 1]) * (1 - outOf));
      break;
    }
    case "cfo": {
      // deadpan: lids drop, stares at camera, one slow unimpressed blink
      look = { x: interpolate(t, [0, 8], [follow * 8, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), y: 1 };
      blink = Math.max(blink, blinkAt(frame, [TRIGGERS[i]! + 20], true));
      body = composePose(body, { sy: 1 - 0.025 * tween(t, [0, 10], [0, 1]), rot: -1.5 * tween(t, [0, 10], [0, 1]) });
      break;
    }
    case "customer-success": {
      body = composePose(body, hop(t - 4, fps, 26, 10));
      body = composePose(body, { rot: 7 * springAt(t, fps, 14, SPRINGS.bouncy) * (1 - outOf) });
      eyes = mixEyes(EXPRESSIONS.neutral, EXPRESSIONS.wink, tween(t, [14, 19], [0, 1]) * (1 - tween(t, [40, 46], [0, 1])));
      look = { x: follow * 4, y: 0 };
      break;
    }
    case "legal": {
      // skeptical side-eye with a head tilt
      body = composePose(body, { rot: -7 * springAt(t, fps, 2, SPRINGS.bouncy) * (1 - outOf) });
      look = { x: tween(t, [4, 12], [follow * 8, -8]), y: 0.5 };
      break;
    }
    case "hr": {
      body = composePose(body, { rot: Math.sin(Math.max(0, t) / 5) * 6 * into * (1 - outOf) });
      eyes = blendExpression("neutral", "happy", tween(t, [6, 12], [0, 1]) * (1 - outOf));
      break;
    }
    case "marketing": {
      body = composePose(body, hop(t - 2, fps, 48, 12));
      eyes = blendExpression("neutral", "wide", into * (1 - outOf));
      look = { x: follow * 5, y: -2 };
      break;
    }
    case "sales": {
      body = composePose(body, { rot: 6 * springAt(t, fps, 4, SPRINGS.bouncy) * (1 - outOf) });
      eyes = mixEyes(EXPRESSIONS.neutral, EXPRESSIONS.wink, tween(t, [6, 11], [0, 1]) * (1 - tween(t, [34, 40], [0, 1])));
      break;
    }
    case "github": {
      // sleepy, then glances toward Neat Bot as the dots gather
      blink = Math.max(blink, blinkAt(frame, [TRIGGERS[i]! + 6], true));
      look = { x: tween(t, [16, 24], [follow * 6, 9]), y: tween(t, [16, 24], [1, -1]) };
      eyes = blendExpression("sleepy", "neutral", tween(t, [16, 22], [0, 1]));
      eyes = mixEyes(EXPRESSIONS.neutral, eyes, into);
      break;
    }
    default:
      break;
  }
  return { eyes, blink, look, body };
};

export const Scene01Lineup = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = cameraAt(frame);

  const accent = interpolateColors(
    cam.x,
    X,
    AGENTS.map((a) => (a.kind === "shape" ? a.colorDef.hex : "#9CA3AF")),
  );
  const intro = tween(frame, [0, 14], [0, 1]);

  return (
    <AbsoluteFill style={{ opacity: intro, filter: intro < 1 ? `blur(${(1 - intro) * 14}px)` : undefined }}>
      <AccentGlow color={accent} x={50} y={60} w={48} h={46} opacity={0.2} />
      <Dust cameraX={cam.x} seed="lineup" />
      <World camera={cam}>
        {/* faint floor sheen — soft horizon, no hard edge */}
        <div
          style={{
            position: "absolute",
            left: cam.x - 2400,
            top: -60,
            width: 4800,
            height: 360,
            background: "radial-gradient(42% 52% at 50% 17%, rgba(255,255,255,0.05), rgba(255,255,255,0) 100%)",
            maskImage: "linear-gradient(to bottom, transparent 0px, black 62px, black 160px, transparent 360px)",
          }}
        />
        {/* Neat Bot's contact shadow on the floor, once the tile has formed */}
        <WorldItem x={NEAT_X} y={6} anchor="center">
          <div
            style={{
              width: NEAT_SIZE * 0.9,
              height: NEAT_SIZE * 0.12,
              borderRadius: "50%",
              background: "radial-gradient(closest-side, rgba(0,0,0,0.6), rgba(0,0,0,0))",
              opacity: tween(frame, [NEAT.assembleAt + 14, NEAT.assembleAt + 34], [0, 1]),
            }}
          />
        </WorldItem>
        {AGENTS.map((agent, i) => {
          const x = X[i]!;
          const dof = depthOfField(cam, x);
          const filter = dof.blur > 0.3 ? `blur(${dof.blur}px) brightness(${dof.dim})` : `brightness(${dof.dim})`;
          if (agent.kind === "neat") {
            const bob = frame > NEAT.assembleAt + 30 ? Math.sin((frame - NEAT.assembleAt) / 11) * 4 : 0;
            return (
              <WorldItem key={agent.id} x={x} y={-SIZE * 0.5 + bob} anchor="center" style={{ filter }}>
                <DotMatrixLogo
                  size={NEAT_SIZE}
                  frame={frame}
                  fps={fps}
                  assembleAt={NEAT.assembleAt}
                  pulseAt={NEAT.pulseAt}
                  blinks={[...NEAT.blinks]}
                  pngAt={NEAT.pngAt}
                  glow={0.8}
                />
              </WorldItem>
            );
          }
          const perf = perform(agent, i, frame, fps, cam);
          return (
            <WorldItem key={agent.id} x={x} y={0} style={{ filter }}>
              <Mascot
                agent={agent}
                size={SIZE}
                eyes={perf.eyes}
                blink={perf.blink}
                look={perf.look}
                body={perf.body}
                glow={0.35 + 0.4 * dof.focus}
              />
            </WorldItem>
          );
        })}
      </World>
    </AbsoluteFill>
  );
};
