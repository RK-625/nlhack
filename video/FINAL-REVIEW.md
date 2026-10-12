# Product demo review — 2026-10-12

Current composition: **160 seconds · 4,800 frames · 1920×1080 · 30 fps**. Music only; no voiceover. Exact scene order and evidence boundaries are in `STORYBOARD.md`.

## Changes

- Extended 24-second enterprise-chaos demonstration in a close-up workflow console: missing trace history, uncapped spend, duplicate retries and a deadpan mascot reaction.
- Separate Research and GitHub chat demonstrations with visible tool activity, results and GitHub write approval; illustrative data labelled throughout.
- CFO demonstration moved into the specialist sequence, with an animated prompt leading into real tool, approval and saved-plan captures.
- Department-wide packet animation; Neat Bot introduced afterward.
- Employee/admin text-only scene replaced by an animated investigation: own-user scope, a separate signed-in admin account, all-user results, project tools and an actual trace.
- Continuous music across the longer timeline using a four-second crossfade.

## Validation

- TypeScript: passed after the opener revision.
- Revised opener stills: checked task selection, inspector, cost phase, retry sequence and mascot reaction; corrected click alignment and removed overlapping warning copy.
- Full render: passed; 160.000 seconds, H.264 1920×1080, 30 fps, 4,800 frames; AAC stereo 48 kHz; 43,029,351 bytes.
- Full video and audio decode: passed without errors.
- Encoded frames: inspected cost explanation, retry click and transition into the existing mascot introduction.
- Audio signal: no clipped samples; crossfade and final fade checked. Measurements are in `out/opening-review/audio-check.json`.
- Final review copy: `out/launch-clear-opening.mp4`. Main output is also updated at `out/launch.mp4`. Focused 24-second opener: `out/opening-demo.mp4`.

Only `video/` was edited. The rest of the narrative and scene durations are unchanged. The old 146-second version is retained as `out/launch-146s-previous.mp4`. No application changes, live external writes, commits or pushes.
