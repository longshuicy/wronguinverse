// difficulty.ts
// The three difficulty LEVELS of Tier 1.
//
// Two different ideas in the design docs were both called "tier", which was a
// steady source of confusion. They are named apart now, and the code uses only
// the second:
//
//   TIER  — which rules are broken. Tier 1 Semantic Shift (this release),
//           Tier 2 Operation Shift, Tier 3 Gesture Shift. Not selectable.
//   LEVEL — how hard a Tier 1 run is: how many mappings, how much the game
//           volunteers. This is what the player picks, and what the music
//           follows.
//
// A level narrows what the game TELLS you unasked — the notebook, the READS AS
// readout. It never narrows what you can ask FOR: the hint ladders are open at
// every level, because a player who is stuck on the hardest one is the player
// who needs them, and taking them away there just ended the run.
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
    blurb: 'Four controls, every reading visible, and a notebook that forgets nothing.',
    mappingCount: 4,
    notebookDetail: 'full',
    interpretedOutputInChallenge: true,
  },
  {
    id: 'uxHell',
    label: 'UX HELL',
    blurb: 'Six controls, a shorter notebook, and a universe that has stopped explaining itself.',
    mappingCount: 6,
    notebookDetail: 'reduced',
    interpretedOutputInChallenge: true,
  },
  {
    id: 'wronguinverse',
    label: 'THE WrongUIᴎverse',
    blurb:
      'All eight controls, and nothing tells you what any of them read as. Zorblet will still answer, if you ask.',
    mappingCount: 8,
    notebookDetail: 'minimal',
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
