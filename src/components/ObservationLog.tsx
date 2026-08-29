// ObservationLog.tsx
// The field notebook. Records VALUES the player has seen, never semantic
// labels — showing "SLIDER = CHOICE" would hand over the deduction the whole
// game is built around. See docs/WrongUInverse-technical-design.md §13.

import { WIDGET_DISPLAY_NAME } from '../content/flavorText.ts';
import type { WidgetType } from '../game/state/types.ts';

interface ObservationLogProps {
  observations: Partial<Record<WidgetType, string[]>>;
  /** How much history to keep per widget; tightened on harder tiers. */
  detail: 'full' | 'reduced' | 'minimal';
}

const DETAIL_LIMIT: Record<ObservationLogProps['detail'], number> = {
  full: 6,
  reduced: 3,
  minimal: 1,
};

export function ObservationLog({ observations, detail }: ObservationLogProps) {
  const limit = DETAIL_LIMIT[detail];
  const entries = Object.entries(observations) as [WidgetType, string[]][];
  const populated = entries.filter(([, seen]) => seen.length > 0);

  return (
    <section className="wui-notebook">
      <h2 className="wui-notebook-title">FIELD NOTES</h2>
      {populated.length === 0 ? (
        <p className="wui-notebook-empty">Nothing observed yet. Try something.</p>
      ) : (
        <ul className="wui-notebook-list">
          {populated.map(([widget, seen]) => (
            <li key={widget}>
              <span className="wui-notebook-widget">
                {WIDGET_DISPLAY_NAME[widget] ?? widget.toUpperCase()}
              </span>
              <span className="wui-notebook-values">{seen.slice(-limit).join(' → ')}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
