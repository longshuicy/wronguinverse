// DateWidget.tsx
// A date picker is a physical calendar control with its own fixed span. The date
// the player picks is converted to a position within THAT span, which the domain
// then reinterprets — so picking a day in March may well mean "24%".
//
// The widget's calendar is deliberately independent of any date domain: this is
// what lets a date picker mean something that is not a date.

import { useMemo } from 'react';
import { clamp01 } from '../game/domains/defineDomain.ts';
import { formatDate, fromDayNumber, makeIsoDate, toDayNumber } from '../game/domains/dateUtils.ts';
import type { AnyDomain, WidgetAdapterProps } from '../game/state/types.ts';

/** The control's own physical span. Not related to any date domain's range. */
const WIDGET_YEAR = 2097;
const FIRST_DAY = toDayNumber(makeIsoDate(WIDGET_YEAR, 1, 1));
const LAST_DAY = toDayNumber(makeIsoDate(WIDGET_YEAR, 12, 31));
const SPAN_DAYS = LAST_DAY - FIRST_DAY;

/**
 * Above this many distinct values the calendar behaves like a normal calendar
 * — nearly every day means something different — and the region strip would be
 * a smear of one-pixel slivers rather than a usable control.
 */
const MAX_REGIONS = 32;

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

export interface Region {
  /** Display label of the value this stretch of calendar resolves to. */
  label: string;
  /** First day of the stretch, as a normalized position. */
  position: number;
  startIso: string;
  endIso: string;
  /** Days covered. Segments are sized by this so the strip maps the real year. */
  days: number;
}

/**
 * Walk the calendar and group consecutive days that mean the same thing.
 *
 * A discrete domain turns 365 days into a handful of values, so most date
 * changes do nothing at all and the boundaries are invisible — you cannot tell
 * a calendar meaning five creatures from one that is simply ignoring you. This
 * is the calendar's equivalent of the slider's detents.
 *
 * Grouping is by displayed label, so it works for any domain shape without ever
 * asking what the semantic is.
 */
function findRegions(domain: AnyDomain, first: number, span: number): Region[] {
  const regions: Region[] = [];

  for (let day = 0; day <= span; day += 1) {
    const position = day / span;
    const label = domain.display(domain.denormalize(position));
    const iso = fromDayNumber(first + day);
    const current = regions[regions.length - 1];

    if (current && current.label === label) {
      current.endIso = iso;
      current.days += 1;
    } else {
      regions.push({ label, position, startIso: iso, endIso: iso, days: 1 });
      // Bail out early once it is clearly a continuous domain.
      if (regions.length > MAX_REGIONS) return [];
    }
  }

  return regions.length > 1 ? regions : [];
}

/**
 * The regions this control would draw for a domain, or `[]` for none.
 *
 * Exported so the behaviour can be asserted directly: whether the strip appears
 * is a gameplay decision, not a styling detail.
 */
export function calendarRegions(domain: AnyDomain): Region[] {
  const native = nativeRange(domain);
  const first = native ? native.first : FIRST_DAY;
  const span = (native ? native.last : LAST_DAY) - first;
  return findRegions(domain, first, span);
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
  const currentLabel = value === undefined ? null : domain.display(value);

  const regions = useMemo(() => calendarRegions(domain), [domain]);

  return (
    <div className="wui-date-control">
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

      {/* One segment per distinct reading, the active one highlighted. Deliberately
          shows WHERE the calendar changes meaning, never WHAT it means — the
          deduction stays intact, only the fumbling goes away. */}
      {regions.length > 0 && (
        <div className="wui-date-regions" role="group" aria-label="Calendar regions">
          {regions.map((region, index) => {
            const active = currentLabel !== null && region.label === currentLabel;
            return (
              <button
                key={region.startIso}
                type="button"
                className={active ? 'wui-date-region is-active' : 'wui-date-region'}
                // Width tracks the real span of dates, so the strip reads as a
                // map of the year rather than an abstract list of slots.
                style={{ flexGrow: region.days }}
                aria-pressed={active}
                aria-label={`Region ${index + 1} of ${regions.length}, ${formatDate(
                  region.startIso,
                )} to ${formatDate(region.endIso)}`}
                title={`${formatDate(region.startIso)} – ${formatDate(region.endIso)}`}
                onClick={() => onChange(domain.denormalize(region.position))}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
