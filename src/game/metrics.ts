// metrics.ts
// The result screen's playful diagnosis.
//
// IMPORTANT: these are comedy outputs derived from interaction counts. They are
// not a psychological assessment and must never be presented as one — see
// docs/WrongUInverse-game-design.md §11 and technical design §12.

import { BRAIN_TYPES, type BrainType } from '../content/brainTypes.ts';
import type { GameEvent } from './state/types.ts';

export interface RunMetrics {
  /** Wall-clock time spent in the challenge, in ms. */
  challengeMs: number;
  interactions: number;
  /** Hints bought during stabilization. Exploration is unscored, so it is free. */
  hintsUsed: number;
  /** Sum of those hints' levels: a full reveal costs more than a nudge. */
  hintWeight: number;
  /** Requirements hit without a single wrong value for that widget first. */
  firstAttemptHits: number;
  challengeAttempts: number;
  /** ms between entering explore and touching anything. */
  timeToFirstInteraction: number | null;
  widgetsTouched: number;
  gaveUp: boolean;
  rulesRevealed: boolean;
}

export function computeMetrics(
  events: GameEvent[],
  challengeStartedAt: number | null,
  challengeEndedAt: number | null,
): RunMetrics {
  const interactions = events.filter((e) => e.type === 'interaction');

  // Only hints bought during stabilization count. Exploration is explicitly
  // unscored ("nothing you do during exploration is scored, poke everything"),
  // so charging for a hint taken there would quietly break that promise.
  const hints = events.filter((e) => e.type === 'hint' && e.phase === 'challenge');
  const attempts = events.filter((e) => e.type === 'challenge_attempt');

  // A widget counts as first-attempt if its first challenge attempt was correct.
  const firstAttemptByWidget = new Map<string, boolean>();
  for (const attempt of attempts) {
    if (attempt.type !== 'challenge_attempt') continue;
    if (!firstAttemptByWidget.has(attempt.widget)) {
      firstAttemptByWidget.set(attempt.widget, attempt.correct);
    }
  }

  const firstInteraction = interactions[0];
  const exploreStart = events[0]?.at ?? null;

  return {
    challengeMs:
      challengeStartedAt !== null && challengeEndedAt !== null
        ? challengeEndedAt - challengeStartedAt
        : 0,
    interactions: interactions.length,
    hintsUsed: hints.length,
    hintWeight: hints.reduce((sum, e) => sum + (e.type === 'hint' ? e.level : 0), 0),
    firstAttemptHits: [...firstAttemptByWidget.values()].filter(Boolean).length,
    challengeAttempts: attempts.length,
    timeToFirstInteraction:
      firstInteraction && exploreStart !== null ? firstInteraction.at - exploreStart : null,
    widgetsTouched: new Set(interactions.map((e) => (e.type === 'interaction' ? e.widget : '')))
      .size,
    gaveUp: events.some((e) => e.type === 'give_up'),
    rulesRevealed: events.some((e) => e.type === 'reveal_rules'),
  };
}

/**
 * "Conventional Thinking" — how much the player leaned on what the controls
 * looked like rather than what they turned out to mean.
 *
 * Derived from three observable behaviours: how many wrong values were entered
 * before landing each requirement, how heavily hints were leaned on, and
 * whether the rules were revealed outright. It is a made-up index tuned to read
 * amusingly, not a measurement of anything real.
 *
 * `null` for an abandoned run, and null rather than zero on purpose. Every term
 * in the formula is a RATIO against a run that finished: walking away after two
 * requirements leaves most of the denominators unspent, so the index reads low
 * — which would print a flattering number for giving up. Worse, revealing the
 * rules on the way out adds a flat 0.25, so quitting after a peek scores WORSE
 * than quitting in silence. Neither number means anything. The screen says so
 * instead of showing one, which also keeps the promise that giving up is
 * reported without shaming (game design §11).
 */
export function conventionalThinking(metrics: RunMetrics, mappingCount: number): number | null {
  if (metrics.gaveUp) return null;
  if (mappingCount === 0) return 0;

  const wrongAttempts = Math.max(0, metrics.challengeAttempts - metrics.firstAttemptHits);
  const wrongRatio = Math.min(1, wrongAttempts / (mappingCount * 4));
  const hintRatio = Math.min(1, metrics.hintWeight / (mappingCount * 3));
  const revealPenalty = metrics.rulesRevealed ? 0.25 : 0;

  const raw = wrongRatio * 0.5 + hintRatio * 0.35 + revealPenalty;
  return Math.round(Math.min(1, raw) * 100);
}

/**
 * Assign an Interface Brain Type.
 *
 * Ordered most-specific first: the first behaviour that clearly stands out
 * wins, so a player who did something distinctive is told about that rather
 * than given a generic label.
 *
 * Judged on INTERACTIONS rather than elapsed time. The run is untimed, so
 * "spent a long time before touching anything" no longer distinguishes
 * anybody — without a clock, everyone does. How much poking a universe took is
 * the thing the game actually asks of the player, so it is the thing measured.
 */
export function brainType(metrics: RunMetrics, mappingCount: number): BrainType {
  const { interactions, hintsUsed, firstAttemptHits, widgetsTouched } = metrics;

  // Before anything else: an abandoned run cannot be read. Every test below
  // compares against a run that FINISHED, so a player who left after touching
  // nothing satisfies THE THEORIST's "barely touched anything, just knew" and
  // gets congratulated on insight they did not have, about a dimension they
  // walked out of. Same reasoning as `conventionalThinking` returning null.
  if (metrics.gaveUp) return BRAIN_TYPES.walkedAway;

  const perMapping = mappingCount > 0 ? interactions / mappingCount : interactions;

  if (perMapping > 25) return BRAIN_TYPES.poker;
  if (hintsUsed >= mappingCount) return BRAIN_TYPES.reasonable;
  if (firstAttemptHits === mappingCount && hintsUsed === 0) return BRAIN_TYPES.uxDesigner;
  if (perMapping > 12 && widgetsTouched >= mappingCount) return BRAIN_TYPES.engineer;
  // Worked it out with barely any poking.
  if (perMapping < 4 && hintsUsed === 0) return BRAIN_TYPES.theorist;
  return BRAIN_TYPES.normie;
}
