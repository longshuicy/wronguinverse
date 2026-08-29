// ChallengeStage.tsx
// Stage 3 — stabilize. Same mappings, less help.
//
// Escape valves are mandatory here: Give Up and Reveal Rules are always
// present, and neither shames the player. A single wrong value never ends the
// run. See docs/WrongUInverse-game-design.md §4, §10.

import { ChallengeCard } from '../../components/ChallengeCard.tsx';
import { Mascot } from '../../components/Mascot.tsx';
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

  if (!run) return null;

  const paired = difficulty.pairRequirementsWithWidgets;
  const done = requirements.filter((r) => lockedWidgets.includes(r.widget)).length;

  return (
    <main className="wui-screen">
      <header className="wui-topbar">
        <StageRail stage="challenge" />
        <div className="wui-topbar-main">
          <div className="wui-goal">
            <Mascot />
            <div>
              <h1 className="wui-stage-title">Stabilize this dimension</h1>
              <p className="wui-lede">{CHALLENGE_INTRO}</p>
            </div>
          </div>
          {/* Progress is the one thing that must always be visible. */}
          <p className="wui-tally">
            <span className="wui-tally-count">
              {done}/{requirements.length}
            </span>
            <span className="wui-tally-label">LOCKED</span>
          </p>
        </div>
        <p className="wui-eyebrow">STABILIZATION PROTOCOL · {run.seed}</p>
      </header>

      {!paired && (
        <ChallengeCard
          title="STABILIZATION ORDER"
          requirements={requirements}
          lockedWidgets={lockedWidgets}
        />
      )}

      <WidgetBench
        mappings={run.mappings}
        values={values}
        mode="challenge"
        onChange={setValue}
        seed={run.seed}
        // Easy tiers keep the readout; harder ones leave the requirement lock
        // as the only signal (technical design §15).
        showInterpreted={difficulty.interpretedOutputInChallenge}
        requirements={paired ? requirements : undefined}
        lockedWidgets={lockedWidgets}
      />

      <footer className="wui-footer">
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

        <div className="wui-actions">
          {!rulesRevealed && (
            <button type="button" className="wui-ghost" onClick={revealRules}>
              Reveal rules
            </button>
          )}
          <button type="button" className="wui-ghost" onClick={giveUp}>
            Give up
          </button>
        </div>
      </footer>
    </main>
  );
}
