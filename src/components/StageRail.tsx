// StageRail.tsx
// A map of the run: CALIBRATE, SHIFT, EXPLORE, STABILIZE, REPORT.
//
// Drawn as a progress track, not a row of chips. Boxed labels read as buttons
// and invite clicks that do nothing, so there are no borders, no panels and no
// hover states here: just a connecting line, a marker on the current step, and
// three levels of dimming.

import type { StageId } from '../game/state/types.ts';

const STEPS: { id: StageId; label: string }[] = [
  { id: 'normal', label: 'CALIBRATE' },
  { id: 'shift', label: 'SHIFT' },
  { id: 'explore', label: 'EXPLORE' },
  { id: 'challenge', label: 'STABILIZE' },
  { id: 'result', label: 'REPORT' },
];

interface StageRailProps {
  stage: StageId;
}

export function StageRail({ stage }: StageRailProps) {
  const index = STEPS.findIndex((step) => step.id === stage);
  if (index < 0) return null;

  return (
    <ol className="wui-rail" aria-label="Run progress">
      {STEPS.map((step, i) => {
        const state = i === index ? 'current' : i < index ? 'done' : 'todo';
        return (
          <li
            key={step.id}
            className={`wui-rail-step is-${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="wui-rail-mark" aria-hidden="true" />
            <span className="wui-rail-label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
