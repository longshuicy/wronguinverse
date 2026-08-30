// OrderPanel.tsx
// The stabilization order, pinned in the header beside Zorblet.
//
// This is the thing the player checks most often, so it never scrolls away and
// never has to be hunted for. Each line names a control on the bench, so the
// panel doubles as a legend: read a line here, find the card with that name.

import type { Requirement, WidgetType } from '../game/state/types.ts';

interface OrderPanelProps {
  requirements: Requirement[];
  lockedWidgets: WidgetType[];
  /** Hide targets during exploration if a level wants the order withheld. */
  showTargets?: boolean;
}

export function OrderPanel({ requirements, lockedWidgets, showTargets = true }: OrderPanelProps) {
  const done = requirements.filter((r) => lockedWidgets.includes(r.widget)).length;

  return (
    <section className="wui-order" aria-label="Stabilization order">
      <header className="wui-order-head">
        <h2>STABILIZATION ORDER</h2>
        <span className="wui-order-count">
          {done}/{requirements.length}
        </span>
      </header>
      <ul className="wui-order-list">
        {requirements.map((requirement) => {
          const locked = lockedWidgets.includes(requirement.widget);
          return (
            <li
              key={requirement.label}
              className={locked ? 'wui-order-item is-locked' : 'wui-order-item'}
            >
              <span className="wui-order-label">{requirement.label}</span>
              {showTargets && <span className="wui-order-target">{requirement.targetDisplay}</span>}
              {/* Not colour alone: the tick carries the same meaning for
                  players who cannot distinguish the green. */}
              {locked && <span className="wui-order-lock">✓</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
