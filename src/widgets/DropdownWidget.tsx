// DropdownWidget.tsx
// A dropdown turns any domain into a list of options. Continuous domains get
// sampled into a finite option set by `enumerateDomain`, so the adapter never
// needs to know which semantic it is showing.

import { enumerateDomain } from '../game/domains/index.ts';
import type { AnyDomain, WidgetAdapterProps } from '../game/state/types.ts';

/** Every normalized position this control can emit — one per listed option. */
export function dropdownPositions(domain: AnyDomain): number[] {
  return enumerateDomain(domain).map((option) => domain.normalize(option));
}

export function DropdownWidget({ domain, value, onChange }: WidgetAdapterProps) {
  const options = enumerateDomain(domain);
  const currentLabel = domain.display(value);

  return (
    <select
      className="wui-dropdown"
      // Options are addressed by their display label: domain values may be
      // objects, which cannot round-trip through a DOM value attribute.
      value={currentLabel}
      onChange={(event) => {
        const picked = options.find((option) => domain.display(option) === event.target.value);
        if (picked !== undefined) onChange(picked);
      }}
      aria-label="Dropdown control"
    >
      {/* The current value may fall between sampled options; show it so the
          control never displays something other than its actual state. */}
      {!options.some((option) => domain.display(option) === currentLabel) && (
        <option value={currentLabel}>{currentLabel}</option>
      )}
      {options.map((option) => {
        const label = domain.display(option);
        return (
          <option key={label} value={label}>
            {label}
          </option>
        );
      })}
    </select>
  );
}
