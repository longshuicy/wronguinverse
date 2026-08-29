// Timer.tsx
// Countdown for the exploration window.

interface TimerProps {
  remainingMs: number;
  totalMs: number;
}

export function Timer({ remainingMs, totalMs }: TimerProps) {
  const seconds = Math.ceil(remainingMs / 1000);
  const fraction = totalMs > 0 ? remainingMs / totalMs : 0;
  const urgent = fraction <= 0.25;

  return (
    <div className={`wui-timer${urgent ? ' wui-timer-urgent' : ''}`}>
      <div className="wui-timer-label">
        <span>STABILITY WINDOW</span>
        {/* Announce politely: a countdown that interrupts on every tick is
            worse than useless to a screen reader. */}
        <span aria-live="polite" aria-atomic="true">
          {seconds}s
        </span>
      </div>
      <div className="wui-timer-track">
        <div className="wui-timer-fill" style={{ width: `${fraction * 100}%` }} />
      </div>
    </div>
  );
}
