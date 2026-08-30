// InstabilityMeter.tsx
// The dimension visibly getting worse while you argue with it.
//
// PURELY COSMETIC, and that is a design constraint rather than an admission:
// nothing reads this value, nothing is gated on it, and it can never end a run.
// The game deliberately has no clock — "nothing in the game asks the player to
// manage a clock, so grading them on one would be measuring something they were
// never told about" (game design §11) — and a meter that DID something would be
// exactly the pressure that decision rejected.
//
// What it is for: the challenge screen had nothing that answered the player
// continuously. Requirements lock, which is rare, and readings change, which is
// local to one card. Between those moments the screen sat still, and a screen
// that never reacts is the thing that reads as a document. This reacts to every
// wrong attempt, costs nothing, and gives the fiction a face: the dimension is
// getting less stable while you work out what a checkbox means.

interface InstabilityMeterProps {
  /** Wrong attempts so far. */
  misses: number;
  /** Controls in this run, so a four-control bench is not judged like an eight. */
  mappingCount: number;
}

/** Misses per control at which the meter is full. Chosen to be reachable. */
const CEILING = 4;

export function InstabilityMeter({ misses, mappingCount }: InstabilityMeterProps) {
  const scale = Math.max(1, mappingCount) * CEILING;
  const level = Math.min(1, misses / scale);
  const segments = 12;
  const lit = Math.round(level * segments);

  return (
    <div
      className="wui-instability"
      data-level={level > 0.66 ? 'high' : level > 0.33 ? 'mid' : 'low'}
    >
      <span className="wui-instability-label">INSTABILITY</span>
      <span
        className="wui-instability-bar"
        role="meter"
        aria-valuenow={Math.round(level * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Dimensional instability, cosmetic"
      >
        {Array.from({ length: segments }, (_, i) => (
          <i key={i} className={i < lit ? 'wui-instability-pip is-lit' : 'wui-instability-pip'} />
        ))}
      </span>
    </div>
  );
}
