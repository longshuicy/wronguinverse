// ResultStage.tsx
// Not a points summary — a playful diagnosis of how the player argued with the
// interface. Giving up is reported without shaming.
// See docs/WrongUInverse-game-design.md §11, technical design §12.

import { useMemo } from 'react';
import {
  GIVE_UP_RESPONSE,
  resultHeadline,
  SEMANTIC_DISPLAY_NAME,
  WIDGET_DISPLAY_NAME,
} from '../../content/flavorText.ts';
import { brainType, computeMetrics, conventionalThinking, formatDuration } from '../metrics.ts';
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
      <header className="wui-screen-head">
        <p className="wui-eyebrow">{run.seed}</p>
        <h1>{resultHeadline(outcome)}</h1>
        {outcome === 'gaveUp' && <p className="wui-lede">{GIVE_UP_RESPONSE}</p>}
      </header>

      <section className="wui-diagnosis">
        <p className="wui-diagnosis-metric">CONVENTIONAL THINKING: {conventional}%</p>
        <p className="wui-diagnosis-brain">{brain.name}</p>
        <p className="wui-diagnosis-blurb">{brain.blurb}</p>
        {/* The doc is emphatic that this is comedy, not assessment. Say so. */}
        <p className="wui-diagnosis-caveat">
          Diagnosis is entirely unscientific and should not be shown to a doctor.
        </p>
      </section>

      <dl className="wui-stats">
        <div>
          <dt>Time</dt>
          <dd>{formatDuration(metrics.challengeMs)}</dd>
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
          <dt>Interactions</dt>
          <dd>{metrics.interactions}</dd>
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
            </li>
          ))}
        </ul>
      </section>

      <div className="wui-actions">
        {/* Retrying after finally understanding the mapping is the satisfying
            half of failing — offer it first (game design §4). */}
        <button type="button" className="wui-primary" onClick={retry}>
          Try this reality again
        </button>
        <button type="button" className="wui-ghost" onClick={next}>
          Escape to another universe
        </button>
      </div>
    </main>
  );
}
