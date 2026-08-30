// DropdownWidget.tsx
// A dropdown turns any domain into a list of options. Continuous domains get
// sampled into a finite option set by `enumerateDomain`, so the adapter never
// needs to know which semantic it is showing.
//
// The list is built here rather than being a native `<select>`, for the same
// reason the colour and date controls build their own: a native option list is
// drawn by the operating system, outside the page entirely. That put it beyond
// every rule the game imposes — a Tier 3 pointer law cannot open it (no
// synthetic press carries the user activation the popup needs), and Tier 2's
// wheel could only ever scrub a control that stayed shut, which meant scrolling
// a list the player could not see.
//
// Owning the list costs a few dozen lines and buys back both tiers.

import { useRef, useState } from 'react';
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
  const [open, setOpen] = useState(false);

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

  // Bound to the wrapper, so the wheel works over the trigger and over the open
  // list alike — under this operation the list is a readout, not a menu, and
  // the player should not have to find one specific strip of it to scrub.
  useNonPassiveWheel(wrapper, step, wheel);

  function pick(option: unknown) {
    if (wheel) {
      // The whole of Tier 2 is that this control answers to the wheel and
      // nothing else. The list still OPENS under the shift — seeing the options
      // go past is what makes scrolling legible — but picking from it directly
      // would be a second, unearned route to the value.
      refuse();
      return;
    }
    onChange(option);
    setOpen(false);
  }

  return (
    <div
      ref={wrapper}
      className={['wui-dropdown-shell', refusing ? 'is-refusing' : ''].filter(Boolean).join(' ')}
    >
      <button
        type="button"
        className={wheel ? 'wui-dropdown-trigger is-shifted' : 'wui-dropdown-trigger'}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Dropdown control, currently ${currentLabel}`}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        onKeyDown={(event) => {
          if (!wheel) return;
          // PageUp/PageDown are the keyboard's wheel. The arrow keys and
          // type-ahead are taken away deliberately: leaving them would let a
          // keyboard player skip the tier entirely. Enter and Space still open
          // the list, because seeing the options is never the puzzle.
          if (event.key === 'PageDown') {
            event.preventDefault();
            step(1);
          } else if (event.key === 'PageUp') {
            event.preventDefault();
            step(-1);
          } else if (!['Tab', 'Shift', 'Enter', ' ', 'Escape'].includes(event.key)) {
            event.preventDefault();
            refuse();
          }
        }}
      >
        <span className="wui-dropdown-value">{currentLabel}</span>
        <span className="wui-dropdown-caret" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div
          className="wui-dropdown-list"
          role="listbox"
          aria-label="Dropdown control"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false);
          }}
        >
          {options.map((option) => {
            const label = domain.display(option);
            const selected = label === currentLabel;
            return (
              <button
                type="button"
                key={label}
                // A real button carrying the option role: the game's laws
                // govern buttons, and a `<li>` the pointer cannot press is
                // exactly the hole the native `<select>` left.
                role="option"
                aria-selected={selected}
                className={selected ? 'wui-dropdown-option is-current' : 'wui-dropdown-option'}
                onClick={() => pick(option)}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
