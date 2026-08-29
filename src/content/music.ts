// music.ts
// The music manifest and its attribution.
//
// All three tracks are by Kevin MacLeod under Creative Commons BY 4.0, which
// REQUIRES visible attribution wherever the work is used. `MUSIC_CREDITS` is
// rendered in the game, not just recorded here — see the credits panel on the
// intro screen. Do not ship a track without its credit.

import type { DifficultyId } from '../game/difficulty.ts';

export interface MusicTrack {
  /** File slug under public/sound/music. */
  slug: string;
  title: string;
  artist: string;
  licence: string;
  licenceUrl: string;
  sourceUrl: string;
}

export const MUSIC_TRACKS: Record<string, MusicTrack> = {
  'airship-serenity': {
    slug: 'airship-serenity',
    title: 'Airship Serenity',
    artist: 'Kevin MacLeod',
    licence: 'CC BY 4.0',
    licenceUrl: 'http://creativecommons.org/licenses/by/4.0/',
    sourceUrl: 'https://incompetech.com/',
  },
  'video-dungeon-boss': {
    slug: 'video-dungeon-boss',
    title: 'Video Dungeon Boss',
    artist: 'Kevin MacLeod',
    licence: 'CC BY 4.0',
    licenceUrl: 'http://creativecommons.org/licenses/by/4.0/',
    sourceUrl: 'https://incompetech.com/',
  },
  'club-diver': {
    slug: 'club-diver',
    title: 'Club Diver',
    artist: 'Kevin MacLeod',
    licence: 'CC BY 4.0',
    licenceUrl: 'http://creativecommons.org/licenses/by/4.0/',
    sourceUrl: 'https://incompetech.com/',
  },
};

/**
 * Which track scores which tier.
 *
 * The ladder gets less calm as it gets harder: a slow, unhurried piece for the
 * gentle tiers, a dungeon theme in the middle, and something driving at the
 * top. Tiers above those reuse the hardest track rather than going silent.
 */
const TIER_MUSIC: Record<DifficultyId, string> = {
  home: 'airship-serenity',
  slightlyWrong: 'airship-serenity',
  wronger: 'video-dungeon-boss',
  deeplyWrong: 'video-dungeon-boss',
  uxHell: 'club-diver',
  wronguinverse: 'club-diver',
};

export function trackForDifficulty(id: DifficultyId): MusicTrack {
  return MUSIC_TRACKS[TIER_MUSIC[id]] ?? MUSIC_TRACKS['airship-serenity']!;
}

export function musicUrl(track: MusicTrack): string {
  return `${import.meta.env.BASE_URL}sound/music/${track.slug}.m4a`;
}

/** Every credit that must appear in the game. */
export const MUSIC_CREDITS: MusicTrack[] = Object.values(MUSIC_TRACKS);
