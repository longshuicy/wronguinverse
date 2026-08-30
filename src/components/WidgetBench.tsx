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
import { planSpecimens, Specimen } from './SceneDecor.tsx';

interface WidgetBenchProps {
  mappings: Mapping[];
  values: Partial<Record<WidgetType, unknown>>;
  mode: Stage;
  onChange: (widget: WidgetType, value: unknown) => void;
  /** Show what each control currently reads as. */
  showInterpreted: boolean;
  /**
   * The order lines, used to NAME each control.
   *
   * A card is headed by the objective it answers, so it can be matched against
   * the order panel by name. "CHECKBOX" was noise (the player can see it is a
   * checkbox) and "STATION 3" was worse: a number that appears nowhere else.
   */
  requirements?: Requirement[];
  /**
   * Print each control's target on it.
   *
   * Off during exploration: Stage 2 is free experimentation, and handing over
   * the objective before the player has touched anything removes the reason to
   * explore (game design §4). The card still carries its NAME, so the bench can
   * be matched to the order when the order arrives.
   */
  showTargets?: boolean;
  lockedWidgets?: WidgetType[];
  hintLevels?: Partial<Record<WidgetType, HintLevel>>;
  onHint?: (widget: WidgetType) => void;
  hintsEnabled?: boolean;
  /** Run seed, used to give each station a stable specimen. */
  seed?: string;
  /**
   * Values the player has already produced with each control, oldest first.
   *
   * Shown on the card that produced them rather than only in a separate panel:
   * the useful question during exploration is "what has THIS control done so
   * far", and answering it next to the control saves the player holding a
   * second list in their head. Records values, never semantic labels, which is
   * what preserves the deduction (technical design §13).
   */
  observations?: Partial<Record<WidgetType, string[]>>;
  /** How much of that trail to keep; tightened on harder levels. */
  observationDetail?: 'full' | 'reduced' | 'minimal';
}

const TRAIL_LIMIT: Record<'full' | 'reduced' | 'minimal', number> = {
  full: 5,
  reduced: 3,
  minimal: 2,
};

export function WidgetBench({
  mappings,
  values,
  mode,
  onChange,
  showInterpreted,
  requirements,
  showTargets = true,
  lockedWidgets = [],
  hintLevels = {},
  onHint,
  hintsEnabled = false,
  seed,
  observations,
  observationDetail = 'full',
}: WidgetBenchProps) {
  const specimens = seed ? planSpecimens(seed, mappings.length) : [];

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
              {/* One inhabitant per station. In normal flow rather than
                  absolutely positioned: floating it over the corner meant wide
                  controls ran underneath it. */}
              <Specimen id={specimens[index]} />
            </header>

            {requirement && showTargets && (
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
                  {value === undefined ? '--' : mapping.domain.display(value)}
                </span>
              </p>
            )}

            {/* What this control has done so far. Kept even when the current
                value is wrong: during exploration nothing is wrong, and seeing
                the sequence is how the mapping gets deduced. */}
            {observations && (observations[mapping.widget]?.length ?? 0) > 1 && (
              <p className="wui-station-trail">
                <span className="wui-station-trail-label">YOU SAW</span>
                <span className="wui-station-trail-values">
                  {observations[mapping.widget]!.slice(-TRAIL_LIMIT[observationDetail]).join(' → ')}
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
