# Bot Company — hackathon product demo

1920×1080 · 30 fps · 160 seconds (2:40) · Remotion · music and bold on-screen text · no voiceover.

The five-minute maximum and labelled reconstructed demos were confirmed by the user. The editable composition remains in Remotion; MP4 is the export format. Dark backgrounds, Geist typography, expressive app mascots, moving packets, cursor actions and matched UI framing stitch the film together.

| Time | Sequence | Visible demonstration |
| --- | --- | --- |
| 0–24 s | Enterprise chaos | Close-up workflow console: three agents working (0–4 s); failed action selection and missing parent trace (4–9 s); uncapped spend climbing (9–14 s); retry click creates duplicate jobs (14–20 s); deadpan mascot reaction (20–24 s). Labelled illustration. |
| 24–30 s | Mascot lineup | Expressive bots introduced, ending on the Neatlogs tile. |
| 30–35 s | Bot Company | Product identity and promise. |
| 35–43 s | Primary Bot | Typed question, delegation, live token and cost meters over captured UI. |
| 43–51 s | Cap and approve | Reconstructed pending controls → cursor approval → captured one-time extension. |
| 51–67 s | Research Bot | Typed company comparison → Crustdata search/enrichment and web search → comparison table → company profile and hiring trend. Labelled illustrative data. |
| 67–83 s | GitHub Bot | Typed release-failure question → repository/actions/log tools → missing environment variable → drafted issue → human approval → created issue. Labelled illustrative data. |
| 83–99 s | CFO Bot | Reconstructed prompt → actual CFO tool/approval capture → saved business plan in cfo.ai. |
| 99–107 s | Department team | Primary Bot connects to eight department specialists; packets travel between them. Neat Bot is introduced separately next. |
| 107–112 s | Meet Neat Bot | Dot-matrix hero animation. |
| 112–128 s | Role-aware investigation | Employee request is scoped to own runs → transition to a separate admin account → all-user results, analytics/detections/triage → open actual failure trace. Reconstructed comparison is labelled. |
| 128–140 s | Diagnose and improve | Actual trace and Neat Bot evidence: failure, duplicated retrieval, ranked shared-context/output-cap recommendations. |
| 140–148 s | Measured results | Observed Northwind token/cost/status comparison and separately labelled CFO file-read sample. |
| 148–153 s | Entire checkpoint | Actual checkpoint and linked commit trail. |
| 153–160 s | End card | Product, mascot lineup, repository and acknowledgements; fade out. |

## Evidence boundaries

Research uses direct Crustdata API tools, not a Crustdata MCP transport. Research companies, GitHub repository/issue, and role comparison users are illustrative. Their reconstructions follow the app's chat styling and tool behaviour; they are not recorded runs. GitHub writes require approval. The employee/admin transition represents different signed-in accounts, not employee self-elevation.

Primary/cap, CFO, Neatlogs diagnosis and trace visuals reuse existing captures from `docs/demo/evidence/2026-10-12`, copied into `public/evidence`. Pending cap controls are reconstructed from `web/src/shell/MessageBubble.tsx` using shot 21 numbers; its approved state is captured evidence. The CFO plan was requested directly from CFO Bot, not delegated by Primary Bot. Shots 22–23 containing the runway miscalculation are unused.

The live token-cap trace and Northwind diagnosis are separate labelled examples. Northwind results are one observed before/after pair: 323,923 → 237,208 tokens (−26.8%), $0.0589567 → $0.0498578 (−15.4%), ERROR → SUCCESS. CFO reads 29 → 10 are a separate three-runs-per-group application-log sample, labelled observational. No general speed or benchmark claim is made. Entire checkpoint `01M4QMYG0STA2ZQR90286XF297` links to commit `8887e9b`.

## Audio and render

Music: “The Last Point” by raspberrymusic (Pixabay). Existing local asset: `public/music/raspberrymusic-the-last-point-beat-electronic-digital-394291.mp3`; standalone track stays gitignored. The 124.584-second track repeats with a four-second crossfade at 116–120 seconds and a final 1.2-second fade. Kokoro assets are unused.

From `video/`: `npm run typecheck`, then `npm run render`. Rendering uses local port 3006 and concurrency 2. Output: `out/launch.mp4`. The prior 146-second cut is preserved as `out/launch-146s-previous.mp4`. The prior 94-second cut is preserved as `out/launch-94s-previous.mp4`. See `FINAL-REVIEW.md` for export validation.
