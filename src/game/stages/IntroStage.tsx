// IntroStage.tsx
// The landing page. Says almost nothing about the twist on purpose: the game
// communicates its thesis through play, not exposition (game design §2). The
// lore that used to sit here now lives in the Reality Index, one page along.
//
// The one thing it MUST get across is that a run is chosen on two independent
// axes — which agreement lapsed, and how much of the bench it reaches. That was
// failing for three reasons, all fixed here:
//
//   1. VOCABULARY. "Tier" and "level" are synonyms in game-speak, both meaning
//      "how far up", so the page read as two difficulty pickers stacked and
//      players assumed the hard run was the bottom-right diagonal. On screen
//      they are now WHAT DRIFTED and HOW DEEP; `tier` and `difficulty` remain
//      the vocabulary of the code and the design doc.
//   2. GEOMETRY. Both pickers were rows of framed buttons. A kind and a
//      quantity should not look alike, so the drift axis is stacked full-width
//      rows and the depth axis is a compact meter of pips — one control per pip.
//   3. NO PRODUCT. Nothing on the page showed the two choices COMBINING. The
//      manifest line under them is one sentence assembled from both, so
//      changing either moves only its own half of it.
//
// The music is the fourth statement of the same thing, and the only one that
// needs no reading: the tier picker changes what you hear, the level picker
// does not (see `content/music.ts`).

import { useState } from 'react';
import { MUSIC_CREDITS } from '../../content/music.ts';
import { runManifest, TAGLINE } from '../../content/flavorText.ts';
import { availableDifficulties } from '../difficulty.ts';
import { availableTiers, DEFAULT_TIER, UNBUILT_TIERS } from '../tier.ts';
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
      {/* The tagline states the premise; the manifest states the run the
          player is about to start. Together above the pickers rather than
          below them: this is the page's promise, and the pickers underneath
          are the two dials that edit it. Read top-down it now says what the
          game is, what THIS run is, and then how to change it. */}
      <p className="wui-tagline">{TAGLINE}</p>
      <p className="wui-manifest">{runManifest(tier.id, difficulty.mappingCount)}</p>

      <div className="wui-picker">
        {/* Axis one: a KIND. Stacked full-width rows, each naming a different
            way for the universe to be wrong — never a scale. */}
        <section className="wui-axis wui-axis-drift" aria-label="What drifted">
          <p className="wui-axis-label">WHAT DRIFTED</p>
          <ul className="wui-tiers">
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
                    <span className="wui-tier-name">{option.name}</span>
                    <span className="wui-tier-blurb">{option.blurb}</span>
                    {/* Order is not difficulty, but it IS a reading order, and
                        a first-time player deserves to be told where to start
                        rather than left to infer it from the list. */}
                    {!progress.tutorialCompleted && option.id === DEFAULT_TIER && (
                      <span className="wui-tier-tag">START HERE</span>
                    )}
                  </button>
                </li>
              );
            })}
            {UNBUILT_TIERS.map((option) => (
              <li key={option.name} className="wui-tier">
                <span className="wui-tier-caret" aria-hidden="true" />
                <span className="wui-tier-name">{option.name}</span>
                <span className="wui-tier-blurb">{option.blurb}</span>
                <span className="wui-tier-tag">SOON</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Axis two: a QUANTITY, drawn as one. The pips are the bench — one
            square per control — so the axis reads as an amount at a glance and
            cannot be mistaken for another list of kinds. */}
        <section className="wui-axis wui-axis-depth" aria-label="How deep">
          <p className="wui-axis-label">HOW DEEP</p>
          <div className="wui-depth-row">
            {availableDifficulties().map((level) => (
              <button
                key={level.id}
                type="button"
                className={level.id === difficulty.id ? 'wui-depth is-active' : 'wui-depth'}
                aria-pressed={level.id === difficulty.id}
                aria-label={`${level.label}, ${level.mappingCount} controls`}
                onClick={() => setDifficulty(level.id)}
              >
                <span className="wui-depth-pips" aria-hidden="true">
                  {Array.from({ length: level.mappingCount }, (_, i) => (
                    <i key={i} className="wui-pip" />
                  ))}
                </span>
                <span className="wui-depth-name">{level.label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

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

      {/* Spelled out rather than filed in the meta line as "23 STABILIZED".
          It is the only record the game keeps of a player's whole history with
          it, and abbreviating it to a token next to the mute button read as
          telemetry rather than as something they had done. */}
      {progress.universesStabilized > 0 && (
        <p className="wui-tally">
          You have successfully stabilized{' '}
          {/* The full stop lives INSIDE the emphasis: as a bare text node after
              it, it wrapped onto a line of its own whenever the count broke to
              a second line. */}
          <strong className="wui-tally-count">
            {progress.universesStabilized}{' '}
            {progress.universesStabilized === 1 ? 'universe' : 'universes'}.
          </strong>
        </p>
      )}

      <p className="wui-meta">
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
