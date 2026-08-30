// DropdownWidget.tsx
// A dropdown turns any domain into a list of options. Continuous domains get
// sampled into a finite option set by `enumerateDomain`, so the adapter never
// needs to know which semantic it is showing.
//
// Under `wheelCycle` the list never opens: the closed control scrolls through
// its own options instead.

import { useRef } from 'react';
import { enumerateDomain } from '../game/domains/index.ts';
import type { AnyDomain, WidgetAdapterProps } from '../game/state/types.ts';
import { useNonPassiveWheel, useRefusal } from './operationShift.ts';

/** Every normalized position this control can emit — one per listed option. */
// Wheeling through the options reaches the same list opening it would, so the
// reachable set does not depend on the gesture.
export function dropdownPositions(domain: AnyDomain): number[] {
  return enumerateDomain(domain).map((option) => domain.normalize(option));
}

export function DropdownWidget({ domain, value, onChange, operation }: WidgetAdapterProps) {
  const options = enumerateDomain(domain);
  const currentLabel = domain.display(value);
  const wheel = operation === 'wheelCycle';
  const wrapper = useRef<HTMLDivElement | null>(null);
  const { refusing, refuse } = useRefusal();

  const index = options.findIndex((option) => domain.display(option) === currentLabel);

  function step(direction: number) {
    const from = index === -1 ? 0 : index;
    const next = from + direction;
    // Clamped rather than wrapped: a list that wraps lets the player scroll
    // past the value they wanted forever without noticing they passed it.
    if (next < 0 || next >= options.length) {
      refuse();
      return;
    }
    onChange(options[next]!);
  }

  useNonPassiveWheel(wrapper, step, wheel);

  const select = (
    <select
      className={wheel ? 'wui-dropdown is-shifted' : 'wui-dropdown'}
      // Options are addressed by their display label: domain values may be
      // objects, which cannot round-trip through a DOM value attribute.
      value={currentLabel}
      onChange={(event) => {
        // Belt and braces. The popup should never open — the element has
        // `pointer-events: none` under the shift — but suppressing a <select>
        // popup is the least reliable thing in this file across engines, and a
        // pick that slips through would hand over the answer. Refusing here
        // means the worst case is a flinch, not a free win.
        if (wheel) {
          refuse();
          return;
        }
        const picked = options.find((option) => domain.display(option) === event.target.value);
        if (picked !== undefined) onChange(picked);
      }}
      tabIndex={wheel ? -1 : undefined}
      aria-hidden={wheel ? true : undefined}
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

  if (!wheel) return select;

  return (
    // `preventDefault` on mousedown does not reliably stop a <select> popup —
    // Safari opens it regardless — so the element is taken out of pointer
    // reach entirely and this wrapper owns the gesture instead.
    <div
      ref={wrapper}
      className={['wui-shift-wrap', refusing ? 'is-refusing' : ''].filter(Boolean).join(' ')}
      // Not `listbox`: that role promises selectable `option` children, and
      // the real options are inside a `select` this wrapper has hidden. A
      // labelled group that announces its current reading is the honest
      // description of what this now is.
      role="group"
      tabIndex={0}
      aria-label={`Dropdown control, currently ${currentLabel}`}
      onClick={refuse}
      onKeyDown={(event) => {
        // PageUp/PageDown are the keyboard's wheel. The arrow keys and
        // type-ahead are taken away deliberately: leaving them would let a
        // keyboard player skip the tier entirely.
        if (event.key === 'PageDown') {
          event.preventDefault();
          step(1);
        } else if (event.key === 'PageUp') {
          event.preventDefault();
          step(-1);
        } else if (event.key !== 'Tab' && event.key !== 'Shift') {
          event.preventDefault();
          refuse();
        }
      }}
    >
      {select}
    </div>
  );
}
