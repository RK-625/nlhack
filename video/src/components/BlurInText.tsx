import type { CSSProperties } from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { FONT_STACK, SPRINGS, TEXT_REVEAL } from "../theme/tokens";

export type TextSegment = {
  text: string;
  style?: CSSProperties;
  /** Extra frames before this segment starts (a beat for the voiceover). */
  pause?: number;
};

export type BlurInTextProps = {
  text: string | TextSegment[];
  /** Reveal per glyph (headlines) or per word (sentences). */
  by?: "glyph" | "word";
  /** Frame the first unit starts. */
  start?: number;
  stagger?: number;
  duration?: number;
  blur?: number;
  rise?: number;
  style?: CSSProperties;
};

type Unit = { key: string; text: string; style?: CSSProperties; delay: number; space: boolean };

/**
 * whatships-style reveal: each glyph/word fades in from blur(8px) and ~20px lower,
 * with a ~70 ms stagger. Spaces are kept as real text so line-breaking and spacing hold.
 */
export const BlurInText = ({
  text,
  by = "word",
  start = 0,
  stagger = TEXT_REVEAL.staggerFrames,
  duration = TEXT_REVEAL.durationFrames,
  blur = TEXT_REVEAL.blur,
  rise = TEXT_REVEAL.rise,
  style,
}: BlurInTextProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const segments: TextSegment[] = typeof text === "string" ? [{ text }] : text;

  const units: Unit[] = [];
  let index = 0;
  let extra = 0;
  segments.forEach((seg, s) => {
    extra += seg.pause ?? 0;
    const parts = by === "glyph" ? Array.from(seg.text) : seg.text.split(/(\s+)/).filter(Boolean);
    parts.forEach((part, p) => {
      const space = /^\s+$/.test(part);
      units.push({ key: `${s}-${p}`, text: part, style: seg.style, delay: index * stagger + extra, space });
      if (!space) index++;
    });
  });

  return (
    <span style={{ fontFamily: FONT_STACK, display: "inline-block", ...style }}>
      {units.map((u) => {
        if (u.space) {
          return (
            <span key={u.key} style={{ whiteSpace: "pre", ...u.style }}>
              {u.text}
            </span>
          );
        }
        const t = frame - start - u.delay;
        const p = interpolate(t, [0, duration], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        });
        const y = rise * (1 - spring({ frame: t, fps, config: SPRINGS.smooth, durationInFrames: duration + 6 }));
        const opacity = interpolate(t, [0, duration * 0.7], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <span
            key={u.key}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              transform: `translateY(${y}px)`,
              filter: p < 1 ? `blur(${blur * (1 - p)}px)` : undefined,
              opacity,
              ...u.style,
            }}
          >
            {u.text}
          </span>
        );
      })}
    </span>
  );
};
