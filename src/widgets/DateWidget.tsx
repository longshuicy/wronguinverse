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
import type { AnyDomain, OperationType, WidgetAdapterProps } from '../game/state/types.ts';
import { useRefusal } from './operationShift.ts';

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

/**
 * How coarsely the arrows walk a calendar with no regions of its own.
 *
 * Stepping a continuous domain one day at a time would mean up to 365 presses
 * to cross the year, which is not a puzzle but a chore. A week per press keeps
 * the whole span a handful of seconds away.
 */
const ARROW_STRIDE_DAYS = 7;

/** The positions the arrows can walk to when every day means something. */
function stridedPositions(span: number): number[] {
  const out: number[] = [];
  for (let day = 0; day <= span; day += ARROW_STRIDE_DAYS) out.push(day / span);
  // The last day is a legitimate target and rarely lands on the stride.
  if (out[out.length - 1] !== 1) out.push(1);
  return out;
}

/** Every normalized position this control can emit — one per day in its span. */
export function datePositions(domain: AnyDomain, operation: OperationType = 'native'): number[] {
  const native = nativeRange(domain);
  const span = native ? native.last - native.first : SPAN_DAYS;

  // Under `stepArrows` the days are dead and the arrows are the only way to
  // move, so the reachable set is whatever they can walk to — the regions when
  // the domain has them, a strided subset when it does not.
  if (operation === 'stepArrows') {
    const regions = calendarRegions(domain);
    if (regions.length > 0) return regions.map((region) => region.position);
    return stridedPositions(span);
  }

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
  stepArrows,
  walk,
}: {
  first: number;
  last: number;
  selectedIso: string;
  /** Day numbers that mean something, or `null` when every day does. */
  selectable: Set<number> | null;
  onPick: (iso: string) => void;
  /**
   * Tier 2: the arrows move the SELECTION and the days are inert.
   *
   * The calendar keeps looking like a calendar — that is the joke — so the days
   * stay enabled and flinch rather than greying out, which would read as the
   * control being switched off rather than being wrong.
   */
  stepArrows: boolean;
  /** Day numbers the arrows walk, ascending. Only used under `stepArrows`. */
  walk: number[];
}) {
  const [selectedYear, selectedMonth] = partsOf(selectedIso);
  const [view, setView] = useState({ year: selectedYear, month: selectedMonth });
  const { refusing, refuse } = useRefusal();

  // The view has to chase the selection once the arrows drive it, or stepping
  // past a month boundary would move a selection the player cannot see.
  const shownIso = fromDayNumber(toDayNumber(selectedIso));
  const [shownYear, shownMonth] = partsOf(shownIso);
  const viewYear = stepArrows ? shownYear : view.year;
  const viewMonth = stepArrows ? shownMonth : view.month;

  /** Move the selection one rung along the walk. */
  function stepSelection(direction: 1 | -1) {
    const current = toDayNumber(selectedIso);
    const index = walk.findIndex((day) => day >= current);
    const from = index === -1 ? walk.length - 1 : index;
    const next = from + direction;
    if (next < 0 || next >= walk.length) {
      // The ends of the calendar are a real edge, not a bug. Flinch rather than
      // wrapping: wrapping would let a player scrub past the target forever.
      refuse();
      return;
    }
    onPick(fromDayNumber(walk[next]!));
  }

  // Most months are entirely dead when a domain collapses to four readings, so
  // stepping one month at a time would mean clicking through empty grids. The
  // arrows jump to the next month that actually holds something.
  function step(direction: 1 | -1) {
    let day = toDayNumber(makeIsoDate(viewYear, viewMonth, 1));
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

  const total = daysInMonth(viewYear, viewMonth);
  const leading = weekdayOf(makeIsoDate(viewYear, viewMonth, 1));
  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: total }, (_, i) => makeIsoDate(viewYear, viewMonth, i + 1)),
  ];

  return (
    <div className={refusing ? 'wui-calendar is-refusing' : 'wui-calendar'}>
      <div className="wui-calendar-head">
        <button
          type="button"
          className="wui-calendar-step"
          onClick={() => (stepArrows ? stepSelection(-1) : step(-1))}
          aria-label={stepArrows ? 'Previous value' : 'Previous month with a selectable date'}
        >
          {'\u25C0'}
        </button>
        <span className="wui-calendar-month">
          {monthName(viewMonth)} {viewYear}
        </span>
        <button
          type="button"
          className="wui-calendar-step"
          onClick={() => (stepArrows ? stepSelection(1) : step(1))}
          aria-label={stepArrows ? 'Next value' : 'Next month with a selectable date'}
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
              // Under `stepArrows` the days stay pressable so they can flinch.
              // A `disabled` button swallows the click entirely and cannot
              // animate, which reads as the calendar being off rather than
              // being wrong.
              disabled={stepArrows ? false : !enabled}
              aria-label={formatDate(iso)}
              aria-current={selected ? 'date' : undefined}
              onClick={() => (stepArrows ? refuse() : onPick(iso))}
            >
              {partsOf(iso)[2]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateWidget({ domain, value, onChange, operation }: WidgetAdapterProps) {
  const stepArrows = operation === 'stepArrows';
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

  // The rungs the arrows climb, as day numbers. Derived from the same
  // `datePositions` the generator asked for reachability, so the target it
  // chose is always one the arrows can actually land on.
  const walk = useMemo(
    () =>
      stepArrows
        ? datePositions(domain, 'stepArrows').map((p) => first + Math.round(p * span))
        : [],
    [stepArrows, domain, first, span],
  );

  return (
    <div className="wui-date-control">
      <CalendarGrid
        first={first}
        last={last}
        selectedIso={selectedIso}
        selectable={selectable}
        stepArrows={stepArrows}
        walk={walk}
        onPick={(iso) => onChange(domain.denormalize(clamp01((toDayNumber(iso) - first) / span)))}
      />
    </div>
  );
}
