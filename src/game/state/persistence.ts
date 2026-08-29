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
}

export const DEFAULT_PROGRESS: PersistedProgress = {
  tutorialCompleted: false,
  universesStabilized: 0,
  furthestDistance: 0,
  audioMuted: false,
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
