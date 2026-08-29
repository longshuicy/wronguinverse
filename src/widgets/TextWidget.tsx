// TextWidget.tsx
// A free-text field. Unlike every other adapter this one is parse-based rather
// than position-based: the player types something and the domain decides
// whether that resolves to a value.
//
// It keeps a local draft so half-typed input is never overwritten — "QUO" on
// the way to "QUONK" must survive the keystroke.

import { useEffect, useRef, useState } from 'react';
import { parseIntoDomain, textReachableValues } from '../game/domains/parse.ts';
import type { AnyDomain, WidgetAdapterProps } from '../game/state/types.ts';

/** Every position a typed value can land on — anything with a distinct label. */
export function textPositions(domain: AnyDomain): number[] {
  return textReachableValues(domain).map((value) => domain.normalize(value));
}

export function TextWidget({ domain, value, onChange }: WidgetAdapterProps) {
  const committed = value === undefined ? '' : domain.display(value);
  const [draft, setDraft] = useState(committed);

  // Tracks the last label this component itself produced, so the effect below
  // can tell an external change (reset, lock) from the player's own typing.
  const ownLabel = useRef(committed);

  useEffect(() => {
    if (committed !== ownLabel.current) {
      ownLabel.current = committed;
      setDraft(committed);
    }
  }, [committed]);

  return (
    <input
      className="wui-text"
      type="text"
      value={draft}
      spellCheck={false}
      autoComplete="off"
      placeholder="type a value"
      onChange={(event) => {
        const raw = event.target.value;
        setDraft(raw);

        const parsed = parseIntoDomain(domain, raw);
        // Unresolved input just sits in the draft. It is not "wrong" — the
        // player may simply be mid-word.
        if (parsed === undefined) return;

        ownLabel.current = domain.display(parsed);
        onChange(parsed);
      }}
      aria-label="Text control"
    />
  );
}
