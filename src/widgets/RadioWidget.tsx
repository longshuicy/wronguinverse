// RadioWidget.tsx
// One button per option, exactly one selected. The simplest possible discrete
// control — it lists whatever the domain can be enumerated into and reports
// which slot the player picked.

import { enumerateDomain } from '../game/domains/index.ts';
import type { AnyDomain, WidgetAdapterProps } from '../game/state/types.ts';

/** Every normalized position this control can emit — one per listed option. */
export function radioPositions(domain: AnyDomain): number[] {
  return enumerateDomain(domain).map((option) => domain.normalize(option));
}

export function RadioWidget({ domain, value, onChange }: WidgetAdapterProps) {
  const options = enumerateDomain(domain);
  const currentLabel = domain.display(value);

  return (
    <div className="wui-radio-group" role="radiogroup" aria-label="Radio control">
      {options.map((option) => {
        const label = domain.display(option);
        return (
          <label key={label} className="wui-radio-row">
            <input
              type="radio"
              // Options are addressed by display label: domain values may be
              // objects, which cannot round-trip through a DOM value attribute.
              checked={label === currentLabel}
              onChange={() => onChange(option)}
            />
            <span>{label}</span>
          </label>
        );
      })}
    </div>
  );
}
