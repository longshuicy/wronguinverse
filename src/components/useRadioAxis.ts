// useRadioAxis.ts
// Arrow-key behaviour and focus bookkeeping for a one-of-N picker.
//
// The intro's two axes were three `aria-pressed` buttons each, which a screen
// reader announces as three independent switches: nothing said the three were
// one choice, and nothing said how many there were. They are radio groups, so
// they are marked as radio groups, and a radio group is expected to behave in
// a particular way — one stop in the tab order, arrows to move, and selection
// following focus.

import { useCallback, useRef } from 'react';

export interface RadioAxis<Id> {
  /** Put on the group element. Handles arrows, Home and End. */
  onKeyDown: (event: React.KeyboardEvent) => void;
  /** Put on each option button, so focus can follow an arrow key. */
  itemRef: (id: Id) => (element: HTMLButtonElement | null) => void;
}

export function useRadioAxis<Id>(ids: Id[], current: Id, select: (id: Id) => void): RadioAxis<Id> {
  const items = useRef(new Map<Id, HTMLButtonElement | null>());

  const itemRef = useCallback(
    (id: Id) => (element: HTMLButtonElement | null) => {
      items.current.set(id, element);
    },
    [],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Both orientations are accepted on both axes. One is a column and one is
      // a row, and a player reaching for an arrow key is not thinking about
      // which.
      const step =
        event.key === 'ArrowDown' || event.key === 'ArrowRight'
          ? 1
          : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
            ? -1
            : 0;

      let next: Id | undefined;
      if (step !== 0) {
        const from = ids.indexOf(current);
        // Wraps, as a radio group does: the list is a loop, not a slider with
        // ends to run into.
        next = ids[(from + step + ids.length) % ids.length];
      } else if (event.key === 'Home') {
        next = ids[0];
      } else if (event.key === 'End') {
        next = ids[ids.length - 1];
      }

      if (next === undefined) return;
      event.preventDefault();
      select(next);
      items.current.get(next)?.focus();
    },
    [ids, current, select],
  );

  return { onKeyDown, itemRef };
}
