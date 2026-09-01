// zorbletLines.ts
// What Zorblet says, keyed to the state it is already in.
//
// The reaction engine in `game/mascot.ts` has always known what just happened;
// it only ever changed which sprite was drawn. A line costs nothing extra and
// is the difference between a decorative creature and something in the room
// with the player.
//
// TWO HARD RULES, both load-bearing:
//
//   1. Never say anything about what a control MEANS. Not a nudge, not a
//      narrowing, not "have you tried the calendar". Meaning is bought with
//      hints, which are counted and scored (`metrics.ts`), and a mascot that
//      gives the same information away for free would quietly wreck both the
//      economy and the deduction. Zorblet comments on BEHAVIOUR only: how much
//      the player has poked, how the last attempt went, how long it has been.
//   2. Sympathy, never mockery — the rule the whole result screen is built on.
//      Zorblet is on the player's side and finds the terminal as ridiculous as
//      they do.

import type { MascotState } from './assets.ts';

/**
 * Several per state so a long run does not repeat one line at the player.
 * Picked deterministically by `zorbletLine`, never randomly: a line that
 * re-rolled on every render would flicker, and one that re-rolled on every
 * event would read as noise rather than as a reaction.
 */
/**
 * The reaction to the very first control the player moves in exploration.
 *
 * Its own constant rather than a `watching` line because it has a job the
 * rotation cannot do: this is the moment the stage explains itself, and it has
 * to be the line that plays, not one of four that might. Behaviour only, per
 * rule 1 — something answered, it was not what the label promised, and it was
 * free.
 */
export const ZORBLET_FIRST_TOUCH =
  'Something answered. Not what the label promised, but something, and it cost you nothing.';

export const ZORBLET_LINES: Record<MascotState, string[]> = {
  idle: [
    'Nothing has been touched yet. No rush.',
    'The controls are waiting. They can wait all day.',
    'Take a moment. It is not going anywhere.',
  ],
  watching: [
    'Keep going. Something in here answers to you.',
    'That is data. Unhelpful data, but data.',
    'Poke it again. It is not scored.',
    'I have seen operators do worse.',
  ],
  suspicious: ['Something just moved that should not have.', 'The readings went strange. Hold on.'],
  discovery: [
    'That landed.',
    'There. One agreement restored.',
    'Good. The terminal did not expect that.',
  ],
  confused: [
    'That is a few misses now. The control is not being difficult on purpose.',
    'It keeps saying no. It is not personal, and it is not you.',
    'Worth stepping back a moment. The obvious reading is not working.',
  ],
  celebrate: [
    'Dimension stable. Nobody is more surprised than the terminal.',
    'Done. I never doubted you, and I did doubt you.',
  ],
};
