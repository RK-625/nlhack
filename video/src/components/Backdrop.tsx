import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { COLORS } from "../theme/tokens";

/** Base near-black gradient shared by every scene (scenes render transparent on top). */
export const BackdropBase = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(120% 95% at 50% 36%, ${COLORS.backgroundLift} 0%, #0e0f12 42%, ${COLORS.background} 70%, ${COLORS.backgroundDeep} 100%)`,
    }}
  />
);

/** Film grain + vignette on top of everything; the grain re-seeds every 2 frames for life. */
export const BackdropFinish = ({ grain = 0.055 }: { grain?: number }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`grain-${Math.floor(frame / 2)}`) * 1000);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 80% 75% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      <AbsoluteFill style={{ opacity: grain, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** A soft coloured light pool (e.g. the focal bot's colour bleeding into the dark). */
export const AccentGlow = ({
  color,
  x = 50,
  y = 55,
  w = 46,
  h = 52,
  opacity = 0.2,
}: {
  color: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  opacity?: number;
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(${w}% ${h}% at ${x}% ${y}%, ${color}, rgba(0,0,0,0) 100%)`,
      opacity,
      mixBlendMode: "screen",
    }}
  />
);

/** Floating dust motes with parallax against a camera x (pass 0 for static scenes). */
export const Dust = ({
  count = 46,
  cameraX = 0,
  seed = "dust",
  opacity = 1,
}: {
  count?: number;
  cameraX?: number;
  seed?: string;
  opacity?: number;
}) => {
  const frame = useCurrentFrame();
  const W = 1920 + 200;
  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const depth = 0.15 + random(`${seed}-z-${i}`) * 0.85;
        const baseX = random(`${seed}-x-${i}`) * W;
        const baseY = random(`${seed}-y-${i}`) * 1080;
        const x = (((baseX - cameraX * depth * 0.6 + frame * 0.25 * depth) % W) + W) % W - 100;
        const y = baseY + Math.sin(frame / (40 + depth * 30) + i) * 10 - frame * 0.15 * depth;
        const r = 0.8 + depth * 2.2;
        const tw = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(frame / 14 + i * 1.7));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: ((y % 1080) + 1080) % 1080,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              background: "#ffffff",
              opacity: tw * depth * 0.55,
              filter: depth < 0.45 ? `blur(${(0.45 - depth) * 4}px)` : undefined,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
