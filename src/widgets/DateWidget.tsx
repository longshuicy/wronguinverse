// DateWidget.tsx
// A date picker is a physical calendar control with its own fixed span. The date
// the player picks is converted to a position within THAT span, which the domain
// then reinterprets — so picking a day in March may well mean "24%".
//
// The widget's calendar is deliberately independent of any date domain: this is
// what lets a date picker mean something that is not a date.

import { clamp01 } from '../game/domains/defineDomain.ts';
import { fromDayNumber, makeIsoDate, toDayNumber } from '../game/domains/dateUtils.ts';
import type { AnyDomain, WidgetAdapterProps } from '../game/state/types.ts';

/** The control's own physical span. Not related to any date domain's range. */
const WIDGET_YEAR = 2097;
const FIRST_DAY = toDayNumber(makeIsoDate(WIDGET_YEAR, 1, 1));
const LAST_DAY = toDayNumber(makeIsoDate(WIDGET_YEAR, 12, 31));
const SPAN_DAYS = LAST_DAY - FIRST_DAY;

/** Every normalized position this control can emit — one per day in its span. */
export function datePositions(_domain: AnyDomain): number[] {
  return Array.from({ length: SPAN_DAYS + 1 }, (_, i) => i / SPAN_DAYS);
}

export function DateWidget({ domain, value, onChange }: WidgetAdapterProps) {
  const position = domain.normalize(value);
  const shownDate = fromDayNumber(FIRST_DAY + Math.round(clamp01(position) * SPAN_DAYS));

  return (
    <input
      className="wui-date"
      type="date"
      min={fromDayNumber(FIRST_DAY)}
      max={fromDayNumber(LAST_DAY)}
      value={shownDate}
      onChange={(event) => {
        // Clearing a date input yields an empty string; ignore it rather than
        // snapping the value to January 1st behind the player's back.
        if (!event.target.value) return;
        const picked = toDayNumber(event.target.value);
        onChange(domain.denormalize(clamp01((picked - FIRST_DAY) / SPAN_DAYS)));
      }}
      aria-label="Date control"
    />
  );
}
