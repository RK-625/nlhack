# Sprint 3 — recovered and rendered

2026-10-12. Current direction: **music + bold on-screen text, no voiceover**.

Review video: [out/sprint3.mp4](out/sprint3.mp4). Video duration 35.000 s (1,050 frames); MP4 container duration 35.008 s due to AAC padding. 1920×1080, 30 fps, H.264 / stereo AAC at 48 kHz. Size 13,959,025 bytes (13.96 MB).

## What is complete

- Scenes 1–2 retain the established dark style and the existing global 1.2× eye enlargement.
- Scene 3: nine specialists orbit Primary Bot, receive labels, connect with curves, and exchange Research/CFO packets. Recovered existing implementation and corrected slow push-in to use the scene's eight-second duration.
- Scene 4: recovered prompt, real screenshot cards, delegation chips, camera move, feathered focus and cost/token counters. Corrected scene-duration push-in and gave the final captured $0.024 / $0.03 and 254k / 300k values a longer hold.
- Scene 5: added pending token-cap approval, curved cursor movement, press/ripple, the real approved capture and a continuation status.
- The existing local “The Last Point” track now plays with composition-length fades. Generated Kokoro clips remain on disk but have no imports or playback path.
- Added a dedicated `Sprint3` composition and `npm run render:sprint3`, using port 3006. Studio remains on 3005.
- Corrected the video ignore rules so `src/data/agents.ts` and `src/data/evidence.ts` are visible to Git; the root `data/` pattern had hidden these required source files.

## Evidence and limits

Scene 5's pending controls are recreated from the real `EscalationCard` in `web/src/shell/MessageBubble.tsx`, with the styling visible in capture 01. The token-limit title and amounts are from capture 21. Its approved state is the original capture 21. This avoids changing from the different dollar-cap run in capture 01 and implying it was the same interaction. This is an animated demonstration, not a continuous screen recording.

The live counter interpolation illustrates values between captures 19 and 20; the endpoints match the evidence. Captures 22/23 are unused. The optional generic tool-approval flash was omitted to keep scene 5 focused.

The full `Main` composition remains 82 seconds, with scenes 6–11 still placeholders. The deliverable here is the first five scenes. Next sprint: Neat Bot return, role permissions, trace diagnosis, measured results, Entire checkpoints and the end card.

The music asset is already present locally and stays gitignored; a fresh checkout requires supplying that asset separately.

## Verification

- `npm run typecheck` passed.
- Visually inspected stills across scenes 1–5, including enlarged eyes, entrance/settled orbit frames, prompt typing/send, delegation, meter endpoints, waiting/click/approved/resumed states.
- Inspected encoded frames at the middle of the 11 s, 19 s and 27 s blur-dissolves.
- `npm run render:sprint3` completed successfully using installed Remotion 4.0.535; no dependency or model downloads.
- `ffprobe` confirmed dimensions, frame rate, duration, frame count and stereo audio.
- Full video decode passed. Decoded music peak −2.58 dBFS, RMS −15.89 dBFS, zero clipped PCM samples.
- No commits, pushes, subagents or edits outside `video/`.

## Four useful stills

- [Intro / larger eyes](out/stills/Sprint3-f300.png)
- [Delegation hub](out/stills/Sprint3-f465.png)
- [Captured cost/token endpoint](out/stills/Sprint3-f800.png)
- [Approval confirmed and work resumed](out/stills/Sprint3-f990.png)

## Files changed in recovery

New scene: `src/scenes/Scene05Guardrails.tsx`.

Updated: `src/scenes/Scene03Team.tsx`, `src/scenes/Scene04RealWork.tsx`, `src/audio/Soundtrack.tsx`, `src/timeline.ts`, `src/Main.tsx`, `src/Root.tsx`, `src/components/ScenePlaceholder.tsx`, `src/components/BlurInText.tsx`, `scripts/render-stills.mjs`, `package.json`, `.gitignore`, `STORYBOARD.md`.

Previously unfinished shared components, cast/evidence tables, enlarged-eye work, and screenshot assets were preserved.

Proposed commit message (not committed): `feat(video): finish sprint 3 with approval flow and music`
