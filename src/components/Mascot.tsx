// Mascot.tsx
// Zorblet, watching you argue with a calendar.
//
// Purely decorative: if the sprite has not been produced yet, AssetImage falls
// back to nothing and the game is unaffected (art guide §18).

import { mascotAsset } from '../content/assets.ts';
import { mascotAltText, mascotState } from '../game/mascot.ts';
import { useGameStore } from '../game/state/gameStore.ts';
import { AssetImage } from './AssetImage.tsx';

interface MascotProps {
  /** Whole-number magnification; see AssetImage. */
  scale?: number;
}

export function Mascot({ scale = 2 }: MascotProps) {
  const stage = useGameStore((s) => s.stage);
  const outcome = useGameStore((s) => s.outcome);
  const events = useGameStore((s) => s.events);

  const state = mascotState(stage, outcome, events);

  return (
    <div className={`wui-mascot wui-mascot-${state}`} aria-hidden={false}>
      {/* Whole-number magnification keeps every pixel square (art guide §8).
          Sized by the caller, because a sprite that fits a wide header is too
          tall for a narrow column. */}
      <AssetImage id={mascotAsset(state)} alt={mascotAltText(state)} scale={scale} />
    </div>
  );
}
