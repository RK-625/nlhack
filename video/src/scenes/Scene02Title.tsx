import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { AccentGlow, Dust } from "../components/Backdrop";
import { BlurInText } from "../components/BlurInText";
import { Dolly } from "../components/Camera";
import { DotMatrixLogo } from "../components/DotMatrixLogo";
import { Mascot } from "../components/Mascot";
import { AGENTS } from "../data/agents";
import { blendExpression, EXPRESSIONS } from "../lib/expressions";
import { blinkAt, clamp, composePose, idle, idleBlinks, REST, springAt, springEntrance, tween } from "../lib/motion";
import { COLORS, SPRINGS, VIDEO } from "../theme/tokens";

const ROW_SIZE = 156;
const NEAT_ROW_SIZE = 124;
const ROW_GAP = 172;
/** Feet line of the row; bots spring up from below the frame edge and settle here. */
const ROW_BASELINE = VIDEO.height - 58;
/** Visual centre of a shape mascot sits 44% of its box above the feet. */
const ROW_CENTER_Y = ROW_BASELINE - ROW_SIZE * 0.44;
const POP_START = 48;
/** ~0.17 s between bots */
const POP_STAGGER = 5;

const popDelay = (i: number) => POP_START + i * POP_STAGGER + (AGENTS[i]?.kind === "neat" ? 6 : 0);

/** Scene 2 — "Bot Company" title card with the whole team popping up from below. */
export const Scene02Title = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const push = clamp(frame / Math.max(1, durationInFrames));
  const allUp = popDelay(AGENTS.length - 1) + 14;

  return (
    <AbsoluteFill>
      <AccentGlow color={COLORS.primary} x={50} y={42} w={42} h={34} opacity={0.16 * tween(frame, [0, 40], [0, 1])} />
      <Dust seed="title" count={30} opacity={0.7} />
      <Dolly progress={push} from={0.985} to={1.03} driftY={-6}>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transform: "translateY(-72px)",
            }}
          >
            <BlurInText
              by="glyph"
              text="Bot Company"
              start={6}
              stagger={2.2}
              duration={18}
              blur={12}
              rise={26}
              style={{
                fontSize: 148,
                fontWeight: 600,
                letterSpacing: "-0.045em",
                lineHeight: 1,
                color: COLORS.foreground,
              }}
            />
            <div style={{ height: 34 }} />
            <BlurInText
              by="word"
              start={36}
              stagger={2.4}
              duration={16}
              text={[
                { text: "A company of AI agents", style: { color: COLORS.mutedStrong } },
                { text: " that asks before it acts.", pause: 8, style: { color: COLORS.foreground, fontWeight: 500 } },
              ]}
              style={{ fontSize: 46, fontWeight: 400, letterSpacing: "-0.015em", lineHeight: 1.2 }}
            />
          </div>
        </AbsoluteFill>
      </Dolly>

      {/* the team pops up along the bottom edge, Neat Bot last */}
      {AGENTS.map((agent, i) => {
        const cx = VIDEO.width / 2 + (i - (AGENTS.length - 1) / 2) * ROW_GAP;
        const delay = popDelay(i);
        const entrance = springEntrance(frame, fps, delay, 300, SPRINGS.bouncy);
        const settled = clamp((frame - delay - 10) / 20);
        const pose = composePose(composePose(REST, entrance), idle(frame, `${agent.id}-row`, settled));
        const lookX = ((VIDEO.width / 2 - cx) / (VIDEO.width / 2)) * 6;
        if (frame < delay - 1) return null;

        if (agent.kind === "neat") {
          const pop = springAt(frame, fps, delay, SPRINGS.bouncy);
          return (
            <div
              key={agent.id}
              style={{
                position: "absolute",
                left: cx - NEAT_ROW_SIZE / 2,
                top: ROW_CENTER_Y - NEAT_ROW_SIZE / 2,
                transform: `translateY(${entrance.y ?? 0}px) scale(${0.9 + 0.1 * pop})`,
              }}
            >
              <DotMatrixLogo
                size={NEAT_ROW_SIZE}
                frame={frame}
                fps={fps}
                pngAt={-100}
                pulseAt={delay + 6}
                glow={0.7}
              />
            </div>
          );
        }

        // after landing: glance up at the title, then a left→right blink wave
        const blinks = [allUp + 8 + i * 2, ...idleBlinks(`${agent.id}-row`, allUp + 40, 400)];
        const beam = agent.id === "assistant" || agent.id === "hr" || agent.id === "marketing";
        const eyes = beam
          ? blendExpression("neutral", agent.id === "marketing" ? "wide" : "happy", tween(frame, [allUp + 22, allUp + 28], [0, 1]))
          : EXPRESSIONS.neutral;
        return (
          <div
            key={agent.id}
            style={{
              position: "absolute",
              left: cx - ROW_SIZE / 2,
              top: ROW_BASELINE - ROW_SIZE * 0.94,
            }}
          >
            <Mascot
              agent={agent}
              size={ROW_SIZE}
              eyes={eyes}
              blink={blinkAt(frame, blinks)}
              look={{ x: lookX * tween(frame, [delay + 8, delay + 16], [0, 1]), y: -4 * tween(frame, [delay + 8, delay + 16], [0, 1]) }}
              body={pose}
              glow={0.5}
              shadow={0.8 * clamp((frame - delay) / 8)}
            />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
