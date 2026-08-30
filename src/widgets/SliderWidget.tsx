// SliderWidget.tsx
// A slider is a continuous 0-1 track. It has no idea whether it is choosing a
// creature, a date or a percentage — it reports a position and the domain
// decides what that means.
//
// Under `clickStep` the track stops being draggable and becomes a row of
// detents you click: the one gesture nobody tries on a slider.

import { useRef } from 'react';
import { enumerateDomain, isDiscrete } from '../game/domains/index.ts';
import { clamp01 } from '../game/domains/defineDomain.ts';
import type { AnyDomain, OperationType, WidgetAdapterProps } from '../game/state/types.ts';
import { DRAG_DETECT_PX, useRefusal } from './operationShift.ts';

/** Physical resolution of the track when the domain is continuous. */
const CONTINUOUS_STEPS = 100;

/**
 * Number of detents on the track for this domain.
 *
 * Shared by the component and by `sliderPositions` so the control's rendered
 * resolution and its advertised reachability can never drift apart.
 */
/** Guard against a domain with an absurdly fine grid producing a useless track. */
const MAX_STEPS = 400;

/**
 * Detents a CLICKED track can address.
 *
 * A click resolves to about a pixel, so a 400-step track clicked at 300 px wide
 * cannot honestly offer 400 values — the player would aim for one and get its
 * neighbour. Clicking therefore snaps to a coarse ladder, and `sliderPositions`
 * reports that same ladder so the generator never picks a target between two
 * rungs.
 */
const CLICK_DETENTS = 12;

function sliderSteps(domain: AnyDomain): number {
  // One detent per value for discrete domains, so every option is reachable by
  // dragging and no two detents collapse onto the same value.
  if (isDiscrete(domain)) {
    return Math.max(1, enumerateDomain(domain).length - 1);
  }

  // A ranged domain publishes its own grid; matching it means every value is
  // reachable and the slider lands exactly on steps instead of between them.
  const { min, max, step } = domain;
  if (typeof min === 'number' && typeof max === 'number' && typeof step === 'number' && step > 0) {
    return Math.max(1, Math.min(MAX_STEPS, Math.round((max - min) / step)));
  }

  return CONTINUOUS_STEPS;
}

/**
 * The ladder a clicked track snaps to.
 *
 * Built by SUBSAMPLING the native detents rather than by dividing the range:
 * an evenly divided ladder lands between the track's own steps, so a clicked
 * slider would offer values a dragged one cannot, and the gesture would be
 * quietly changing the domain instead of only the way you reach it.
 *
 * A track already coarser than `CLICK_DETENTS` keeps its own steps: it is
 * clickable as it stands, and thinning it further would hide values.
 */
function clickDetents(domain: AnyDomain): number[] {
  const steps = sliderSteps(domain);
  if (steps <= CLICK_DETENTS) {
    return Array.from({ length: steps + 1 }, (_, i) => i / steps);
  }

  const out: number[] = [];
  for (let i = 0; i <= CLICK_DETENTS; i += 1) {
    const detent = Math.round((i / CLICK_DETENTS) * steps);
    const position = detent / steps;
    // Rounding can land twice on the same detent near the ends.
    if (out[out.length - 1] !== position) out.push(position);
  }
  return out;
}

/** Every normalized position this control can emit. */
export function sliderPositions(domain: AnyDomain, operation: OperationType = 'native'): number[] {
  if (operation === 'clickStep') return clickDetents(domain);
  const steps = sliderSteps(domain);
  return Array.from({ length: steps + 1 }, (_, i) => i / steps);
}

export function SliderWidget({ domain, value, onChange, operation }: WidgetAdapterProps) {
  const safeSteps = sliderSteps(domain);
  const position = domain.normalize(value);
  const clickStep = operation === 'clickStep';
  const wrapper = useRef<HTMLDivElement | null>(null);
  const track = useRef<HTMLInputElement | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const { refusing, refuse } = useRefusal();

  const input = (
    <input
      ref={track}
      className={clickStep ? 'wui-slider is-shifted' : 'wui-slider'}
      type="range"
      min={0}
      max={safeSteps}
      step={1}
      value={Math.round(clamp01(position) * safeSteps)}
      onChange={(event) => {
        // Unreachable while the track has `pointer-events: none`, but kept
        // guarded so that an engine which routes some other way cannot hand the
        // player a free drag.
        if (clickStep) return;
        onChange(domain.denormalize(Number(event.target.value) / safeSteps));
      }}
      // Out of the tab order under the shift; the wrapper is the focus target.
      tabIndex={clickStep ? -1 : undefined}
      aria-hidden={clickStep ? true : undefined}
      aria-label="Slider control"
    />
  );

  if (!clickStep) return input;

  const detents = clickDetents(domain);

  /** Nearest rung to a normalized position. */
  function snap(to: number): number {
    let best = 0;
    for (let i = 1; i < detents.length; i += 1) {
      if (Math.abs(detents[i]! - to) < Math.abs(detents[best]! - to)) best = i;
    }
    return best;
  }

  function commit(index: number) {
    onChange(domain.denormalize(detents[clamp(index)]!));
  }

  function clamp(index: number): number {
    return Math.max(0, Math.min(detents.length - 1, index));
  }

  const currentIndex = snap(clamp01(position));

  return (
    // The native track keeps its looks and its value but stops taking pointer
    // input: cancelling a range drag via preventDefault is engine-dependent,
    // whereas `pointer-events: none` is not. The wrapper owns the gesture.
    <div
      ref={wrapper}
      className={['wui-shift-wrap', refusing ? 'is-refusing' : ''].filter(Boolean).join(' ')}
      role="slider"
      tabIndex={0}
      aria-label="Slider control"
      aria-valuemin={0}
      aria-valuemax={detents.length - 1}
      aria-valuenow={currentIndex}
      aria-valuetext={value === undefined ? undefined : domain.display(value)}
      onPointerDown={(event) => {
        origin.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const from = origin.current;
        origin.current = null;
        const element = track.current;
        if (!element) return;

        // A press that travelled is an attempted drag — the gesture this track
        // no longer answers to. Flinch rather than treating it as a click at
        // the release point, which would reward the wrong gesture by accident.
        if (from && Math.hypot(event.clientX - from.x, event.clientY - from.y) > DRAG_DETECT_PX) {
          refuse();
          return;
        }

        const { left, width } = element.getBoundingClientRect();
        if (width === 0) return;
        commit(snap(clamp01((event.clientX - left) / width)));
      }}
      onKeyDown={(event) => {
        // The arrows move one DETENT, not one native step: the keyboard gets
        // the same coarse ladder the mouse does rather than a finer bypass.
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
          event.preventDefault();
          commit(currentIndex + 1);
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
          event.preventDefault();
          commit(currentIndex - 1);
        }
      }}
    >
      {input}
    </div>
  );
}
