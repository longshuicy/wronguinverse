// AssetImage.tsx
// A sprite that quietly disappears when its file is not there yet.
//
// Art is produced in parallel with code, so most of the manifest is absent at
// any given moment. Art guide §18: optional art must have fallbacks so missing
// decorative assets never block gameplay. A broken-image icon in the middle of
// the terminal would be worse than nothing.

import { useState } from 'react';
import { assetUrl, type AssetId } from '../content/assets.ts';

interface AssetImageProps {
  id: AssetId;
  alt: string;
  /** Display height in CSS pixels. Width follows the source aspect ratio. */
  height?: number;
  className?: string;
  /**
   * `pixelated` is only right for a sprite already reduced to a logical pixel
   * grid and then scaled UP by an integer (art guide §5, §8). Applied to a raw
   * high-resolution source being scaled DOWN it drops pixels instead of
   * averaging them, which looks harsh. Default to `auto` and opt in per asset
   * once it has been through the cleanup pass.
   */
  rendering?: 'auto' | 'pixelated';
  /** Rendered instead when the asset is missing. Defaults to nothing. */
  fallback?: React.ReactNode;
}

export function AssetImage({
  id,
  alt,
  height = 96,
  className,
  rendering = 'auto',
  fallback = null,
}: AssetImageProps) {
  const [missing, setMissing] = useState(false);

  if (missing) return <>{fallback}</>;

  return (
    <img
      className={className ? `wui-sprite ${className}` : 'wui-sprite'}
      src={assetUrl(id)}
      alt={alt}
      // Height only: forcing a square would squash any sprite that is not one.
      style={{ height, width: 'auto', imageRendering: rendering }}
      onError={() => setMissing(true)}
      draggable={false}
    />
  );
}
