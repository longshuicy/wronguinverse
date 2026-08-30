// IntroStage.tsx
// The landing page. Says almost nothing about the twist on purpose: the game
// communicates its thesis through play, not exposition (game design §2). The
// lore that used to sit here now lives in the Reality Index, one page along.

import { useState } from 'react';
import { MUSIC_CREDITS } from '../../content/music.ts';
import { TAGLINE } from '../../content/flavorText.ts';
import { availableDifficulties } from '../difficulty.ts';
import { availableTiers, UNBUILT_TIERS } from '../tier.ts';
import { seedFromLocation } from '../generator/seededRandom.ts';
import { useGameStore } from '../state/gameStore.ts';

export function IntroStage() {
  const openBriefing = useGameStore((s) => s.openBriefing);
  const progress = useGameStore((s) => s.progress);
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const tier = useGameStore((s) => s.tier);
  const setTier = useGameStore((s) => s.setTier);
  const setMuted = useGameStore((s) => s.setMuted);
  const [urlSeed] = useState(seedFromLocation);
  const [showCredits, setShowCredits] = useState(false);

  return (
    <main className="wui-screen wui-intro">
      <h1 className="wui-title">
        Wrong<span className="wui-title-ui">UI</span>
        <span className="wui-title-flip">N</span>verse
      </h1>
      <p className="wui-tagline">{TAGLINE}</p>

      {/* Built tiers are buttons now that there is a real choice to make;
          the unbuilt one stays a plain row, because anything that looks
          pressable is a promise the page cannot keep. */}
      <ul className="wui-tiers" aria-label="Tier">
        {availableTiers().map((option) => {
          const selected = option.id === tier.id;
          return (
            <li key={option.name} className={selected ? 'wui-tier is-active' : 'wui-tier'}>
              <button
                type="button"
                className="wui-tier-button"
                aria-pressed={selected}
                onClick={() => setTier(option.id)}
              >
                <span className="wui-tier-caret" aria-hidden="true">
                  {selected ? '▶' : ''}
                </span>
                <span className="wui-tier-name">
                  TIER {option.id} · {option.name}
                </span>
                <span className="wui-tier-blurb">{option.blurb}</span>
              </button>
            </li>
          );
        })}
        {UNBUILT_TIERS.map((option, i) => (
          <li key={option.name} className="wui-tier">
            <span className="wui-tier-caret" aria-hidden="true" />
            <span className="wui-tier-name">
              TIER {availableTiers().length + i + 1} · {option.name}
            </span>
            <span className="wui-tier-blurb">{option.blurb}</span>
            <span className="wui-tier-tag">SOON</span>
          </li>
        ))}
      </ul>

      <section className="wui-levels" aria-label="Difficulty level">
        <p className="wui-picker-label">SELECT LEVEL</p>
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
        {/* The gesture shift needs a wheel and a press-and-hold, neither of
            which a touch screen offers. Said here rather than in the tier row,
            which has no width left for it. */}
        <p className="wui-level-blurb">
          {difficulty.blurb}
          {tier.operationShift && ' Bring a mouse.'}
        </p>
      </section>

      <div className="wui-actions wui-actions-centred">
        {/* `?seed=…` reproduces a specific universe exactly (technical §9). */}
        {/* Every run opens on the Reality Index rather than dropping straight
            into calibration. It carries a skip, so this costs a returning
            player one click and gives a new one the reason any of it makes
            sense. */}
        <button type="button" className="wui-start" onClick={openBriefing}>
          {progress.tutorialCompleted ? 'Contact a new universe' : 'Begin'}
        </button>
      </div>

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
                ), licensed under Creative Commons:{' '}
                <a href={track.licenceUrl} target="_blank" rel="noreferrer noopener">
                  By Attribution 4.0
                </a>
              </li>
            ))}
          </ul>
          <h2>ART</h2>
          <ul>
            <li>
              Creatures, props and the shift clip generated with Midjourney, then cleaned to a pixel
              grid by the scripts in this repository.
            </li>
          </ul>
          <h2>TYPE</h2>
          <ul>
            <li>Press Start 2P and Silkscreen, SIL Open Font License 1.1.</li>
          </ul>
          <h2>CODE</h2>
          <ul>
            <li>
              MIT licensed:{' '}
              <a
                href="https://github.com/longshuicy/wronguinverse"
                target="_blank"
                rel="noreferrer noopener"
              >
                github.com/longshuicy/wronguinverse
              </a>
            </li>
          </ul>
        </section>
      )}
    </main>
  );
}
