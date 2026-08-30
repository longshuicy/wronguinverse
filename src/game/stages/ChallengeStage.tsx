// ChallengeStage.tsx
// Stage 3 - stabilize. Same mappings, less help.
//
// Escape valves are mandatory here: Give Up and Reveal Rules are always
// present, and neither shames the player. A single wrong value never ends the
// run. See docs/WrongUInverse-game-design.md §4, §10.

import { InstabilityMeter } from '../../components/InstabilityMeter.tsx';
import { Mascot } from '../../components/Mascot.tsx';
import { OrderPanel } from '../../components/OrderPanel.tsx';
import { StageBar } from '../../components/StageBar.tsx';
import { WidgetBench } from '../../components/WidgetBench.tsx';
import {
  CHALLENGE_INTRO,
  OPERATION_DISPLAY_NAME,
  SEMANTIC_DISPLAY_NAME,
  WIDGET_DISPLAY_NAME,
} from '../../content/flavorText.ts';
import { useEffect, useRef } from 'react';
import { computeMetrics } from '../metrics.ts';
import { mascotState, zorbletLine } from '../mascot.ts';
import { useGameStore } from '../state/gameStore.ts';

/** `92s` / `2m 14s`. Short enough to sit in a stat cell. */
function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  if (total < 60) return `${total}s`;
  return `${Math.floor(total / 60)}m ${total % 60}s`;
}

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
  const hintLevels = useGameStore((s) => s.hintLevels);
  const useHint = useGameStore((s) => s.useHint);
  const operationHintLevels = useGameStore((s) => s.operationHintLevels);
  const useOperationHint = useGameStore((s) => s.useOperationHint);
  const outcome = useGameStore((s) => s.outcome);
  const openReport = useGameStore((s) => s.openReport);
  const challengeStartedAt = useGameStore((s) => s.challengeStartedAt);
  const challengeEndedAt = useGameStore((s) => s.challengeEndedAt);

  // Declared before the early return: hooks cannot be called conditionally.
  const reportRef = useRef<HTMLButtonElement>(null);

  // A dialog that appears without taking focus leaves a keyboard or screen
  // reader user still on the bench behind it, unaware anything happened.
  useEffect(() => {
    if (outcome === 'stabilized') reportRef.current?.focus();
  }, [outcome]);

  if (!run) return null;

  const interactions = events.filter((event) => event.type === 'interaction').length;

  // The run is finished but the player has not asked for the debrief yet. The
  // bench stays on screen behind this, all of it locked, which is the picture
  // the whole run has been building towards.
  const stabilized = outcome === 'stabilized';
  const metrics = stabilized ? computeMetrics(events, challengeStartedAt, challengeEndedAt) : null;

  return (
    <main className="wui-screen">
      <StageBar
        stage="challenge"
        status={
          stabilized ? (
            <>
              <span className="wui-status-word">STABILIZED</span>{' '}
              <span className="wui-counter-value">
                {requirements.length}/{requirements.length}
              </span>{' '}
              locked
            </>
          ) : (
            <>
              <span className="wui-status-word">STABILIZING</span>{' '}
              <span className="wui-counter-value">
                {lockedWidgets.length}/{requirements.length}
              </span>{' '}
              locked
            </>
          )
        }
        actions={
          <>
            {/* Nothing left to reveal or give up on once it is done. */}
            {!stabilized && !rulesRevealed && (
              <button type="button" className="wui-ghost" onClick={revealRules}>
                Reveal rules
              </button>
            )}
            {!stabilized && (
              <button type="button" className="wui-ghost" onClick={giveUp}>
                Give up
              </button>
            )}
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
              {/* Zorblet reacting out loud. Behaviour only, never meaning:
                  see the rules at the top of `content/zorbletLines.ts`. */}
              <p className="wui-zorblet-line">
                {zorbletLine(mascotState('challenge', null, events), events)}
              </p>
              <p className="wui-eyebrow">STABILIZATION PROTOCOL · {run.seed}</p>
            </div>
          </div>

          {/* Under the order, where the player looks after a miss. Cosmetic:
              see the header of InstabilityMeter for why it must stay that way. */}
          <InstabilityMeter
            misses={
              events.filter((event) => event.type === 'challenge_attempt' && !event.correct).length
            }
            mappingCount={run.mappings.length}
          />

          <OrderPanel requirements={requirements} lockedWidgets={lockedWidgets} />

          {/* Effort belongs here, not in the bar: this is the stage that is
              actually measured, and the bar was getting crowded. Once the run
              is done the panel above carries the same number, better. */}
          {!stabilized && (
            <p className="wui-effort">
              <span className="wui-effort-value">{interactions}</span> INTERACTIONS SO FAR
            </p>
          )}

          {rulesRevealed && (
            <section className="wui-rules">
              <h2>UNIVERSE RULES</h2>
              <ul>
                {run.mappings.map((mapping) => (
                  <li key={mapping.widget}>
                    {WIDGET_DISPLAY_NAME[mapping.widget] ?? mapping.widget.toUpperCase()} →{' '}
                    {SEMANTIC_DISPLAY_NAME[mapping.semantic] ?? mapping.semantic.toUpperCase()}
                    {/* On a Tier 2 run the meaning is only half the rule. A
                        reveal that stopped here would leave the player knowing
                        what a control is for and still unable to work it. */}
                    {mapping.operation !== 'native' && (
                      <>
                        {' · '}
                        {OPERATION_DISPLAY_NAME[mapping.operation] ??
                          mapping.operation.toUpperCase()}
                      </>
                    )}
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
          // Hints follow the player into stabilization. Withholding them here
          // only punished someone who worked out WHICH control they were stuck
          // on, which is the deduction the game is asking for. The hardest
          // level still withholds them, as it does everywhere else.
          hintLevels={hintLevels}
          onHint={useHint}
          hintsEnabled={difficulty.hintPolicy !== 'limited'}
          operationHintLevels={operationHintLevels}
          onOperationHint={useOperationHint}
        />
      </div>

      {/* A dialog rather than a panel in the column: finishing the run is the
          one moment that should interrupt. It sits OVER the completed bench
          rather than replacing it, so the thing the player just achieved is
          still visible behind the numbers describing it. */}
      {stabilized && metrics && (
        <div className="wui-modal-backdrop" role="presentation">
          <section
            className="wui-modal wui-complete"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wui-complete-head"
          >
            <h2 className="wui-complete-head" id="wui-complete-head">
              ALL READINGS LOCKED
            </h2>
            <p className="wui-complete-lede">
              The dimension is stable. You worked out what {requirements.length} controls
              {run.tier === 2 ? ' meant, and how to work them' : ' actually meant'}.
            </p>

            <dl className="wui-complete-stats">
              <div>
                <dt>TIME</dt>
                <dd>{formatDuration(metrics.challengeMs)}</dd>
              </div>
              <div>
                <dt>INTERACTIONS</dt>
                <dd>{metrics.interactions}</dd>
              </div>
              <div>
                <dt>FIRST TRY</dt>
                <dd>
                  {metrics.firstAttemptHits}/{requirements.length}
                </dd>
              </div>
              <div>
                <dt>HINTS USED</dt>
                <dd>{metrics.hintsUsed}</dd>
              </div>
            </dl>

            <button type="button" className="wui-start" onClick={openReport} ref={reportRef}>
              Read the report
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
