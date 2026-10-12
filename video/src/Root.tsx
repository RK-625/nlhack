import { AbsoluteFill, Composition, Folder } from "remotion";
import { BackdropBase, BackdropFinish } from "./components/Backdrop";
import { CastSheet } from "./dev/CastSheet";
import { Intro, Main } from "./Main";
import { FONT_STACK, VIDEO } from "./theme/tokens";
import { INTRO_SCENES, SCENES, sequenceFrames, totalFrames } from "./timeline";

const base = { fps: VIDEO.fps, width: VIDEO.width, height: VIDEO.height } as const;

/** One scene on the shared backdrop — for focused iteration in the Studio. */
const SoloScene = ({ index }: { index: number }) => {
  const Component = SCENES[index]?.component;
  return (
    <AbsoluteFill style={{ fontFamily: FONT_STACK }}>
      <BackdropBase />
      {Component ? <Component /> : null}
      <BackdropFinish />
    </AbsoluteFill>
  );
};

export const RemotionRoot = () => (
  <>
    <Composition id="Main" component={Main} durationInFrames={totalFrames(SCENES)} {...base} />
    <Composition id="Intro" component={Intro} durationInFrames={totalFrames(INTRO_SCENES)} {...base} />
    <Folder name="Scenes">
      {SCENES.map((scene, i) =>
        scene.component ? (
          <Composition
            key={scene.id}
            id={`Scene-${scene.id}`}
            component={SoloScene}
            defaultProps={{ index: i }}
            durationInFrames={sequenceFrames(SCENES, i)}
            {...base}
          />
        ) : null,
      )}
    </Folder>
    <Folder name="Dev">
      <Composition id="CastSheet" component={CastSheet} durationInFrames={30} {...base} />
    </Folder>
  </>
);
