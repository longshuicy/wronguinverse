// ColorWidget.tsx
// A swatch picker.
//
// Deliberately NOT a native <input type="color">: that would hand the player an
// arbitrary RGB space when every colour domain is a small curated palette, and
// the design doc is explicit that exact RGB knowledge is never required.
//
// When the domain is not about colour, the swatches become meaningless
// decoration over the option list — picking a colour then sets a date, which is
// exactly the intended violation.

import { DECORATIVE_SWATCHES, isColorValue } from '../content/colors.ts';
import { enumerateDomain } from '../game/domains/index.ts';
import type { AnyDomain, WidgetAdapterProps } from '../game/state/types.ts';

/** Every normalized position this control can emit — one per swatch. */
export function colorPositions(domain: AnyDomain): number[] {
  return enumerateDomain(domain, 10).map((option) => domain.normalize(option));
}

export function ColorWidget({ domain, value, onChange }: WidgetAdapterProps) {
  const options = enumerateDomain(domain, 10);
  const currentLabel = domain.display(value);

  return (
    <div className="wui-swatches" role="radiogroup" aria-label="Colour control">
      {options.map((option, index) => {
        const label = domain.display(option);
        const selected = label === currentLabel;
        // A real colour paints itself; anything else borrows a decorative hue.
        const hex = isColorValue(option)
          ? option.hex
          : DECORATIVE_SWATCHES[index % DECORATIVE_SWATCHES.length]!;

        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={selected}
            // The swatch is colour-only, so the label must reach assistive tech
            // some other way — and the title gives sighted players a tooltip.
            aria-label={label}
            title={label}
            className={selected ? 'wui-swatch wui-swatch-selected' : 'wui-swatch'}
            style={{ background: hex }}
            onClick={() => onChange(option)}
          />
        );
      })}
    </div>
  );
}
