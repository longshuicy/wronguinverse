// metrics.test.ts
// The report's two outputs are comedy, but the rules about WHEN they are shown
// and what is free are promises the game makes out loud, and those are worth
// pinning.

import { describe, expect, it } from 'vitest';
import { brainType, computeMetrics, conventionalThinking } from './metrics.ts';
import type { GameEvent, WidgetType } from './state/types.ts';

const at = (n: number) => n * 100;

function attempt(widget: WidgetType, correct: boolean, i: number): GameEvent {
  return { type: 'challenge_attempt', widget, correct, at: at(i) };
}

function hint(widget: WidgetType, level: 1 | 2 | 3, phase: 'explore' | 'challenge'): GameEvent {
  return { type: 'hint', widget, level, at: at(1), phase };
}

const metricsOf = (events: GameEvent[]) => computeMetrics(events, 0, 1000);

describe('an abandoned run', () => {
  it('is given the type reserved for leaving, never one it did not earn', () => {
    // The bug this pins: a player who quit having touched nothing satisfied
    // THE THEORIST ("barely touched anything, just knew") and was congratulated
    // on insight they did not have.
    const events: GameEvent[] = [{ type: 'give_up', at: at(1) }];
    expect(brainType(metricsOf(events), 4).id).toBe('walkedAway');
  });

  it('reaches that type however the run was played', () => {
    const busy: GameEvent[] = [
      ...Array.from({ length: 200 }, (_, i): GameEvent => ({
        type: 'interaction',
        widget: 'slider',
        at: at(i),
        interpretedValue: i,
      })),
      { type: 'give_up', at: at(300) },
    ];
    expect(brainType(metricsOf(busy), 4).id).toBe('walkedAway');
  });

  it('is the only way to reach it', () => {
    const finished: GameEvent[] = [attempt('slider', true, 1)];
    expect(brainType(metricsOf(finished), 2).id).not.toBe('walkedAway');
  });
});

describe('conventional thinking', () => {
  it('is not scored at all for an abandoned run', () => {
    const events: GameEvent[] = [attempt('slider', false, 1), { type: 'give_up', at: at(2) }];
    expect(conventionalThinking(metricsOf(events), 4)).toBeNull();
  });

  it('does not let a peek on the way out become a score', () => {
    // Revealing the rules is a flat penalty, so an abandoned run that peeked
    // would otherwise print a WORSE number than one that left in silence —
    // grading someone on the manner of their giving up.
    const events: GameEvent[] = [
      { type: 'reveal_rules', at: at(1) },
      { type: 'give_up', at: at(2) },
    ];
    expect(conventionalThinking(metricsOf(events), 4)).toBeNull();
  });

  it('scores a finished run', () => {
    const events: GameEvent[] = [attempt('slider', true, 1), attempt('checkbox', true, 2)];
    const score = conventionalThinking(metricsOf(events), 2);
    expect(score).toBe(0);
  });

  it('charges for hints bought during stabilization', () => {
    const clean = conventionalThinking(metricsOf([attempt('slider', true, 1)]), 2);
    const helped = conventionalThinking(
      metricsOf([hint('slider', 3, 'challenge'), attempt('slider', true, 1)]),
      2,
    );
    expect(helped!).toBeGreaterThan(clean!);
  });

  it('leaves exploration free', () => {
    // "Nothing during exploration is scored. Poke everything." — a hint taken
    // there must cost nothing, or the game is quietly lying on the intro
    // screen and in the Reality Index.
    const events: GameEvent[] = [hint('slider', 3, 'explore'), attempt('slider', true, 1)];
    const metrics = metricsOf(events);
    expect(metrics.hintsUsed).toBe(0);
    expect(metrics.hintWeight).toBe(0);
    expect(conventionalThinking(metrics, 2)).toBe(0);
  });
});
