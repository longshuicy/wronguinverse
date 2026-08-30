// ChallengeStage.tsx
// Stage 3 - stabilize. Same mappings, less help.
//
// Escape valves are mandatory here: Give Up and Reveal Rules are always
// present, and neither shames the player. A single wrong value never ends the
// run. See docs/WrongUInverse-game-design.md §4, §10.

import { Mascot } from '../../components/Mascot.tsx';
import { OrderPanel } from '../../components/OrderPanel.tsx';
import { StageBar } from '../../components/StageBar.tsx';
import { WidgetBench } from '../../components/WidgetBench.tsx';
import {
  CHALLENGE_INTRO,
  SEMANTIC_DISPLAY_NAME,
  WIDGET_DISPLAY_NAME,
} from '../../content/flavorText.ts';
import { useGameStore } from '../state/gameStore.ts';

export function ChallengeStage() {
  const run = useGameStore((s) => s.run);
  const values = useGameStore((s) => s.values);
  const setValue = useGameStore((s) => s.setValue);
  const requirements = useGameStore((s) => s.requirements);
  const lockedWidgets = useGameStore((s) => s.lockedWidgets);
  const rulesRevealed = useGameStore((s) => s.rulesRevealed);
  const revealRules = useGameStore((s) => s.revealRules);
  const giveUp = useGameStore((s) => s.giveUp);
  const difficulty = useGameStore((s) => s.difficulty);
  const returnToIntro = useGameStore((s) => s.returnToIntro);
  const observations = useGameStore((s) => s.observations);
  const events = useGameStore((s) => s.events);

  if (!run) return null;

  const interactions = events.filter((event) => event.type === 'interaction').length;

  return (
    <main className="wui-screen">
      <StageBar
        stage="challenge"
        status={
          <>
            <span className="wui-status-word">STABILIZING</span>{' '}
            <span className="wui-counter-value">
              {lockedWidgets.length}/{requirements.length}
            </span>{' '}
            locked
          </>
        }
        actions={
          <>
            {!rulesRevealed && (
              <button type="button" className="wui-ghost" onClick={revealRules}>
                Reveal rules
              </button>
            )}
            <button type="button" className="wui-ghost" onClick={giveUp}>
              Give up
            </button>
            <button type="button" className="wui-ghost" onClick={returnToIntro}>
              Leave
            </button>
          </>
        }
      />

      {/* Two columns on a wide screen. The briefing and the order are what a
          player re-reads constantly, so they share a sticky left column and
          stay put while the bench flows beside them. */}
      <div className="wui-board">
        <aside className="wui-board-aside">
          <div className="wui-goal">
            <Mascot />
            <div>
              <h1 className="wui-stage-title">Stabilize this dimension</h1>
              <p className="wui-lede">{CHALLENGE_INTRO}</p>
              <p className="wui-eyebrow">STABILIZATION PROTOCOL · {run.seed}</p>
            </div>
          </div>

          <OrderPanel requirements={requirements} lockedWidgets={lockedWidgets} />

          {/* Effort belongs here, not in the bar: this is the stage that is
              actually measured, and the bar was getting crowded. */}
          <p className="wui-effort">
            <span className="wui-effort-value">{interactions}</span> INTERACTIONS SO FAR
          </p>

          {rulesRevealed && (
            <section className="wui-rules">
              <h2>UNIVERSE RULES</h2>
              <ul>
                {run.mappings.map((mapping) => (
                  <li key={mapping.widget}>
                    {WIDGET_DISPLAY_NAME[mapping.widget] ?? mapping.widget.toUpperCase()} →{' '}
                    {SEMANTIC_DISPLAY_NAME[mapping.semantic] ?? mapping.semantic.toUpperCase()}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <WidgetBench
          mappings={run.mappings}
          values={values}
          mode="challenge"
          onChange={setValue}
          seed={run.seed}
          // Easy levels keep the readout; the hardest leaves the requirement
          // lock as the only signal (technical design §15).
          showInterpreted={difficulty.interpretedOutputInChallenge}
          requirements={requirements}
          lockedWidgets={lockedWidgets}
          observations={observations}
          observationDetail={difficulty.notebookDetail}
        />
      </div>
    </main>
  );
}
