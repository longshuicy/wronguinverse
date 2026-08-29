// audioManager.ts
// Background music, one looping track at a time.
//
// Deliberately small: load the track for the current tier, loop it, allow mute.
// Sound effects are not here yet — the art guide (§14) suggests generating them
// procedurally with Web Audio rather than shipping more files.

import { Howl, Howler } from 'howler';
import { musicUrl, trackForDifficulty, type MusicTrack } from '../content/music.ts';
import type { DifficultyId } from '../game/difficulty.ts';

let current: { howl: Howl; slug: string } | null = null;
let muted = false;

/** Fade length, long enough not to click when switching tiers. */
const FADE_MS = 600;
const VOLUME = 0.35;

/**
 * Start (or switch to) the track for a tier.
 *
 * Loading is deferred to this call rather than done up front: a track is a
 * couple of megabytes, and a session only ever needs the one for the tier being
 * played. Browsers block audio until a user gesture, so this must be called
 * from a click — starting a run is the natural moment.
 */
export function playMusicFor(difficulty: DifficultyId): void {
  const track = trackForDifficulty(difficulty);
  if (current?.slug === track.slug) return;

  stopMusic();

  const howl = new Howl({
    src: [musicUrl(track)],
    loop: true,
    volume: 0,
    html5: true, // stream rather than decoding megabytes into memory first
  });

  current = { howl, slug: track.slug };
  if (muted) return;

  howl.play();
  howl.fade(0, VOLUME, FADE_MS);
}

export function stopMusic(): void {
  if (!current) return;
  const { howl } = current;
  current = null;
  howl.fade(howl.volume(), 0, FADE_MS);
  // Unload after the fade so the file is not held in memory for the rest of
  // the session; a stopped track is usually a tier the player has left.
  setTimeout(() => {
    howl.stop();
    howl.unload();
  }, FADE_MS);
}

export function setMuted(next: boolean): void {
  muted = next;
  Howler.mute(next);

  // Honour a late unmute: the track may have been created while muted and so
  // never started playing.
  if (!next && current && !current.howl.playing()) {
    current.howl.play();
    current.howl.fade(0, VOLUME, FADE_MS);
  }
}

export function isMuted(): boolean {
  return muted;
}

/** The track currently scheduled, for the credit line shown while playing. */
export function currentTrack(difficulty: DifficultyId): MusicTrack {
  return trackForDifficulty(difficulty);
}
