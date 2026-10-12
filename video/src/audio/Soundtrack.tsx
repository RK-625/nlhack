import { Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
const TRACK = "music/raspberrymusic-the-last-point-beat-electronic-digital-394291.mp3";
/** Existing track, music only. Longer films overlap a repeat with a four-second crossfade. */
export const Soundtrack = () => {
  const { durationInFrames: duration, fps } = useVideoConfig();
  if (duration <= 120 * fps) return <Audio src={staticFile(TRACK)} volume={f => interpolate(f,
    [0, fps * .65, duration - fps * 1.2, duration - 1], [0, .72, .72, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}/>;
  const second = 116 * fps; const remaining = duration - second;
  return <>
    <Sequence durationInFrames={120 * fps} layout="none"><Audio src={staticFile(TRACK)} volume={f=>interpolate(f,
      [0, fps * .65, second, 120 * fps - 1], [0, .72, .72, 0], { extrapolateLeft:"clamp", extrapolateRight:"clamp" })}/></Sequence>
    <Sequence from={second} layout="none"><Audio src={staticFile(TRACK)} volume={f=>interpolate(f,
      [0,4*fps,remaining-1.2*fps,remaining-1],[0,.72,.72,0],{extrapolateLeft:"clamp",extrapolateRight:"clamp"})}/></Sequence>
  </>;
};
