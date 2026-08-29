// gameStore.test.ts
// Stage machine behaviour, driven through the store rather than the DOM.

import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from './gameStore.ts';

function reset() {
  localStorage.clear();
  useGameStore.setState({
    stage: 'intro',
    run: null,
    values: {},
    requirements: [],
    lockedWidgets: [],
    events: [],
    outcome: null,
    distance: 0,
    challengeStartedAt: null,
    challengeEndedAt: null,
    rulesRevealed: false,
    hintLevels: {},
    observations: {},
  });
}

describe('run loop', () => {
  beforeEach(reset);

  it('generates a universe and its challenge together', () => {
    useGameStore.getState().beginRun('REALITY-TEST');
    const { run, requirements, stage } = useGameStore.getState();
    expect(stage).toBe('normal');
    expect(run?.seed).toBe('REALITY-TEST');
    expect(requirements.length).toBeGreaterThan(0);
    for (const requirement of requirements) {
      expect(run!.mappings.some((m) => m.widget === requirement.widget)).toBe(true);
    }
  });

  it('locks a requirement when its widget reaches the target', () => {
    useGameStore.getState().beginRun('REALITY-TEST');
    useGameStore.getState().beginChallenge();

    const { run, requirements } = useGameStore.getState();
    const requirement = requirements[0]!;
    const mapping = run!.mappings.find((m) => m.widget === requirement.widget)!;

    useGameStore.getState().setValue(requirement.widget, mapping.domain.target);
    expect(useGameStore.getState().lockedWidgets).toContain(requirement.widget);
  });

  it('keeps a locked requirement locked against later changes', () => {
    useGameStore.getState().beginRun('REALITY-TEST');
    useGameStore.getState().beginChallenge();

    const { run, requirements } = useGameStore.getState();
    const requirement = requirements[0]!;
    const mapping = run!.mappings.find((m) => m.widget === requirement.widget)!;

    useGameStore.getState().setValue(requirement.widget, mapping.domain.target);
    const other = mapping.domain.denormalize(0.5);
    useGameStore.getState().setValue(requirement.widget, other);

    expect(useGameStore.getState().lockedWidgets).toContain(requirement.widget);
    expect(useGameStore.getState().values[requirement.widget]).toEqual(mapping.domain.target);
  });

  it('locks requirements already satisfied when the challenge begins', () => {
    // A player who works a mapping out during exploration may leave the widget
    // sitting on the answer. That must count, not strand the requirement:
    // locking used to happen only inside setValue, so an already-correct value
    // never locked and the run could not complete.
    useGameStore.getState().beginRun('REALITY-TEST');
    const { run, requirements } = useGameStore.getState();
    const requirement = requirements[0]!;
    const mapping = run!.mappings.find((m) => m.widget === requirement.widget)!;

    // Set it during EXPLORE, before the challenge starts.
    useGameStore.getState().setValue(requirement.widget, mapping.domain.target);
    useGameStore.getState().beginChallenge();

    expect(useGameStore.getState().lockedWidgets).toContain(requirement.widget);
  });

  it('completes the run when every requirement is satisfied on entry', () => {
    // The degenerate version of the same bug: with everything already correct
    // there was no further interaction to trigger the completion check at all.
    useGameStore.getState().beginRun('REALITY-TEST');
    const { run, requirements } = useGameStore.getState();

    for (const requirement of requirements) {
      const mapping = run!.mappings.find((m) => m.widget === requirement.widget)!;
      useGameStore.getState().setValue(requirement.widget, mapping.domain.target);
    }
    useGameStore.getState().beginChallenge();

    expect(useGameStore.getState().stage).toBe('result');
    expect(useGameStore.getState().outcome).toBe('stabilized');
  });

  it('reaches the result screen by satisfying every requirement', () => {
    useGameStore.getState().beginRun('REALITY-TEST');
    useGameStore.getState().beginChallenge();

    const { run, requirements } = useGameStore.getState();
    for (const requirement of requirements) {
      const mapping = run!.mappings.find((m) => m.widget === requirement.widget)!;
      useGameStore.getState().setValue(requirement.widget, mapping.domain.target);
    }

    expect(useGameStore.getState().stage).toBe('result');
    expect(useGameStore.getState().outcome).toBe('stabilized');
    expect(useGameStore.getState().distance).toBe(1);
  });

  it('records giving up without shaming or losing the mapping', () => {
    useGameStore.getState().beginRun('REALITY-TEST');
    useGameStore.getState().beginChallenge();
    useGameStore.getState().giveUp();

    const state = useGameStore.getState();
    expect(state.stage).toBe('result');
    expect(state.outcome).toBe('gaveUp');
    expect(state.rulesRevealed).toBe(true);
    expect(state.run).not.toBeNull();
  });

  it('retries the same reality with identical mappings and targets', () => {
    useGameStore.getState().beginRun('REALITY-TEST');
    useGameStore.getState().beginChallenge();
    const before = useGameStore.getState().run!;
    const beforeTargets = before.mappings.map((m) => m.domain.display(m.domain.target));

    useGameStore.getState().giveUp();
    useGameStore.getState().retrySameReality();

    const after = useGameStore.getState();
    expect(after.stage).toBe('challenge');
    expect(after.run!.seed).toBe(before.seed);
    expect(after.run!.mappings.map((m) => m.domain.display(m.domain.target))).toEqual(
      beforeTargets,
    );
    expect(after.lockedWidgets).toEqual([]);
  });

  it('advances distance only after a successful stabilization', () => {
    useGameStore.getState().beginRun('REALITY-TEST');
    useGameStore.getState().beginChallenge();
    useGameStore.getState().giveUp();
    useGameStore.getState().nextUniverse();
    // Giving up ends the streak without blocking further play.
    expect(useGameStore.getState().distance).toBe(0);
    expect(useGameStore.getState().stage).toBe('shift');
  });

  it('walks the hint ladder to a full reveal and stops', () => {
    useGameStore.getState().beginRun('REALITY-TEST');
    const widget = useGameStore.getState().run!.mappings[0]!.widget;

    for (let i = 0; i < 5; i += 1) useGameStore.getState().useHint(widget);
    expect(useGameStore.getState().hintLevels[widget]).toBe(3);
    expect(useGameStore.getState().events.filter((e) => e.type === 'hint')).toHaveLength(3);
  });

  it('records observed values, not semantic labels', () => {
    useGameStore.getState().beginRun('REALITY-TEST');
    const mapping = useGameStore.getState().run!.mappings[0]!;

    useGameStore.getState().setValue(mapping.widget, mapping.domain.denormalize(0.2));
    useGameStore.getState().setValue(mapping.widget, mapping.domain.denormalize(0.8));

    const seen = useGameStore.getState().observations[mapping.widget]!;
    expect(seen.length).toBeGreaterThan(0);
    // Never leaks the semantic type into the notebook.
    expect(seen.join(' ')).not.toContain(mapping.semantic);
  });
});
