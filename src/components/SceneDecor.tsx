// SceneDecor.tsx
// Layer C — the parallel-universe flavour (art guide §3).
//
// Creatures and anomalies used to float in the page margins, which read as
// clip-art scattered around a website rather than as a place. They now attach
// to the things they belong to: one specimen per station, so each control has
// an inhabitant, chosen from the run seed so a universe keeps the same cast.
//
// Purely decorative. Nothing here has gameplay logic, everything is
// aria-hidden, and a missing sprite simply does not render.

import type { AssetId } from '../content/assets.ts';
import { createRng } from '../game/generator/seededRandom.ts';
import { AssetImage } from './AssetImage.tsx';

/**
 * Props only. Creatures are reserved for the result screen, where each one
 * stands for an Interface Brain Type (content/brainTypes.ts) — reusing them as
 * card decoration would dilute that association into wallpaper.
 *
 * Seven props against a maximum of eight stations, so the hardest level
 * repeats one. An eighth prop would remove the repeat.
 */
const SPECIMENS: AssetId[] = [
  'prop_flux_crystal',
  'prop_reactor_orb',
  'prop_antenna',
  'prop_antigravity_rock',
  'prop_tiny_satellite',
  'prop_anomaly_blob',
  'prop_portal',
];

/**
 * One specimen per station, distinct within a run and stable across renders.
 *
 * Keyed off the seed so the same universe always has the same inhabitants —
 * re-rolling them on every render would make the page twitch.
 */
export function planSpecimens(seed: string, count: number): AssetId[] {
  const rng = createRng(`${seed}::specimens`);
  const picked = rng.sample(SPECIMENS, Math.min(count, SPECIMENS.length));
  // Wrap rather than render nothing if a level has more stations than props.
  return Array.from({ length: count }, (_, i) => picked[i % picked.length]!);
}

interface SpecimenProps {
  id: AssetId | undefined;
}

/** A single specimen, sized to sit beside a control without crowding it. */
export function Specimen({ id }: SpecimenProps) {
  if (!id) return null;
  return (
    <div className="wui-specimen" aria-hidden="true">
      {/* 2x, so the pixels read as pixels rather than as a small picture. */}
      <AssetImage id={id} alt="" scale={2} />
    </div>
  );
}
