import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "../theme/tokens";
import type { TextSegment } from "./BlurInText";
import { BlurInText } from "./BlurInText";

/** Where every scene headline sits: centred, its cap line ~78 px from the top. */
export const HEADLINE = {
  top: 66,
  fontSize: 64,
  /** Bottom of the headline band; content should start below this. */
  bandBottom: 160,
} as const;

export type HeadlineProps = {
  /** ≤ 7 words. Segments let a second sentence come in on a beat (pause) or in a softer tone. */
  text: string | TextSegment[];
  /** Frame the first word starts. */
  start?: number;
  style?: CSSProperties;
};

/**
 * The scene headline: word-by-word blur-in (BlurInText), always at the same spot so
 * the eye knows where to look scene after scene.
 */
export const Headline = ({ text, start = 10, style }: HeadlineProps) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: HEADLINE.top,
        display: "flex",
        justifyContent: "center",
        ...style,
      }}
    >
      <BlurInText
        by="word"
        start={start}
        stagger={2.6}
        duration={16}
        text={text}
        style={{
          fontSize: HEADLINE.fontSize,
          fontWeight: 600,
          letterSpacing: "-0.035em",
          lineHeight: 1.1,
          color: COLORS.foreground,
          textShadow: "0 2px 24px rgba(0,0,0,0.55)",
          whiteSpace: "nowrap",
        }}
      />
    </div>
  </AbsoluteFill>
);

/** Muted tone for the second half of a two-part headline. */
export const SOFT: CSSProperties = { color: COLORS.mutedStrong };
