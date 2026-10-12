# Bot Company — launch video storyboard (Sprint 1 draft)

1920×1080 · 30 fps · ~82 s · Remotion · **dark look** (near-black gradient, bot colours as accents) · music bed + short, confident female VO (Kokoro) · on-screen headlines ≤ 7 words. Status: approved 2026-10-12.

Style (from the whatships refs): one idea per scene, word-by-word blur-in headlines, real UI in floating cards with a soft shadow and slow push-in, cursor with click ripples, blur-dissolve transitions (never hard cuts), a whoosh at each scene change. Mascots = the app's own bot avatars (gradient shapes with capsule eyes); Neat Bot = the Neatlogs dot-matrix "nl" tile.

| # | Time | Scene (visual) | On-screen text | Voiceover |
|---|------|----------------|----------------|-----------|
| 1 | 0–6s | **Mascot lineup** (MausBot style). The camera dollies along the row of bots and each one gets a beat with its own expression: Primary Bot (violet hex) first, then the specialists. The last stop is **Neat Bot**: its dots spring together into the "nl" tile, it blinks, and it holds as the final hero pose. | — | "Meet Bot Company." |
| 2 | 6–11s | **Title.** "Bot Company" blurs in glyph by glyph, then the subtitle word by word. The bots pop up from the bottom edge, staggered. | **Bot Company** / A company of AI agents that asks before it acts. | "A company of AI agents… that asks before it acts." |
| 3 | 11–19s | **The team.** Primary Bot in the centre; 9 specialists orbit, then connect to it with curved lines (delegation hub). Each label pops: Research · CFO · GitHub · Legal · Sales · … | One assistant. Nine specialists. | "Ask the Primary Bot anything. It hands the work to the right specialist." |
| 4 | 19–27s | **Real work, real UI.** App card (sidebar + chat). A prompt pill types the US-expansion question. "Delegated to Research Bot / CFO Bot" chips tick in. The cost and token meters climb. *(shots 19, 20)* | Real work. Live costs. | "Every turn shows its cost and tokens, live." |
| 5 | 27–35s | **Guardrails.** The cap card slides up ("302k / 300k tokens"). The cursor clicks **Approve**, which turns into "One-time extension granted". Quick flash of the Approve/Deny tool card. *(shots 21, 16, 01)* | Nothing happens without you. | "Hit a limit, or about to change something? It stops — and asks." |
| 6 | 35–40s | **Neat Bot returns.** The "nl" tile from the intro bursts back into dots, which reassemble into Neat Bot in the app sidebar. A status chip reads "Reading traces…". | Meet Neat Bot. | "And watching every run… Neat Bot." |
| 7 | 40–50s | **Employee vs Admin** split screen with the same question on both sides. Left (Employee): own traces only; asking for project analytics returns "not available to you". Right (Admin): all traces, analytics, detections and triage, and a triage change still shows an Approve card. *(new captures)* | Employees: own runs. Admins: everything. | "Employees see only their own runs. Admins see everything — and even their changes need approval." |
| 8 | 50–62s | **It debugs your agents.** Neatlogs trace dashboard: a red ERROR run *(shot 17)*. Push into the Neat Bot chat: verdict, then waste found, then ranked fixes *(shots 08 → 10 → 11)*. A checklist ticks. | It reads every trace. | "When a run fails, Neat Bot reads the Neatlogs trace, finds the cause, and ranks the fixes." |
| 9 | 62–70s | **Fixed. Measured.** Animated counters: ERROR becomes SUCCESS; tokens 323,923 → 237,208 (−26.8%); cost −15.4%; CFO file reads 29 → 10. Small footnote: "same task, before vs after". *(shots 12, 18)* | One fix. Measured. | "One fix later, the failure's gone — with a quarter fewer tokens." |
| 10 | 70–75s | **Built with receipts.** An Entire checkpoint card slides in over a commit timeline. | Every change, checkpointed. | "Every change, checkpointed with Entire." |
| 11 | 75–82s | **End card.** The bots line up again (the same pose as scene 1, so it loops). "Try Bot Company" with the Primary Bot tile, then a URL pill github.com/RK-625/nlhack, then "Built for neatHack 2026 · Neatlogs · Entire · cfo.ai". Fade out. | Try Bot Company | "Bot Company. AI that asks before it acts." |

## Honesty guardrails
- No speed claims: the after runs were not faster.
- The before/after numbers are labelled as one task / our runs, not a benchmark.
- The approved answer's text (shots 22–23) is never zoomed in, because it contains a runway miscalculation.

## Asset plan
- **Existing screenshots:** docs/demo/evidence/2026-10-12 (17, 19, 20, 21, 16, 01, 08, 10, 11, 12, 18).
- **New captures** (from a local copy of the app signed in as admin and as employee):
  - the sidebar with the new Neat Bot avatar;
  - Employee vs Admin asking Neat Bot the same question;
  - an admin triage change behind an Approve card.
- **Mascots:** rebuilt in Remotion from the real avatar shapes and colours (web/src/lib/avatar).
- **Audio:** a Pixabay track (you choose from 3) + Kokoro VO + whoosh/click SFX.
