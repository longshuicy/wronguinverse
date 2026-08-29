// difficulty.ts
// The Tier 1 difficulty ladder. Difficulty scales by widening the mapping set
// and narrowing the player's aids — no new mechanics.
// See docs/WrongUInverse-technical-design.md §15.

import { implementedSemantics } from './domains/index.ts';
import { maxMappingCount } from './generator/mappingGenerator.ts';
import { implementedWidgets } from '../widgets/registry.ts';

export type DifficultyId =
  'home' | 'slightlyWrong' | 'wronger' | 'deeplyWrong' | 'uxHell' | 'wronguinverse';

export interface DifficultyConfig {
  id: DifficultyId;
  /** Player-facing tier name. */
  label: string;
  mappingCount: number;
  explorationSeconds: number;
  challengeRequirementCount: number;
  notebookDetail: 'full' | 'reduced' | 'minimal';
  hintPolicy: 'generous' | 'normal' | 'limited';
  /**
   * Whether the challenge still shows what each widget currently reads as.
   *
   * Technical design §15 makes this the main step between Easy and Medium:
   * "output visible only during exploration". With it off, the only feedback is
   * a requirement locking when its widget lands on target.
   */
  interpretedOutputInChallenge: boolean;
  /**
   * Whether each requirement is shown ON the control that satisfies it.
   *
   * Paired, the player still has to work out HOW to make that control produce
   * the value — but not WHICH control to use. Unpaired, the order is a separate
   * list and matching it to the bench is part of the puzzle. Gentle tiers pair;
   * harder tiers separate.
   */
  pairRequirementsWithWidgets: boolean;
}

const LADDER: DifficultyConfig[] = [
  {
    id: 'slightlyWrong',
    label: 'SLIGHTLY WRONG',
    mappingCount: 3,
    explorationSeconds: 45,
    challengeRequirementCount: 3,
    notebookDetail: 'full',
    hintPolicy: 'generous',
    interpretedOutputInChallenge: true,
    pairRequirementsWithWidgets: true,
  },
  {
    id: 'wronger',
    label: 'WRONGER',
    mappingCount: 4,
    explorationSeconds: 35,
    challengeRequirementCount: 3,
    notebookDetail: 'full',
    hintPolicy: 'normal',
    interpretedOutputInChallenge: false,
    pairRequirementsWithWidgets: true,
  },
  {
    id: 'deeplyWrong',
    label: 'DEEPLY WRONG',
    mappingCount: 6,
    explorationSeconds: 30,
    challengeRequirementCount: 4,
    notebookDetail: 'reduced',
    hintPolicy: 'normal',
    interpretedOutputInChallenge: false,
    pairRequirementsWithWidgets: false,
  },
  {
    id: 'uxHell',
    label: 'UX HELL',
    mappingCount: 7,
    explorationSeconds: 25,
    challengeRequirementCount: 5,
    notebookDetail: 'minimal',
    hintPolicy: 'limited',
    interpretedOutputInChallenge: false,
    pairRequirementsWithWidgets: false,
  },
  {
    id: 'wronguinverse',
    label: 'THE WrongUIᴎverse',
    mappingCount: 8,
    explorationSeconds: 25,
    challengeRequirementCount: 6,
    notebookDetail: 'minimal',
    hintPolicy: 'limited',
    interpretedOutputInChallenge: false,
    pairRequirementsWithWidgets: false,
  },
];

/**
 * The largest run the current vocabulary can actually build.
 *
 * Only four widgets and four semantics exist so far, so the upper tiers cannot
 * be generated yet. Rather than let them fail at runtime, tiers are clamped to
 * what is buildable and `availableDifficulties()` hides the ones that would
 * collapse into a duplicate of a lower tier.
 */
function buildableCeiling(): number {
  return maxMappingCount(implementedWidgets(), implementedSemantics(), ['yes']);
}

function clampToVocabulary(config: DifficultyConfig): DifficultyConfig {
  const ceiling = buildableCeiling();
  const mappingCount = Math.min(config.mappingCount, ceiling);
  return {
    ...config,
    mappingCount,
    challengeRequirementCount: Math.min(config.challengeRequirementCount, mappingCount),
  };
}

/** Tiers that are distinct and buildable with the vocabulary implemented today. */
export function availableDifficulties(): DifficultyConfig[] {
  const ceiling = buildableCeiling();
  const out: DifficultyConfig[] = [];
  for (const config of LADDER) {
    // Once a tier needs more mappings than exist, every tier above it would
    // clamp to the same size; keep the first and stop.
    const clamped = clampToVocabulary(config);
    out.push(clamped);
    if (config.mappingCount >= ceiling) break;
  }
  return out;
}

export function getDifficulty(id: DifficultyId): DifficultyConfig {
  const found = LADDER.find((config) => config.id === id);
  if (!found) throw new Error(`Unknown difficulty "${id}"`);
  return clampToVocabulary(found);
}

/** Where a first-time player starts. */
export const DEFAULT_DIFFICULTY: DifficultyId = 'slightlyWrong';
