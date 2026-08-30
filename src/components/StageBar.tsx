// StageBar.tsx
// The one bar every stage shares: where you are and what counts on the left,
// the ways out on the right.
//
// Present on every screen including the report, so the run never loses its
// frame and the exits never move.

import type { ReactNode } from 'react';
import type { StageId } from '../game/state/types.ts';
import { StageRail } from './StageRail.tsx';

interface StageBarProps {
  stage: StageId;
  /** What this stage is counting, phrased so the stakes are unmistakable. */
  status: ReactNode;
  /** Buttons, right-aligned. */
  actions: ReactNode;
}

export function StageBar({ stage, status, actions }: StageBarProps) {
  return (
    <header className="wui-topbar">
      <div className="wui-topbar-status">
        <StageRail stage={stage} />
        <p className="wui-status">{status}</p>
      </div>
      <div className="wui-topbar-actions">{actions}</div>
    </header>
  );
}
