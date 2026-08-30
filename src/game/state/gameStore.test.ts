// gameStore.test.ts
// Stage machine behaviour, driven through the store rather than the DOM.

import { beforeEach, describe, expect, it } from 'vitest';
import { computeMetrics } from '../metrics.ts';
import { getTier } from '../tier.ts';
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
    operationHintLevels: {},
    observations: {},
    tier: getTier(1),
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

  it('resets the bench when the challenge begins', () => {
    // Exploration is for poking, so a widget can arrive at stabilization
    // anywhere the player left it. Stabilizing is a fresh instruction and
    // starts from the resting state the goals were generated against.
    useGameStore.getState().beginRun('REALITY-TEST');
    const { run, requirements } = useGameStore.getState();
    const requirement = requirements[0]!;
    const mapping = run!.mappings.find((m) => m.widget === requirement.widget)!;

    useGameStore.getState().setValue(requirement.widget, mapping.domain.target);
    expect(useGameStore.getState().values[requirement.widget]).toEqual(mapping.domain.target);

    useGameStore.getState().beginChallenge();

    expect(useGameStore.getState().values[requirement.widget]).not.toEqual(mapping.domain.target);
    expect(useGameStore.getState().lockedWidgets).toEqual([]);
    expect(useGameStore.getState().stage).toBe('challenge');
  });

  it('never begins a challenge with a requirement already satisfied', () => {
    // The reset above is only safe because the generator never picks a target
    // equal to a widget's resting value. If that invariant broke, a run whose
    // requirements were all satisfied on entry would have nothing left to
    // interact with and could never complete.
    for (let i = 0; i < 40; i += 1) {
      useGameStore.getState().beginRun(`REALITY-RESET-${i}`);
      useGameStore.getState().beginChallenge();

      expect(useGameStore.getState().stage).toBe('challenge');
      expect(useGameStore.getState().lockedWidgets).toEqual([]);
    }
  });

  it('stabilizes the universe without leaving the bench', () => {
    // Landing the last requirement finishes the run but does NOT jump to the
    // debrief: the player gets to see the finished bench and asks for the
    // report themselves.
    useGameStore.getState().beginRun('REALITY-TEST');
    useGameStore.getState().beginChallenge();

    const { run, requirements } = useGameStore.getState();
    for (const requirement of requirements) {
      const mapping = run!.mappings.find((m) => m.widget === requirement.widget)!;
      useGameStore.getState().setValue(requirement.widget, mapping.domain.target);
    }

    expect(useGameStore.getState().stage).toBe('challenge');
    expect(useGameStore.getState().outcome).toBe('stabilized');
    expect(useGameStore.getState().distance).toBe(1);
  });

  it('reaches the report when the player asks for it', () => {
    useGameStore.getState().beginRun('REALITY-TEST');
    useGameStore.getState().beginChallenge();
    const before = useGameStore.getState().progress.universesStabilized;

    const { run, requirements } = useGameStore.getState();
    for (const requirement of requirements) {
      const mapping = run!.mappings.find((m) => m.widget === requirement.widget)!;
      useGameStore.getState().setValue(requirement.widget, mapping.domain.target);
    }
    // Credit is banked by FINISHING, not by reading about it: a player who
    // leaves without opening the report has still stabilized the universe.
    const banked = useGameStore.getState().progress.universesStabilized;
    useGameStore.getState().openReport();

    expect(useGameStore.getState().stage).toBe('result');
    expect(useGameStore.getState().outcome).toBe('stabilized');
    expect(banked).toBe(before + 1);
    expect(useGameStore.getState().progress.universesStabilized).toBe(banked);
  });

  it('winds both hint ladders back when stabilization begins', () => {
    // A hint unwound while exploring must not still be sitting on the card
    // when the scored phase opens, or the deduction arrives pre-solved.
    useGameStore.getState().setTier(2);
    useGameStore.getState().beginRun('REALITY-TEST');
    const widget = useGameStore.getState().run!.mappings[0]!.widget;
    useGameStore.getState().useHint(widget);
    useGameStore.getState().useOperationHint(widget);
    expect(useGameStore.getState().hintLevels[widget]).toBe(1);
    expect(useGameStore.getState().operationHintLevels[widget]).toBe(1);

    useGameStore.getState().beginChallenge();

    expect(useGameStore.getState().hintLevels).toEqual({});
    expect(useGameStore.getState().operationHintLevels).toEqual({});
  });

  it('does not charge the run for hints spent while exploring', () => {
    // Exploration is explicitly unscored, so a hint taken there is free. Only
    // hints bought once stabilization has started show up in the tally.
    useGameStore.getState().beginRun('REALITY-TEST');
    const widget = useGameStore.getState().run!.mappings[0]!.widget;
    useGameStore.getState().useHint(widget);
    useGameStore.getState().useHint(widget);
    useGameStore.getState().beginChallenge();

    const explored = useGameStore.getState();
    expect(computeMetrics(explored.events, explored.challengeStartedAt, Date.now()).hintsUsed).toBe(
      0,
    );

    // The same ladder, continued after the challenge began, does count.
    useGameStore.getState().useHint(widget);
    const during = useGameStore.getState();
    expect(computeMetrics(during.events, during.challengeStartedAt, Date.now()).hintsUsed).toBe(1);
  });

  it('will not open a report for a run that has not ended', () => {
    useGameStore.getState().beginRun('REALITY-TEST');
    useGameStore.getState().beginChallenge();
    useGameStore.getState().openReport();

    expect(useGameStore.getState().stage).toBe('challenge');
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

  it('retries the same reality with the same rules but new goals', () => {
    // The point of a retry is to ask whether the player learned the MAPPING,
    // not whether they memorised four values. Same widget meanings, new
    // labels, ranges and targets.
    useGameStore.getState().beginRun('REALITY-TEST');
    useGameStore.getState().beginChallenge();

    const before = useGameStore.getState().run!;
    const beforeRules = before.mappings.map((m) => `${m.widget}:${m.semantic}`);
    const beforeTargets = before.mappings.map((m) => m.domain.display(m.domain.target));

    useGameStore.getState().giveUp();
    useGameStore.getState().retrySameReality();

    const after = useGameStore.getState();
    expect(after.stage).toBe('challenge');
    expect(after.run!.seed).toBe(before.seed);

    // The rules are preserved exactly.
    expect(after.run!.mappings.map((m) => `${m.widget}:${m.semantic}`)).toEqual(beforeRules);

    // The goals are not. (A single domain could coincidentally re-roll the
    // same value, so this asserts on the set rather than every element.)
    const afterTargets = after.run!.mappings.map((m) => m.domain.display(m.domain.target));
    expect(afterTargets).not.toEqual(beforeTargets);

    // And every new target is still reachable and not the resting value.
    for (const mapping of after.run!.mappings) {
      const resting = mapping.domain.denormalize(0);
      expect(mapping.domain.equals(resting, mapping.domain.target)).toBe(false);
    }

    expect(after.lockedWidgets).toEqual([]);
  });

  it('keeps the seed stable across retries', () => {
    useGameStore.getState().beginRun('REALITY-TEST');
    useGameStore.getState().beginChallenge();
    const before = useGameStore.getState().run!;
    useGameStore.getState().giveUp();
    useGameStore.getState().retrySameReality();
    expect(useGameStore.getState().run!.seed).toBe(before.seed);
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

describe('tier 2 (operation shift)', () => {
  beforeEach(reset);

  it('shifts every control in the run but leaves calibration alone', () => {
    useGameStore.getState().setTier(2);
    useGameStore.getState().beginRun('REALITY-TEST');

    const { run, calibration } = useGameStore.getState();
    expect(run!.tier).toBe(2);
    for (const mapping of run!.mappings) expect(mapping.operation).not.toBe('native');

    // Stage 1 is the home universe the shift is measured against. If it shifted
    // too, there would be no baseline left to notice the difference from.
    for (const mapping of calibration!.mappings) expect(mapping.operation).toBe('native');
  });

  it('keeps the gestures when the same reality is retried', () => {
    // Retry re-rolls the CONTENT of a universe but not its RULES, and the
    // gesture is a rule: a retry that quietly un-shifted them would be a
    // different, easier universe wearing the same name.
    useGameStore.getState().setTier(2);
    useGameStore.getState().beginRun('REALITY-TEST');
    const before = useGameStore.getState().run!.mappings.map((m) => `${m.widget}:${m.operation}`);

    useGameStore.getState().retrySameReality();
    const after = useGameStore.getState().run!.mappings.map((m) => `${m.widget}:${m.operation}`);

    expect(after).toEqual(before);
  });

  it('walks the gesture ladder independently of the meaning ladder', () => {
    useGameStore.getState().setTier(2);
    useGameStore.getState().beginRun('REALITY-TEST');
    const widget = useGameStore.getState().run!.mappings[0]!.widget;

    for (let i = 0; i < 5; i += 1) useGameStore.getState().useOperationHint(widget);

    expect(useGameStore.getState().operationHintLevels[widget]).toBe(3);
    // Spending the gesture ladder must not spend the meaning one: they answer
    // different questions and are bought separately.
    expect(useGameStore.getState().hintLevels[widget]).toBeUndefined();

    const hints = useGameStore.getState().events.filter((e) => e.type === 'hint');
    expect(hints).toHaveLength(3);
    for (const hint of hints) expect(hint.track).toBe('operation');
  });

  it('stays on tier 1 by default', () => {
    useGameStore.getState().beginRun('REALITY-TEST');
    expect(useGameStore.getState().run!.tier).toBe(1);
  });
});
