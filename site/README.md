# Bot Company site

- Dev: `npm install && npm run dev`. Build: `npm run build` (output in `dist/`, pages `/` and `/judges/`).
- All facts, links and numbers live in `src/content.ts`; replace each `todo("...")` (shown on the page as "Coming soon"). Screenshots go in `public/img/`.
- Render static site: root dir `site`, build command `npm ci && npm run build`, publish directory `dist`.

Live: https://bot-company.onrender.com. The existing Render service builds from
the repository root with `cd site && npm ci && npm run build` and publishes
`site/dist`; pushes to `main` deploy automatically.

The 12 October Northwind evidence is published in `public/evidence/2026-10-12/`.
Its seven PNGs and three JSON exports match the supplied files in
`docs/demo/`; the report and Markdown links are adapted for public hosting.
The folder includes a fresh SHA-256 manifest. Checkpoint counts are pinned to
the commit stored in `repoFacts.ref`, so later commits do not invalidate them.
The export lists checkpoint IDs, not private Entire session contents.

Still needed: demo video/chapters, cfo.ai business plan and screenshots,
Entire screenshot, and #neatHack posts. The repository remains private.
