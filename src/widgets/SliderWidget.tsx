// SliderWidget.tsx
// A slider is a continuous 0-1 track. It has no idea whether it is choosing a
// creature, a date or a percentage — it reports a position and the domain
// decides what that means.

import { enumerateDomain, isDiscrete } from '../game/domains/index.ts';
import type { AnyDomain, WidgetAdapterProps } from '../game/state/types.ts';

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

/** Every normalized position this control can emit. */
export function sliderPositions(domain: AnyDomain): number[] {
  const steps = sliderSteps(domain);
  return Array.from({ length: steps + 1 }, (_, i) => i / steps);
}

export function SliderWidget({ domain, value, onChange }: WidgetAdapterProps) {
  const safeSteps = sliderSteps(domain);
  const position = domain.normalize(value);

  return (
    <input
      className="wui-slider"
      type="range"
      min={0}
      max={safeSteps}
      step={1}
      value={Math.round(position * safeSteps)}
      onChange={(event) => onChange(domain.denormalize(Number(event.target.value) / safeSteps))}
      aria-label="Slider control"
    />
  );
}
