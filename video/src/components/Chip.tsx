import type { CSSProperties, ReactNode } from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { clamp } from "../lib/motion";
import { COLORS, FONT_STACK, SPRINGS } from "../theme/tokens";

export type ChipIcon = "none" | "spinner" | "check" | "dot";

const SUCCESS = "#10B981";

/** Arc spinner that settles into a drawn checkmark at `checkAt` (if given). */
const StatusIcon = ({
  icon,
  frame,
  fps,
  color,
  checkAt,
  size,
}: {
  icon: ChipIcon;
  frame: number;
  fps: number;
  color: string;
  checkAt?: number;
  size: number;
}) => {
  if (icon === "none") return null;
  if (icon === "dot") {
    const pulse = 0.5 + 0.5 * Math.sin(frame / 4.5);
    return (
      <span style={{ position: "relative", width: size, height: size, display: "inline-block", flexShrink: 0 }}>
        <span
          style={{
            position: "absolute",
            inset: size * 0.28,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 ${6 + 8 * pulse}px ${color}`,
          }}
        />
        <span
          style={{
            position: "absolute",
            inset: size * (0.28 - 0.18 * pulse),
            borderRadius: "50%",
            border: `1.5px solid ${color}`,
            opacity: 0.55 * (1 - pulse),
          }}
        />
      </span>
    );
  }
  const checking = icon === "check" ? 1 : checkAt === undefined ? 0 : spring({ frame: frame - checkAt, fps, config: SPRINGS.bouncy });
  const draw = icon === "check" ? 1 : checkAt === undefined ? 0 : Easing.out(Easing.cubic)(clamp((frame - checkAt - 2) / 9));
  const spinOpacity = 1 - clamp(checking * 1.6);
  const angle = frame * 13;
  const checkColor = icon === "check" ? color : SUCCESS;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ flexShrink: 0, overflow: "visible" }}>
      {spinOpacity > 0.01 ? (
        <g opacity={spinOpacity}>
          <circle cx={12} cy={12} r={9} fill="none" stroke={color} strokeOpacity={0.22} strokeWidth={2.6} />
          <circle
            cx={12}
            cy={12}
            r={9}
            fill="none"
            stroke={color}
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeDasharray="16 41"
            transform={`rotate(${angle} 12 12)`}
          />
        </g>
      ) : null}
      {checking > 0.01 ? (
        <g transform={`translate(12 12) scale(${0.6 + 0.4 * checking}) translate(-12 -12)`}>
          <circle cx={12} cy={12} r={11} fill={checkColor} opacity={clamp(checking)} />
          <path
            d="M7.2 12.4 L10.6 15.6 L16.9 8.9"
            fill="none"
            stroke="#ffffff"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={16}
            strokeDashoffset={16 * (1 - draw)}
          />
        </g>
      ) : null}
    </svg>
  );
};

export type ChipProps = {
  label: ReactNode;
  icon?: ChipIcon;
  /** Accent for the spinner / dot / check. */
  color?: string;
  /** Spinner turns into a ✓ at this frame. */
  checkAt?: number;
  enterAt?: number;
  exitAt?: number;
  /** Something before the label, e.g. a tiny mascot. */
  leading?: ReactNode;
  size?: "md" | "lg";
  style?: CSSProperties;
};

/**
 * Dark glass status chip ("Delegated to CFO Bot", "Approved"…). Springs in with a small
 * rise + blur; the spinner keeps turning so the frame is never static.
 */
export const Chip = ({
  label,
  icon = "none",
  color = COLORS.primary,
  checkAt,
  enterAt = 0,
  exitAt,
  leading,
  size = "md",
  style,
}: ChipProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - enterAt, fps, config: { damping: 16, stiffness: 170, mass: 0.7 } });
  const out = exitAt === undefined ? 0 : interpolate(frame, [exitAt, exitAt + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = clamp(p * 1.4) * (1 - out);
  if (opacity <= 0.001) return null;
  const lg = size === "lg";
  const h = lg ? 64 : 54;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: lg ? 14 : 12,
        height: h,
        padding: `0 ${lg ? 28 : 22}px 0 ${lg ? 16 : 14}px`,
        borderRadius: h / 2,
        background: "rgba(20,21,25,0.92)",
        border: "1px solid rgba(255,255,255,0.09)",
        boxShadow: "0 18px 40px -8px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
        fontFamily: FONT_STACK,
        fontSize: lg ? 28 : 24,
        fontWeight: 500,
        letterSpacing: "-0.012em",
        color: COLORS.foreground,
        whiteSpace: "nowrap",
        opacity,
        transform: `translateY(${14 * (1 - p) - 8 * out}px) scale(${0.9 + 0.1 * p})`,
        filter: p < 0.98 || out > 0 ? `blur(${6 * (1 - clamp(p)) + 6 * out}px)` : undefined,
        ...style,
      }}
    >
      {leading}
      <StatusIcon icon={icon} frame={frame} fps={fps} color={color} checkAt={checkAt} size={lg ? 28 : 24} />
      <span>{label}</span>
    </div>
  );
};

/** A chip with a live pulsing dot — "Reading traces…", "Nearing the cap". */
export const StatusPill = (props: Omit<ChipProps, "icon">) => <Chip {...props} icon="dot" />;
