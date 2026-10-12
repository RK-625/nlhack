// Bundle once, then render several stills for review.
// Usage: npm run stills -- [CompositionId] [frame,frame,...]
//   npm run stills                       -> Intro @ 0,30,75,120,150,170,200,240,300,329
//   npm run stills -- Intro 140,160,180
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const compositionId = process.argv[2] ?? "Intro";
const frames = (process.argv[3] ?? "0,30,75,120,150,170,200,240,300,329").split(",").map(Number);
const outDir = join(root, "out/stills");
mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: join(root, "src/index.ts"), publicDir: join(root, "public") });
const composition = await selectComposition({ serveUrl, id: compositionId, chromiumOptions: { gl: "angle" } });
for (const frame of frames) {
  const output = join(outDir, `${compositionId}-f${String(frame).padStart(3, "0")}.png`);
  await renderStill({ serveUrl, composition, frame, output, chromiumOptions: { gl: "angle" } });
  console.log(output);
}
