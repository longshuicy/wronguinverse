// ResultStage.tsx
// Not a points summary — a playful diagnosis of how the player argued with the
// interface. Giving up is reported without shaming.
// See docs/WrongUInverse-game-design.md §11, technical design §12.

import { useMemo } from 'react';
import { AssetImage } from '../../components/AssetImage.tsx';
import { StageBar } from '../../components/StageBar.tsx';
import {
  GIVE_UP_RESPONSE,
  resultHeadline,
  OPERATION_DISPLAY_NAME,
  SEMANTIC_DISPLAY_NAME,
  WIDGET_DISPLAY_NAME,
} from '../../content/flavorText.ts';
import { brainType, computeMetrics, conventionalThinking } from '../metrics.ts';
import { useGameStore } from '../state/gameStore.ts';

export function ResultStage() {
  const run = useGameStore((s) => s.run);
  const events = useGameStore((s) => s.events);
  const outcome = useGameStore((s) => s.outcome);
  const startedAt = useGameStore((s) => s.challengeStartedAt);
  const endedAt = useGameStore((s) => s.challengeEndedAt);
  const distance = useGameStore((s) => s.distance);
  const progress = useGameStore((s) => s.progress);
  const retry = useGameStore((s) => s.retrySameReality);
  const next = useGameStore((s) => s.nextUniverse);
  const returnToIntro = useGameStore((s) => s.returnToIntro);

  const mappingCount = run?.mappings.length ?? 0;
  const metrics = useMemo(
    () => computeMetrics(events, startedAt, endedAt),
    [events, startedAt, endedAt],
  );
  const conventional = conventionalThinking(metrics, mappingCount);
  const brain = brainType(metrics, mappingCount);

  if (!run || !outcome) return null;

  return (
    <main className="wui-screen">
      {/* The report keeps the same bar as every other stage, so the run never
          loses its frame and the exits never move. */}
      <StageBar
        stage="result"
        status={
          <>
            <span className="wui-status-word">
              {outcome === 'stabilized' ? 'STABILIZED' : 'ABANDONED'}
            </span>{' '}
            {run.seed}
          </>
        }
        actions={
          <>
            {/* Retrying after finally understanding the mapping is the
                satisfying half of failing, so offer it first (game design §4). */}
            <button type="button" className="wui-primary" onClick={retry}>
              Try this reality again
            </button>
            <button type="button" className="wui-ghost" onClick={next}>
              Escape to another universe
            </button>
            <button type="button" className="wui-ghost" onClick={returnToIntro}>
              Leave
            </button>
          </>
        }
      />

      <header className="wui-screen-head">
        <h1>{resultHeadline(outcome)}</h1>
        {outcome === 'gaveUp' && <p className="wui-lede">{GIVE_UP_RESPONSE}</p>}
      </header>

      {/* Two columns, not one centred stack. The panel is far wider than a
          readable line, so a single column left ~460px empty on either side
          and stacked five blocks at three different alignments. The specimen
          card is the part a player recognises and shares; the read is prose
          and belongs in a column of its own. */}
      <section className="wui-diagnosis">
        {/* Each brain type has a specimen; the pairing lives in
            content/brainTypes.ts so it is not re-invented per screen. */}
        <div className="wui-diagnosis-specimen">
          <div className="wui-diagnosis-creature">
            <AssetImage id={brain.creature} alt="" scale={2} />
          </div>
          <p className="wui-diagnosis-creature-name">{brain.creatureName}</p>
          {/* The one number that summarises the read, so it is set as a
              figure rather than as a grey footnote under the prose.
              An abandoned run has no number: see `conventionalThinking`. The
              slot is still filled rather than removed, so the card keeps its
              shape and the absence reads as deliberate. */}
          <p className="wui-diagnosis-metric-value">
            {conventional === null ? 'N/A' : `${conventional}%`}
          </p>
          <p className="wui-diagnosis-metric-label">
            {conventional === null ? 'NO READING TAKEN' : 'CONVENTIONAL THINKING'}
          </p>
        </div>

        <div className="wui-diagnosis-read">
          <p className="wui-diagnosis-brain">{brain.name}</p>
          {/* A caption for the type, not body text — the description below is
              the payoff and carries the weight. */}
          <p className="wui-diagnosis-blurb">{brain.blurb}</p>
          <p className="wui-diagnosis-description">{brain.description}</p>
        </div>
      </section>

      <dl className="wui-stats">
        {/* Interactions, not elapsed time. The run is untimed, so reporting
            seconds would grade the player on something the game never asked
            them to manage — and would punish anyone who stopped to think. */}
        <div>
          <dt>Interactions</dt>
          <dd>{metrics.interactions}</dd>
        </div>
        <div>
          <dt>Hints used</dt>
          <dd>{metrics.hintsUsed}</dd>
        </div>
        <div>
          <dt>First-attempt</dt>
          <dd>
            {metrics.firstAttemptHits}/{mappingCount}
          </dd>
        </div>
        <div>
          <dt>Controls used</dt>
          <dd>{metrics.widgetsTouched}</dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>ᴎ-{String(distance).padStart(3, '0')}</dd>
        </div>
        <div>
          <dt>Stabilized</dt>
          <dd>{progress.universesStabilized}</dd>
        </div>
      </dl>

      <section className="wui-rules">
        <h2>THIS UNIVERSE'S RULES</h2>
        <ul>
          {run.mappings.map((mapping) => (
            <li key={mapping.widget}>
              {WIDGET_DISPLAY_NAME[mapping.widget] ?? mapping.widget.toUpperCase()} →{' '}
              {SEMANTIC_DISPLAY_NAME[mapping.semantic] ?? mapping.semantic.toUpperCase()}
              {/* On a tier 2 run the meaning is only half the rule; a debrief
                  that stopped here would leave the player still not knowing
                  why the control would not answer them. */}
              {mapping.operation !== 'native' && (
                <>
                  {' · '}
                  {OPERATION_DISPLAY_NAME[mapping.operation] ?? mapping.operation.toUpperCase()}
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
