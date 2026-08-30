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
import { pickPointerLaw, pointerLawFromLocation, type PointerLawId } from '../pointerLaw.ts';
import { DEFAULT_TIER, getTier, type TierConfig } from '../tier.ts';
import { playMusicFor, playSfx, setMuted as setAudioMuted } from '../../audio/audioManager.ts';
import { initialValue } from '../domains/index.ts';
import { generateChallenge, isRequirementSatisfied } from '../generator/challengeGenerator.ts';
import { generateRun, regenerateGoals } from '../generator/mappingGenerator.ts';
import { brainType, computeMetrics } from '../metrics.ts';
import { createRng, createSeed, seedFromLocation } from '../generator/seededRandom.ts';
import { loadProgress, saveProgress, type PersistedProgress } from './persistence.ts';
import type {
  GameEvent,
  HintLevel,
  Mapping,
  Requirement,
  RunConfig,
  RunOutcome,
  StageId,
  TierId,
  WidgetType,
} from './types.ts';

/**
 * Calibration is a fixed seed on purpose.
 *
 * Stage 1 is the player's "home universe" baseline — the thing the shift is
 * measured against — so it must feel the same every run.
 */
const CALIBRATION_SEED = 'HOME-UNIVERSE';
/** Every control, so the baseline covers the whole vocabulary. */
const CALIBRATION_TASK_COUNT = 8;

type WidgetValues = Partial<Record<WidgetType, unknown>>;

interface GameState {
  stage: StageId;
  difficulty: DifficultyConfig;
  /**
   * Which rules this run breaks. Independent of `difficulty`: the tier decides
   * WHAT is shifted, the level decides how much of it there is.
   */
  tier: TierConfig;
  progress: PersistedProgress;

  /** Conventional mappings for Stage 1. Regenerated identically every run. */
  calibration: RunConfig | null;
  calibrationValues: WidgetValues;

  /**
   * The pointer law in force, or `null` outside Tier 3.
   *
   * Held here rather than read off the tier because it is drawn per RUN: the
   * tier owns the pool, a run owns the law. Drawn from the run's own seed, so
   * `?seed=` reproduces the cursor as well as the mappings.
   */
  pointerLaw: PointerLawId | null;
  /**
   * The seed the next run will use, chosen when the briefing opens.
   *
   * Chosen that early because the briefing's door obeys the law (it is the
   * tutorial for it), and the law cannot be drawn before the seed it comes
   * from exists.
   */
  pendingSeed: string | null;

  /** The shifted universe. Survives Retry, replaced by Next. */
  run: RunConfig | null;
  values: WidgetValues;

  hintLevels: Partial<Record<WidgetType, HintLevel>>;
  /**
   * The gesture ladder, unwound separately from the semantic one.
   *
   * Two tracks rather than one longer ladder: "what does this mean" and "how do
   * I work it" are different questions, and a player stuck on one should not
   * have to buy answers to the other to reach it.
   */
  operationHintLevels: Partial<Record<WidgetType, HintLevel>>;
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
  /** Which attempt at this reality the player is on; drives the retry seed. */
  attempt: number;

  // --- actions ---
  beginRun: (seed?: string) => void;
  skipCalibration: () => void;
  setCalibrationValue: (widget: WidgetType, value: unknown) => void;
  beginExplore: () => void;
  beginChallenge: () => void;
  setValue: (widget: WidgetType, value: unknown) => void;
  useHint: (widget: WidgetType) => void;
  useOperationHint: (widget: WidgetType) => void;
  revealRules: () => void;
  /** Leave the finished bench for the debrief. Only meaningful once stabilized. */
  openReport: () => void;
  giveUp: () => void;
  retrySameReality: () => void;
  nextUniverse: () => void;
  returnToIntro: () => void;
  openBriefing: () => void;
  setDifficulty: (id: DifficultyId) => void;
  setTier: (id: TierId) => void;
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
 *
 * Deliberately does NOT move to the result screen. Landing the last requirement
 * used to fling the player straight into a diagnosis, which stepped on the one
 * moment the run has been building to: the bench, finally all locked, sitting
 * there finished. The run stays on the challenge screen, wearing its outcome,
 * until the player asks for the report (`openReport`).
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
    outcome: 'stabilized',
    challengeEndedAt: Date.now(),
    distance: distance + 1,
    progress: nextProgress,
  };
}

/**
 * Add the type this run earned to the cast the player has collected.
 *
 * Recorded when the REPORT is reached rather than when the run ends: the run
 * sits finished on the bench for as long as the player likes, and anything they
 * do in that time still counts toward the reading. Recording early would file a
 * type the report then disagreed with.
 */
function rememberBrainType(get: () => GameState): PersistedProgress {
  const { events, challengeStartedAt, challengeEndedAt, run, progress } = get();
  const metrics = computeMetrics(events, challengeStartedAt, challengeEndedAt);
  const earned = brainType(metrics, run?.mappings.length ?? 0).id;
  if (progress.typesSeen.includes(earned)) return progress;

  const next = { ...progress, typesSeen: [...progress.typesSeen, earned] };
  saveProgress(next);
  return next;
}

/**
 * The pointer law for a run, or `null` if this tier does not impose one.
 *
 * Its own seed stream (`::law`), like the challenge card's, so that adding
 * laws to the pool later cannot shift the mappings an existing seed produces.
 */
function drawPointerLaw(seed: string, tier: TierConfig): PointerLawId | null {
  // `?law=` wins over both the pool and the draw, and over the tier having no
  // pool at all: the point of it is to reach one law directly without playing
  // the odds. Development only — nothing in the game links to it.
  const forced = pointerLawFromLocation();
  if (forced) return forced;
  if (!tier.pointerLaws?.length) return null;
  return pickPointerLaw(tier.pointerLaws, createRng(`${seed}::law`));
}

/** Build the shifted universe plus its challenge card from one seed. */
function buildUniverse(seed: string, difficulty: DifficultyConfig, tier: TierConfig) {
  const run = generateRun({
    seed,
    count: difficulty.mappingCount,
    operationShift: tier.operationShift,
  });
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
  tier: getTier(DEFAULT_TIER),
  progress: loadProgress(),

  calibration: null,
  calibrationValues: {},

  pointerLaw: null,
  pendingSeed: null,

  run: null,
  values: {},

  hintLevels: {},
  operationHintLevels: {},
  observations: {},

  requirements: [],
  lockedWidgets: [],
  challengeStartedAt: null,
  challengeEndedAt: null,
  rulesRevealed: false,
  outcome: null,

  events: [],
  distance: 0,
  attempt: 0,

  beginRun: (seed) => {
    const { difficulty, tier, progress, pendingSeed } = get();
    // The briefing already chose one, and its door has been teaching the law
    // that seed drew. Taking a fresh seed here would move the goalposts between
    // the tutorial and the run.
    const runSeed = seed ?? pendingSeed ?? createSeed();

    // Usually already playing from the level picker; this covers the player
    // who pressed start without touching the picker at all.
    setAudioMuted(progress.audioMuted);
    if (!progress.audioMuted) playMusicFor(tier.id);
    const { run, requirements } = buildUniverse(runSeed, difficulty, tier);

    // Conventional pairings only — this is the universe the player already
    // lives in. `accept: ['normal']` reuses the same generator machinery.
    const calibration = generateRun({
      seed: CALIBRATION_SEED,
      count: CALIBRATION_TASK_COUNT,
      accept: ['normal'],
      // Radio and dropdown are both conventionally "choice"; without this
      // calibration could only ever show seven of the eight controls.
      allowDuplicateSemantics: true,
    });

    set({
      // Calibration always runs; once completed once, it becomes skippable
      // rather than automatic, so the player keeps the choice.
      stage: 'normal',
      run,
      requirements,
      values: freshValues(run.mappings),
      calibration,
      calibrationValues: freshValues(calibration.mappings),
      hintLevels: {},
      operationHintLevels: {},
      observations: {},
      lockedWidgets: [],
      challengeStartedAt: null,
      challengeEndedAt: null,
      rulesRevealed: false,
      outcome: null,
      events: [],
      attempt: 0,
    });
  },

  setCalibrationValue: (widget, value) => {
    // Calibration was silent. Stage 1 is the universe the player already lives
    // in, and the whole point of it is to be a baseline for what NORMAL feels
    // like — a bench where the controls make no sound at all, while the
    // shifted bench blips at every reading, is a poor baseline. Same tick as
    // `setValue` uses in the normal stage, for the same reason: it fires on a
    // CHANGE, not on every pixel of a drag.
    const { calibration, calibrationValues } = get();
    const mapping = calibration?.mappings.find((m) => m.widget === widget);
    const previous = calibrationValues[widget];
    const changed = !mapping || previous === undefined || !mapping.domain.equals(previous, value);
    if (changed) playSfx('value_tick');
    set((state) => ({ calibrationValues: { ...state.calibrationValues, [widget]: value } }));
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
    const run = get().run;
    if (!run) {
      set({
        stage: 'challenge',
        challengeStartedAt: at,
        hintLevels: {},
        operationHintLevels: {},
      });
      return;
    }

    // Exploration is for poking, so the bench arrives at stabilization wherever
    // the player left it — half-dragged sliders, a colour picked to see what it
    // did. Stabilizing is a fresh instruction, and it should start from the
    // same resting state the goals were generated against.
    set({
      stage: 'challenge',
      challengeStartedAt: at,
      values: freshValues(run.mappings),
      // Both hint ladders wind back too. A hint bought while exploring was
      // free (it is not scored), and leaving its text on the card would hand
      // that answer over again at the moment it finally costs something —
      // stabilization would open with the deduction already done.
      hintLevels: {},
      operationHintLevels: {},
    });

    const { requirements, values, events } = get();

    // A guard, not a carry-over: the generator never picks a target equal to a
    // widget's resting value, so nothing should be satisfied by the reset
    // above. If that invariant ever breaks, locking only inside setValue would
    // strand the requirement and leave the run unwinnable.
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
    const { hintLevels, run, events, stage } = get();
    if (!run) return;
    const current = hintLevels[widget] ?? 0;
    if (current >= 3) return;
    const level = (current + 1) as 1 | 2 | 3;
    playSfx('zorblet_chirp');
    set({
      hintLevels: { ...hintLevels, [widget]: level },
      events: [
        ...events,
        {
          type: 'hint',
          widget,
          level,
          at: Date.now(),
          phase: stage === 'challenge' ? 'challenge' : 'explore',
        },
      ],
    });
  },

  /**
   * The gesture ladder. A near-copy of `useHint` on purpose: the two tracks
   * behave identically, they simply answer different questions, and sharing an
   * implementation would mean one record deciding when the other may advance.
   */
  useOperationHint: (widget) => {
    const { operationHintLevels, run, events, stage } = get();
    if (!run) return;
    const current = operationHintLevels[widget] ?? 0;
    if (current >= 3) return;
    const level = (current + 1) as 1 | 2 | 3;
    playSfx('zorblet_chirp');
    set({
      operationHintLevels: { ...operationHintLevels, [widget]: level },
      events: [
        ...events,
        {
          type: 'hint',
          widget,
          level,
          at: Date.now(),
          track: 'operation' as const,
          phase: stage === 'challenge' ? 'challenge' : 'explore',
        },
      ],
    });
  },

  openReport: () => {
    // Guarded rather than a bare stage set: the report reads a completed run's
    // outcome and timings, so reaching it any other way would show a debrief
    // of nothing.
    if (get().outcome === null) return;
    set({ stage: 'result', progress: rememberBrainType(get) });
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
    set((state) => ({
      stage: 'result',
      outcome: 'gaveUp',
      challengeEndedAt: Date.now(),
      rulesRevealed: true,
      events: [...state.events, { type: 'give_up', at: Date.now() }],
    }));
    // After the give_up event is in, so the type recorded is the one the
    // report will show: PERSON WITH BOUNDARIES, not whatever the partial run
    // would otherwise have been read as.
    set({ progress: rememberBrainType(get) });
  },

  /**
   * Same rules, new orders.
   *
   * Keeps the mapping the player worked out — the slider still means a date —
   * but re-rolls every domain, so the labels, ranges and targets are all
   * different. Replaying the identical challenge would only measure whether
   * they remember four values; changing the goal asks whether they actually
   * learned the mapping, which is the thing the game is about.
   */
  retrySameReality: () => {
    const { run, difficulty, attempt } = get();
    if (!run) return;

    const nextAttempt = attempt + 1;
    const mappings = regenerateGoals(run.mappings, `${run.seed}::retry-${nextAttempt}`);
    const requirements = generateChallenge(
      mappings,
      difficulty.challengeRequirementCount,
      createRng(`${run.seed}::retry-${nextAttempt}::challenge`),
    );

    set({
      stage: 'challenge',
      attempt: nextAttempt,
      run: { ...run, mappings },
      requirements,
      values: freshValues(mappings),
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
    const { difficulty, tier, distance, outcome } = get();
    const seed = createSeed();
    const { run, requirements } = buildUniverse(seed, difficulty, tier);
    set({
      stage: 'shift',
      // A new universe is a new draw. Two Tier 3 runs in a row under the same
      // law would make the tier feel like one gimmick rather than a pool.
      pointerLaw: drawPointerLaw(seed, tier),
      pendingSeed: seed,
      run,
      requirements,
      values: freshValues(run.mappings),
      hintLevels: {},
      operationHintLevels: {},
      observations: {},
      lockedWidgets: [],
      challengeStartedAt: null,
      challengeEndedAt: null,
      rulesRevealed: false,
      outcome: null,
      events: [],
      attempt: 0,
      // Giving up ends the streak without blocking play (game design §12).
      distance: outcome === 'stabilized' ? distance : 0,
    });
  },

  returnToIntro: () => set({ stage: 'intro', pointerLaw: null, pendingSeed: null }),

  /**
   * Open the Reality Index, and settle what universe is behind it.
   *
   * The seed is chosen here rather than at `beginRun` because the briefing's
   * door obeys the run's pointer law — it is where the player learns it — and
   * a law cannot be drawn before its seed exists. Technical design §9's
   * `?seed=` override is read here for the same reason.
   */
  openBriefing: () => {
    const seed = seedFromLocation() ?? createSeed();
    set({ stage: 'briefing', pendingSeed: seed, pointerLaw: drawPointerLaw(seed, get().tier) });
  },

  /**
   * Only meaningful from the intro; a run's tier is fixed once it starts.
   *
   * Switches the music straight away rather than waiting for the run to begin.
   * The track is part of what a tier IS, so picking one should let you hear it
   * — and on the landing page that is also the clearest statement that the two
   * axes are different: this one you can hear, the other one you can only
   * count. The click is the user gesture browsers require before audio may
   * play, so this is the earliest honest moment to start.
   */
  setTier: (id) => {
    const tier = getTier(id);
    // The law belongs to a run, and no run is pending from the intro — leaving
    // a stale one set would put the landing page under the rules of a tier the
    // player has just switched away from.
    if (!get().progress.audioMuted) playMusicFor(tier.id);
    set({ tier, pointerLaw: null, pendingSeed: null });
  },

  /** No music change: the soundtrack belongs to the tier, not to how much of it. */
  setDifficulty: (id) => set({ difficulty: getDifficulty(id) }),

  setMuted: (muted) => {
    const progress = { ...get().progress, audioMuted: muted };
    saveProgress(progress);
    setAudioMuted(muted);
    set({ progress });
  },
}));
