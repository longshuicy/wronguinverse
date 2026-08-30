// audioManager.ts
// Background music, one looping track at a time.
//
// Deliberately small: load the track for the current tier, loop it, allow
// mute, and fire short one-shot effects. See art guide §11 (music) and §12-13
// (the effect budget and its character).

import { Howl, Howler } from 'howler';
import { musicUrl, trackForTier } from '../content/music.ts';
import { sfxFiles, sfxUrl, type SfxId } from '../content/sfx.ts';
import type { TierId } from '../game/state/types.ts';

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
export function playMusicFor(tier: TierId): void {
  const track = trackForTier(tier);
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

// --- sound effects ---

/**
 * Lazily built Howls, one per variant file.
 *
 * Nothing is fetched until the first effect actually plays, so a muted session
 * never downloads them. They are tiny and cached thereafter.
 */
const sfxPool = new Map<string, Howl>();

/** Round-robin index per effect, so repeats rotate through their variants. */
const variantCursor = new Map<SfxId, number>();

/**
 * How close together the same effect may fire, in ms.
 *
 * Dragging a slider emits an interaction per pixel; without a floor the tick
 * becomes a buzz. Throttling is per effect so a correct-answer chime is never
 * swallowed by a run of ticks.
 */
const THROTTLE_MS: Partial<Record<SfxId, number>> = {
  value_tick: 60,
  semantic_blip: 90,
  ui_click: 40,
  // A Tier 3 refusal plays this, and a refused player presses again straight
  // away — without a throttle the takes stack into a single flat buzz.
  mismatch: 160,
};

const lastPlayed = new Map<SfxId, number>();

const SFX_VOLUME = 0.4;

function loadSfx(file: string): Howl {
  let howl = sfxPool.get(file);
  if (!howl) {
    howl = new Howl({ src: [sfxUrl(file)], volume: SFX_VOLUME, preload: true });
    sfxPool.set(file, howl);
  }
  return howl;
}

/**
 * Play a one-shot effect.
 *
 * Silently does nothing when muted or throttled — a caller should be able to
 * fire this from any game event without first asking whether sound is on.
 */
export function playSfx(id: SfxId): void {
  if (muted) return;

  const throttle = THROTTLE_MS[id];
  if (throttle !== undefined) {
    const now = Date.now();
    const previous = lastPlayed.get(id) ?? 0;
    if (now - previous < throttle) return;
    lastPlayed.set(id, now);
  }

  const files = sfxFiles(id);
  const cursor = (variantCursor.get(id) ?? 0) % files.length;
  variantCursor.set(id, cursor + 1);

  loadSfx(files[cursor]!).play();
}
