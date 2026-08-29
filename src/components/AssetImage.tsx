// AssetImage.tsx
// A sprite that quietly disappears when its file is not there yet.
//
// Art is produced in parallel with code, so parts of the manifest may be absent
// at any moment. Art guide §18: optional art must have fallbacks so missing
// decorative assets never block gameplay. A broken-image icon in the middle of
// the terminal would be worse than nothing.

import { useState } from 'react';
import { assetUrl, type AssetId } from '../content/assets.ts';

interface AssetImageProps {
  id: AssetId;
  alt: string;
  /**
   * Whole-number magnification of the source sprite.
   *
   * Shipped sprites have been reduced to a logical pixel grid by
   * `scripts/clean-sprites.mjs`, so they are magnified by an integer factor and
   * never resampled — art guide §8, "scale with integer multiples", "avoid
   * fractional sprite scaling".
   */
  scale?: number;
  className?: string;
  /** Rendered instead when the asset is missing. Defaults to nothing. */
  fallback?: React.ReactNode;
}

export function AssetImage({ id, alt, scale = 2, className, fallback = null }: AssetImageProps) {
  const [missing, setMissing] = useState(false);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);

  if (missing) return <>{fallback}</>;

  return (
    <img
      className={className ? `wui-sprite ${className}` : 'wui-sprite'}
      src={assetUrl(id)}
      alt={alt}
      // Sized from the source's real dimensions once known, so the aspect ratio
      // is never forced and the magnification stays exactly `scale`.
      style={
        natural
          ? { width: natural.width * scale, height: natural.height * scale }
          : { visibility: 'hidden' }
      }
      onLoad={(event) =>
        setNatural({
          width: event.currentTarget.naturalWidth,
          height: event.currentTarget.naturalHeight,
        })
      }
      onError={() => setMissing(true)}
      draggable={false}
    />
  );
}
