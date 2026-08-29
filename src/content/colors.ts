// colors.ts
// The colour palette a colour domain draws from.
//
// Every entry carries a fictional alias as its player-facing name. The design
// doc is explicit that the player should never need exact RGB knowledge — they
// match "GLIMMER VIOLET", not "#b46cff".
// See docs/WrongUInverse-technical-design.md §6.

export interface ColorValue {
  hex: string;
  /** Ordinary colour name, kept for authoring clarity — not shown to players. */
  name: string;
  /** The in-fiction label the player actually reads. */
  alias: string;
}

/**
 * Drawn from the art direction palette so generated colours sit inside the
 * game's own visual language rather than clashing with it.
 * See docs/WrongUInverse-art-audio-guide.md §7.
 */
export const COLOR_PALETTE: ColorValue[] = [
  { hex: '#b46cff', name: 'violet', alias: 'GLIMMER VIOLET' },
  { hex: '#ffc857', name: 'amber', alias: 'FLUX AMBER' },
  { hex: '#72f2c2', name: 'mint', alias: 'QUASAR MINT' },
  { hex: '#ff6b72', name: 'coral', alias: 'VOID PEACH' },
  { hex: '#38e8ff', name: 'cyan', alias: 'ORBITAL BLUE' },
  { hex: '#c8ff4d', name: 'lime', alias: 'REACTOR LIME' },
  { hex: '#f4f2e8', name: 'bone', alias: 'PALE STATIC' },
  { hex: '#8a7bff', name: 'indigo', alias: 'NEBULA INDIGO' },
  { hex: '#ff9f4d', name: 'orange', alias: 'EMBER RUST' },
  { hex: '#4dd4a0', name: 'jade', alias: 'DRIFT JADE' },
];

/**
 * Decorative swatches used when a colour-picker-shaped control is driven by a
 * domain that has nothing to do with colour.
 *
 * The control still has to look like a colour picker while it is secretly
 * choosing a date, so each position needs *a* colour — one with no meaning.
 */
export const DECORATIVE_SWATCHES: string[] = [
  '#38e8ff',
  '#b46cff',
  '#c8ff4d',
  '#ffc857',
  '#ff6b72',
  '#72f2c2',
  '#8a7bff',
  '#ff9f4d',
  '#4dd4a0',
  '#f4f2e8',
  '#6f7ba8',
  '#2b3a6b',
];

/** True when a value looks like a `ColorValue`. Shape check, not a type test. */
export function isColorValue(value: unknown): value is ColorValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ColorValue).hex === 'string' &&
    typeof (value as ColorValue).alias === 'string'
  );
}
