// music.ts
// The music manifest and its attribution.
//
// All three tracks are by Kevin MacLeod under Creative Commons BY 4.0, which
// REQUIRES visible attribution wherever the work is used. `MUSIC_CREDITS` is
// rendered in the game, not just recorded here — see the credits panel on the
// intro screen. Do not ship a track without its credit.

import type { TierId } from '../game/state/types.ts';

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
 * Which track scores which TIER — one per tier, not per level.
 *
 * It used to follow the level, on the reasoning that the level is what the
 * player picks and what lasts a session. But so is the tier, and the two axes
 * are not the same kind of thing: the tier is what a run IS (which agreement
 * lapsed), the level is only how much of it there is. Music is identity, not
 * quantity — scoring the control count meant three different universes sounded
 * identical while three helpings of the same universe did not.
 *
 * It also earns its keep on the landing page, which has to teach that these
 * axes are independent: choosing a tier changes what you hear and choosing a
 * level does not, so the page says it before anybody reads a word.
 *
 * The score gets less settled as the drift reaches further down.
 */
const TIER_MUSIC: Record<TierId, string> = {
  1: 'airship-serenity',
  2: 'video-dungeon-boss',
  3: 'club-diver',
};

export function trackForTier(id: TierId): MusicTrack {
  return MUSIC_TRACKS[TIER_MUSIC[id]] ?? MUSIC_TRACKS['airship-serenity']!;
}

export function musicUrl(track: MusicTrack): string {
  return `${import.meta.env.BASE_URL}sound/music/${track.slug}.m4a`;
}

/** Every credit that must appear in the game. */
export const MUSIC_CREDITS: MusicTrack[] = Object.values(MUSIC_TRACKS);
