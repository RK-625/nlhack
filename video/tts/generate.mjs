#!/usr/bin/env node
/**
 * Bot Company launch video: voiceover generator.
 *
 * Runs Kokoro-82M (full-precision ONNX, CPU) locally through kokoro-js with the
 * `af_heart` voice, one clip per scene, and writes:
 *   ../public/vo/sNN.wav       24 kHz mono 16-bit PCM clips
 *   ../public/vo/manifest.json  [{ file, scene, startSec, durationSec, text, speed, ... }]
 *   ../public/vo/preview.wav    all clips on an 82 s silent timeline (no music)
 *
 * Usage:  cd video/tts && npm install && node generate.mjs
 * The model is cached in ./.cache (gitignored) on first run (~325 MB download).
 */
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { env } from "@huggingface/transformers";
import { KokoroTTS } from "kokoro-js";
import { phonemize } from "phonemizer";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(HERE, "../public/vo");
env.cacheDir = path.join(HERE, ".cache"); // keep every downloaded byte inside video/tts

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const MODEL_ID = "onnx-community/Kokoro-82M-v1.0-ONNX";
const VOICE = "af_heart";
const SR = 24000; // Kokoro native rate
const TOTAL_SEC = 82;

const LEAD_IN_SEC = 0.3; // clip starts this long after the scene starts
const TAIL_OUT_SEC = 0.3; // clip must end this long before the scene ends
const EDGE_PAD_MS = 50; // silence kept at the start and end of every clip
const GAP_ELLIPSIS_MS = 380; // pause inserted at "…"
const GAP_DASH_MS = 300; // pause inserted at "—"

const BASE_SPEED = 1.0;
const MIN_SPEED = 0.92;
const MAX_SPEED = 1.08;
const SPEED_STEP = 0.02;

// Loudness: match speech RMS across clips, never exceed the peak ceiling.
const TARGET_RMS_DBFS = -20;
const PEAK_CEIL_DBFS = -1;

/** Spoken-form overrides (manifest.text always keeps the original line). */
const PRONUNCIATION = [
  [/\bNeatlogs\b/g, "Neat logs"], // espeak says "neat-lahgz"; "Neat logs" -> "neat lawgz"
];

/** Optional per-line starting speed (auto-raised up to MAX_SPEED if the line overflows). */
const SPEED_OVERRIDE = {};

/** Lines where we force an explicit pause between sentences (the model's own gap is ~280 ms). */
const SENTENCE_GAP_MS = { "s11.wav": 420 }; // tagline beat: "Bot Company.  AI that asks before it acts."

const LINES = [
  { file: "s01.wav", scene: 1, from: 0, to: 6, text: "Meet Bot Company." },
  { file: "s02.wav", scene: 2, from: 6, to: 11, text: "A company of AI agents… that asks before it acts." },
  { file: "s03.wav", scene: 3, from: 11, to: 19, text: "Ask the Primary Bot anything. It hands the work to the right specialist." },
  { file: "s04.wav", scene: 4, from: 19, to: 27, text: "Every turn shows its cost and tokens, live." },
  { file: "s05.wav", scene: 5, from: 27, to: 35, text: "Hit a limit, or about to change something? It stops — and asks." },
  { file: "s06.wav", scene: 6, from: 35, to: 40, text: "And watching every run… Neat Bot." },
  { file: "s07.wav", scene: 7, from: 40, to: 50, text: "Employees see only their own runs. Admins see everything — and even their changes need approval." },
  { file: "s08.wav", scene: 8, from: 50, to: 62, text: "When a run fails, Neat Bot reads the Neatlogs trace, finds the cause, and ranks the fixes." },
  { file: "s09.wav", scene: 9, from: 62, to: 70, text: "One fix later, the failure's gone — with a quarter fewer tokens." },
  { file: "s10.wav", scene: 10, from: 70, to: 75, text: "Every change, checkpointed with Entire." },
  { file: "s11.wav", scene: 11, from: 75, to: 82, text: "Bot Company. AI that asks before it acts." },
];

// ---------------------------------------------------------------------------
// DSP helpers (Float32Array, mono)
// ---------------------------------------------------------------------------
const dB = (x) => 20 * Math.log10(Math.max(x, 1e-9));
const fromDb = (d) => 10 ** (d / 20);
const ms = (n) => Math.round((n / 1000) * SR);
const silence = (n) => new Float32Array(n);

const FRAME = ms(5);
const SILENCE_DB = -52; // frames quieter than this count as silence when trimming

function frameRmsDb(a, i) {
  const end = Math.min(i + FRAME, a.length);
  let e = 0;
  for (let k = i; k < end; k++) e += a[k] * a[k];
  return dB(Math.sqrt(e / Math.max(end - i, 1)));
}

/** Remove leading/trailing silence completely, with tiny fades to avoid clicks. */
function trimSilence(a) {
  let s = 0;
  while (s < a.length && frameRmsDb(a, s) < SILENCE_DB) s += FRAME;
  let e = a.length;
  while (e > s && frameRmsDb(a, Math.max(e - FRAME, 0)) < SILENCE_DB) e -= FRAME;
  const out = a.slice(s, Math.max(e, s));
  fade(out, ms(3), ms(8));
  return out;
}

function fade(a, inN, outN) {
  for (let i = 0; i < Math.min(inN, a.length); i++) a[i] *= i / inN;
  for (let i = 0; i < Math.min(outN, a.length); i++) a[a.length - 1 - i] *= i / outN;
}

function concat(parts) {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function stats(a) {
  let peak = 0;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < a.length; i++) peak = Math.max(peak, Math.abs(a[i]));
  const GATE = -45; // speech-active frames only
  for (let i = 0; i + FRAME <= a.length; i += FRAME) {
    if (frameRmsDb(a, i) < GATE) continue;
    for (let k = i; k < i + FRAME; k++) sum += a[k] * a[k];
    n += FRAME;
  }
  return { peakDb: dB(peak), rmsDb: dB(Math.sqrt(sum / Math.max(n, 1))) };
}

/** Internal pauses (>= minMs) between speech, in seconds [start, length]. */
function internalPauses(a, minMs = 150) {
  const res = [];
  let runStart = -1;
  for (let i = 0; i + FRAME <= a.length; i += FRAME) {
    const quiet = frameRmsDb(a, i) < SILENCE_DB;
    if (quiet && runStart < 0) runStart = i;
    if (!quiet && runStart >= 0) {
      if (((i - runStart) / SR) * 1000 >= minMs) res.push([+(runStart / SR).toFixed(2), +((i - runStart) / SR).toFixed(2)]);
      runStart = -1;
    }
  }
  return res.filter(([t]) => t > EDGE_PAD_MS / 1000 + 0.02 && t < a.length / SR - 0.1);
}

// ---------------------------------------------------------------------------
// WAV I/O (16-bit PCM mono)
// ---------------------------------------------------------------------------
function quantize(a) {
  const out = new Int16Array(a.length);
  for (let i = 0; i < a.length; i++) {
    const v = Math.max(-1, Math.min(1, a[i]));
    out[i] = Math.round(v < 0 ? v * 32768 : v * 32767);
  }
  return out;
}

function encodeWav(pcm) {
  const dataBytes = pcm.length * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataBytes, 40);
  Buffer.from(pcm.buffer, pcm.byteOffset, dataBytes).copy(buf, 44);
  return buf;
}

async function verifyWav(file, expectSamples) {
  const b = await fs.readFile(file);
  const ok =
    b.toString("ascii", 0, 4) === "RIFF" &&
    b.toString("ascii", 8, 12) === "WAVE" &&
    b.readUInt16LE(20) === 1 &&
    b.readUInt16LE(22) === 1 &&
    b.readUInt32LE(24) === SR &&
    b.readUInt16LE(34) === 16 &&
    b.readUInt32LE(40) === expectSamples * 2 &&
    b.length === 44 + expectSamples * 2;
  if (!ok) throw new Error(`Invalid WAV written: ${file}`);
}

// ---------------------------------------------------------------------------
// Text handling
// ---------------------------------------------------------------------------
const spoken = (t) => PRONUNCIATION.reduce((s, [re, to]) => s.replace(re, to), t);

/** Split at "…" and "—": the mark stays on the segment end (hanging intonation); gap follows. */
function toSegments(text, sentenceGapMs = 0) {
  const out = [];
  let cur = "";
  for (const ch of text) {
    if (ch === "…" || ch === "—") {
      out.push({ text: (cur + ch).trim(), gapMs: ch === "…" ? GAP_ELLIPSIS_MS : GAP_DASH_MS });
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) out.push({ text: cur.trim(), gapMs: 0 });
  if (!sentenceGapMs) return out;
  // Optionally split further at sentence ends and put an explicit gap between sentences.
  return out.flatMap((seg) => {
    const sentences = seg.text.split(/(?<=[.!?])\s+/);
    return sentences.map((t, i) => ({ text: t, gapMs: i < sentences.length - 1 ? sentenceGapMs : seg.gapMs }));
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
console.log(`Loading ${MODEL_ID} (fp32, cpu) ...`);
const t0 = Date.now();
const tts = await KokoroTTS.from_pretrained(MODEL_ID, { dtype: "fp32", device: "cpu" });
console.log(`Model ready in ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

async function buildClip(line, speed) {
  const segs = toSegments(line.text, SENTENCE_GAP_MS[line.file]);
  const parts = [silence(ms(EDGE_PAD_MS))];
  for (let i = 0; i < segs.length; i++) {
    const { audio, sampling_rate } = await tts.generate(spoken(segs[i].text), { voice: VOICE, speed });
    if (sampling_rate !== SR) throw new Error(`Unexpected sampling rate ${sampling_rate}`);
    parts.push(trimSilence(audio));
    if (segs[i].gapMs) parts.push(silence(ms(segs[i].gapMs)));
  }
  parts.push(silence(ms(EDGE_PAD_MS)));
  return concat(parts);
}

const clips = [];
for (const line of LINES) {
  const startSec = line.from + LEAD_IN_SEC;
  const maxDur = line.to - TAIL_OUT_SEC - startSec;
  let speed = SPEED_OVERRIDE[line.file] ?? BASE_SPEED;
  let samples;
  let fits = false;
  for (;;) {
    samples = await buildClip(line, speed);
    fits = samples.length / SR <= maxDur;
    if (fits || speed >= MAX_SPEED - 1e-9) break;
    speed = Math.min(MAX_SPEED, +(speed + SPEED_STEP).toFixed(2));
  }
  const phon = (await Promise.all(toSegments(line.text, SENTENCE_GAP_MS[line.file]).map((s) => phonemize(spoken(s.text), "en-us")))).map((p) => p.join(" ")).join("  |  ");
  console.log(`${line.file}  speed ${speed.toFixed(2)}  ${(samples.length / SR).toFixed(2)}s / max ${maxDur.toFixed(1)}s  ${fits ? "ok" : "OVERFLOW"}`);
  console.log(`    phonemes: ${phon}`);
  clips.push({ line, startSec, maxDur, speed, fits, samples });
}

// Consistent loudness: same speech RMS everywhere, capped by the peak ceiling.
console.log("\nLoudness (raw -> final)");
for (const c of clips) {
  const raw = stats(c.samples);
  const wantGain = fromDb(TARGET_RMS_DBFS - raw.rmsDb);
  const capGain = fromDb(PEAK_CEIL_DBFS - raw.peakDb);
  const gain = Math.min(wantGain, capGain);
  c.peakLimited = capGain < wantGain;
  for (let i = 0; i < c.samples.length; i++) c.samples[i] *= gain;
  c.pcm = quantize(c.samples);
  c.final = stats(Float32Array.from(c.pcm, (v) => v / 32768));
  console.log(
    `  ${c.line.file}  rms ${raw.rmsDb.toFixed(1)} -> ${c.final.rmsDb.toFixed(1)} dBFS   peak ${raw.peakDb.toFixed(1)} -> ${c.final.peakDb.toFixed(1)} dBFS${c.peakLimited ? "  (peak-limited)" : ""}`,
  );
}

// Write clips, manifest, preview.
await fs.mkdir(OUT_DIR, { recursive: true });
const manifest = [];
const timeline = new Int16Array(Math.round(TOTAL_SEC * SR)); // 16-bit mix, bit-exact with the clips
for (const c of clips) {
  const { line } = c;
  const file = path.join(OUT_DIR, line.file);
  await fs.writeFile(file, encodeWav(c.pcm));
  await verifyWav(file, c.pcm.length);
  const durationSec = +(c.pcm.length / SR).toFixed(3);
  manifest.push({
    file: line.file,
    scene: line.scene,
    startSec: +c.startSec.toFixed(3),
    durationSec,
    text: line.text,
    speed: c.speed,
    endSec: +(c.startSec + durationSec).toFixed(3),
    sceneStartSec: line.from,
    sceneEndSec: line.to,
    sampleRate: SR,
    voice: VOICE,
  });
  const off = Math.round(c.startSec * SR);
  for (let i = 0; i < c.pcm.length && off + i < timeline.length; i++) timeline[off + i] = Math.max(-32768, Math.min(32767, timeline[off + i] + c.pcm[i]));
}
await fs.writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
await fs.writeFile(path.join(OUT_DIR, "preview.wav"), encodeWav(timeline));
await verifyWav(path.join(OUT_DIR, "preview.wav"), timeline.length);

// Report.
console.log("\nscene  file     window        speech slot    dur     slack   speed  internal pauses (start,len s)");
for (const c of clips) {
  const { line } = c;
  const dur = c.pcm.length / SR;
  const pauses = internalPauses(Float32Array.from(c.pcm, (v) => v / 32768))
    .map((p) => `${p[0]}+${p[1]}`)
    .join(" ");
  console.log(
    `${String(line.scene).padStart(3)}    ${line.file}  ${String(line.from).padStart(2)}-${String(line.to).padEnd(2)} s   ${c.startSec.toFixed(1)}-${(line.to - TAIL_OUT_SEC).toFixed(1)} s    ${dur.toFixed(2)}s  ${(c.maxDur - dur).toFixed(2)}s  ${c.speed.toFixed(2)}   ${pauses || "-"}${c.fits ? "" : "   <-- OVERFLOW"}`,
  );
}
const overflow = clips.filter((c) => !c.fits);
console.log(overflow.length ? `\n${overflow.length} clip(s) overflow their window.` : "\nAll clips fit their scene windows.");
console.log(`Wrote ${clips.length} clips + manifest.json + preview.wav to ${OUT_DIR}`);
