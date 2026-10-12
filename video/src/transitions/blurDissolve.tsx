import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";
import { AbsoluteFill, interpolate } from "remotion";

export type BlurDissolveProps = {
  /** Peak blur in px at the midpoint. */
  blur?: number;
  /** Scale travel; both scenes drift forward for a sense of motion. */
  zoom?: number;
};

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const BlurDissolvePresentation = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}: TransitionPresentationComponentProps<BlurDissolveProps>) => {
  const blur = passedProps.blur ?? 18;
  const zoom = passedProps.zoom ?? 0.04;
  const entering = presentationDirection === "entering";
  const style = entering
    ? {
        opacity: interpolate(p, [0.15, 0.85], [0, 1], CLAMP),
        filter: `blur(${blur * (1 - p)}px)`,
        transform: `scale(${1 - zoom + zoom * p})`,
      }
    : {
        opacity: interpolate(p, [0.15, 0.85], [1, 0], CLAMP),
        filter: `blur(${blur * p}px)`,
        transform: `scale(${1 + zoom * p})`,
      };
  return <AbsoluteFill style={style}>{children}</AbsoluteFill>;
};

/** Blur-dissolve: no hard cuts — outgoing scene blurs/fades forward, incoming resolves from blur. */
export const blurDissolve = (props: BlurDissolveProps = {}): TransitionPresentation<BlurDissolveProps> => ({
  component: BlurDissolvePresentation,
  props,
});
