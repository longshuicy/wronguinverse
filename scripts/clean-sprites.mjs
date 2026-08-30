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
    // 96, not the 48 this started at. At 48 the downscale destroyed Zorblet's
    // antennae outright — they thinned below one pixel, broke into fragments,
    // and the despeckle then swept the fragments away. Magnifying what was
    // left just produced large soft blobs, which is what "blurry" actually
    // means here: the detail was lost on the way DOWN, not on the way up.
    size: 96,
    colors: 16,
    sharpen: 2,
    saturation: 1.35,
    contrast: 1.5,
    outline: true,
  },
  {
    dir: 'props',
    // Props are card decoration. Fixed HEIGHT rather than longest side, so a
    // row of them lines up: a wide satellite and a tall crystal are the same
    // height and differ only in width.
    height: 32,
    colors: 12,
    sharpen: 2,
    saturation: 1.35,
    contrast: 1.5,
    outline: true,
  },
];

/** Outline colour: near the page black, so it reads as a silhouette edge. */
const OUTLINE_RGB = [9, 11, 24];

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
const MAX_SPRITE_KB = 16;

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
async function hardenAlpha(buffer, { outline = false } = {}) {
  const image = sharp(buffer).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  for (let i = 3; i < data.length; i += info.channels) {
    data[i] = data[i] >= ALPHA_CUTOFF ? 255 : 0;
  }

  despeckle(data, info);
  if (outline) addOutline(data, info);

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

/**
 * Grow a one-pixel dark edge around the silhouette.
 *
 * A hard outline is the strongest single signal that something is pixel art
 * rather than a small photograph: it gives the shape a definite boundary
 * instead of letting it fade into the background.
 */
function addOutline(data, info) {
  const { width, height, channels } = info;
  const before = Buffer.from(data);
  const opaque = (x, y) =>
    x >= 0 && y >= 0 && x < width && y < height && before[(y * width + x) * channels + 3] === 255;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels;
      if (before[i + 3] === 255) continue;
      if (!(opaque(x - 1, y) || opaque(x + 1, y) || opaque(x, y - 1) || opaque(x, y + 1))) continue;
      data[i] = OUTLINE_RGB[0];
      data[i + 1] = OUTLINE_RGB[1];
      data[i + 2] = OUTLINE_RGB[2];
      data[i + 3] = 255;
    }
  }
}

async function cleanOne(sourcePath, outputPath, category) {
  const { size, height, colors, sharpen, saturation, contrast, outline } = category;
  const raw = await readFile(sourcePath);

  let pipeline = sharp(raw)
    // 1. Crop away the empty margin the generator leaves around the subject.
    //    Threshold is generous: these edges are transparent, not merely pale.
    .trim({ threshold: 10 })
    // 2. Down to the logical grid. lanczos3 keeps the silhouette readable at
    //    this reduction; nearest-neighbour would drop whole features.
    .resize(
      height
        ? { height, kernel: 'lanczos3', withoutEnlargement: true }
        : {
            width: size,
            height: size,
            fit: 'inside',
            kernel: 'lanczos3',
            withoutEnlargement: true,
          },
    );

  // 3. Restore the edge definition lanczos softens. Without this the result is
  //    technically on-grid but every boundary is a gradient, which magnifies
  //    into mush rather than into pixels.
  if (sharpen) pipeline = pipeline.sharpen({ sigma: sharpen });

  // 4. Flatten the shading into bands. Generated art is smoothly lit, and a
  //    smooth gradient shrunk down reads as a tiny photograph however square
  //    its pixels are. Lifting contrast and saturation before quantising is
  //    what turns that gradient into the deliberate ramps pixel art is made
  //    of — this, not the pixel size, is what "crisp" actually means here.
  if (saturation && saturation !== 1) pipeline = pipeline.modulate({ saturation });
  if (contrast && contrast !== 1) {
    pipeline = pipeline.linear(contrast, -(128 * contrast) + 128);
  }

  const hardened = await hardenAlpha(await pipeline.png().toBuffer(), { outline });

  // 4. Quantise to a limited palette, which is what makes it read as pixel art
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
      const label = `${category.dir}/${file}`;

      if (category.height) {
        if (meta.height !== category.height) {
          problems.push(`${label}: ${meta.height}px tall, expected exactly ${category.height}px`);
        }
      } else {
        const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
        if (longest > category.size) {
          problems.push(`${label}: ${meta.width}x${meta.height}, expected max ${category.size}px`);
        }
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
