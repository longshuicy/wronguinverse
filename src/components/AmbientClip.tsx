// AmbientClip.tsx
// The generated clip, full-bleed and dimmed, behind a screen that has nothing
// to operate. Shared by the shift transition and the Reality Index.
//
// Decoration only: it is nearly a megabyte and may not have arrived yet, so it
// fades in if and when it is ready and the screen is identical without it.

import { useState } from 'react';

const CLIP_URL = `${import.meta.env.BASE_URL}animation/shift.m4v`;

interface AmbientClipProps {
  /** Suppressed entirely under prefers-reduced-motion. */
  disabled?: boolean;
  /** Looped on a page the player reads at their own pace. */
  loop?: boolean;
}

export function AmbientClip({ disabled = false, loop = false }: AmbientClipProps) {
  const [ready, setReady] = useState(false);
  if (disabled) return null;

  return (
    <video
      className={ready ? 'wui-ambient-clip is-ready' : 'wui-ambient-clip'}
      src={CLIP_URL}
      autoPlay
      muted
      playsInline
      loop={loop}
      preload="auto"
      aria-hidden="true"
      onCanPlay={() => setReady(true)}
      onError={() => setReady(false)}
    />
  );
}
