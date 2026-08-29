// ExploreStage.tsx
// Stage 2 — free experimentation. No failure state, rich feedback, hints always
// available so confusion never becomes frustration.
// See docs/WrongUInverse-game-design.md §4, technical design §12.

import { useEffect } from 'react';
import { ChallengeCard } from '../../components/ChallengeCard.tsx';
import { ObservationLog } from '../../components/ObservationLog.tsx';
import { StageRail } from '../../components/StageRail.tsx';
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

  const paired = difficulty.pairRequirementsWithWidgets;

  return (
    <main className="wui-screen">
      {/* Sticky: the objective and the clock are what the player checks most,
          and both used to scroll away behind the bench. */}
      <header className="wui-topbar">
        <StageRail stage="explore" />
        <div className="wui-topbar-main">
          <div>
            <h1 className="wui-stage-title">Semantic drift detected</h1>
            <p className="wui-lede">{EXPLORE_INTRO}</p>
          </div>
          <Timer remainingMs={remaining} totalMs={difficulty.explorationSeconds * 1000} />
        </div>
        <p className="wui-eyebrow">SHIFTED · {run.seed}</p>
      </header>

      {/* Unpaired tiers keep the order as its own card, since the bench cannot
          show which station answers which line. */}
      {!paired && (
        <ChallengeCard
          title="INCOMING STABILIZATION ORDER"
          requirements={requirements}
          lockedWidgets={[]}
        />
      )}

      <WidgetBench
        mappings={run.mappings}
        values={values}
        mode="explore"
        onChange={setValue}
        showInterpreted
        requirements={paired ? requirements : undefined}
        hintLevels={hintLevels}
        onHint={useHint}
        hintsEnabled={difficulty.hintPolicy !== 'limited'}
      />

      <footer className="wui-footer">
        <ObservationLog observations={observations} detail={difficulty.notebookDetail} />
        <div className="wui-actions">
          <button type="button" className="wui-primary" onClick={beginChallenge}>
            I understand this universe
          </button>
        </div>
      </footer>
    </main>
  );
}
