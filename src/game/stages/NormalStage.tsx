// NormalStage.tsx
// Stage 1 — calibration. Ordinary controls doing ordinary things.
//
// Its entire job is to install the expectation the shift will violate, so it
// must feel unremarkable. Conventional pairings come from the same generator
// with `accept: ['normal']`. See technical design §12.

import { useState } from 'react';
import { CALIBRATION_INTRO, SKIP_CALIBRATION_COPY } from '../../content/flavorText.ts';
import { useGameStore } from '../state/gameStore.ts';
import { getWidgetDefinition } from '../../widgets/registry.ts';

export function NormalStage() {
  const calibration = useGameStore((s) => s.calibration);
  const index = useGameStore((s) => s.calibrationIndex);
  const values = useGameStore((s) => s.calibrationValues);
  const setValue = useGameStore((s) => s.setCalibrationValue);
  const advance = useGameStore((s) => s.advanceCalibration);
  const skip = useGameStore((s) => s.skipCalibration);
  const tutorialCompleted = useGameStore((s) => s.progress.tutorialCompleted);

  // Chosen once per mount so the joke does not change mid-stage.
  const [skipCopy] = useState(
    () => SKIP_CALIBRATION_COPY[Math.floor(Math.random() * SKIP_CALIBRATION_COPY.length)]!,
  );

  if (!calibration) return null;

  const mapping = calibration.mappings[index];
  if (!mapping) return null;

  const definition = getWidgetDefinition(mapping.widget);
  if (!definition) return null;

  const Widget = definition.component;
  const value = values[mapping.widget];
  const satisfied = value !== undefined && mapping.domain.equals(value, mapping.domain.target);

  return (
    <main className="wui-screen">
      <header className="wui-screen-head">
        <p className="wui-eyebrow">HOME UNIVERSE · CALIBRATION</p>
        <h1>Reality Calibration Terminal</h1>
        <p className="wui-lede">{CALIBRATION_INTRO}</p>
      </header>

      <p className="wui-progress">
        TASK {index + 1} / {calibration.mappings.length}
      </p>

      <section className="wui-station">
        <header className="wui-station-head">
          <span className="wui-station-name">
            Set {definition.label.toLowerCase()} to{' '}
            <strong>{mapping.domain.display(mapping.domain.target)}</strong>
          </span>
        </header>
        <div className="wui-station-control">
          <Widget
            domain={mapping.domain}
            value={value}
            onChange={(next) => setValue(mapping.widget, next)}
            mode="normal"
          />
        </div>
        <p className="wui-station-output">
          <span className="wui-station-output-label">READS AS</span>
          <span className="wui-station-output-value">
            {value === undefined ? '—' : mapping.domain.display(value)}
          </span>
        </p>
      </section>

      <div className="wui-actions">
        <button type="button" className="wui-primary" disabled={!satisfied} onClick={advance}>
          {satisfied ? 'Confirm' : 'Set the value to continue'}
        </button>
        {/* Calibration is tutorial, not replay content — once seen, it can go. */}
        {tutorialCompleted && (
          <button type="button" className="wui-ghost" onClick={skip}>
            {skipCopy}
          </button>
        )}
      </div>
    </main>
  );
}
