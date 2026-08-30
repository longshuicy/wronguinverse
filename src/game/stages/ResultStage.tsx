// ResultStage.tsx
// Not a points summary: a playful diagnosis of how the player argued with the
// interface. Giving up is reported without shaming.
// See docs/WrongUInverse-game-design.md §11, technical design §12.
//
// Dealt out in beats rather than rendered whole. The content was never the
// problem; the pacing was. Everything landed in one frame, so the verdict, the
// read, the numbers and the rules all competed for the same instant and the
// screen read as a page that had finished loading. Four beats, about 1.7
// seconds, and any press or key ends it early (see `useStagedReveal`).
//
// The rules table is deliberately LAST. It is the answer to the puzzle the
// player has just spent a run failing to solve, and it used to sit at the
// bottom of a completed page as though it were a footnote.

import { useEffect, useMemo } from 'react';
import { AssetImage } from '../../components/AssetImage.tsx';
import { CastGallery } from '../../components/CastGallery.tsx';
import { CountUp } from '../../components/CountUp.tsx';
import { Mascot } from '../../components/Mascot.tsx';
import { StageBar } from '../../components/StageBar.tsx';
import {
  GIVE_UP_RESPONSE,
  resultHeadline,
  OPERATION_DISPLAY_NAME,
  SEMANTIC_DISPLAY_NAME,
  WIDGET_DISPLAY_NAME,
} from '../../content/flavorText.ts';
import { brainType, computeMetrics, conventionalThinking } from '../metrics.ts';
import { useStagedReveal } from '../useStagedReveal.ts';
import { playSfx } from '../../audio/audioManager.ts';
import { useGameStore } from '../state/gameStore.ts';

/** Verdict, specimen, numbers, rules, cast. */
const BEATS = 5;

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
  const { shown } = useStagedReveal(BEATS);

  // One tick per beat as it lands, so the report is heard being assembled
  // rather than just watched. Skipping fires no burst: `shown` jumps straight
  // to the end and this only runs on change.
  useEffect(() => {
    // Beat 1 is on screen from the first frame, so it gets no tick: a sound
    // for something the player never saw arrive is a sound with no cause.
    if (shown > 1 && shown < BEATS) playSfx('value_tick');
    if (shown === BEATS) playSfx('selection_confirm');
  }, [shown]);

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

      <header className="wui-screen-head wui-beat" data-shown={shown >= 1}>
        {/* Zorblet was built with a success and a confused state and appeared
            on no screen where either applied. It watches the player argue with
            a calendar for a whole run; it should be there at the end of it. */}
        {/* Scale 1, not the 2 the bench uses: beside a heading rather than
            alone in a column, and at 2 it was taller than the verdict it is
            reacting to. */}
        <Mascot scale={1} />
        <div>
          <h1 className="wui-verdict">{resultHeadline(outcome)}</h1>
          {outcome === 'gaveUp' && <p className="wui-lede">{GIVE_UP_RESPONSE}</p>}
        </div>
      </header>

      {/* Two columns, not one centred stack. The panel is far wider than a
          readable line, so a single column left ~460px empty on either side
          and stacked five blocks at three different alignments. The specimen
          card is the part a player recognises and shares; the read is prose
          and belongs in a column of its own. */}
      <section className="wui-diagnosis wui-beat" data-shown={shown >= 2}>
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
            {conventional === null ? (
              'N/A'
            ) : (
              <CountUp value={conventional} start={shown >= 2} suffix="%" />
            )}
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

      <dl className="wui-stats wui-beat" data-shown={shown >= 3}>
        {/* Interactions, not elapsed time. The run is untimed, so reporting
            seconds would grade the player on something the game never asked
            them to manage — and would punish anyone who stopped to think. */}
        <div>
          <dt>Interactions</dt>
          <dd>
            <CountUp value={metrics.interactions} start={shown >= 3} />
          </dd>
        </div>
        <div>
          <dt>Hints used</dt>
          <dd>
            <CountUp value={metrics.hintsUsed} start={shown >= 3} />
          </dd>
        </div>
        <div>
          <dt>First-attempt</dt>
          <dd>
            {metrics.firstAttemptHits}/{mappingCount}
          </dd>
        </div>
        <div>
          <dt>Controls used</dt>
          <dd>
            <CountUp value={metrics.widgetsTouched} start={shown >= 3} />
          </dd>
        </div>
        <div>
          <dt>Distance</dt>
          <dd>ᴎ-{String(distance).padStart(3, '0')}</dd>
        </div>
        <div>
          <dt>Stabilized</dt>
          <dd>
            <CountUp value={progress.universesStabilized} start={shown >= 3} />
          </dd>
        </div>
      </dl>

      <section className="wui-rules wui-beat" data-shown={shown >= 4}>
        <h2>THIS UNIVERSE'S RULES</h2>
        <ul>
          {run.mappings.map((mapping, index) => (
            // Staggered against each other as well as against the beat: the
            // rules are a list of answers, and a list of answers appearing all
            // at once is read as a block rather than as answers.
            <li key={mapping.widget} style={{ animationDelay: `${index * 70}ms` }}>
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
      {/* Last, and after the answer: the run is explained, and this is what
          there is to come back for. */}
      <div className="wui-beat" data-shown={shown >= 5}>
        <CastGallery seen={progress.typesSeen} current={brain.id} />
      </div>
    </main>
  );
}
