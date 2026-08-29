// StageRail.tsx
// A persistent map of the run: CALIBRATE → SHIFT → EXPLORE → STABILIZE → REPORT.
//
// The stages used to be told apart only by their heading, which meant a player
// mid-run could not see where they were or what was coming. Tinting each stage
// a different colour was not enough on its own — a tint tells you something
// changed, not what. This names the steps and marks the current one.

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
    <nav className="wui-rail" aria-label="Run progress">
      {STEPS.map((step, i) => {
        const state = i === index ? 'current' : i < index ? 'done' : 'todo';
        return (
          <span
            key={step.id}
            className={`wui-rail-step is-${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            {step.label}
          </span>
        );
      })}
    </nav>
  );
}
