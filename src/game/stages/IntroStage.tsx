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
//
// HOW DEEP sits above WHAT DRIFTED, in that order, because the two are not
// symmetric any more: there is no "Begin" button on this page. Depth is set
// quietly, then picking a drift row IS the button — it commits both axes and
// moves on. Setting the quiet dial first and pressing the loud choice second
// reads as one motion; the reverse order would ask the player to press
// "start" and then keep configuring.

import { useState } from 'react';
import { useRadioAxis } from '../../components/useRadioAxis.ts';
import { MUSIC_CREDITS } from '../../content/music.ts';
import { runManifest, TAGLINE } from '../../content/flavorText.ts';
import { availableDifficulties } from '../difficulty.ts';
import { availableTiers, DEFAULT_TIER } from '../tier.ts';
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

  const tiers = availableTiers();
  const levels = availableDifficulties();
  /** The full bench, so the meter's empty pips show what is being left out. */
  const deepest = Math.max(...levels.map((level) => level.mappingCount));

  // Depth is set quietly and does not move the player on: it is the dial you
  // set before the choice that matters, not the choice itself.
  const chooseDifficulty = setDifficulty;
  // Drift is the choice that starts the run — there is no separate "Begin"
  // button any more, so picking a drift IS pressing it. Depth is read from
  // the store rather than closed over, so a depth change just made in the
  // same render is not lost to a stale closure.
  const chooseTier = (id: (typeof tiers)[number]['id']) => {
    setTier(id);
    openBriefing();
  };

  // Both axes are one-of-N choices, so both behave like radio groups: one tab
  // stop, arrows to move, selection following focus.
  const depthKeys = useRadioAxis(
    levels.map((level) => level.id),
    difficulty.id,
    chooseDifficulty,
  );
  const driftKeys = useRadioAxis(
    tiers.map((option) => option.id),
    tier.id,
    chooseTier,
  );

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
        {/* Axis one, set first and quietly: a QUANTITY. No frames and no
            panels, and no navigation either — this is the dial you set
            before making the choice that starts the run below it.

            The amount is drawn ONCE, as a gauge beside the label, rather than
            once per option. Three sets of pips plus three full names could not
            share a line at a readable size, and the fix is not to shrink the
            names or wrap them: it is to notice that a dial has one needle. The
            meter fills to the selected level and the names are just the
            positions it can take. */}
        <section className="wui-axis wui-axis-depth">
          <p className="wui-axis-label" id="wui-axis-depth-label">
            HOW DEEP
            <span className="wui-depth-meter" aria-hidden="true">
              {Array.from({ length: deepest }, (_, i) => (
                <i key={i} className={i < difficulty.mappingCount ? 'wui-pip' : 'wui-pip is-off'} />
              ))}
            </span>
            <span className="wui-depth-count" aria-hidden="true">
              {difficulty.mappingCount} CONTROLS
            </span>
          </p>
          <div
            className="wui-depth-strip"
            role="radiogroup"
            aria-labelledby="wui-axis-depth-label"
            onKeyDown={depthKeys.onKeyDown}
          >
            {levels.map((level) => {
              const selected = level.id === difficulty.id;
              return (
                <button
                  key={level.id}
                  type="button"
                  ref={depthKeys.itemRef(level.id)}
                  className={selected ? 'wui-depth is-active' : 'wui-depth'}
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  // The count is not on screen per option any more, so it is
                  // said here instead: a screen reader gets the same "and this
                  // one is eight controls" the meter gives everyone else.
                  aria-label={`${level.label}, ${level.mappingCount} controls`}
                  onClick={() => chooseDifficulty(level.id)}
                >
                  {/* Drawn on every option, filled on the chosen one. Without
                      a marker and a resting underline these were three pieces
                      of grey text: nothing said they could be clicked, and on
                      a touch screen there is no hover to find out with. */}
                  <span
                    className={selected ? 'wui-depth-mark is-on' : 'wui-depth-mark'}
                    aria-hidden="true"
                  />
                  {level.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Axis two, set second: a KIND, and the one that starts the run.
            Stacked full-width rows, each naming a different way for the
            universe to be wrong — never a scale. There is no separate "Begin"
            button any more: picking a row here IS pressing it, `?seed=…`
            reproduces a specific universe exactly (technical §9), and every
            run still opens on the Reality Index rather than dropping straight
            into calibration — that page carries its own skip for a returning
            player. */}
        <section className="wui-axis wui-axis-drift">
          <p className="wui-axis-label" id="wui-axis-drift-label">
            WHAT DRIFTED
          </p>
          {/* Framed at rest, not only when hovered or chosen. They used to be
              transparent-bordered text, which made the page's PRIMARY choice
              the only thing on it that did not look clickable — and on a touch
              screen, where there is no hover, look is all there is. */}
          <div
            className="wui-tiers"
            role="radiogroup"
            aria-labelledby="wui-axis-drift-label"
            onKeyDown={driftKeys.onKeyDown}
          >
            {tiers.map((option) => {
              const selected = option.id === tier.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  ref={driftKeys.itemRef(option.id)}
                  className={selected ? 'wui-tier-button is-active' : 'wui-tier-button'}
                  role="radio"
                  aria-checked={selected}
                  // One tab stop for the group, then arrows within it.
                  tabIndex={selected ? 0 : -1}
                  onClick={() => chooseTier(option.id)}
                >
                  {/* Drawn either way. An empty slot on the unchosen rows is
                      what says there are three of these and one is taken. */}
                  <span className="wui-tier-caret" aria-hidden="true">
                    {selected ? '▶' : '▷'}
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
              );
            })}
          </div>
        </section>
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
            <li>Press Start 2P and JetBrains Mono, SIL Open Font License 1.1.</li>
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
