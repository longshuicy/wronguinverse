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
import { DRAG_THRESHOLD_PX, useRefusal } from './operationShift.ts';
import { useRef } from 'react';

/** Physical box count used to encode a continuous domain as "how many ticked". */
const COUNT_BOXES = 10;

/**
 * Every normalized position this control can emit.
 *
 * Mirrors the three encodings in the component below; kept beside them so the
 * rendered resolution and the advertised reachability stay in step.
 */
// Dragging a box instead of clicking it changes the gesture, not the encoding,
// so every operation reaches the same set.
export function checkboxPositions(domain: AnyDomain): number[] {
  if (isDiscrete(domain)) {
    const length = enumerateDomain(domain).length;
    if (length === 2) return [0, 1];
    return Array.from({ length }, (_, i) => indexToPosition(i, length));
  }
  return Array.from({ length: COUNT_BOXES + 1 }, (_, i) => i / COUNT_BOXES);
}

/**
 * One box that, under `dragToggle`, has to be dragged across rather than clicked.
 *
 * A component of its own because each box needs its own pointer-origin ref and
 * its own flinch, and hooks cannot be called from inside a `map`.
 */
function Box({
  checked,
  label,
  drag,
  onCommit,
}: {
  checked: boolean;
  label?: string;
  drag: boolean;
  onCommit: () => void;
}) {
  const origin = useRef<{ x: number; y: number } | null>(null);
  const committed = useRef(false);
  const { refusing, refuse } = useRefusal();

  if (!drag) {
    return (
      <input
        type="checkbox"
        checked={checked}
        onChange={onCommit}
        {...(label ? { 'aria-label': label } : {})}
      />
    );
  }

  return (
    <input
      type="checkbox"
      className={refusing ? 'is-refusing' : undefined}
      checked={checked}
      // React needs a handler for a controlled checkbox, but the click below is
      // prevented before this can ever fire.
      onChange={() => {}}
      onPointerDown={(event) => {
        origin.current = { x: event.clientX, y: event.clientY };
        committed.current = false;
        // Capture so the drag survives leaving the box, which is exactly what
        // "drag across it" means. It can throw if the pointer is already gone,
        // and an uncaught throw here would abandon the gesture mid-press.
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Without capture the drag still works while the pointer stays over
          // the box, which is the common case anyway.
        }
      }}
      onPointerUp={(event) => {
        const from = origin.current;
        origin.current = null;
        if (!from) return;
        const travelled = Math.hypot(event.clientX - from.x, event.clientY - from.y);
        if (travelled >= DRAG_THRESHOLD_PX) {
          committed.current = true;
          onCommit();
        }
      }}
      // Activation is specified as cancellable, so this reliably reverts the
      // checked state in every engine — the one native suppression worth
      // trusting without a fallback.
      onClick={(event) => {
        event.preventDefault();
        if (!committed.current) refuse();
        committed.current = false;
      }}
      onKeyDown={(event) => {
        if (event.key !== ' ') return;
        // Space would otherwise hand keyboard users a free bypass of the tier.
        event.preventDefault();
        refuse();
      }}
      {...(label ? { 'aria-label': label } : {})}
    />
  );
}

export function CheckboxWidget({ domain, value, onChange, operation }: WidgetAdapterProps) {
  const drag = operation === 'dragToggle';
  const discrete = isDiscrete(domain);
  const options = discrete ? enumerateDomain(domain) : [];

  // Two-state domain: the familiar single checkbox.
  if (discrete && options.length === 2) {
    const checked = domain.normalize(value) >= 0.5;
    return (
      <label className="wui-checkbox-single">
        <Box
          checked={checked}
          drag={drag}
          onCommit={() => onChange(domain.denormalize(checked ? 0 : 1))}
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
              <Box
                checked={label === currentLabel}
                drag={drag}
                // Re-ticking the active box is a no-op: the group always has
                // exactly one selection, so there is no empty state to fall to.
                onCommit={() => onChange(options[index])}
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
        <Box
          key={index}
          checked={index < ticked}
          drag={drag}
          label={`Box ${index + 1}`}
          // Ticking box N fills 1..N, unticking the last filled box empties it.
          onCommit={() => {
            const nextCount = index < ticked ? index : index + 1;
            onChange(domain.denormalize(nextCount / COUNT_BOXES));
          }}
        />
      ))}
    </div>
  );
}
