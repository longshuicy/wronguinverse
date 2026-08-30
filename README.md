# WrongUIᴎverse

> **Display title:** **WrongUIᴎverse** · **ASCII / technical name:** `wronguinverse`

A frontend-only browser game in which visual UI widgets and semantic input
domains are independent systems, randomly paired at runtime. See
[`docs/`](docs) for the full design:

- [Game design](docs/WrongUInverse-game-design.md)
- [Technical design](docs/WrongUInverse-technical-design.md)
- [Art & audio guide](docs/WrongUInverse-art-audio-guide.md)

**Play it:** <https://longshuicy.github.io/wronguinverse/>

**WrongUIᴎverse 1.0.0-beta3: all three tiers playable.**
Semantic Shift, Operation Shift and Gesture Shift, each at three levels,
end to end with music and art.

> **Two axes, not one.** A _tier_ is which rules are broken: Semantic Shift
> (wrong meanings), Operation Shift (wrong meanings and wrong gestures) and
> Gesture Shift (wrong meanings and a pointer that is not yours). A _level_ is
> how much of the bench a run reaches: four, six or eight controls. They are
> INDEPENDENT, so there are nine runs rather than three, and the landing page
> calls them WHAT DRIFTED and HOW DEEP because "tier" and "level" read as
> synonyms. See [game design §3](docs/WrongUInverse-game-design.md).

What exists:

- The full run loop: calibration → shift → timed exploration → compound
  challenge → result, with retry-same-reality and escape-to-another-universe.
- The full V0 vocabulary: 8 widgets (slider, checkbox, radio, dropdown,
  number, text, date, colour) against 8 semantics (boolean, choice, quantity,
  number, text, date, time, colour), paired by a data-driven compatibility
  table. Thousands of distinct universe shapes.
- Seeded generation — a seed reproduces the mapping, labels and targets exactly.
  Add `?seed=REALITY-XXXX` to replay a specific universe.
- Three levels of 4, 6 and 8 mappings. Music follows the TIER, not the level:
  the tier is what a run is, the level is only how much of it there is.
  Eight is the ceiling: a run gives every widget a distinct semantic.
- Exploration is untimed. Effort is measured by counting interactions, which
  is what the result screen reports.
- Progressive hints (nudge → category → reveal), a field-notes panel that
  records observed values but never semantic labels, and a result screen that
  diagnoses how you argued with the interface.
- Tier 2 gives each control a gesture it has no business wanting: a slider you
  click, a checkbox you drag, a dropdown you scroll.
- Tier 3 imposes one page-wide pointer LAW per run, drawn from five: the cursor
  commits on dwell, once is not enough, presses land off-target, the pointer
  runs backwards, or a hurried hand is ignored. The keyboard is never governed,
  and the law is printed in the chrome for free.
- Seven Interface Brain Types, collected as a cast across runs. One of them can
  only be earned by walking out on a dimension.
- Pixel-art presentation: self-hosted pixel type, notched 8-bit frames, the
  Zorblet mascot reacting to play, and per-universe creatures and anomalies.

Still to come: the remaining polish in the design docs (cursed universes,
Daily Reality, the endless distance run), more widgets, and richer Tier 2
shifts. Art assets are produced separately; anything missing from `public/`
degrades to a CSS fallback rather than blocking play.

## Stack

- TypeScript
- React + Vite
- Zustand for game state
- Howler.js for audio
- localStorage for settings/high scores (no backend, no network at runtime)
- Vitest for unit/generator tests
- oxlint for linting, Prettier for formatting

Playwright (interaction tests) is optional per the technical design and not
wired up yet.

## Getting started

```bash
npm install
npm run dev
```

## Scripts

| Script                 | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start the Vite dev server               |
| `npm run build`        | Typecheck + production build to `dist/` |
| `npm run preview`      | Preview the production build locally    |
| `npm run lint`         | Run oxlint                              |
| `npm run format`       | Format the repo with Prettier           |
| `npm run format:check` | Check formatting without writing        |
| `npm run typecheck`    | `tsc` project-references check, no emit |
| `npm run test`         | Run the Vitest suite once               |
| `npm run test:watch`   | Run Vitest in watch mode                |
| `npm run art:clean`    | Process raw art into shippable sprites  |
| `npm run audio:clean`  | Transcode source music for the web      |

## Project structure

```text
src/
  game/
    generator/   # mapping generator, seeded RNG, compatibility table
    domains/     # boolean, choice, quantity, number, text, date, color
    stages/      # Normal / Explore / Challenge / Result stage components
    state/       # game store + shared types
  widgets/       # slider, checkbox, radio, dropdown, number, text, date, color
  content/       # word banks, colour palette, flavor text, asset manifest
  audio/         # audio manager (Howler)
  components/    # shell, bench, timer, notebook, challenge card
  styles/        # universe-variables / nes-overrides / wronguinverse-theme
  test/          # Vitest setup
```

This mirrors the structure in the
[technical design doc](docs/WrongUInverse-technical-design.md#20-suggested-repository-structure).

Two ideas carry most of the architecture:

- **The normalized layer.** Every domain projects onto `[0, 1]`, so a widget
  drives a domain without knowing what it means. A date picker mapped to a
  boolean simply reports a position and snaps to two.
- **Two independent gates.** `generator/compatibility.ts` decides whether a
  pairing is a good idea; `widgets/registry.ts` decides whether it is
  renderable. A mapping needs both, so an unbuildable pairing can never reach a
  player.

Colours come from role tokens in `styles/universe-variables.css` — components
never write a literal hex, which is what makes stage treatments and per-universe
palette variants cost nothing.

## CI/CD

- [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — on every push/PR to
  `main`: format check, lint, typecheck, test, asset budgets, build.
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — on push to
  `main`: builds and deploys `dist/` to GitHub Pages.

To enable Pages deployment, set the repository's **Settings → Pages → Source**
to **GitHub Actions**.

## Credits

**Music** — all three tracks by Kevin MacLeod (incompetech.com), licensed under
[Creative Commons: By Attribution 4.0](http://creativecommons.org/licenses/by/4.0/):

- "Airship Serenity" Kevin MacLeod (incompetech.com)
- "Video Dungeon Boss" Kevin MacLeod (incompetech.com)
- "Club Diver" Kevin MacLeod (incompetech.com)

The same credits are shown in-game on the intro screen, which is what the
licence actually requires.

**Sound effects** — procedurally synthesized for this game; no third-party
samples.

**Art** — creatures, props and the shift clip generated with
[Midjourney](https://www.midjourney.com), then cleaned to a pixel grid by the
scripts in `scripts/`. Prompts are recorded per asset in the
[art guide](docs/WrongUInverse-art-audio-guide.md).

**Type** — [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)
and [Silkscreen](https://fonts.google.com/specimen/Silkscreen), both under the
SIL Open Font License 1.1 and self-hosted.

## Working with assets

Raw art and music are **untracked**; only the processed versions ship.

```bash
npm run art:clean      # art-source/ -> public/  (sprites, ~100x smaller)
npm run audio:clean    # audio-source/ -> public/sound/music  (96kbps AAC)
```

Both have a `:check` counterpart that runs in CI and fails if anything
oversized reaches `public/`. See the art guide
[§5](docs/WrongUInverse-art-audio-guide.md) and §11.

## Licence

The code is [MIT licensed](LICENSE). The third-party music and fonts keep
their own licences, listed under Credits above.
