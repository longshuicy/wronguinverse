// ChallengeCard.tsx
// The compound objective. Each line locks with a confirmation when its widget
// lands on target — on harder tiers this lock is the ONLY feedback the player
// gets. See docs/WrongUInverse-game-design.md §10.

import type { Requirement, WidgetType } from '../game/state/types.ts';

interface ChallengeCardProps {
  title: string;
  requirements: Requirement[];
  lockedWidgets: WidgetType[];
}

export function ChallengeCard({ title, requirements, lockedWidgets }: ChallengeCardProps) {
  const done = requirements.filter((r) => lockedWidgets.includes(r.widget)).length;

  return (
    <section className="wui-challenge-card">
      <header className="wui-challenge-head">
        <h2>{title}</h2>
        <span className="wui-challenge-count">
          {done}/{requirements.length}
        </span>
      </header>
      <ul className="wui-challenge-list">
        {requirements.map((requirement) => {
          const locked = lockedWidgets.includes(requirement.widget);
          return (
            <li
              key={requirement.label}
              className={locked ? 'wui-requirement wui-requirement-locked' : 'wui-requirement'}
            >
              <span className="wui-requirement-label">{requirement.label}</span>
              <span className="wui-requirement-target">{requirement.targetDisplay}</span>
              {/* Not colour alone: the tick carries the same meaning for
                  players who cannot distinguish the green. */}
              <span className="wui-requirement-state">{locked ? '✓ LOCKED' : ''}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
