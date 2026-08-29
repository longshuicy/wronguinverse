// DebugScreen.tsx
// Milestone 1 mechanics sandbox: renders a generated universe and exposes every
// internal value the real game will hide.
//
// This is a development harness, not a game stage — it deliberately reveals the
// mappings that Explore/Challenge exist to make the player deduce. It lives
// outside `game/stages/` so it is easy to drop once the real loop lands.

import { useMemo, useState } from 'react';
import { initialValue } from '../game/domains/index.ts';
import { generateRun } from '../game/generator/mappingGenerator.ts';
import { createSeed } from '../game/generator/seededRandom.ts';
import type { Mapping } from '../game/state/types.ts';
import { getWidgetDefinition } from '../widgets/registry.ts';
import './debug.css';

const MAPPING_COUNT = 4;

function MappingRow({
  mapping,
  value,
  onChange,
}: {
  mapping: Mapping;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const definition = getWidgetDefinition(mapping.widget);
  if (!definition) return null;

  const Widget = definition.component;
  const { domain } = mapping;
  const onTarget = domain.equals(value, domain.target);

  return (
    <section className="debug-row">
      <header className="debug-row-header">
        <span className="debug-widget">{definition.label}</span>
        <span className="debug-arrow">actually means</span>
        <span className="debug-semantic">{mapping.semantic}</span>
      </header>

      <div className="debug-control">
        <Widget domain={domain} value={value} onChange={onChange} mode="explore" />
      </div>

      <dl className="debug-readout">
        <div>
          <dt>Interpreted</dt>
          <dd className="debug-interpreted">{domain.display(value)}</dd>
        </div>
        <div>
          <dt>Normalized</dt>
          <dd>{domain.normalize(value).toFixed(3)}</dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd className={onTarget ? 'debug-hit' : undefined}>
            {domain.display(domain.target)}
            {onTarget ? ' ✓' : ''}
          </dd>
        </div>
        <div>
          <dt>Raw</dt>
          <dd className="debug-raw">{JSON.stringify(value)}</dd>
        </div>
      </dl>
    </section>
  );
}

export function DebugScreen() {
  const [seed, setSeed] = useState(() => createSeed());
  const run = useMemo(() => generateRun({ seed, count: MAPPING_COUNT }), [seed]);

  // Keyed by widget: a widget appears at most once per run, and re-keying on the
  // seed makes React discard the previous universe's values on regeneration.
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(run.mappings.map((m) => [m.widget, initialValue(m.domain)])),
  );

  const regenerate = (nextSeed: string) => {
    const nextRun = generateRun({ seed: nextSeed, count: MAPPING_COUNT });
    setValues(Object.fromEntries(nextRun.mappings.map((m) => [m.widget, initialValue(m.domain)])));
    setSeed(nextSeed);
  };

  const solved = run.mappings.every((m) => m.domain.equals(values[m.widget], m.domain.target));

  return (
    <main className="debug-screen">
      <header className="debug-header">
        <h1>
          WrongUI<span className="debug-flip">N</span>verse
        </h1>
        <p className="debug-subtitle">Milestone 1 — mechanics sandbox</p>

        <div className="debug-seed">
          <label>
            Seed
            <input
              value={seed}
              onChange={(event) => regenerate(event.target.value)}
              spellCheck={false}
            />
          </label>
          <button type="button" onClick={() => regenerate(createSeed())}>
            New universe
          </button>
        </div>
      </header>

      {solved && <p className="debug-solved">All targets satisfied.</p>}

      {run.mappings.map((mapping) => (
        <MappingRow
          key={mapping.widget}
          mapping={mapping}
          value={values[mapping.widget]}
          onChange={(next) => setValues((prev) => ({ ...prev, [mapping.widget]: next }))}
        />
      ))}
    </main>
  );
}
