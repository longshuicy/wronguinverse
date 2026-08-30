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

export type DifficultyId = 'slightlyWrong' | 'uxHell' | 'wronguinverse';

export interface DifficultyConfig {
  id: DifficultyId;
  /** Player-facing level name. */
  label: string;
  /** One line describing what changes, shown on the level picker. */
  blurb: string;
  mappingCount: number;
  /**
   * Always equal to `mappingCount`: every control carries one line of the
   * order, so every card can be named after the objective it answers rather
   * than by a meaningless station number.
   */
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
}

/**
 * Three levels, at 4, 6 and 8 mappings.
 *
 * Eight is the ceiling: a run gives every widget a distinct semantic, and there
 * are eight of each. A ninth level would need a ninth semantic implemented.
 */
/**
 * Three levels, at 4, 6 and 8 mappings.
 *
 * `challengeRequirementCount` is derived rather than written here: it is always
 * the mapping count, so every control carries one line of the order.
 *
 * Eight is the ceiling. A run gives every widget a distinct semantic, and there
 * are eight of each; a fourth level needs a ninth semantic implemented.
 */
type LevelSpec = Omit<DifficultyConfig, 'challengeRequirementCount'>;

const LEVELS: LevelSpec[] = [
  {
    id: 'slightlyWrong',
    label: 'SLIGHTLY WRONG',
    blurb: 'Four controls. The readings are visible and the universe is feeling generous.',
    mappingCount: 4,
    notebookDetail: 'full',
    hintPolicy: 'generous',
    interpretedOutputInChallenge: true,
  },
  {
    id: 'uxHell',
    label: 'UX HELL',
    blurb: 'Six controls, a shorter notebook, and a universe that has stopped explaining itself.',
    mappingCount: 6,
    notebookDetail: 'reduced',
    hintPolicy: 'normal',
    interpretedOutputInChallenge: true,
  },
  {
    id: 'wronguinverse',
    label: 'THE WrongUIᴎverse',
    blurb: 'All eight controls, and nothing tells you what any of them read as. Good luck.',
    mappingCount: 8,
    notebookDetail: 'minimal',
    hintPolicy: 'limited',
    interpretedOutputInChallenge: false,
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
function clampToVocabulary(config: LevelSpec): DifficultyConfig {
  const mappingCount = Math.min(config.mappingCount, buildableCeiling());
  return { ...config, mappingCount, challengeRequirementCount: mappingCount };
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
