// IntroStage.tsx
// Entry point. Deliberately says almost nothing about the twist — the game
// communicates its thesis through play, not exposition (game design §2).

import { useState } from 'react';
import { seedFromLocation } from '../generator/seededRandom.ts';
import { useGameStore } from '../state/gameStore.ts';

export function IntroStage() {
  const beginRun = useGameStore((s) => s.beginRun);
  const progress = useGameStore((s) => s.progress);
  const difficulty = useGameStore((s) => s.difficulty);
  const [urlSeed] = useState(seedFromLocation);

  return (
    <main className="wui-screen wui-intro">
      <h1 className="wui-title">
        Wrong<span className="wui-title-ui">UI</span>
        <span className="wui-title-flip">N</span>verse
      </h1>
      <p className="wui-tagline">Everything works as unintended.</p>

      <p className="wui-lede">
        You operate a Reality Calibration Terminal. Nearby universes have overlapped, and interface
        conventions were among the things that shifted.
      </p>

      <div className="wui-actions">
        {/* `?seed=…` reproduces a specific universe exactly (technical §9). */}
        <button
          type="button"
          className="wui-primary"
          onClick={() => beginRun(urlSeed ?? undefined)}
        >
          {progress.tutorialCompleted ? 'Contact a new universe' : 'Begin calibration'}
        </button>
      </div>

      <p className="wui-meta">
        TIER: {difficulty.label} · {difficulty.mappingCount} MAPPINGS
        {progress.universesStabilized > 0 && ` · ${progress.universesStabilized} STABILIZED`}
        {urlSeed && ` · SEED ${urlSeed}`}
      </p>
    </main>
  );
}
