// IntroStage.tsx
// Entry point. Deliberately says almost nothing about the twist — the game
// communicates its thesis through play, not exposition (game design §2).

import { useState } from 'react';
import { MUSIC_CREDITS } from '../../content/music.ts';
import { availableDifficulties } from '../difficulty.ts';
import { seedFromLocation } from '../generator/seededRandom.ts';
import { useGameStore } from '../state/gameStore.ts';

export function IntroStage() {
  const beginRun = useGameStore((s) => s.beginRun);
  const progress = useGameStore((s) => s.progress);
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const setMuted = useGameStore((s) => s.setMuted);
  const [urlSeed] = useState(seedFromLocation);
  const [showCredits, setShowCredits] = useState(false);

  const tiers = availableDifficulties();

  return (
    <main className="wui-screen wui-intro">
      <h1 className="wui-title">
        Wrong<span className="wui-title-ui">UI</span>
        <span className="wui-title-flip">N</span>verse
      </h1>
      <p className="wui-tagline">Everything works as unintended.</p>

      <p className="wui-lede">
        You operate a Reality Calibration Terminal. Nearby universes have overlapped, and interface
        conventions were among the things that shifted.
      </p>

      {/* The tier ladder was implemented but never reachable; every run used
          the opening tier. It also selects the music. */}
      <section className="wui-tiers" aria-label="Difficulty">
        {tiers.map((tier) => (
          <button
            key={tier.id}
            type="button"
            className={tier.id === difficulty.id ? 'wui-tier is-active' : 'wui-tier'}
            aria-pressed={tier.id === difficulty.id}
            onClick={() => setDifficulty(tier.id)}
          >
            <span className="wui-tier-name">{tier.label}</span>
            <span className="wui-tier-detail">
              {tier.mappingCount} MAPPINGS · {tier.explorationSeconds}s
            </span>
          </button>
        ))}
      </section>

      <div className="wui-actions">
        {/* `?seed=…` reproduces a specific universe exactly (technical §9). */}
        <button
          type="button"
          className="wui-primary"
          onClick={() => beginRun(urlSeed ?? undefined)}
        >
          {progress.tutorialCompleted ? 'Contact a new universe' : 'Begin calibration'}
        </button>
        <button
          type="button"
          className="wui-ghost"
          aria-pressed={progress.audioMuted}
          onClick={() => setMuted(!progress.audioMuted)}
        >
          {progress.audioMuted ? 'Sound off' : 'Sound on'}
        </button>
      </div>

      <p className="wui-meta">
        {progress.universesStabilized > 0 && `${progress.universesStabilized} STABILIZED · `}
        {urlSeed && `SEED ${urlSeed} · `}
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
