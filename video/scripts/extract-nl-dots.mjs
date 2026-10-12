// Samples the Neatlogs "nl" logo (public/neatlogs-nl.png) into a dot grid so the video can
// animate each dot. Pure Node (zlib) PNG decoding: 8-bit RGB/RGBA, non-interlaced only.
// Output: src/assets/nl-dots.ts (generated — re-run `npm run dots` if the PNG changes).
import { readFileSync, writeFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const png = readFileSync(join(root, "public/neatlogs-nl.png"));

let pos = 8;
let width = 0;
let height = 0;
let colorType = 0;
const idat = [];
while (pos < png.length) {
  const len = png.readUInt32BE(pos);
  const type = png.toString("ascii", pos + 4, pos + 8);
  const data = png.subarray(pos + 8, pos + 8 + len);
  if (type === "IHDR") {
    width = data.readUInt32BE(0);
    height = data.readUInt32BE(4);
    const bitDepth = data[8];
    colorType = data[9];
    if (bitDepth !== 8 || data[12] !== 0) throw new Error("only 8-bit non-interlaced PNGs");
  } else if (type === "IDAT") idat.push(data);
  else if (type === "IEND") break;
  pos += 12 + len;
}
const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
if (!bpp) throw new Error(`unsupported color type ${colorType}`);
const raw = inflateSync(Buffer.concat(idat));
const stride = width * bpp;
const px = Buffer.alloc(height * stride);
for (let y = 0; y < height; y++) {
  const filter = raw[y * (stride + 1)];
  for (let x = 0; x < stride; x++) {
    const v = raw[y * (stride + 1) + 1 + x];
    const a = x >= bpp ? px[y * stride + x - bpp] : 0;
    const b = y > 0 ? px[(y - 1) * stride + x] : 0;
    const c = x >= bpp && y > 0 ? px[(y - 1) * stride + x - bpp] : 0;
    let out = v;
    if (filter === 1) out = v + a;
    else if (filter === 2) out = v + b;
    else if (filter === 3) out = v + ((a + b) >> 1);
    else if (filter === 4) {
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      out = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
    }
    px[y * stride + x] = out & 255;
  }
}
const rgb = (x, y) => {
  const i = y * stride + x * bpp;
  return [px[i], px[i + 1], px[i + 2]];
};
const lum = (x, y) => {
  const [r, g, b] = rgb(x, y);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// The dots sit on a regular grid (~4.4 px pitch) and their anti-aliased edges touch, so blob
// detection merges them. Fit the grid instead: search pitch/offset per axis that maximises the
// brightness sampled at grid points, keep the bright cells, then refine each centre with a
// brightness-weighted centroid.
const bilinear = (fx, fy) => {
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const tx = fx - x0, ty = fy - y0;
  if (x0 < 0 || y0 < 0 || x0 + 1 >= width || y0 + 1 >= height) return 0;
  return (
    lum(x0, y0) * (1 - tx) * (1 - ty) + lum(x0 + 1, y0) * tx * (1 - ty) +
    lum(x0, y0 + 1) * (1 - tx) * ty + lum(x0 + 1, y0 + 1) * tx * ty
  );
};
const fitAxis = (axis) => {
  // brightness profile along the axis, using only bright pixels (contrast of dots vs gaps)
  const n = axis === "x" ? width : height;
  const prof = new Float64Array(n);
  for (let a = 0; a < n; a++)
    for (let b = 0; b < (axis === "x" ? height : width); b++) {
      const v = axis === "x" ? lum(a, b) : lum(b, a);
      if (v > 120) prof[a] += v;
    }
  let best = { pitch: 0, offset: 0, score: -Infinity };
  for (let pitch = 3.8; pitch <= 5.0; pitch += 0.005)
    for (let offset = 0; offset < pitch; offset += 0.05) {
      let sc = 0;
      for (let c = offset; c < n - 1; c += pitch) {
        const i = Math.floor(c), t = c - i;
        sc += prof[i] * (1 - t) + prof[i + 1] * t;
        // penalise the gap halfway between dots
        const g = c + pitch / 2;
        if (g < n - 1) { const j = Math.floor(g), u = g - j; sc -= prof[j] * (1 - u) + prof[j + 1] * u; }
      }
      if (sc > best.score) best = { pitch, offset, score: sc };
    }
  return best;
};
const gx = fitAxis("x");
const gy = fitAxis("y");
const THRESH = 150;
let dots = [];
for (let cy = gy.offset; cy < height; cy += gy.pitch)
  for (let cx = gx.offset; cx < width; cx += gx.pitch) {
    if (bilinear(cx, cy) < THRESH) continue;
    let sx = 0, sy = 0, sw = 0;
    for (let y = Math.floor(cy - 2); y <= Math.ceil(cy + 2); y++)
      for (let x = Math.floor(cx - 2); x <= Math.ceil(cx + 2); x++) {
        if (x < 0 || y < 0 || x >= width || y >= height) continue;
        if ((x - cx) ** 2 + (y - cy) ** 2 > 4.5) continue;
        const w = Math.max(0, lum(x, y) - 120);
        sx += x * w; sy += y * w; sw += w;
      }
    // pixel centres are at +0.5
    dots.push({ x: sw ? sx / sw + 0.5 : cx + 0.5, y: sw ? sy / sw + 0.5 : cy + 0.5 });
  }
const pitch = (gx.pitch + gy.pitch) / 2;
const radius = pitch * 0.5;
console.log("grid", gx, gy);
const corner = (x, y) => "#" + rgb(x, y).map((v) => v.toString(16).padStart(2, "0")).join("");

const out = `// GENERATED by scripts/extract-nl-dots.mjs from public/neatlogs-nl.png — do not edit by hand.
/** Dot centres of the Neatlogs "nl" dot-matrix mark, in the PNG's ${width}x${height} pixel space. */
export const NL_SOURCE_SIZE = ${width};
export const NL_DOT_RADIUS = ${radius.toFixed(2)};
export const NL_TILE_COLORS = {
  topLeft: "${corner(2, 2)}",
  topRight: "${corner(width - 3, 2)}",
  bottomLeft: "${corner(2, height - 3)}",
  bottomRight: "${corner(width - 3, height - 3)}",
  center: "${corner(width >> 1, 30)}",
} as const;
export const NL_DOTS: ReadonlyArray<readonly [number, number]> = [
${dots.map((d) => `  [${d.x.toFixed(2)}, ${d.y.toFixed(2)}],`).join("\n")}
];
`;
writeFileSync(join(root, "src/assets/nl-dots.ts"), out);
console.log(`${dots.length} dots, pitch ${pitch.toFixed(2)}, radius ${radius.toFixed(2)}, size ${width}x${height}`);
