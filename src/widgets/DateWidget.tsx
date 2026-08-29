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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Can this control show the domain's own values directly?
 *
 * A date picker driven by a date domain should behave like an ordinary date
 * picker — that is the whole point of calibration, and a picker showing 2097
 * while reading as 2092 is just broken. Detected from the SHAPE of the value
 * (an ISO date string plus a day-numbered range), never from the semantic type,
 * so the rule stays generic.
 */
function nativeRange(domain: AnyDomain): { first: number; last: number } | null {
  if (typeof domain.min !== 'number' || typeof domain.max !== 'number') return null;
  if (domain.max <= domain.min) return null;
  const probe = domain.denormalize(0);
  if (typeof probe !== 'string' || !ISO_DATE.test(probe)) return null;
  return { first: domain.min, last: domain.max };
}

/** Every normalized position this control can emit — one per day in its span. */
export function datePositions(domain: AnyDomain): number[] {
  const native = nativeRange(domain);
  const span = native ? native.last - native.first : SPAN_DAYS;
  return Array.from({ length: span + 1 }, (_, i) => i / span);
}

export function DateWidget({ domain, value, onChange }: WidgetAdapterProps) {
  // Native: the domain already speaks in dates, so show its actual calendar.
  // Otherwise fall back to this control's own span and report a position —
  // which is what lets a date picker mean a boolean or a percentage.
  const native = nativeRange(domain);
  const first = native ? native.first : FIRST_DAY;
  const last = native ? native.last : LAST_DAY;
  const span = last - first;

  const position = domain.normalize(value);
  const shownDate = fromDayNumber(first + Math.round(clamp01(position) * span));

  return (
    <input
      className="wui-date"
      type="date"
      min={fromDayNumber(first)}
      max={fromDayNumber(last)}
      value={shownDate}
      onChange={(event) => {
        // Clearing a date input yields an empty string; ignore it rather than
        // snapping the value to January 1st behind the player's back.
        if (!event.target.value) return;
        const picked = toDayNumber(event.target.value);
        onChange(domain.denormalize(clamp01((picked - first) / span)));
      }}
      aria-label="Date control"
    />
  );
}
