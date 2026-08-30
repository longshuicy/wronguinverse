// RadioWidget.tsx
// One button per option, exactly one selected. The simplest possible discrete
// control — it lists whatever the domain can be enumerated into and reports
// which slot the player picked.
//
// Under `holdToSelect` it lists the same options and reports the same values;
// it just will not accept a click, only patience.

import { enumerateDomain } from '../game/domains/index.ts';
import type { AnyDomain, WidgetAdapterProps } from '../game/state/types.ts';
import { useRefusal, usePressHold } from './operationShift.ts';

/** Every normalized position this control can emit — one per listed option. */
// Holding rather than clicking changes the gesture, not the option list.
export function radioPositions(domain: AnyDomain): number[] {
  return enumerateDomain(domain).map((option) => domain.normalize(option));
}

/**
 * One radio that, under the shift, answers only to a held press.
 *
 * Its own component because each row needs its own hold timer and flinch, and
 * hooks cannot be called from inside a `map`.
 */
function Row({
  label,
  selected,
  hold,
  onPick,
}: {
  label: string;
  selected: boolean;
  hold: boolean;
  onPick: () => void;
}) {
  const { refusing, refuse } = useRefusal();
  const { didFire, handlers } = usePressHold(onPick);

  if (!hold) {
    return (
      <label className="wui-radio-row">
        <input
          type="radio"
          // Options are addressed by display label: domain values may be
          // objects, which cannot round-trip through a DOM value attribute.
          checked={selected}
          onChange={onPick}
        />
        <span>{label}</span>
      </label>
    );
  }

  return (
    <label className={refusing ? 'wui-radio-row is-refusing' : 'wui-radio-row'}>
      <input
        type="radio"
        checked={selected}
        // Controlled inputs need a handler; the click below is prevented first.
        onChange={() => {}}
        {...handlers}
        // Radio activation is specified as cancellable, so preventing the click
        // reliably reverts the checked state in every engine.
        onClick={(event) => {
          event.preventDefault();
          // A click that ends a successful hold is not a refusal.
          if (!didFire()) refuse();
        }}
        onKeyDown={(event) => {
          // A native radiogroup moves the selection with the arrow keys, which
          // would hand keyboard users the whole tier for free. Held Enter is
          // the keyboard equivalent of the same awkward gesture.
          if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
            event.preventDefault();
            refuse();
            return;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            if (event.repeat) onPick();
          }
        }}
      />
      <span>{label}</span>
    </label>
  );
}

export function RadioWidget({ domain, value, onChange, operation }: WidgetAdapterProps) {
  const options = enumerateDomain(domain);
  const currentLabel = domain.display(value);
  const hold = operation === 'holdToSelect';

  return (
    <div className="wui-radio-group" role="radiogroup" aria-label="Radio control">
      {options.map((option) => {
        const label = domain.display(option);
        return (
          <Row
            key={label}
            label={label}
            selected={label === currentLabel}
            hold={hold}
            onPick={() => onChange(option)}
          />
        );
      })}
    </div>
  );
}
