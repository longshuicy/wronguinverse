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
import { useRefusal, usePressHold } from './operationShift.ts';

/** Every normalized position this control can emit — one per swatch. */
// Holding a swatch instead of clicking it changes the gesture, not the palette,
// so the reachable set is the same under either operation.
export function colorPositions(domain: AnyDomain): number[] {
  return enumerateDomain(domain, 10).map((option) => domain.normalize(option));
}

/**
 * One swatch, which under `holdToSelect` answers only to patience.
 *
 * A component rather than inline markup because each swatch needs its own hold
 * timer, and hooks cannot be called from inside a `map`.
 */
function Swatch({
  label,
  hex,
  selected,
  hold,
  onPick,
}: {
  label: string;
  hex: string;
  selected: boolean;
  hold: boolean;
  onPick: () => void;
}) {
  const { refusing, refuse } = useRefusal();
  const { didFire, handlers } = usePressHold(onPick);

  const classes = ['wui-swatch'];
  if (selected) classes.push('wui-swatch-selected');
  if (refusing) classes.push('is-refusing');

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      // The swatch is colour-only, so the label must reach assistive tech
      // some other way — and the title gives sighted players a tooltip.
      aria-label={label}
      title={hold ? `${label}: press and hold` : label}
      className={classes.join(' ')}
      style={{ background: hex }}
      {...(hold ? handlers : {})}
      onClick={(event) => {
        if (!hold) {
          onPick();
          return;
        }
        event.preventDefault();
        // A click that came at the end of a successful hold is not a refusal;
        // flinching there would punish the player for doing it right.
        if (!didFire()) refuse();
      }}
      onKeyDown={(event) => {
        if (!hold || (event.key !== 'Enter' && event.key !== ' ')) return;
        // Keyboard gets the same gesture, not a free pass: holding the key
        // repeats it, and the first repeat is what commits.
        event.preventDefault();
        if (event.repeat) onPick();
      }}
    />
  );
}

export function ColorWidget({ domain, value, onChange, operation }: WidgetAdapterProps) {
  const options = enumerateDomain(domain, 10);
  const currentLabel = domain.display(value);
  const hold = operation === 'holdToSelect';

  return (
    <div className="wui-swatches" role="radiogroup" aria-label="Colour control">
      {options.map((option, index) => {
        const label = domain.display(option);
        // A real colour paints itself; anything else borrows a decorative hue.
        const hex = isColorValue(option)
          ? option.hex
          : DECORATIVE_SWATCHES[index % DECORATIVE_SWATCHES.length]!;

        return (
          <Swatch
            key={label}
            label={label}
            hex={hex}
            selected={label === currentLabel}
            hold={hold}
            onPick={() => onChange(option)}
          />
        );
      })}
    </div>
  );
}
