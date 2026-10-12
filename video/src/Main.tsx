import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { Fragment } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Soundtrack } from "./audio/Soundtrack";
import { BackdropBase, BackdropFinish } from "./components/Backdrop";
import { ScenePlaceholder } from "./components/ScenePlaceholder";
import { ensureFonts } from "./theme/fonts";
import { FONT_STACK, TRANSITION_FRAMES } from "./theme/tokens";
import type { SceneDef } from "./timeline";
import { INTRO_SCENES, SCENES, sequenceFrames } from "./timeline";
import { blurDissolve } from "./transitions/blurDissolve";

ensureFonts();

/** Scenes in a TransitionSeries joined by blur-dissolves, over one shared backdrop. */
export const SceneSeries = ({ scenes }: { scenes: SceneDef[] }) => {
  const frame = useCurrentFrame();
  const fromBlack = interpolate(frame, [0, 10], [1, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill style={{ fontFamily: FONT_STACK, backgroundColor: "#000" }}>
      <BackdropBase />
      <TransitionSeries>
        {scenes.map((scene, i) => {
          const Component = scene.component;
          return (
            <Fragment key={scene.id}>
              {i > 0 ? (
                <TransitionSeries.Transition
                  presentation={blurDissolve({ blur: 20, zoom: 0.04 })}
                  timing={linearTiming({ durationInFrames: TRANSITION_FRAMES, easing: Easing.inOut(Easing.cubic) })}
                />
              ) : null}
              <TransitionSeries.Sequence durationInFrames={sequenceFrames(scenes, i)} name={scene.id}>
                {Component ? <Component /> : <ScenePlaceholder scene={scene} index={i} />}
              </TransitionSeries.Sequence>
            </Fragment>
          );
        })}
      </TransitionSeries>
      <BackdropFinish />
      <Soundtrack scenes={scenes} />
      {fromBlack > 0 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: fromBlack }} /> : null}
    </AbsoluteFill>
  );
};

/** Full ~82 s launch video (unbuilt scenes render as placeholder cards). */
export const Main = () => <SceneSeries scenes={SCENES} />;

/** Scenes 1–2 only (0–11 s) — the Sprint 2 style test. */
export const Intro = () => <SceneSeries scenes={INTRO_SCENES} />;
