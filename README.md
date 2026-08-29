# WrongUIᴎverse

> **Display title:** **WrongUIᴎverse** · **ASCII / technical name:** `wronguinverse`

A frontend-only browser game in which visual UI widgets and semantic input
domains are independent systems, randomly paired at runtime. See
[`docs/`](docs) for the full design:

- [Game design](docs/WrongUInverse-game-design.md)
- [Technical design](docs/WrongUInverse-technical-design.md)
- [Art & audio guide](docs/WrongUInverse-art-audio-guide.md)

**Play it:** <https://longshuicy.github.io/wronguinverse/>

**Status: playable end to end**, with four difficulty tiers, music and art.

What exists:

- The full run loop: calibration → shift → timed exploration → compound
  challenge → result, with retry-same-reality and escape-to-another-universe.
- The complete V0 vocabulary: 8 widgets (slider, checkbox, radio, dropdown,
  number, text, date, colour) against 7 semantics (boolean, choice, quantity,
  number, text, date, colour), paired by a data-driven compatibility table.
  Roughly 2,700 distinct universe shapes at the opening tier.
- Seeded generation — a seed reproduces the mapping, labels and targets exactly.
  Add `?seed=REALITY-XXXX` to replay a specific universe.
- Four difficulty tiers, each scoring itself with its own music track.
- Progressive hints (nudge → category → reveal), a field-notes panel that
  records observed values but never semantic labels, and a result screen that
  diagnoses how you argued with the interface.
- Pixel-art presentation: self-hosted pixel type, notched 8-bit frames, the
  Zorblet mascot reacting to play, and per-universe creatures and anomalies.

Still to come: sound effects, and the remaining Tier 1 polish in the design
docs (cursed universes, Daily Reality, the endless distance run). Art assets
are produced separately; anything missing from `public/` degrades to a CSS
fallback rather than blocking play.

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
