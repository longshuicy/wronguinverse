// WidgetBench.tsx
// The controls the player actually operates, shared by Explore and Challenge.
// The two stages differ only in how much they tell you — never in which
// controls exist or how they behave.
//
// Laid out as a grid rather than a column so the whole bench is visible at
// once: comparing what two controls read as is the core act of deduction, and
// that is impossible if half of them are below the fold.

import { hintText } from '../content/flavorText.ts';
import type { HintLevel, Mapping, Requirement, Stage, WidgetType } from '../game/state/types.ts';
import { getWidgetDefinition } from '../widgets/registry.ts';

interface WidgetBenchProps {
  mappings: Mapping[];
  values: Partial<Record<WidgetType, unknown>>;
  mode: Stage;
  onChange: (widget: WidgetType, value: unknown) => void;
  /** Show what each control currently reads as. */
  showInterpreted: boolean;
  /**
   * Requirements to print on the controls that satisfy them.
   *
   * When supplied, a station is headed by its objective ("COMPANION → QUONK")
   * instead of by the name of its control. "CHECKBOX" was noise: the player can
   * see it is a checkbox. What they cannot see is which line of the order it
   * answers. Withheld on harder tiers, where matching order to bench is part of
   * the puzzle.
   */
  requirements?: Requirement[];
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
  requirements,
  lockedWidgets = [],
  hintLevels = {},
  onHint,
  hintsEnabled = false,
}: WidgetBenchProps) {
  return (
    <div className="wui-bench">
      {mappings.map((mapping, index) => {
        const definition = getWidgetDefinition(mapping.widget);
        if (!definition) return null;

        const Widget = definition.component;
        const value = values[mapping.widget];
        const locked = lockedWidgets.includes(mapping.widget);
        const level = hintLevels[mapping.widget] ?? 0;
        const requirement = requirements?.find((r) => r.widget === mapping.widget);

        return (
          <section
            key={mapping.widget}
            className={locked ? 'wui-station wui-station-locked' : 'wui-station'}
          >
            <header className="wui-station-head">
              <span className="wui-station-name">
                {/* Neutral numbering when the objective is withheld: the type
                    name is visible in the control itself and adds nothing. */}
                {requirement ? requirement.label : `STATION ${index + 1}`}
              </span>
              {locked && <span className="wui-station-lock">✓ LOCKED</span>}
            </header>

            {requirement && (
              <p className="wui-station-goal">
                <span className="wui-station-goal-arrow">SET TO</span>
                <span className="wui-station-goal-value">{requirement.targetDisplay}</span>
              </p>
            )}

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
