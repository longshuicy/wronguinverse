// useInterfaceSounds.ts
// A click that makes a sound, everywhere, once.
//
// `ui_click` and `selection_confirm` shipped with the sfx set and were never
// played by anything: every press in the chrome — every tier, level, hint,
// skip, begin and leave — was silent. Silence on input is most of what makes an
// interface read as a web page rather than as a machine, so this is bound once
// at the root rather than sprinkled through thirty handlers, and any button
// added later is covered without anybody remembering to wire it.
//
// Three things it deliberately does NOT do:
//
//   1. It does not sound the bench. A widget adapter's job is to report a
//      VALUE, and the store already answers those with `value_tick` or
//      `semantic_blip`; a click on top of that is one sound too many. Widget
//      roots are marked `data-widget` for exactly this.
//   2. It does not fire on a press a Tier 3 law refused. Those are swallowed in
//      the capture phase with `stopPropagation`, so this bubble-phase listener
//      never sees them, and the refusal keeps `mismatch` to itself.
//   3. It does not distinguish mouse from keyboard. Both are the player
//      pressing something, and only one of them is governed by a pointer law.

import { useEffect } from 'react';
import { playSfx } from './audioManager.ts';

/** Anything the player can press that is part of the interface itself. */
const PRESSABLE = 'button, [role="button"], a[href], summary';

/** Controls whose sound belongs to the value they carry, not to the press. */
const OWNS_ITS_SOUND = '[data-widget]';

export function useInterfaceSounds(): void {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const node = event.target as Element | null;
      const pressed = node?.closest(PRESSABLE);
      if (!pressed || pressed.closest(OWNS_ITS_SOUND)) return;
      if ((pressed as HTMLButtonElement).disabled) return;

      // Choosing between options is a different act from firing an action, and
      // the set already has a sound for each. `aria-pressed` is the honest test
      // because it is what the page uses to SAY a control is a choice.
      const choosing = pressed.hasAttribute('aria-pressed');
      playSfx(choosing ? 'selection_confirm' : 'ui_click');
    };

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
}
