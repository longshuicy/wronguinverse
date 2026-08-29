#!/usr/bin/env node
// clean-audio.mjs
//
// Transcodes source music into web-weight loops, the audio counterpart to
// clean-sprites.mjs. See docs/WrongUInverse-art-audio-guide.md §11.
//
// Source tracks arrive as 256-320kbps MP3s of several megabytes each. That is
// mastering quality for something that loops quietly under a puzzle game, and
// three of them would be an 18MB download.
//
//   node scripts/clean-audio.mjs           transcode audio-source/ into public/
//   node scripts/clean-audio.mjs --check   verify the shipped budget (CI)
//
// Uses macOS `afconvert`, which needs no install. Only required when adding a
// track — the transcoded output is committed, so CI and other platforms never
// run the transcode, just the --check.

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'audio-source', 'music');
const OUTPUT_DIR = path.join(ROOT, 'public', 'sound', 'music');

/**
 * 96kbps stereo AAC. These are simple oscillator compositions rather than
 * orchestral recordings, so they survive the reduction well, and the track
 * plays quietly under gameplay.
 */
const BITRATE = 96_000;

/** Fail the check above this, in MB. One track is fetched per session. */
const MAX_TRACK_MB = 3.5;

/** Source filename (any case/spacing) → the slug the game references. */
const SLUGS = {
  'airship serenity': 'airship-serenity',
  'video dungeon boss': 'video-dungeon-boss',
  'club diver': 'club-diver',
};

function slugFor(filename) {
  const base = path.basename(filename, path.extname(filename)).toLowerCase();
  return SLUGS[base] ?? base.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function transcode() {
  if (!existsSync(SOURCE_DIR)) {
    console.error(
      `No audio-source/music/ directory.\n` +
        `Put source tracks there and re-run. Sources stay untracked; the ` +
        `transcoded files in public/sound/music/ are what ship.`,
    );
    process.exitCode = 1;
    return;
  }

  if (process.platform !== 'darwin') {
    console.error(
      'Transcoding needs macOS `afconvert`.\n' +
        'The transcoded tracks are committed, so this is only needed when ' +
        'adding music. Use any encoder that produces ~96kbps AAC .m4a.',
    );
    process.exitCode = 1;
    return;
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  const files = (await readdir(SOURCE_DIR)).filter((f) => /\.(mp3|wav|aiff?|m4a)$/i.test(f)).sort();
  let sourceTotal = 0;
  let outputTotal = 0;

  for (const file of files) {
    const sourcePath = path.join(SOURCE_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, `${slugFor(file)}.m4a`);

    await run('afconvert', [
      '-f',
      'm4af',
      '-d',
      'aac',
      '-b',
      String(BITRATE),
      sourcePath,
      outputPath,
    ]);

    const before = (await stat(sourcePath)).size;
    const after = (await stat(outputPath)).size;
    sourceTotal += before;
    outputTotal += after;

    console.log(
      `  ${path.basename(outputPath).padEnd(28)} ` +
        `${(before / 1024 / 1024).toFixed(1)}MB -> ${(after / 1024 / 1024).toFixed(1)}MB`,
    );
  }

  if (files.length === 0) {
    console.log('No source tracks found.');
    return;
  }

  console.log(
    `\nTranscoded ${files.length} track${files.length === 1 ? '' : 's'}. ` +
      `${(sourceTotal / 1024 / 1024).toFixed(1)}MB -> ${(outputTotal / 1024 / 1024).toFixed(1)}MB ` +
      `(${Math.round((1 - outputTotal / sourceTotal) * 100)}% smaller).`,
  );
}

async function check() {
  if (!existsSync(OUTPUT_DIR)) {
    console.log('No music shipped yet.');
    return;
  }

  const problems = [];
  for (const file of (await readdir(OUTPUT_DIR)).filter((f) => f.endsWith('.m4a'))) {
    const bytes = (await stat(path.join(OUTPUT_DIR, file))).size;
    const mb = bytes / 1024 / 1024;
    if (mb > MAX_TRACK_MB) {
      problems.push(`${file}: ${mb.toFixed(1)}MB, expected under ${MAX_TRACK_MB}MB`);
    }
  }

  // A stray uncompressed source in the shipped folder is the mistake this
  // guards against most.
  for (const file of await readdir(OUTPUT_DIR)) {
    if (/\.(mp3|wav|aiff?)$/i.test(file)) {
      problems.push(`${file}: untranscoded source in public/, run npm run audio:clean`);
    }
  }

  if (problems.length > 0) {
    console.error('Audio is not within budget:\n' + problems.map((p) => `  ${p}`).join('\n'));
    process.exitCode = 1;
    return;
  }

  console.log('All shipped music is within the size budget.');
}

if (process.argv.includes('--check')) await check();
else await transcode();
