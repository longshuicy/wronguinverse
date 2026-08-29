#!/usr/bin/env node
// clean-sprites.mjs
//
// Turns raw generated art into production sprites, implementing the cleanup
// pipeline in docs/WrongUInverse-art-audio-guide.md §5 and the sprite rules
// in §8.
//
// Generated art arrives as ~500px illustrations weighing hundreds of KB. Those
// are concept art, not sprites: they are far too heavy for a web game, and
// `image-rendering: pixelated` is actively wrong for them because downscaling
// a high-resolution source by 10x discards pixels instead of averaging. This
// script reduces each one to a logical pixel grid so that `pixelated` becomes
// the correct setting and integer scaling looks crisp.
//
//   node scripts/clean-sprites.mjs           clean everything
//   node scripts/clean-sprites.mjs --check   verify outputs exist and are small
//   node scripts/clean-sprites.mjs --force   re-clean even if up to date
//
// Sources live in art-source/ (untracked); outputs go to public/.

import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'art-source');
const OUTPUT_DIR = path.join(ROOT, 'public');

/**
 * Per-category sprite rules.
 *
 * `size` is the LONGEST side in logical pixels; the other side follows the
 * source aspect ratio. Art guide §8: never force an aspect ratio, and keep
 * character sprites around 24/32/48.
 */
const CATEGORIES = [
  {
    dir: 'creatures',
    // The mascot and creatures are the largest things on screen, so they get
    // the top of the §8 range.
    size: 48,
    colors: 32,
  },
  {
    dir: 'props',
    // Props are background decoration and never larger than a creature.
    size: 32,
    colors: 24,
  },
];

/** Alpha at or above this becomes fully opaque; below it, fully transparent. */
const ALPHA_CUTOFF = 128;

/**
 * Detached blobs smaller than this are deleted as noise.
 *
 * Generated art is full of faint sparkles and dust that survive the downscale
 * as two or three orphaned pixels. Removal is by CONNECTED COMPONENT rather
 * than by neighbour count, so anything joined to the body — Zorblet's thin
 * antennae, a satellite's mast — is kept however spindly it is.
 */
const MIN_COMPONENT_PIXELS = 4;

/** Fail the budget check above this, in KB. A cleaned sprite is a few KB. */
const MAX_SPRITE_KB = 12;

function log(...args) {
  console.log(...args);
}

/**
 * Collapse anti-aliased edges to hard on/off alpha.
 *
 * Downscaling leaves a fringe of semi-transparent pixels. Left alone they blur
 * the silhouette the moment the sprite is scaled back up with `pixelated`,
 * which defeats the point. sharp premultiplies alpha during resize, so the RGB
 * under a surviving edge pixel is already the right colour.
 */
async function hardenAlpha(buffer) {
  const image = sharp(buffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  for (let i = 3; i < data.length; i += info.channels) {
    data[i] = data[i] >= ALPHA_CUTOFF ? 255 : 0;
  }

  despeckle(data, info);

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();
}

/**
 * Erase opaque blobs smaller than `MIN_COMPONENT_PIXELS`, in place.
 *
 * Flood-fills each 8-connected component of opaque pixels and clears the ones
 * too small to be a real feature. Art guide §5 step 3, "simplify noisy
 * details" — at 48px a stray sparkle is indistinguishable from a rendering
 * fault.
 */
function despeckle(data, info) {
  const { width, height, channels } = info;
  const seen = new Uint8Array(width * height);
  const isOpaque = (index) => data[index * channels + 3] === 255;

  for (let start = 0; start < width * height; start += 1) {
    if (seen[start] || !isOpaque(start)) continue;

    // Iterative flood fill; recursion would blow the stack on a large blob.
    const component = [];
    const queue = [start];
    seen[start] = 1;

    while (queue.length > 0) {
      const index = queue.pop();
      component.push(index);
      const x = index % width;
      const y = (index - x) / width;

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const neighbour = ny * width + nx;
          if (seen[neighbour] || !isOpaque(neighbour)) continue;
          seen[neighbour] = 1;
          queue.push(neighbour);
        }
      }
    }

    if (component.length < MIN_COMPONENT_PIXELS) {
      for (const index of component) data[index * channels + 3] = 0;
    }
  }
}

async function cleanOne(sourcePath, outputPath, { size, colors }) {
  const raw = await readFile(sourcePath);

  const resized = await sharp(raw)
    // 1. Crop away the empty margin the generator leaves around the subject.
    //    Threshold is generous: these edges are transparent, not merely pale.
    .trim({ threshold: 10 })
    // 2. Down to the logical grid. lanczos3 keeps the silhouette readable at
    //    this reduction; nearest-neighbour would drop whole features.
    .resize({
      width: size,
      height: size,
      fit: 'inside',
      kernel: 'lanczos3',
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  const hardened = await hardenAlpha(resized);

  // 3. Quantise to a limited palette, which is what makes it read as pixel art
  //    rather than a tiny photograph. Dithering is disabled deliberately: it
  //    scatters stray pixels that look like noise at this size.
  const output = await sharp(hardened)
    .png({ palette: true, colors, dither: 0, effort: 10, compressionLevel: 9 })
    .toBuffer();

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output);

  const meta = await sharp(output).metadata();
  return {
    bytes: output.length,
    width: meta.width,
    height: meta.height,
    sourceBytes: raw.length,
  };
}

/** Records what produced each output, so unchanged sources can be skipped. */
async function loadManifest() {
  const file = path.join(SOURCE_DIR, '.cleaned.json');
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return {};
  }
}

async function saveManifest(manifest) {
  await writeFile(path.join(SOURCE_DIR, '.cleaned.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

async function run({ check, force }) {
  if (check) return runCheck();

  if (!existsSync(SOURCE_DIR)) {
    console.error(
      `No art-source/ directory.\n` +
        `Put raw generated art in art-source/creatures/ and art-source/props/, ` +
        `then re-run. Sources stay untracked; the cleaned sprites in public/ are ` +
        `what ships.`,
    );
    process.exitCode = 1;
    return;
  }

  const manifest = await loadManifest();
  let cleaned = 0;
  let skipped = 0;
  let sourceTotal = 0;
  let outputTotal = 0;

  for (const category of CATEGORIES) {
    const dir = path.join(SOURCE_DIR, category.dir);
    if (!existsSync(dir)) continue;

    const files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith('.png')).sort();

    for (const file of files) {
      const sourcePath = path.join(dir, file);
      const outputPath = path.join(OUTPUT_DIR, category.dir, file);

      const raw = await readFile(sourcePath);
      const hash = createHash('sha1')
        .update(raw)
        .update(JSON.stringify(category))
        .digest('hex')
        .slice(0, 12);

      if (!force && manifest[`${category.dir}/${file}`] === hash && existsSync(outputPath)) {
        skipped += 1;
        continue;
      }

      const result = await cleanOne(sourcePath, outputPath, category);
      manifest[`${category.dir}/${file}`] = hash;
      cleaned += 1;
      sourceTotal += result.sourceBytes;
      outputTotal += result.bytes;

      const from = `${Math.round(result.sourceBytes / 1024)}KB`;
      const to = `${(result.bytes / 1024).toFixed(1)}KB`;
      log(
        `  ${category.dir}/${file.padEnd(32)} ` +
          `${String(result.width).padStart(3)}x${String(result.height).padEnd(3)} ` +
          `${from.padStart(7)} -> ${to.padStart(7)}`,
      );
    }
  }

  await saveManifest(manifest);

  if (cleaned === 0) {
    log(`Nothing to do (${skipped} sprite${skipped === 1 ? '' : 's'} already current).`);
    return;
  }

  const saved = 1 - outputTotal / sourceTotal;
  log(
    `\nCleaned ${cleaned} sprite${cleaned === 1 ? '' : 's'}` +
      (skipped ? `, skipped ${skipped} already current` : '') +
      `. ${Math.round(sourceTotal / 1024)}KB -> ${(outputTotal / 1024).toFixed(1)}KB ` +
      `(${Math.round(saved * 100)}% smaller).`,
  );
}

/**
 * Verifies shipped sprites are actually cleaned.
 *
 * Runs in CI, where art-source/ does not exist — so it checks the OUTPUTS,
 * which is the property that matters: nothing oversized reaches players.
 */
async function runCheck() {
  const problems = [];

  for (const category of CATEGORIES) {
    const dir = path.join(OUTPUT_DIR, category.dir);
    if (!existsSync(dir)) continue;

    for (const file of (await readdir(dir)).filter((f) => f.toLowerCase().endsWith('.png'))) {
      const filePath = path.join(dir, file);
      const { size: bytes } = await stat(filePath);
      const meta = await sharp(filePath).metadata();
      const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
      const label = `${category.dir}/${file}`;

      if (longest > category.size) {
        problems.push(`${label}: ${meta.width}x${meta.height}, expected max ${category.size}px`);
      }
      if (bytes > MAX_SPRITE_KB * 1024) {
        problems.push(`${label}: ${Math.round(bytes / 1024)}KB, expected under ${MAX_SPRITE_KB}KB`);
      }
    }
  }

  if (problems.length > 0) {
    console.error('Sprites are not cleaned:\n' + problems.map((p) => `  ${p}`).join('\n'));
    console.error('\nRun: npm run art:clean');
    process.exitCode = 1;
    return;
  }

  log('All shipped sprites are within the size and weight budget.');
}

await run({
  check: process.argv.includes('--check'),
  force: process.argv.includes('--force'),
});
