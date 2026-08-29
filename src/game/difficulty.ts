// difficulty.ts
// The three difficulty LEVELS of Tier 1.
//
// Two different ideas in the design docs were both called "tier", which was a
// steady source of confusion. They are named apart now, and the code uses only
// the second:
//
//   TIER  — which rules are broken. Tier 1 Semantic Shift (this release),
//           Tier 2 Operation Shift, Tier 3 Gesture Shift. Not selectable.
//   LEVEL — how hard a Tier 1 run is: how many mappings, how much help.
//           This is what the player picks, and what the music follows.
//
// See docs/WrongUInverse-game-design.md §3 (tiers) and §12 (levels).

import { implementedSemantics } from './domains/index.ts';
import { maxMappingCount } from './generator/mappingGenerator.ts';
import { implementedWidgets } from '../widgets/registry.ts';

export type DifficultyId = 'slightlyWrong' | 'deeplyWrong' | 'wronguinverse';

export interface DifficultyConfig {
  id: DifficultyId;
  /** Player-facing level name. */
  label: string;
  /** One line describing what changes, shown on the level picker. */
  blurb: string;
  mappingCount: number;
  challengeRequirementCount: number;
  notebookDetail: 'full' | 'reduced' | 'minimal';
  hintPolicy: 'generous' | 'normal' | 'limited';
  /**
   * Whether the challenge still shows what each widget currently reads as.
   *
   * With it off, the only feedback is a requirement locking when its widget
   * lands on target.
   */
  interpretedOutputInChallenge: boolean;
  /**
   * Whether each requirement is shown ON the control that satisfies it.
   *
   * Paired, the player still has to work out HOW to make that control produce
   * the value — but not WHICH control to use. Unpaired, the order is a separate
   * list and matching it to the bench is part of the puzzle.
   */
  pairRequirementsWithWidgets: boolean;
}

/**
 * Three levels, at 4, 6 and 8 mappings.
 *
 * Eight is the ceiling: a run gives every widget a distinct semantic, and there
 * are eight of each. A ninth level would need a ninth semantic implemented.
 */
const LEVELS: DifficultyConfig[] = [
  {
    id: 'slightlyWrong',
    label: 'SLIGHTLY WRONG',
    blurb: 'Four controls. Each objective is written on the control that answers it.',
    mappingCount: 4,
    challengeRequirementCount: 4,
    notebookDetail: 'full',
    hintPolicy: 'generous',
    interpretedOutputInChallenge: true,
    pairRequirementsWithWidgets: true,
  },
  {
    id: 'deeplyWrong',
    label: 'DEEPLY WRONG',
    blurb: 'Six controls, and the order no longer says which one to use.',
    mappingCount: 6,
    challengeRequirementCount: 5,
    notebookDetail: 'reduced',
    hintPolicy: 'normal',
    interpretedOutputInChallenge: true,
    pairRequirementsWithWidgets: false,
  },
  {
    id: 'wronguinverse',
    label: 'THE WrongUIᴎverse',
    blurb: 'All eight controls, and nothing tells you what they read as.',
    mappingCount: 8,
    challengeRequirementCount: 6,
    notebookDetail: 'minimal',
    hintPolicy: 'limited',
    interpretedOutputInChallenge: false,
    pairRequirementsWithWidgets: false,
  },
];

/** The largest run the current vocabulary can actually build. */
function buildableCeiling(): number {
  return maxMappingCount(implementedWidgets(), implementedSemantics(), ['yes']);
}

/**
 * Clamp a level to what is buildable.
 *
 * A level asking for more mappings than there are semantics would fail at
 * runtime, so it is trimmed instead. Nothing is clamped today; this exists so
 * that removing a semantic degrades the ladder rather than breaking the game.
 */
function clampToVocabulary(config: DifficultyConfig): DifficultyConfig {
  const mappingCount = Math.min(config.mappingCount, buildableCeiling());
  return {
    ...config,
    mappingCount,
    challengeRequirementCount: Math.min(config.challengeRequirementCount, mappingCount),
  };
}

export function availableDifficulties(): DifficultyConfig[] {
  return LEVELS.map(clampToVocabulary);
}

export function getDifficulty(id: DifficultyId): DifficultyConfig {
  const found = LEVELS.find((config) => config.id === id);
  if (!found) throw new Error(`Unknown difficulty level "${id}"`);
  return clampToVocabulary(found);
}

/** Where a first-time player starts. */
export const DEFAULT_DIFFICULTY: DifficultyId = 'slightlyWrong';
