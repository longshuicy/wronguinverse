// ChallengeStage.tsx
// Stage 3 - stabilize. Same mappings, less help.
//
// Escape valves are mandatory here: Give Up and Reveal Rules are always
// present, and neither shames the player. A single wrong value never ends the
// run. See docs/WrongUInverse-game-design.md §4, §10.

import { Mascot } from '../../components/Mascot.tsx';
import { OrderPanel } from '../../components/OrderPanel.tsx';
import { StageRail } from '../../components/StageRail.tsx';
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

  if (!run) return null;

  return (
    <main className="wui-screen">
      {/* Give Up and Reveal Rules are the escape valves, so they belong where
          they can always be seen. They used to sit below the bench, which is
          off-screen on a large board. */}
      <header className="wui-topbar">
        <div className="wui-topbar-row">
          <StageRail stage="challenge" />
          <div className="wui-topbar-actions">
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
          </div>
        </div>

        <div className="wui-topbar-main">
          <div className="wui-goal">
            <Mascot />
            <div>
              <h1 className="wui-stage-title">Stabilize this dimension</h1>
              <p className="wui-lede">{CHALLENGE_INTRO}</p>
              <p className="wui-eyebrow">STABILIZATION PROTOCOL · {run.seed}</p>
            </div>
          </div>
          <OrderPanel requirements={requirements} lockedWidgets={lockedWidgets} />
        </div>
      </header>

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
      />

      {rulesRevealed && (
        <footer className="wui-footer">
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
        </footer>
      )}
    </main>
  );
}
