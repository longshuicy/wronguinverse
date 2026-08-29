// CheckboxWidget.tsx
// A checkbox group encodes a position in one of two ways: which box is ticked,
// or how many boxes are ticked.
//
// The choice between them is made from the *shape* of the domain (discrete vs
// continuous, and how many values), never from its semantic type — a checkbox
// group must not contain `if (semantic === 'quantity')`.

import { enumerateDomain, isDiscrete } from '../game/domains/index.ts';
import { indexToPosition } from '../game/domains/defineDomain.ts';
import type { AnyDomain, WidgetAdapterProps } from '../game/state/types.ts';

/** Physical box count used to encode a continuous domain as "how many ticked". */
const COUNT_BOXES = 10;

/**
 * Every normalized position this control can emit.
 *
 * Mirrors the three encodings in the component below; kept beside them so the
 * rendered resolution and the advertised reachability stay in step.
 */
export function checkboxPositions(domain: AnyDomain): number[] {
  if (isDiscrete(domain)) {
    const length = enumerateDomain(domain).length;
    if (length === 2) return [0, 1];
    return Array.from({ length }, (_, i) => indexToPosition(i, length));
  }
  return Array.from({ length: COUNT_BOXES + 1 }, (_, i) => i / COUNT_BOXES);
}

export function CheckboxWidget({ domain, value, onChange }: WidgetAdapterProps) {
  const discrete = isDiscrete(domain);
  const options = discrete ? enumerateDomain(domain) : [];

  // Two-state domain: the familiar single checkbox.
  if (discrete && options.length === 2) {
    const checked = domain.normalize(value) >= 0.5;
    return (
      <label className="wui-checkbox-single">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(domain.denormalize(event.target.checked ? 1 : 0))}
        />
        <span>{domain.display(value)}</span>
      </label>
    );
  }

  // Discrete domain: one box per value, mutually exclusive.
  if (discrete) {
    const currentLabel = domain.display(value);
    return (
      <div className="wui-checkbox-group" role="group" aria-label="Checkbox control">
        {options.map((option, index) => {
          const label = domain.display(option);
          return (
            <label key={label} className="wui-checkbox-row">
              <input
                type="checkbox"
                checked={label === currentLabel}
                // Re-ticking the active box is a no-op: the group always has
                // exactly one selection, so there is no empty state to fall to.
                onChange={() => onChange(options[index])}
              />
              <span>{label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  // Continuous domain: the number of ticked boxes is the value.
  const ticked = Math.round(domain.normalize(value) * COUNT_BOXES);
  return (
    <div className="wui-checkbox-count" role="group" aria-label="Checkbox control">
      {Array.from({ length: COUNT_BOXES }, (_, index) => (
        <input
          key={index}
          type="checkbox"
          checked={index < ticked}
          // Ticking box N fills 1..N, unticking the last filled box empties it.
          onChange={() => {
            const nextCount = index < ticked ? index : index + 1;
            onChange(domain.denormalize(nextCount / COUNT_BOXES));
          }}
          aria-label={`Box ${index + 1}`}
        />
      ))}
    </div>
  );
}
