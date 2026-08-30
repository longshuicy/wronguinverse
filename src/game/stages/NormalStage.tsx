// NormalStage.tsx
// Stage 1 - calibration. Ordinary controls doing ordinary things.
//
// Its entire job is to install the expectation the shift will violate, so it
// must feel unremarkable. Conventional pairings come from the same generator
// with `accept: ['normal']`. See technical design §12.

import { useState } from 'react';
import { StageBar } from '../../components/StageBar.tsx';
import { CALIBRATION_INTRO, SKIP_CALIBRATION_COPY } from '../../content/flavorText.ts';
import { useGameStore } from '../state/gameStore.ts';
import { getWidgetDefinition } from '../../widgets/registry.ts';

export function NormalStage() {
  const calibration = useGameStore((s) => s.calibration);
  const values = useGameStore((s) => s.calibrationValues);
  const setValue = useGameStore((s) => s.setCalibrationValue);
  const skip = useGameStore((s) => s.skipCalibration);
  const returnToIntro = useGameStore((s) => s.returnToIntro);
  const tutorialCompleted = useGameStore((s) => s.progress.tutorialCompleted);

  // Chosen once per mount so the joke does not change while it is on screen.
  const [skipCopy] = useState(
    () => SKIP_CALIBRATION_COPY[Math.floor(Math.random() * SKIP_CALIBRATION_COPY.length)]!,
  );

  if (!calibration) return null;

  const mappings = calibration.mappings;
  const isSatisfied = (index: number) => {
    const mapping = mappings[index]!;
    const value = values[mapping.widget];
    return value !== undefined && mapping.domain.equals(value, mapping.domain.target);
  };
  const doneCount = mappings.filter((_, i) => isSatisfied(i)).length;
  const allDone = doneCount === mappings.length;

  return (
    <main className="wui-screen">
      <StageBar
        stage="normal"
        status={
          <>
            <span className="wui-status-word">CALIBRATING</span>{' '}
            <span className="wui-counter-value">
              {doneCount}/{mappings.length}
            </span>{' '}
            set
          </>
        }
        actions={
          <>
            <button type="button" className="wui-primary" disabled={!allDone} onClick={skip}>
              {allDone ? 'Confirm calibration' : `Set all ${mappings.length} readings`}
            </button>
            {/* Calibration is tutorial, not replay content: once seen, it can go. */}
            {tutorialCompleted && (
              <button type="button" className="wui-ghost" onClick={skip}>
                {skipCopy}
              </button>
            )}
            <button type="button" className="wui-ghost" onClick={returnToIntro}>
              Leave
            </button>
          </>
        }
      />

      <header className="wui-screen-head">
        <h1 className="wui-stage-title">Reality Calibration Terminal</h1>
        <p className="wui-lede">{CALIBRATION_INTRO}</p>
      </header>

      {/* All four at once rather than one at a time. Stage 1 is meant to feel
          ordinary and brief; a four-step wizard for four trivial tasks made it
          feel like paperwork, and hid how small it actually is. */}
      <div className="wui-bench">
        {mappings.map((mapping, index) => {
          const definition = getWidgetDefinition(mapping.widget);
          if (!definition) return null;
          const Widget = definition.component;
          const value = values[mapping.widget];
          const satisfied = isSatisfied(index);

          return (
            <section
              key={mapping.widget}
              className={satisfied ? 'wui-station wui-station-locked' : 'wui-station'}
            >
              <header className="wui-station-head">
                <span className="wui-station-name">{definition.label}</span>
                {satisfied && <span className="wui-station-lock">✓ SET</span>}
              </header>

              <p className="wui-station-goal">
                <span className="wui-station-goal-arrow">SET TO</span>
                <span className="wui-station-goal-value">
                  {mapping.domain.display(mapping.domain.target)}
                </span>
              </p>

              {/* Marked like the shifted bench's controls, so the global click
                  sound leaves them to their own value tick. See
                  `audio/useInterfaceSounds.ts`. */}
              <div className="wui-station-control" data-widget>
                <Widget
                  domain={mapping.domain}
                  value={value}
                  onChange={(next) => setValue(mapping.widget, next)}
                  mode="normal"
                  // Calibration is the player's home universe: whatever the
                  // tier does to the shifted run, the baseline it is measured
                  // against must behave exactly as built.
                  operation="native"
                />
              </div>

              <p className="wui-station-output">
                <span className="wui-station-output-label">READS AS</span>
                <span className="wui-station-output-value">
                  {value === undefined ? '--' : mapping.domain.display(value)}
                </span>
              </p>
            </section>
          );
        })}
      </div>
    </main>
  );
}
