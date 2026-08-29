// IntroStage.tsx
// Entry point. Deliberately says almost nothing about the twist — the game
// communicates its thesis through play, not exposition (game design §2).

import { useState } from 'react';
import { MUSIC_CREDITS } from '../../content/music.ts';
import { availableDifficulties } from '../difficulty.ts';
import { seedFromLocation } from '../generator/seededRandom.ts';
import { useGameStore } from '../state/gameStore.ts';

/** Tiers 2 and 3 from game design §3, named so the shape of the game is clear. */
const FUTURE_TIERS = [
  { name: 'TIER 2 · OPERATION SHIFT', blurb: 'The controls stop working the way they look.' },
  { name: 'TIER 3 · GESTURE SHIFT', blurb: 'Clicking, dragging and hovering swap places.' },
];

export function IntroStage() {
  const beginRun = useGameStore((s) => s.beginRun);
  const progress = useGameStore((s) => s.progress);
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const setMuted = useGameStore((s) => s.setMuted);
  const [urlSeed] = useState(seedFromLocation);
  const [showCredits, setShowCredits] = useState(false);

  return (
    <main className="wui-screen wui-intro">
      <h1 className="wui-title">
        Wrong<span className="wui-title-ui">UI</span>
        <span className="wui-title-flip">N</span>verse
      </h1>
      <p className="wui-tagline">Everything works as unintended.</p>
      <p className="wui-release">1.0 · TIER 1 — SEMANTIC SHIFT</p>

      <p className="wui-lede">
        You operate a Reality Calibration Terminal. Nearby universes have overlapped, and interface
        conventions were among the things that shifted.
      </p>

      {/* A plain row of named levels rather than a grid of description cards:
          the blurb for the selected one is enough, and three boxes of prose
          crowded the page. */}
      <section className="wui-levels" aria-label="Difficulty level">
        <p className="wui-levels-label">SELECT LEVEL</p>
        <div className="wui-level-row">
          {availableDifficulties().map((level) => (
            <button
              key={level.id}
              type="button"
              className={level.id === difficulty.id ? 'wui-level is-active' : 'wui-level'}
              aria-pressed={level.id === difficulty.id}
              onClick={() => setDifficulty(level.id)}
            >
              <span className="wui-level-count">{level.mappingCount}</span>
              <span className="wui-level-name">{level.label}</span>
            </button>
          ))}
        </div>
        <p className="wui-level-blurb">{difficulty.blurb}</p>
      </section>

      <div className="wui-actions wui-actions-centred">
        {/* `?seed=…` reproduces a specific universe exactly (technical §9). */}
        <button type="button" className="wui-start" onClick={() => beginRun(urlSeed ?? undefined)}>
          {progress.tutorialCompleted ? 'Contact a new universe' : 'Begin calibration'}
        </button>
      </div>

      <section className="wui-future" aria-label="Coming soon">
        {FUTURE_TIERS.map((tier) => (
          <p key={tier.name} className="wui-future-item">
            <span className="wui-future-name">{tier.name}</span>
            <span className="wui-future-blurb">{tier.blurb}</span>
            <span className="wui-future-tag">COMING SOON</span>
          </p>
        ))}
      </section>

      <p className="wui-meta">
        {progress.universesStabilized > 0 && `${progress.universesStabilized} STABILIZED · `}
        {urlSeed && `SEED ${urlSeed} · `}
        <button type="button" className="wui-link" onClick={() => setMuted(!progress.audioMuted)}>
          {progress.audioMuted ? 'SOUND OFF' : 'SOUND ON'}
        </button>
        {' · '}
        <button type="button" className="wui-link" onClick={() => setShowCredits((v) => !v)}>
          {showCredits ? 'HIDE CREDITS' : 'CREDITS'}
        </button>
      </p>

      {/* CC BY 4.0 requires attribution wherever the work is used, so this
          lives in the game and not only in the repository. */}
      {showCredits && (
        <section className="wui-credits">
          <h2>MUSIC</h2>
          <ul>
            {MUSIC_CREDITS.map((track) => (
              <li key={track.slug}>
                “{track.title}” {track.artist} (
                <a href={track.sourceUrl} target="_blank" rel="noreferrer noopener">
                  incompetech.com
                </a>
                ) — licensed under Creative Commons:{' '}
                <a href={track.licenceUrl} target="_blank" rel="noreferrer noopener">
                  By Attribution 4.0
                </a>
              </li>
            ))}
          </ul>
          <h2>TYPE</h2>
          <ul>
            <li>Press Start 2P and Silkscreen, SIL Open Font License 1.1.</li>
          </ul>
        </section>
      )}
    </main>
  );
}
