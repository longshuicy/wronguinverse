// TerminalShell.tsx
// Layer B of the visual hierarchy: the framing the DOM terminal sits inside.
//
// Owns the two things that make the palette tokens do any work — the current
// stage treatment and the current universe's accent remap — by putting them on
// a wrapper as data attributes. See art guide §3, §7.

import { useEffect, useState } from 'react';
import { assetUrl } from '../content/assets.ts';
import type { StageId } from '../game/state/types.ts';
import { Mascot } from './Mascot.tsx';

/** Accent remaps a universe can adopt. Art guide §7 "Universe Palette Variants". */
const UNIVERSE_VARIANTS = ['standard', 'voidMint', 'fluxAmber', 'inverseViolet'] as const;
export type UniverseVariant = (typeof UNIVERSE_VARIANTS)[number];

/**
 * Pick a palette variant from the seed.
 *
 * Derived rather than random so a shared seed looks the same for everyone, and
 * weighted so most universes stay recognizably WrongUIᴎverse (§7).
 */
export function universeVariant(seed: string | null): UniverseVariant {
  if (!seed) return 'standard';
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  // Half of all universes use the default palette.
  const roll = hash % 100;
  if (roll < 50) return 'standard';
  if (roll < 70) return 'voidMint';
  if (roll < 85) return 'fluxAmber';
  return 'inverseViolet';
}

interface TerminalShellProps {
  stage: StageId;
  seed: string | null;
  children: React.ReactNode;
}

export function TerminalShell({ stage, seed, children }: TerminalShellProps) {
  const [hasArt, setHasArt] = useState(false);

  // Probe the background rather than assuming it exists: art lands in public/
  // over time, and a missing file must fall through to the CSS gradient.
  useEffect(() => {
    const url = assetUrl('bg_calibration_lab');
    const image = new Image();
    image.onload = () => setHasArt(true);
    image.onerror = () => setHasArt(false);
    image.src = url;
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, []);

  return (
    <div className="wui-shell" data-stage={stage} data-universe={universeVariant(seed)}>
      <div
        className="wui-shell-backdrop"
        data-has-art={hasArt}
        style={hasArt ? { backgroundImage: `url(${assetUrl('bg_calibration_lab')})` } : undefined}
      />
      <div className="wui-shell-veil" />
      {children}
      <Mascot />
    </div>
  );
}
