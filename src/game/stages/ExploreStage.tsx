// ExploreStage.tsx
// Stage 2 — free experimentation. No failure state, rich feedback, hints always
// available so confusion never becomes frustration.
// See docs/WrongUInverse-game-design.md §4, technical design §12.

import { ChallengeCard } from '../../components/ChallengeCard.tsx';
import { ObservationLog } from '../../components/ObservationLog.tsx';
import { Mascot } from '../../components/Mascot.tsx';
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

  if (!run) return null;

  const paired = difficulty.pairRequirementsWithWidgets;
  const interactions = events.filter((event) => event.type === 'interaction').length;

  return (
    <main className="wui-screen">
      {/* Sticky: the objective and the clock are what the player checks most,
          and both used to scroll away behind the bench. */}
      <header className="wui-topbar">
        <StageRail stage="explore" />
        <div className="wui-topbar-main">
          {/* Zorblet stands beside the objective rather than floating in a
              corner: he reacts to what you are doing, so he belongs next to
              the thing you are reading. */}
          <div className="wui-goal">
            <Mascot />
            <div>
              <h1 className="wui-stage-title">Semantic drift detected</h1>
              <p className="wui-lede">{EXPLORE_INTRO}</p>
            </div>
          </div>
          {/* Where the countdown used to be. Exploration is untimed; what is
              measured is how much poking it took, and saying so up front is
              fairer than measuring something the player cannot see. */}
          <p className="wui-tally">
            <span className="wui-tally-count wui-tally-neutral">{interactions}</span>
            <span className="wui-tally-label">INTERACTIONS</span>
          </p>
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
        seed={run.seed}
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
