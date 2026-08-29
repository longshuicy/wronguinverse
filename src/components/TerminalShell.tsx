// TerminalShell.tsx
// Layer B of the visual hierarchy: the framing the DOM terminal sits inside.
//
// Owns the two things that make the palette tokens do any work — the current
// stage treatment and the current universe's accent remap — by putting them on
// a wrapper as data attributes. See art guide §3, §7.

import type { StageId } from '../game/state/types.ts';

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
  return (
    <div className="wui-shell" data-stage={stage} data-universe={universeVariant(seed)}>
      {/* Scanlines over the flat page colour. The generated environment
          painting was retired: it fought the pixel controls in front of it and
          pulled the screen away from the palette. See art guide §4 A001. */}
      <div className="wui-shell-veil" />
      {children}
    </div>
  );
}
