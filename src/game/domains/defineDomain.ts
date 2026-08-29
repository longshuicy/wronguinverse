// defineDomain.ts
// The one place where a typed domain is erased to `AnyDomain`.
//
// A run holds heterogeneous domains side by side (a boolean domain next to a
// date domain), so they must share a single storage type. Generators are written
// with full type safety over their own `T` and pass through here exactly once,
// which keeps the unsafe cast auditable instead of scattered.

import type { AnyDomain, SemanticDomain } from '../state/types.ts';

export function defineDomain<T>(domain: SemanticDomain<T>): AnyDomain {
  return domain as SemanticDomain<unknown>;
}

/** Clamp into `[0, 1]`; every widget position passes through here. */
export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

/**
 * Map a `[0, 1]` position onto one of `length` evenly spaced slots.
 * The inverse of `indexToPosition`.
 */
export function positionToIndex(position: number, length: number): number {
  if (length <= 1) return 0;
  return Math.round(clamp01(position) * (length - 1));
}

/** Map a slot index back onto its `[0, 1]` position. */
export function indexToPosition(index: number, length: number): number {
  if (length <= 1) return 0;
  return index / (length - 1);
}
