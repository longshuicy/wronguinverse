// gameStore.ts
// The run loop: INTRO → NORMAL → SHIFT → EXPLORE → CHALLENGE → RESULT, with
// RETRY_SAME_REALITY and NEXT_REALITY branching off the result.
// See docs/WrongUInverse-technical-design.md §12.

import { create } from 'zustand';
import {
  DEFAULT_DIFFICULTY,
  getDifficulty,
  type DifficultyConfig,
  type DifficultyId,
} from '../difficulty.ts';
import { playMusicFor, playSfx, setMuted as setAudioMuted } from '../../audio/audioManager.ts';
import { initialValue } from '../domains/index.ts';
import { generateChallenge, isRequirementSatisfied } from '../generator/challengeGenerator.ts';
import { generateRun } from '../generator/mappingGenerator.ts';
import { createRng, createSeed } from '../generator/seededRandom.ts';
import { loadProgress, saveProgress, type PersistedProgress } from './persistence.ts';
import type {
  GameEvent,
  HintLevel,
  Mapping,
  Requirement,
  RunConfig,
  RunOutcome,
  StageId,
  WidgetType,
} from './types.ts';

/**
 * Calibration is a fixed seed on purpose.
 *
 * Stage 1 is the player's "home universe" baseline — the thing the shift is
 * measured against — so it must feel the same every run.
 */
const CALIBRATION_SEED = 'HOME-UNIVERSE';
const CALIBRATION_TASK_COUNT = 4;

type WidgetValues = Partial<Record<WidgetType, unknown>>;

interface GameState {
  stage: StageId;
  difficulty: DifficultyConfig;
  progress: PersistedProgress;

  /** Conventional mappings for Stage 1. Regenerated identically every run. */
  calibration: RunConfig | null;
  calibrationIndex: number;
  calibrationValues: WidgetValues;

  /** The shifted universe. Survives Retry, replaced by Next. */
  run: RunConfig | null;
  values: WidgetValues;

  hintLevels: Partial<Record<WidgetType, HintLevel>>;
  /** Interpreted values the player has seen per widget, oldest first. */
  observations: Partial<Record<WidgetType, string[]>>;

  requirements: Requirement[];
  /** Requirements already hit once. Locked so a stray drag cannot undo them. */
  lockedWidgets: WidgetType[];
  challengeStartedAt: number | null;
  challengeEndedAt: number | null;
  rulesRevealed: boolean;
  outcome: RunOutcome;

  events: GameEvent[];
  distance: number;

  // --- actions ---
  beginRun: (seed?: string) => void;
  skipCalibration: () => void;
  advanceCalibration: () => void;
  setCalibrationValue: (widget: WidgetType, value: unknown) => void;
  beginExplore: () => void;
  beginChallenge: () => void;
  setValue: (widget: WidgetType, value: unknown) => void;
  useHint: (widget: WidgetType) => void;
  revealRules: () => void;
  giveUp: () => void;
  retrySameReality: () => void;
  nextUniverse: () => void;
  returnToIntro: () => void;
  setDifficulty: (id: DifficultyId) => void;
  setMuted: (muted: boolean) => void;
}

function freshValues(mappings: Mapping[]): WidgetValues {
  return Object.fromEntries(mappings.map((m) => [m.widget, initialValue(m.domain)]));
}

/**
 * The single place a universe is declared stabilized.
 *
 * Shared by `setValue` and `beginChallenge` so completion cannot depend on
 * which of them happened to notice — returns the state patch, or null if there
 * is still something left to do.
 */
function completionPatch(
  get: () => GameState,
  lockedWidgets: WidgetType[],
): Partial<GameState> | null {
  const { requirements, distance, progress } = get();
  const allDone =
    requirements.length > 0 &&
    requirements.every((requirement) => lockedWidgets.includes(requirement.widget));
  if (!allDone) return null;

  const nextProgress = {
    ...progress,
    universesStabilized: progress.universesStabilized + 1,
    furthestDistance: Math.max(progress.furthestDistance, distance + 1),
  };
  saveProgress(nextProgress);

  return {
    stage: 'result',
    outcome: 'stabilized',
    challengeEndedAt: Date.now(),
    distance: distance + 1,
    progress: nextProgress,
  };
}

/** Build the shifted universe plus its challenge card from one seed. */
function buildUniverse(seed: string, difficulty: DifficultyConfig) {
  const run = generateRun({ seed, count: difficulty.mappingCount });
  // A separate stream, so changing challenge generation cannot shift the
  // mappings a shared seed already produced.
  const requirements = generateChallenge(
    run.mappings,
    difficulty.challengeRequirementCount,
    createRng(`${seed}::challenge`),
  );
  return { run, requirements };
}

export const useGameStore = create<GameState>((set, get) => ({
  stage: 'intro',
  difficulty: getDifficulty(DEFAULT_DIFFICULTY),
  progress: loadProgress(),

  calibration: null,
  calibrationIndex: 0,
  calibrationValues: {},

  run: null,
  values: {},

  hintLevels: {},
  observations: {},

  requirements: [],
  lockedWidgets: [],
  challengeStartedAt: null,
  challengeEndedAt: null,
  rulesRevealed: false,
  outcome: null,

  events: [],
  distance: 0,

  beginRun: (seed) => {
    const { difficulty, progress } = get();
    const runSeed = seed ?? createSeed();

    // Usually already playing from the level picker; this covers the player
    // who pressed start without touching the picker at all.
    setAudioMuted(progress.audioMuted);
    if (!progress.audioMuted) playMusicFor(difficulty.id);
    const { run, requirements } = buildUniverse(runSeed, difficulty);

    // Conventional pairings only — this is the universe the player already
    // lives in. `accept: ['normal']` reuses the same generator machinery.
    const calibration = generateRun({
      seed: CALIBRATION_SEED,
      count: CALIBRATION_TASK_COUNT,
      accept: ['normal'],
    });

    set({
      // Calibration always runs; once completed once, it becomes skippable
      // rather than automatic, so the player keeps the choice.
      stage: 'normal',
      run,
      requirements,
      values: freshValues(run.mappings),
      calibration,
      calibrationIndex: 0,
      calibrationValues: freshValues(calibration.mappings),
      hintLevels: {},
      observations: {},
      lockedWidgets: [],
      challengeStartedAt: null,
      challengeEndedAt: null,
      rulesRevealed: false,
      outcome: null,
      events: [],
    });
  },

  setCalibrationValue: (widget, value) =>
    set((state) => ({ calibrationValues: { ...state.calibrationValues, [widget]: value } })),

  advanceCalibration: () => {
    const { calibration, calibrationIndex } = get();
    if (!calibration) return;
    const next = calibrationIndex + 1;
    if (next >= calibration.mappings.length) {
      get().skipCalibration();
      return;
    }
    playSfx('selection_confirm');
    set({ calibrationIndex: next });
  },

  skipCalibration: () => {
    const progress = { ...get().progress, tutorialCompleted: true };
    saveProgress(progress);
    playSfx('reality_shift');
    set({ stage: 'shift', progress });
  },

  /**
   * Exploration is untimed on purpose.
   *
   * A countdown turned deduction into a race and punished the players most
   * likely to be enjoying it — the ones reading the readouts and forming a
   * theory. The run ends when the player says they understand the universe.
   * Effort is still measured, by counting interactions rather than seconds.
   */
  beginExplore: () => set({ stage: 'explore' }),

  beginChallenge: () => {
    const at = Date.now();
    set({ stage: 'challenge', challengeStartedAt: at });

    const { run, requirements, values, events } = get();
    if (!run) return;

    // A player who worked a mapping out during exploration may leave the widget
    // sitting on the answer. Evaluate on entry so that counts: locking used to
    // happen only inside setValue, which stranded already-correct requirements
    // and — if every one of them was correct — left the run unwinnable.
    const alreadySatisfied = requirements
      .filter((requirement) => isRequirementSatisfied(requirement, run.mappings, values))
      .map((requirement) => requirement.widget);

    if (alreadySatisfied.length === 0) return;

    set({
      lockedWidgets: alreadySatisfied,
      events: [
        ...events,
        ...alreadySatisfied.map((widget): GameEvent => ({
          type: 'challenge_attempt',
          widget,
          correct: true,
          at,
        })),
      ],
    });

    const completion = completionPatch(get, alreadySatisfied);
    if (completion) {
      playSfx('stabilization_complete');
      set(completion);
    }
  },

  setValue: (widget, value) => {
    const { run, stage, values, observations, events, requirements, lockedWidgets } = get();
    if (!run) return;
    // A locked requirement stays locked: once the player has landed it, a
    // stray drag must not silently undo their progress.
    if (lockedWidgets.includes(widget)) return;

    const mapping = run.mappings.find((m) => m.widget === widget);
    if (!mapping) return;

    const interpreted = mapping.domain.display(value);
    const at = Date.now();

    // The blip is the "weird output" sound (§13): during exploration each new
    // reading is a small surprise, so it only fires when the value actually
    // changed, not on every drag pixel.
    const previous = values[widget];
    const changed = previous === undefined || !mapping.domain.equals(previous, value);
    if (changed) playSfx(stage === 'normal' ? 'value_tick' : 'semantic_blip');
    const nextEvents: GameEvent[] = [
      ...events,
      { type: 'interaction', widget, at, interpretedValue: interpreted },
    ];

    // The notebook records observed values, never semantic labels — that is
    // what preserves the deduction (technical design §13).
    const seen = observations[widget] ?? [];
    const nextObservations =
      seen[seen.length - 1] === interpreted
        ? observations
        : { ...observations, [widget]: [...seen, interpreted] };

    const nextValues = { ...values, [widget]: value };
    let nextLocked = lockedWidgets;

    if (stage === 'challenge') {
      const requirement = requirements.find((r) => r.widget === widget);
      if (requirement) {
        const correct = isRequirementSatisfied(requirement, run.mappings, nextValues);
        nextEvents.push({ type: 'challenge_attempt', widget, correct, at });
        if (correct) {
          nextLocked = [...lockedWidgets, widget];
          playSfx('requirement_correct');
        }
      }
    }

    set({
      values: nextValues,
      observations: nextObservations,
      events: nextEvents,
      lockedWidgets: nextLocked,
    });

    // Every requirement locked = universe stabilized.
    if (stage === 'challenge' && nextLocked.length > 0) {
      const completion = completionPatch(get, nextLocked);
      if (completion) {
        playSfx('stabilization_complete');
        set(completion);
      }
    }
  },

  useHint: (widget) => {
    const { hintLevels, run, events } = get();
    if (!run) return;
    const current = hintLevels[widget] ?? 0;
    if (current >= 3) return;
    const level = (current + 1) as 1 | 2 | 3;
    playSfx('zorblet_chirp');
    set({
      hintLevels: { ...hintLevels, [widget]: level },
      events: [...events, { type: 'hint', widget, level, at: Date.now() }],
    });
  },

  revealRules: () =>
    set((state) => ({
      rulesRevealed: true,
      events: [...state.events, { type: 'reveal_rules', at: Date.now() }],
    })),

  giveUp: () => {
    // Deliberately the mismatch tone and not a failure sting: the design docs
    // are explicit that giving up is met with sympathy, never a buzzer.
    playSfx('mismatch');
    return set((state) => ({
      stage: 'result',
      outcome: 'gaveUp',
      challengeEndedAt: Date.now(),
      rulesRevealed: true,
      events: [...state.events, { type: 'give_up', at: Date.now() }],
    }));
  },

  /** Same seed, same mappings, same targets — only the attempt resets. */
  retrySameReality: () => {
    const { run } = get();
    if (!run) return;
    set({
      stage: 'challenge',
      values: freshValues(run.mappings),
      lockedWidgets: [],
      challengeStartedAt: Date.now(),
      challengeEndedAt: null,
      outcome: null,
      rulesRevealed: false,
      events: [...get().events, { type: 'retry_same', at: Date.now() }],
    });
  },

  /** A brand new universe, one step further from normality. */
  nextUniverse: () => {
    const { difficulty, distance, outcome } = get();
    const seed = createSeed();
    const { run, requirements } = buildUniverse(seed, difficulty);
    set({
      stage: 'shift',
      run,
      requirements,
      values: freshValues(run.mappings),
      hintLevels: {},
      observations: {},
      lockedWidgets: [],
      challengeStartedAt: null,
      challengeEndedAt: null,
      rulesRevealed: false,
      outcome: null,
      events: [],
      // Giving up ends the streak without blocking play (game design §12).
      distance: outcome === 'stabilized' ? distance : 0,
    });
  },

  returnToIntro: () => set({ stage: 'intro' }),

  /**
   * Only meaningful from the intro; a run's level is fixed once it starts.
   *
   * Switches the music straight away rather than waiting for the run to begin.
   * The track is part of what a level IS, so picking one should let you hear
   * it. The click is also the user gesture browsers require before audio may
   * play, so this is the earliest honest moment to start.
   */
  setDifficulty: (id) => {
    const difficulty = getDifficulty(id);
    if (!get().progress.audioMuted) playMusicFor(id);
    set({ difficulty });
  },

  setMuted: (muted) => {
    const progress = { ...get().progress, audioMuted: muted };
    saveProgress(progress);
    setAudioMuted(muted);
    set({ progress });
  },
}));
