// persistence.ts
// The only things that survive a reload. Deliberately small.
//
// Mappings are NOT persisted: a new universe must feel genuinely shifted, and
// "Retry Same Reality" keeps its mapping in live run state only.
// See docs/WrongUInverse-technical-design.md §16.

const STORAGE_KEY = 'wronguinverse.progress.v1';

export interface PersistedProgress {
  tutorialCompleted: boolean;
  universesStabilized: number;
  furthestDistance: number;
  audioMuted: boolean;
  /**
   * Which Interface Brain Types this player has been, ever.
   *
   * The one piece of progress that is a COLLECTION rather than a counter, and
   * the only reason to play a tier or a level you would otherwise skip: two of
   * the seven are unreachable without behaving unusually, and one of them
   * requires giving up on purpose.
   */
  typesSeen: string[];
}

export const DEFAULT_PROGRESS: PersistedProgress = {
  tutorialCompleted: false,
  universesStabilized: 0,
  furthestDistance: 0,
  audioMuted: false,
  typesSeen: [],
};

/**
 * Read saved progress, falling back to defaults.
 *
 * Every access is guarded: localStorage throws outright in private-mode Safari
 * and when a browser is set to block site data, and the stored JSON may be from
 * an older build. A corrupt or unavailable store must never stop the game
 * loading — it just means the player starts fresh.
 */
export function loadProgress(): PersistedProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PROGRESS };
    const parsed = JSON.parse(raw) as Partial<PersistedProgress>;
    return {
      tutorialCompleted: Boolean(parsed.tutorialCompleted ?? DEFAULT_PROGRESS.tutorialCompleted),
      universesStabilized: Number(parsed.universesStabilized) || 0,
      furthestDistance: Number(parsed.furthestDistance) || 0,
      audioMuted: Boolean(parsed.audioMuted ?? DEFAULT_PROGRESS.audioMuted),
      // Absent in stores written before the cast existed, and worth reading
      // defensively anyway: this is the one field a hand-edited save is likely
      // to contain something odd in.
      typesSeen: Array.isArray(parsed.typesSeen)
        ? parsed.typesSeen.filter((id): id is string => typeof id === 'string')
        : [],
    };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

export function saveProgress(progress: PersistedProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage unavailable or full. Progress is a convenience, not a
    // requirement — the run in front of the player continues either way.
  }
}
