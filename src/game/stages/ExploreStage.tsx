// ExploreStage.tsx
// Stage 2 - free experimentation. No failure state, rich feedback, hints always
// available so confusion never becomes frustration.
// See docs/WrongUInverse-game-design.md §4, technical design §12.

import { Mascot } from '../../components/Mascot.tsx';
import { ObservationLog } from '../../components/ObservationLog.tsx';
import { OrderPanel } from '../../components/OrderPanel.tsx';
import { StageRail } from '../../components/StageRail.tsx';
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
  const events = useGameStore((s) => s.events);
  const beginChallenge = useGameStore((s) => s.beginChallenge);
  const difficulty = useGameStore((s) => s.difficulty);
  const requirements = useGameStore((s) => s.requirements);
  const returnToIntro = useGameStore((s) => s.returnToIntro);

  if (!run) return null;

  const interactions = events.filter((event) => event.type === 'interaction').length;

  return (
    <main className="wui-screen">
      {/* Everything the player needs to keep checking lives here and stays
          put: the order, the count, and the way forward. The advance button
          used to sit under the bench, which on a six-station board is well
          below the fold - so players never found it, and never reached the
          report at all. */}
      <header className="wui-topbar">
        <div className="wui-topbar-row">
          <StageRail stage="explore" />
          <div className="wui-topbar-actions">
            <span className="wui-counter">
              <span className="wui-counter-value">{interactions}</span> INTERACTIONS
            </span>
            <button type="button" className="wui-primary" onClick={beginChallenge}>
              I understand this universe
            </button>
            <button type="button" className="wui-ghost" onClick={returnToIntro}>
              Leave
            </button>
          </div>
        </div>

        <div className="wui-topbar-main">
          {/* Zorblet stands beside the order he reacts to. */}
          <div className="wui-goal">
            <Mascot />
            <div>
              <h1 className="wui-stage-title">Semantic drift detected</h1>
              <p className="wui-lede">{EXPLORE_INTRO}</p>
              <p className="wui-eyebrow">SHIFTED · {run.seed}</p>
            </div>
          </div>
          <OrderPanel requirements={requirements} lockedWidgets={[]} />
        </div>
      </header>

      <WidgetBench
        mappings={run.mappings}
        values={values}
        mode="explore"
        onChange={setValue}
        seed={run.seed}
        showInterpreted
        requirements={requirements}
        hintLevels={hintLevels}
        onHint={useHint}
        hintsEnabled={difficulty.hintPolicy !== 'limited'}
      />

      <footer className="wui-footer">
        <ObservationLog observations={observations} detail={difficulty.notebookDetail} />
      </footer>
    </main>
  );
}
