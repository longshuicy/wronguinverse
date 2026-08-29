# WrongUIᴎverse

> **Display title:** **WrongUIᴎverse** · **ASCII / technical name:** `wronguinverse`

A frontend-only browser game in which visual UI widgets and semantic input
domains are independent systems, randomly paired at runtime. See
[`docs/`](docs) for the full design:

- [Game design](docs/WrongUInverse-game-design.md)
- [Technical design](docs/WrongUInverse-technical-design.md)
- [Art & audio guide](docs/WrongUInverse-art-audio-guide.md)

**Play it:** <https://longshuicy.github.io/wronguinverse/>

**Status: Milestone 3 — full V0 vocabulary.** The game is playable end to end.

What exists:

- The full run loop: calibration → shift → timed exploration → compound
  challenge → result, with retry-same-reality and escape-to-another-universe.
- The complete V0 vocabulary: 8 widgets (slider, checkbox, radio, dropdown,
  number, text, date, colour) against 7 semantics (boolean, choice, quantity,
  number, text, date, colour), paired by a data-driven compatibility table.
  Roughly 2,700 distinct universe shapes at the opening tier.
- Seeded generation — a seed reproduces the mapping, labels and targets exactly.
- Progressive hints (nudge → category → reveal), a field-notes panel that
  records observed values but never semantic labels, and a result screen that
  diagnoses how you argued with the interface.
- The token palette from the art guide, with per-stage treatment and
  seed-derived universe palette variants.

Still to come (Milestone 4): the pixel-art terminal shell over NES.css, the
Zorblet mascot, music and SFX. Art assets are produced separately; anything
missing from `public/` degrades to a CSS fallback rather than blocking play.

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
  audio/         # audio manager (Howler) — Milestone 4
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
  `main`: format check, lint, typecheck, test, build.
- [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) — on push to
  `main`: builds and deploys `dist/` to GitHub Pages.

To enable Pages deployment, set the repository's **Settings → Pages → Source**
to **GitHub Actions**.
