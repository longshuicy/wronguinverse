// ExploreStage.tsx
// Stage 2 — free experimentation. No failure state, rich feedback, hints always
// available so confusion never becomes frustration.
// See docs/WrongUInverse-game-design.md §4, technical design §12.

import { useEffect } from 'react';
import { ChallengeCard } from '../../components/ChallengeCard.tsx';
import { ObservationLog } from '../../components/ObservationLog.tsx';
import { Timer } from '../../components/Timer.tsx';
import { WidgetBench } from '../../components/WidgetBench.tsx';
import { EXPLORE_INTRO } from '../../content/flavorText.ts';
import { useGameStore } from '../state/gameStore.ts';

export function ExploreStage() {
  const run = useGameStore((s) => s.run);
  const values = useGameStore((s) => s.values);
  const setValue = useGameStore((s) => s.setValue);
  const observations = useGameStore((s) => s.observations);
  const hintLevels = useGameStore((s) => s.hintLevels);
  const useHint = useGameStore((s) => s.useHint);
  const remaining = useGameStore((s) => s.exploreRemainingMs);
  const tick = useGameStore((s) => s.tickExplore);
  const beginChallenge = useGameStore((s) => s.beginChallenge);
  const difficulty = useGameStore((s) => s.difficulty);
  const requirements = useGameStore((s) => s.requirements);

  useEffect(() => {
    // 250ms keeps the countdown honest without re-rendering every frame.
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [tick]);

  if (!run) return null;

  return (
    <main className="wui-screen">
      <header className="wui-screen-head">
        <p className="wui-eyebrow">SHIFTED · {run.seed}</p>
        <h1>Semantic drift detected</h1>
        <p className="wui-lede">{EXPLORE_INTRO}</p>
      </header>

      <Timer remainingMs={remaining} totalMs={difficulty.explorationSeconds * 1000} />

      {/* Shown early and unsolved: knowing what will be asked is what makes
          exploration purposeful rather than aimless poking. */}
      <ChallengeCard
        title="INCOMING STABILIZATION ORDER"
        requirements={requirements}
        lockedWidgets={[]}
      />

      <WidgetBench
        mappings={run.mappings}
        values={values}
        mode="explore"
        onChange={setValue}
        showInterpreted
        hintLevels={hintLevels}
        onHint={useHint}
        hintsEnabled={difficulty.hintPolicy !== 'limited'}
      />

      <ObservationLog observations={observations} detail={difficulty.notebookDetail} />

      <div className="wui-actions">
        <button type="button" className="wui-primary" onClick={beginChallenge}>
          I understand this universe
        </button>
      </div>
    </main>
  );
}
