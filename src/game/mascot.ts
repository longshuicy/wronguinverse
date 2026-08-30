// mascot.ts
// Zorblet's reaction engine.
//
// A small finite state derived from what just happened — deliberately not a
// character AI (technical design §15). The one hard rule from the design docs:
// giving up gets sympathy, never mockery.
// Mapping from docs/WrongUInverse-technical-design.md §19.

import type { MascotState } from '../content/assets.ts';
import { ZORBLET_LINES } from '../content/zorbletLines.ts';
import type { GameEvent, RunOutcome, StageId } from './state/types.ts';

/** How many trailing challenge attempts must miss before Zorblet looks worried. */
const CONFUSION_STREAK = 4;

export function mascotState(stage: StageId, outcome: RunOutcome, events: GameEvent[]): MascotState {
  if (stage === 'result') {
    return outcome === 'stabilized' ? 'celebrate' : 'confused';
  }

  if (stage === 'shift') return 'suspicious';
  if (stage === 'normal' || stage === 'intro') return 'idle';

  const attempts = events.filter((event) => event.type === 'challenge_attempt');
  const last = attempts[attempts.length - 1];

  // A requirement just landed.
  if (last?.type === 'challenge_attempt' && last.correct) return 'discovery';

  // Repeatedly entering values that do not land — the player is probably still
  // treating the control as if it meant the conventional thing.
  const trailing = attempts.slice(-CONFUSION_STREAK);
  if (
    trailing.length === CONFUSION_STREAK &&
    trailing.every((event) => event.type === 'challenge_attempt' && !event.correct)
  ) {
    return 'confused';
  }

  const hasInteracted = events.some((event) => event.type === 'interaction');
  return hasInteracted ? 'watching' : 'idle';
}

/** Short caption for assistive tech; never narrates the answer. */
export function mascotAltText(state: MascotState): string {
  switch (state) {
    case 'celebrate':
      return 'Zorblet, delighted';
    case 'discovery':
      return 'Zorblet, pleased';
    case 'confused':
      return 'Zorblet, puzzled';
    case 'suspicious':
      return 'Zorblet, unsettled';
    case 'watching':
      return 'Zorblet, watching';
    case 'idle':
      return 'Zorblet, waiting';
  }
}

/**
 * The line to go with the face.
 *
 * Chosen by how much has happened rather than at random. Two reasons: a random
 * pick would re-roll on every render and flicker, and a line that changes on
 * every single event reads as chatter rather than as a reaction to something.
 * Stepping every few events means Zorblet's mood visibly develops over a run
 * while staying still long enough to be read.
 */
export function zorbletLine(state: MascotState, events: GameEvent[]): string {
  const lines = ZORBLET_LINES[state];
  const step = Math.floor(events.length / 6);
  return lines[step % lines.length]!;
}
