// metrics.ts
// The result screen's playful diagnosis.
//
// IMPORTANT: these are comedy outputs derived from interaction counts. They are
// not a psychological assessment and must never be presented as one — see
// docs/WrongUInverse-game-design.md §11 and technical design §12.

import type { GameEvent } from './state/types.ts';

export interface RunMetrics {
  /** Wall-clock time spent in the challenge, in ms. */
  challengeMs: number;
  interactions: number;
  hintsUsed: number;
  /** Sum of hint levels — a full reveal costs more than a nudge. */
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
  const hints = events.filter((e) => e.type === 'hint');
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
 */
export function conventionalThinking(metrics: RunMetrics, mappingCount: number): number {
  if (mappingCount === 0) return 0;

  const wrongAttempts = Math.max(0, metrics.challengeAttempts - metrics.firstAttemptHits);
  const wrongRatio = Math.min(1, wrongAttempts / (mappingCount * 4));
  const hintRatio = Math.min(1, metrics.hintWeight / (mappingCount * 3));
  const revealPenalty = metrics.rulesRevealed ? 0.25 : 0;

  const raw = wrongRatio * 0.5 + hintRatio * 0.35 + revealPenalty;
  return Math.round(Math.min(1, raw) * 100);
}

export interface BrainType {
  name: string;
  blurb: string;
}

/**
 * Assign an Interface Brain Type.
 *
 * Ordered most-specific first: the first behaviour that clearly stands out
 * wins, so a player who did something distinctive gets told about that rather
 * than a generic label.
 */
export function brainType(metrics: RunMetrics, mappingCount: number): BrainType {
  const { interactions, hintsUsed, timeToFirstInteraction, firstAttemptHits } = metrics;

  if (timeToFirstInteraction !== null && timeToFirstInteraction > 8000) {
    return {
      name: 'THE THEORIST',
      blurb: 'Spent suspiciously long staring before interacting.',
    };
  }
  if (interactions > mappingCount * 25) {
    return { name: 'THE POKER', blurb: 'Touched everything until reality gave up.' };
  }
  if (hintsUsed >= mappingCount) {
    return {
      name: 'REASONABLE HUMAN BEING',
      blurb: 'Used hints instead of arguing with a calendar.',
    };
  }
  if (firstAttemptHits === mappingCount && hintsUsed === 0) {
    return { name: 'THE UX DESIGNER', blurb: 'Immediately assumed the interface was wrong.' };
  }
  if (interactions > mappingCount * 12) {
    return { name: 'THE ENGINEER', blurb: 'Brute-forced the semantic space.' };
  }
  return { name: 'THE NORMIE', blurb: 'Attempted to use every control correctly. Adorable.' };
}

/** `1:07` */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
