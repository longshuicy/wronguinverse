// DateWidget.tsx
// A date picker is a physical calendar control with its own fixed span. The date
// the player picks is converted to a position within THAT span, which the domain
// then reinterprets — so picking a day in March may well mean "24%".
//
// The widget's calendar is deliberately independent of any date domain: this is
// what lets a date picker mean something that is not a date.

import { useMemo, useState } from 'react';
import { clamp01 } from '../game/domains/defineDomain.ts';
import {
  daysInMonth,
  formatDate,
  fromDayNumber,
  makeIsoDate,
  monthName,
  partsOf,
  toDayNumber,
  weekdayOf,
} from '../game/domains/dateUtils.ts';
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
  /** Days covered, so a stretch can show the range it stands for. */
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

const WEEKDAY_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * A calendar that can refuse a date.
 *
 * `<input type="date">` cannot: there is no attribute for disabling individual
 * days, and the popup is browser chrome we can neither style nor gate. When a
 * discrete domain collapses the year into a handful of readings, every other
 * day is dead — picking it changes nothing, and a player cannot tell a calendar
 * that means five creatures from one that is ignoring them. So the grid is
 * drawn here, where a dead day can simply be `disabled`.
 *
 * It still shows WHERE the calendar changes meaning and never WHAT it means:
 * the deduction stays intact, only the fumbling goes away.
 */
function CalendarGrid({
  first,
  last,
  selectedIso,
  selectable,
  onPick,
}: {
  first: number;
  last: number;
  selectedIso: string;
  /** Day numbers that mean something, or `null` when every day does. */
  selectable: Set<number> | null;
  onPick: (iso: string) => void;
}) {
  const [selectedYear, selectedMonth] = partsOf(selectedIso);
  const [view, setView] = useState({ year: selectedYear, month: selectedMonth });

  // Most months are entirely dead when a domain collapses to four readings, so
  // stepping one month at a time would mean clicking through empty grids. The
  // arrows jump to the next month that actually holds something.
  function step(direction: 1 | -1) {
    let day = toDayNumber(makeIsoDate(view.year, view.month, 1));
    for (let guard = 0; guard < 24; guard += 1) {
      const [y, m] = partsOf(fromDayNumber(day));
      const next =
        direction === 1
          ? toDayNumber(makeIsoDate(m === 12 ? y + 1 : y, (m % 12) + 1, 1))
          : toDayNumber(makeIsoDate(m === 1 ? y - 1 : y, m === 1 ? 12 : m - 1, 1));
      if (next > last || next < first - 31) return;
      day = next;

      const [ny, nm] = partsOf(fromDayNumber(day));
      const total = daysInMonth(ny, nm);
      const start = toDayNumber(makeIsoDate(ny, nm, 1));
      const holdsSomething =
        selectable === null ||
        Array.from({ length: total }, (_, i) => start + i).some(
          (d) => d >= first && d <= last && selectable.has(d),
        );
      if (holdsSomething) {
        setView({ year: ny, month: nm });
        return;
      }
    }
  }

  const total = daysInMonth(view.year, view.month);
  const leading = weekdayOf(makeIsoDate(view.year, view.month, 1));
  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: total }, (_, i) => makeIsoDate(view.year, view.month, i + 1)),
  ];

  return (
    <div className="wui-calendar">
      <div className="wui-calendar-head">
        <button
          type="button"
          className="wui-calendar-step"
          onClick={() => step(-1)}
          aria-label="Previous month with a selectable date"
        >
          {'\u25C0'}
        </button>
        <span className="wui-calendar-month">
          {monthName(view.month)} {view.year}
        </span>
        <button
          type="button"
          className="wui-calendar-step"
          onClick={() => step(1)}
          aria-label="Next month with a selectable date"
        >
          {'\u25B6'}
        </button>
      </div>

      <div className="wui-calendar-grid" role="grid">
        {WEEKDAY_INITIALS.map((initial, i) => (
          <span key={i} className="wui-calendar-weekday" aria-hidden="true">
            {initial}
          </span>
        ))}

        {cells.map((iso, i) => {
          if (!iso) return <span key={`pad-${i}`} className="wui-calendar-pad" />;

          const day = toDayNumber(iso);
          const inSpan = day >= first && day <= last;
          const enabled = inSpan && (selectable === null || selectable.has(day));
          const selected = iso === selectedIso;

          return (
            <button
              key={iso}
              type="button"
              className={selected ? 'wui-calendar-day is-selected' : 'wui-calendar-day'}
              disabled={!enabled}
              aria-label={formatDate(iso)}
              aria-current={selected ? 'date' : undefined}
              onClick={() => onPick(iso)}
            >
              {partsOf(iso)[2]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateWidget({ domain, value, onChange }: WidgetAdapterProps) {
  // Native: the domain already speaks in dates, so show its actual calendar.
  // Otherwise fall back to this control's own span and report a position —
  // which is what lets a date picker mean a boolean or a percentage.
  const native = nativeRange(domain);
  const first = native ? native.first : FIRST_DAY;
  const last = native ? native.last : LAST_DAY;
  const span = last - first;

  const regions = useMemo(() => calendarRegions(domain), [domain]);
  const currentLabel = value === undefined ? null : domain.display(value);

  // One day per distinct reading. `null` means the domain changes often enough
  // that every day is worth offering, and the calendar behaves normally.
  const selectable = useMemo(
    () =>
      regions.length === 0
        ? null
        : new Set(regions.map((region) => first + Math.round(region.position * span))),
    [regions, first, span],
  );

  const activeRegion =
    currentLabel === null ? undefined : regions.find((region) => region.label === currentLabel);

  const position = domain.normalize(value);
  const selectedIso = activeRegion
    ? activeRegion.startIso
    : fromDayNumber(first + Math.round(clamp01(position) * span));

  return (
    <div className="wui-date-control">
      <CalendarGrid
        first={first}
        last={last}
        selectedIso={selectedIso}
        selectable={selectable}
        onPick={(iso) => onChange(domain.denormalize(clamp01((toDayNumber(iso) - first) / span)))}
      />
    </div>
  );
}
