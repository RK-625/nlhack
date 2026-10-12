# Bot Company site

- Dev: `npm install && npm run dev`. Build: `npm run build` (output in `dist/`, pages `/` and `/judges/`).
- All facts, links and numbers live in `src/content.ts`; replace each `todo("...")` (shown on the page as "Coming soon"). Screenshots go in `public/img/`.
- Render static site: root dir `site`, build command `npm ci && npm run build`, publish directory `dist`.

Live: https://bot-company.onrender.com. The existing Render service builds from
the repository root with `cd site && npm ci && npm run build` and publishes
`site/dist`; pushes to `main` deploy automatically.

The 12 October Northwind evidence is published in `public/evidence/2026-10-12/`.
Its 31 PNGs and three JSON exports match the supplied files in
`docs/demo/`; the report and Markdown links are adapted for public hosting.
The folder includes a fresh SHA-256 manifest. Checkpoint counts are pinned to
the commit stored in `repoFacts.ref`, so later commits do not invalidate them.
The export lists checkpoint IDs; the public repository includes source code and commit trailers.

The judges page presents the seven criteria as separate sections with inline
screenshots. Entire uses saved CLI output; built-in-public awaits post links.
Home uses the app avatar shapes, usage popover, approval and cap-card layouts.

The home page plays `public/video/launch.mp4` (160 seconds / 2:40, 1920×1080, 30 fps). The 24-second opener demonstrates missing trace history, uncapped spend and duplicate retries in a labelled illustrative workflow. Primary Bot, Research, GitHub and CFO demonstrations follow, then Neat Bot role-aware investigation, measured results and Entire. The video URL is versioned to refresh browser caches. The MP4 is optimized for streaming with its metadata at the beginning. Built in public links four posts from @rk625dev. A YouTube upload remains optional.
Source: [RK-625/nlhack](https://github.com/RK-625/nlhack).

CFO evidence on `/judges/#cfo` compares the fresh disconnected file-based run (43–47) with the earlier approved cfo.ai MCP write (36–38). Interactive proof highlights retain the original captures. All eight new attachments (40–47) are archived with checksums; 40–42 are excluded from the featured baseline. See `../JUDGE.md`. No financial accuracy or speed advantage is claimed.

Specialist execution evidence: [GitHub and Research task completion, cost, tokens and trace captures](https://bot-company.onrender.com/judges/#execution). Original captures 48–56 and measurement limits are indexed in the evidence folder.
