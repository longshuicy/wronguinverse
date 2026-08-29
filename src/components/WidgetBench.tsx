// WidgetBench.tsx
// The row of controls the player actually operates, shared by Explore and
// Challenge. The two stages differ only in how much they tell you — never in
// which controls exist or how they behave.

import { hintText, WIDGET_DISPLAY_NAME } from '../content/flavorText.ts';
import type { HintLevel, Mapping, Stage, WidgetType } from '../game/state/types.ts';
import { getWidgetDefinition } from '../widgets/registry.ts';

interface WidgetBenchProps {
  mappings: Mapping[];
  values: Partial<Record<WidgetType, unknown>>;
  mode: Stage;
  onChange: (widget: WidgetType, value: unknown) => void;
  /** Show what each control currently reads as. */
  showInterpreted: boolean;
  lockedWidgets?: WidgetType[];
  hintLevels?: Partial<Record<WidgetType, HintLevel>>;
  onHint?: (widget: WidgetType) => void;
  hintsEnabled?: boolean;
}

export function WidgetBench({
  mappings,
  values,
  mode,
  onChange,
  showInterpreted,
  lockedWidgets = [],
  hintLevels = {},
  onHint,
  hintsEnabled = false,
}: WidgetBenchProps) {
  return (
    <div className="wui-bench">
      {mappings.map((mapping) => {
        const definition = getWidgetDefinition(mapping.widget);
        if (!definition) return null;

        const Widget = definition.component;
        const value = values[mapping.widget];
        const locked = lockedWidgets.includes(mapping.widget);
        const level = hintLevels[mapping.widget] ?? 0;

        return (
          <section
            key={mapping.widget}
            className={locked ? 'wui-station wui-station-locked' : 'wui-station'}
          >
            <header className="wui-station-head">
              <span className="wui-station-name">
                {WIDGET_DISPLAY_NAME[mapping.widget] ?? definition.label}
              </span>
              {locked && <span className="wui-station-lock">✓ LOCKED</span>}
            </header>

            <div className="wui-station-control">
              <Widget
                domain={mapping.domain}
                value={value}
                onChange={(next) => onChange(mapping.widget, next)}
                mode={mode}
              />
            </div>

            {showInterpreted && (
              <p className="wui-station-output">
                <span className="wui-station-output-label">READS AS</span>
                <span className="wui-station-output-value">
                  {value === undefined ? '—' : mapping.domain.display(value)}
                </span>
              </p>
            )}

            {hintsEnabled && onHint && (
              <div className="wui-station-hint">
                {level > 0 && (
                  <p className="wui-hint-text">
                    {hintText(mapping.widget, mapping.semantic, level as 1 | 2 | 3)}
                  </p>
                )}
                {level < 3 && (
                  <button
                    type="button"
                    className="wui-hint-button"
                    onClick={() => onHint(mapping.widget)}
                  >
                    {level === 0 ? 'Ask the universe' : 'Ask again'}
                  </button>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
