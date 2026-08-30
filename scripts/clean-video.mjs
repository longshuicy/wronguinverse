#!/usr/bin/env node
// clean-video.mjs
//
// Prepares the shift-transition clip. Sibling of clean-sprites.mjs and
// clean-audio.mjs. See docs/WrongUInverse-art-audio-guide.md §9.
//
// Generated video arrives at full length and full size: 720x544 and several
// megabytes for a clip that is on screen for about two seconds. Trimming it to
// the length of the transition matters far more than the bitrate does.
//
//   node scripts/clean-video.mjs           transcode video-source/ into public/
//   node scripts/clean-video.mjs --check   verify the shipped budget (CI)
//
// Uses macOS `avconvert`, which needs no install. Only required when adding a
// clip: the transcoded output is committed, so CI never runs the transcode.

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const run = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = path.join(ROOT, 'video-source');
const OUTPUT_DIR = path.join(ROOT, 'public', 'animation');

/**
 * Seconds kept. The shift lasts about this long, and every second past it is
 * weight the player never sees.
 */
const DURATION = 2.4;

/** 640x480 H.264: the clip is a blurred background, not something to read. */
const PRESET = 'Preset640x480';

/** The one clip the game references, whatever the source is called. */
const OUTPUT_NAME = 'shift.m4v';

/** Fail the check above this, in MB. */
const MAX_MB = 1.5;

async function transcode() {
  if (!existsSync(SOURCE_DIR)) {
    console.error(
      'No video-source/ directory.\n' +
        'Put the shift clip there and re-run. Sources stay untracked; the ' +
        'transcoded file in public/animation/ is what ships.',
    );
    process.exitCode = 1;
    return;
  }

  if (process.platform !== 'darwin') {
    console.error(
      'Transcoding needs macOS `avconvert`.\n' +
        'The transcoded clip is committed, so this is only needed when ' +
        'replacing it. Any encoder producing a short 640x480 H.264 file works.',
    );
    process.exitCode = 1;
    return;
  }

  const sources = (await readdir(SOURCE_DIR)).filter((f) => /\.(mp4|mov|m4v)$/i.test(f)).sort();
  if (sources.length === 0) {
    console.log('No source clips found.');
    return;
  }
  if (sources.length > 1) {
    console.log(`Using ${sources[0]} (${sources.length} clips present; the first wins).`);
  }

  await mkdir(OUTPUT_DIR, { recursive: true });
  const sourcePath = path.join(SOURCE_DIR, sources[0]);
  const outputPath = path.join(OUTPUT_DIR, OUTPUT_NAME);

  // avconvert refuses to overwrite.
  await rm(outputPath, { force: true });
  await run('avconvert', [
    '-s',
    sourcePath,
    '-p',
    PRESET,
    '-o',
    outputPath,
    '--start',
    '0',
    '--duration',
    String(DURATION),
  ]);

  const before = (await stat(sourcePath)).size;
  const after = (await stat(outputPath)).size;
  console.log(
    `  ${OUTPUT_NAME}  ${(before / 1024 / 1024).toFixed(1)}MB -> ` +
      `${(after / 1024 / 1024).toFixed(1)}MB  (trimmed to ${DURATION}s)`,
  );
}

async function check() {
  if (!existsSync(OUTPUT_DIR)) {
    console.log('No animation shipped yet.');
    return;
  }

  const problems = [];
  for (const file of await readdir(OUTPUT_DIR)) {
    if (!/\.(mp4|mov|m4v)$/i.test(file)) continue;
    const mb = (await stat(path.join(OUTPUT_DIR, file))).size / 1024 / 1024;
    if (mb > MAX_MB) {
      problems.push(`${file}: ${mb.toFixed(1)}MB, expected under ${MAX_MB}MB`);
    }
  }

  if (problems.length > 0) {
    console.error('Animation is not within budget:\n' + problems.map((p) => `  ${p}`).join('\n'));
    console.error('\nRun: npm run video:clean');
    process.exitCode = 1;
    return;
  }

  console.log('Shipped animation is within the size budget.');
}

if (process.argv.includes('--check')) await check();
else await transcode();
