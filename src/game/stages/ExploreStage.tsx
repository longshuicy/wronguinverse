// ExploreStage.tsx
// Stage 2 - free experimentation. No failure state, rich feedback, hints always
// available so confusion never becomes frustration.
// See docs/WrongUInverse-game-design.md §4, technical design §12.

import { Mascot } from '../../components/Mascot.tsx';
import { StageBar } from '../../components/StageBar.tsx';
import { WidgetBench } from '../../components/WidgetBench.tsx';
import { EXPLORE_INTRO } from '../../content/flavorText.ts';
import { mascotState, zorbletLine } from '../mascot.ts';
import { useGameStore } from '../state/gameStore.ts';

export function ExploreStage() {
  const run = useGameStore((s) => s.run);
  const events = useGameStore((s) => s.events);
  const values = useGameStore((s) => s.values);
  const setValue = useGameStore((s) => s.setValue);
  const observations = useGameStore((s) => s.observations);
  const hintLevels = useGameStore((s) => s.hintLevels);
  const useHint = useGameStore((s) => s.useHint);
  const operationHintLevels = useGameStore((s) => s.operationHintLevels);
  const useOperationHint = useGameStore((s) => s.useOperationHint);
  const beginChallenge = useGameStore((s) => s.beginChallenge);
  const difficulty = useGameStore((s) => s.difficulty);
  const requirements = useGameStore((s) => s.requirements);
  const returnToIntro = useGameStore((s) => s.returnToIntro);

  if (!run) return null;

  return (
    <main className="wui-screen">
      {/* The status line states the stakes outright. Explore and Stabilize
          otherwise look alike, and a tester who cannot tell them apart is
          really asking "does what I do here count?" — so answer that. */}
      <StageBar
        stage="explore"
        // No count here. Exploration is the stage where nothing is being
        // scored, and putting a running tally on screen quietly contradicts
        // that — it reads as something to keep down.
        status={
          <>
            <span className="wui-status-word">EXPLORING</span> nothing counts yet
          </>
        }
        actions={
          <>
            <button type="button" className="wui-primary" onClick={beginChallenge}>
              I understand this universe
            </button>
            <button type="button" className="wui-ghost" onClick={returnToIntro}>
              Leave
            </button>
          </>
        }
      />

      {/* Same two columns as the challenge, so the screen does not rearrange
          itself between the two stages. The field notes take the place the
          order will occupy, since watching values accumulate is what this
          stage is for. */}
      <div className="wui-board">
        <aside className="wui-board-aside">
          <div className="wui-goal">
            <Mascot />
            <div>
              <h1 className="wui-stage-title">Semantic drift detected</h1>
              <p className="wui-lede">{EXPLORE_INTRO}</p>
              {/* Zorblet reacting out loud. Behaviour only, never meaning:
                  see the rules at the top of `content/zorbletLines.ts`. */}
              <p className="wui-zorblet-line">
                {zorbletLine(mascotState('explore', null, events), events)}
              </p>
              <p className="wui-eyebrow">SHIFTED · {run.seed}</p>
            </div>
          </div>
        </aside>

        <WidgetBench
          mappings={run.mappings}
          values={values}
          mode="explore"
          onChange={setValue}
          seed={run.seed}
          showInterpreted
          // Names, but not targets: Stage 2 is free experimentation, and
          // handing over the objective before the player has touched anything
          // removes the reason to explore at all (game design §4).
          requirements={requirements}
          showTargets={false}
          hintLevels={hintLevels}
          onHint={useHint}
          operationHintLevels={operationHintLevels}
          onOperationHint={useOperationHint}
          hintsEnabled={difficulty.hintPolicy !== 'limited'}
          observations={observations}
          observationDetail={difficulty.notebookDetail}
        />
      </div>
    </main>
  );
}
