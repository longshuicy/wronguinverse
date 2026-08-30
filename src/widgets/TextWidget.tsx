// TextWidget.tsx
// A free-text field. Unlike every other adapter this one is parse-based rather
// than position-based: the player types something and the domain decides
// whether that resolves to a value.
//
// It keeps a local draft so half-typed input is never overwritten — "QUO" on
// the way to "QUONK" must survive the keystroke.
//
// Under `commitOnEnter` the draft is ALL that typing does: the field fills in
// perfectly normally and simply never reports anything, until Enter.

import { useEffect, useRef, useState } from 'react';
import { parseIntoDomain, textReachableValues } from '../game/domains/parse.ts';
import type { AnyDomain, WidgetAdapterProps } from '../game/state/types.ts';
import { useRefusal } from './operationShift.ts';

/** Every position a typed value can land on — anything with a distinct label. */
export function textPositions(domain: AnyDomain): number[] {
  // Committing on Enter rather than on keystroke changes WHEN a value is
  // reported, never WHICH values can be reached, so the gesture is ignored.
  return textReachableValues(domain).map((value) => domain.normalize(value));
}

export function TextWidget({ domain, value, onChange, operation }: WidgetAdapterProps) {
  const committed = value === undefined ? '' : domain.display(value);
  const [draft, setDraft] = useState(committed);
  const enterToCommit = operation === 'commitOnEnter';
  const { refusing, refuse } = useRefusal();

  // Tracks the last label this component itself produced, so the effect below
  // can tell an external change (reset, lock) from the player's own typing.
  const ownLabel = useRef(committed);

  useEffect(() => {
    if (committed !== ownLabel.current) {
      ownLabel.current = committed;
      setDraft(committed);
    }
  }, [committed]);

  function commit(raw: string): boolean {
    const parsed = parseIntoDomain(domain, raw);
    // Unresolved input just sits in the draft. It is not "wrong" — the
    // player may simply be mid-word.
    if (parsed === undefined) return false;
    ownLabel.current = domain.display(parsed);
    onChange(parsed);
    return true;
  }

  return (
    <input
      className={refusing ? 'wui-text is-refusing' : 'wui-text'}
      type="text"
      value={draft}
      spellCheck={false}
      autoComplete="off"
      placeholder={enterToCommit ? 'type a value, then press enter' : 'type a value'}
      onChange={(event) => {
        const raw = event.target.value;
        setDraft(raw);
        if (enterToCommit) return;
        commit(raw);
      }}
      onKeyDown={(event) => {
        if (!enterToCommit || event.key !== 'Enter') return;
        // The field lives inside no form, but Enter still has a default in some
        // contexts and the keypress must not escape the control.
        event.preventDefault();
        // An Enter on something the domain cannot read is the one case worth
        // flinching at: the player has done the right gesture on wrong content,
        // and silence there would read as the gesture being wrong too.
        if (!commit(draft)) refuse();
      }}
      onBlur={() => {
        // A parseable draft the player walked away from is a value they think
        // they entered. Refusing rather than committing keeps the rule honest,
        // but saying nothing at all would look like the field ate it.
        if (enterToCommit && draft !== committed && parseIntoDomain(domain, draft) !== undefined) {
          refuse();
        }
      }}
      aria-label="Text control"
    />
  );
}
