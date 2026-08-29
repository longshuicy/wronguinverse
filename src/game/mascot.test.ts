// mascot.test.ts
// The reaction engine is comedy, but one rule is a genuine design requirement:
// giving up must never be mocked (game design §4).

import { describe, expect, it } from 'vitest';
import { mascotAltText, mascotState } from './mascot.ts';
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
