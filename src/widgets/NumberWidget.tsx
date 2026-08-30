// NumberWidget.tsx
// A stepper. Like the date picker, it has two modes decided by the SHAPE of the
// domain, never by its semantic type:
//
//   native   — the domain already deals in numbers, so type them directly
//   ordinal  — anything else: the stepper indexes into the option list, so
//              typing "3" might select a creature or a colour
//
// The ordinal mode is what lets a number input mean something that is not a
// number, which is the entire point of the game.

import { useRef } from 'react';
import { enumerateDomain, isDiscrete } from '../game/domains/index.ts';
import { clamp01 } from '../game/domains/defineDomain.ts';
import type { AnyDomain, WidgetAdapterProps } from '../game/state/types.ts';
import { useNonPassiveWheel, useRefusal } from './operationShift.ts';

interface NativeRange {
  min: number;
  max: number;
  step: number;
}

/** A ranged numeric domain the stepper can address in its own units. */
function nativeRange(domain: AnyDomain): NativeRange | null {
  if (isDiscrete(domain)) return null;
  const { min, max, step } = domain;
  if (typeof min !== 'number' || typeof max !== 'number') return null;
  if (typeof step !== 'number' || step <= 0) return null;
  if (typeof domain.denormalize(0) !== 'number') return null;
  return { min, max, step };
}

// The wheel steps through exactly the positions typing could reach, so the
// reachable set is the same under either gesture.
export function numberPositions(domain: AnyDomain): number[] {
  const native = nativeRange(domain);
  if (native) {
    const steps = Math.max(1, Math.round((native.max - native.min) / native.step));
    return Array.from({ length: steps + 1 }, (_, i) => i / steps);
  }
  return enumerateDomain(domain).map((option) => domain.normalize(option));
}

/**
 * The stepper's arrows, as real buttons.
 *
 * The native `<input type="number">` spinner is drawn by the browser inside the
 * input's own box, which makes it unreachable to anything but a genuine mouse
 * press on that exact strip of pixels — so under any Tier 3 pointer law it was
 * simply dead, and under Tier 2 it was a second, ungoverned way to change the
 * value. Owning the arrows fixes both at once, the same way the colour and date
 * controls already refuse to use the native pickers.
 */
function NumberArrows({
  onStep,
  disabledReason,
}: {
  onStep: (direction: number) => void;
  disabledReason: string | null;
}) {
  return (
    <span className="wui-number-arrows">
      <button
        type="button"
        className="wui-number-arrow"
        aria-label={disabledReason ?? 'Step up'}
        onClick={() => onStep(1)}
      >
        ▲
      </button>
      <button
        type="button"
        className="wui-number-arrow"
        aria-label={disabledReason ?? 'Step down'}
        onClick={() => onStep(-1)}
      >
        ▼
      </button>
    </span>
  );
}

export function NumberWidget({ domain, value, onChange, operation }: WidgetAdapterProps) {
  const native = nativeRange(domain);
  const wheel = operation === 'wheelCycle';
  const ref = useRef<HTMLInputElement | null>(null);
  const { refusing, refuse } = useRefusal();

  // One shared ladder for both modes below, so the wheel does not need to know
  // whether the field is addressing numbers or indexing a list.
  const ladder = numberPositions(domain);
  const current = clamp01(domain.normalize(value));

  /** One rung along the ladder, shared by the wheel and the arrows. */
  function step(direction: number) {
    // Nearest rung to where the value actually sits, so a value nudged in by
    // some other route still steps predictably.
    let index = 0;
    for (let i = 1; i < ladder.length; i += 1) {
      if (Math.abs(ladder[i]! - current) < Math.abs(ladder[index]! - current)) index = i;
    }
    const next = index + direction;
    // Clamped, not wrapped: wrapping lets a player scrub past the target
    // forever without ever noticing they passed it.
    if (next < 0 || next >= ladder.length) {
      refuse();
      return;
    }
    onChange(domain.denormalize(ladder[next]!));
  }

  useNonPassiveWheel(ref, step, wheel);

  // Under `wheelCycle` the arrows are still there and still flinch, rather than
  // being hidden: a control that quietly loses a button reads as a different
  // control, and the flinch is what teaches which gesture this one now wants.
  const arrows = <NumberArrows onStep={wheel ? refuse : step} disabledReason={null} />;

  /** Keys the shift takes away, each flinching rather than dying silently. */
  function guardKeys(event: React.KeyboardEvent) {
    if (!wheel) return;
    if (event.key === 'Tab' || event.key === 'Shift') return;
    event.preventDefault();
    refuse();
  }

  const shiftedProps = wheel
    ? {
        ref,
        // `readOnly`, never `disabled`: the field stays focusable and stays
        // announced, it simply will not take what you type.
        readOnly: true,
        onKeyDown: guardKeys,
      }
    : {};

  const className = ['wui-number', wheel ? 'is-shifted' : '', refusing ? 'is-refusing' : '']
    .filter(Boolean)
    .join(' ');

  if (native) {
    return (
      <span className="wui-number-stepper">
        <input
          className={className}
          type="number"
          min={native.min}
          max={native.max}
          step={native.step}
          value={typeof value === 'number' ? value : native.min}
          {...shiftedProps}
          onChange={(event) => {
            // `readOnly` already stops a player typing here; this guard covers
            // every other route a value could arrive by, matching the belt-and
            // -braces guards on the slider and the dropdown.
            if (wheel) return;
            // An empty or half-typed field ("-") parses as NaN; ignore it rather
            // than snapping the value while the player is mid-keystroke.
            const parsed = Number(event.target.value);
            if (event.target.value === '' || Number.isNaN(parsed)) return;
            onChange(
              domain.denormalize(clamp01((parsed - native.min) / (native.max - native.min))),
            );
          }}
          aria-label="Number control"
        />
        {arrows}
      </span>
    );
  }

  // Ordinal mode: the number IS the position in the list, 1-based for humans.
  const options = enumerateDomain(domain);
  const currentLabel = domain.display(value);
  const index = Math.max(
    0,
    options.findIndex((option) => domain.display(option) === currentLabel),
  );

  return (
    <span className="wui-number-stepper">
      <input
        className={className}
        type="number"
        min={1}
        max={options.length}
        step={1}
        value={index + 1}
        {...shiftedProps}
        onChange={(event) => {
          if (wheel) return;
          const parsed = Number(event.target.value);
          if (event.target.value === '' || Number.isNaN(parsed)) return;
          const clamped = Math.min(options.length, Math.max(1, Math.round(parsed)));
          onChange(options[clamped - 1]);
        }}
        aria-label="Number control"
      />
      {arrows}
    </span>
  );
}
