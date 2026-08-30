// CastGallery.tsx
// Which of the Interface Brain Types this player has been.
//
// The seven types were a punchline you saw once and never thought about again:
// nothing told a player that the other six existed, so nothing suggested that a
// different way of playing would be READ differently. Shown as a set, they
// become the only reason to try a tier or a level you would otherwise skip, and
// two of them are genuinely hard to reach — THE THEORIST needs a run solved on
// almost no interactions, and PERSON WITH BOUNDARIES requires walking out on a
// dimension on purpose.
//
// Unseen types are shown as blanked silhouettes rather than hidden. A gap you
// can see is an invitation; a gap you cannot see is nothing at all. The name is
// withheld, though — the joke should land when it is earned.

import { BRAIN_TYPES, type BrainTypeId } from '../content/brainTypes.ts';
import { AssetImage } from './AssetImage.tsx';

interface CastGalleryProps {
  /** Ids from persisted progress. Unknown ids are ignored, not trusted. */
  seen: string[];
  /** The type earned by the run just finished, marked as new if first time. */
  current: BrainTypeId;
}

export function CastGallery({ seen, current }: CastGalleryProps) {
  const all = Object.values(BRAIN_TYPES);
  const found = all.filter((type) => seen.includes(type.id));

  return (
    <section className="wui-cast">
      <h2>
        THE CAST · {found.length}/{all.length}
      </h2>
      <ul>
        {all.map((type) => {
          const discovered = seen.includes(type.id);
          return (
            <li
              key={type.id}
              className={discovered ? 'wui-cast-member' : 'wui-cast-member is-unknown'}
            >
              <AssetImage id={type.creature} alt="" scale={1} />
              <span className="wui-cast-name">{discovered ? type.creatureName : '???'}</span>
              {type.id === current && <span className="wui-cast-tag">THIS RUN</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
