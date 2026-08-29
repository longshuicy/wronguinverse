// SceneDecor.tsx
// Layer C — the parallel-universe flavour: creatures watching the terminal and
// anomalies drifting around it (art guide §3).
//
// Chosen from the run seed, so a universe keeps the same inhabitants for its
// whole life and two universes look different. Purely decorative: nothing here
// has gameplay logic, everything is aria-hidden, and any missing sprite simply
// does not render.
//
// Placed only in the margins beside the terminal column and hidden on narrow
// screens, because decoration must never crowd a control.

import { useMemo } from 'react';
import type { AssetId } from '../content/assets.ts';
import { createRng } from '../game/generator/seededRandom.ts';
import { AssetImage } from './AssetImage.tsx';

const CREATURES: AssetId[] = [
  'creature_mip',
  'creature_quonk',
  'creature_velori',
  'creature_plim',
  'creature_noxu',
];

const PROPS: AssetId[] = [
  'prop_flux_crystal',
  'prop_reactor_orb',
  'prop_antenna',
  'prop_antigravity_rock',
  'prop_tiny_satellite',
  'prop_anomaly_blob',
  'prop_portal',
];

interface Placement {
  id: AssetId;
  side: 'left' | 'right';
  /** Percentage down the viewport. */
  top: number;
  /** Inset from the viewport edge, in px. */
  inset: number;
  scale: number;
  /** Seconds; varied so the drift never falls into lockstep. */
  duration: number;
  delay: number;
}

function planScene(seed: string): Placement[] {
  const rng = createRng(`${seed}::decor`);
  const chosen: AssetId[] = [
    ...rng.sample(CREATURES, rng.int(1, 2)),
    ...rng.sample(PROPS, rng.int(2, 3)),
  ];

  // Spread down the viewport in bands so two never land on top of each other.
  const bands = rng.shuffle([10, 28, 46, 64, 80]);

  return chosen.map((id, index) => {
    // Zorblet lives in the bottom-right corner; keep that band clear.
    const band = bands[index] ?? 50;
    const side = index % 2 === 0 ? 'left' : ('right' as const);
    return {
      id,
      side: side === 'right' && band > 58 ? ('left' as const) : side,
      top: band,
      // Slight negative inset lets them peek in from beyond the edge, which
      // reads as inhabiting the room rather than sitting in a margin — and
      // survives the margin being narrow on a smaller desktop.
      inset: rng.int(-14, 20),
      scale: 1,
      duration: rng.int(7, 14),
      delay: rng.int(0, 6),
    };
  });
}

interface SceneDecorProps {
  seed: string | null;
}

export function SceneDecor({ seed }: SceneDecorProps) {
  const scene = useMemo(() => (seed ? planScene(seed) : []), [seed]);
  if (scene.length === 0) return null;

  return (
    <div className="wui-decor" aria-hidden="true">
      {scene.map((item) => (
        <div
          key={item.id}
          className="wui-decor-item"
          style={{
            top: `${item.top}%`,
            [item.side]: `${item.inset}px`,
            animationDuration: `${item.duration}s`,
            animationDelay: `-${item.delay}s`,
          }}
        >
          <AssetImage id={item.id} alt="" scale={item.scale} />
        </div>
      ))}
    </div>
  );
}
