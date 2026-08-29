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

import { enumerateDomain, isDiscrete } from '../game/domains/index.ts';
import { clamp01 } from '../game/domains/defineDomain.ts';
import type { AnyDomain, WidgetAdapterProps } from '../game/state/types.ts';

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

export function numberPositions(domain: AnyDomain): number[] {
  const native = nativeRange(domain);
  if (native) {
    const steps = Math.max(1, Math.round((native.max - native.min) / native.step));
    return Array.from({ length: steps + 1 }, (_, i) => i / steps);
  }
  return enumerateDomain(domain).map((option) => domain.normalize(option));
}

export function NumberWidget({ domain, value, onChange }: WidgetAdapterProps) {
  const native = nativeRange(domain);

  if (native) {
    const current = typeof value === 'number' ? value : native.min;
    return (
      <input
        className="wui-number"
        type="number"
        min={native.min}
        max={native.max}
        step={native.step}
        value={current}
        onChange={(event) => {
          // An empty or half-typed field ("-") parses as NaN; ignore it rather
          // than snapping the value while the player is mid-keystroke.
          const parsed = Number(event.target.value);
          if (event.target.value === '' || Number.isNaN(parsed)) return;
          onChange(domain.denormalize(clamp01((parsed - native.min) / (native.max - native.min))));
        }}
        aria-label="Number control"
      />
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
    <input
      className="wui-number"
      type="number"
      min={1}
      max={options.length}
      step={1}
      value={index + 1}
      onChange={(event) => {
        const parsed = Number(event.target.value);
        if (event.target.value === '' || Number.isNaN(parsed)) return;
        const clamped = Math.min(options.length, Math.max(1, Math.round(parsed)));
        onChange(options[clamped - 1]);
      }}
      aria-label="Number control"
    />
  );
}
