// mascot.test.ts
// The reaction engine is comedy, but one rule is a genuine design requirement:
// giving up must never be mocked (game design §4).

import { describe, expect, it } from 'vitest';
import { mascotAltText, mascotState, zorbletLine } from './mascot.ts';
import type { MascotState } from '../content/assets.ts';
import { ZORBLET_LINES } from '../content/zorbletLines.ts';
import type { GameEvent } from './state/types.ts';

const at = 0;
const miss: GameEvent = { type: 'challenge_attempt', widget: 'slider', correct: false, at };
const hit: GameEvent = { type: 'challenge_attempt', widget: 'slider', correct: true, at };
const touch: GameEvent = {
  type: 'interaction',
  widget: 'slider',
  at,
  interpretedValue: 'X',
};

describe('mascotState', () => {
  it('celebrates a stabilized universe', () => {
    expect(mascotState('result', 'stabilized', [])).toBe('celebrate');
  });

  it('is sympathetic, never gleeful, when the player gives up', () => {
    const state = mascotState('result', 'gaveUp', [{ type: 'give_up', at }]);
    expect(state).toBe('confused');
    expect(state).not.toBe('celebrate');
  });

  it('reacts to a requirement landing', () => {
    expect(mascotState('challenge', null, [miss, hit])).toBe('discovery');
  });

  it('looks puzzled only after a sustained run of misses', () => {
    expect(mascotState('challenge', null, [miss, miss, miss])).not.toBe('confused');
    expect(mascotState('challenge', null, [miss, miss, miss, miss])).toBe('confused');
  });

  it('watches once the player starts touching things', () => {
    expect(mascotState('explore', null, [])).toBe('idle');
    expect(mascotState('explore', null, [touch])).toBe('watching');
  });

  it('is unsettled by the shift and calm during calibration', () => {
    expect(mascotState('shift', null, [])).toBe('suspicious');
    expect(mascotState('normal', null, [touch])).toBe('idle');
  });

  it('describes every state for assistive tech', () => {
    for (const state of [
      'idle',
      'watching',
      'confused',
      'suspicious',
      'discovery',
      'celebrate',
    ] as const) {
      expect(mascotAltText(state)).toMatch(/Zorblet/);
    }
  });
});

describe('what Zorblet says', () => {
  const states: MascotState[] = [
    'idle',
    'watching',
    'suspicious',
    'discovery',
    'confused',
    'celebrate',
  ];

  it('has a line for every face', () => {
    for (const state of states) {
      expect(zorbletLine(state, []).length).toBeGreaterThan(0);
    }
  });

  it('is stable between renders and moves as a run goes on', () => {
    const few: GameEvent[] = [];
    const many: GameEvent[] = Array.from({ length: 30 }, (_, i) => ({
      type: 'interaction' as const,
      widget: 'slider' as const,
      at: i,
      interpretedValue: i,
    }));
    // Same input, same line: a line that re-rolled per render would flicker.
    expect(zorbletLine('watching', few)).toBe(zorbletLine('watching', few));
    expect(zorbletLine('watching', many)).toBe(zorbletLine('watching', many));
    expect(zorbletLine('watching', few)).not.toBe(zorbletLine('watching', many));
  });

  it('never names a widget or a semantic', () => {
    // The one thing Zorblet must not do is give away meaning: hints are
    // counted and scored, and a mascot handing the same information over for
    // free would wreck both the economy and the deduction.
    const forbidden = /slider|checkbox|dropdown|calendar|colour|color|date picker|radio|means/i;
    for (const lines of Object.values(ZORBLET_LINES)) {
      for (const line of lines) {
        expect(line).not.toMatch(forbidden);
      }
    }
  });
});
