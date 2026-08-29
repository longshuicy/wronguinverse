# WrongUIᴎverse --- Technical Design Document

> **Display title:** **WrongUIᴎverse**  
> **ASCII / technical name:** `wronguinverse`  
> The title intentionally combines **Wrong + UI + inverse + universe**. The reversed **ᴎ** should be treated as a visual branding element; use the ASCII name for repository names, URLs, package identifiers, and other tooling-sensitive contexts.

## 1. Technical Goal

Build a frontend-only browser game in which visual UI widgets and
semantic input domains are independent systems that can be randomly
paired at runtime.

V0 implements Tier 1 only:

**Visual Widget → Random Compatible Semantic Domain**

The architecture must make Tier 2 and Tier 3 possible later without
rewriting Tier 1.

## 2. Suggested Stack

Keep dependencies light.

Recommended:

- TypeScript
- React
- Vite
- CSS / CSS Modules or a small styling layer
- Zustand or React context/reducer for game state
- Web Audio API or Howler.js for minimal sound
- localStorage for settings/high scores/discovered stats
- Vitest for generator/domain tests
- Playwright optional for interaction tests

No backend. No database. No authentication. No network dependency during
gameplay.

The built site should deploy cleanly to GitHub Pages or any static host.

## 3. Core Architectural Principle

Do NOT implement pair-specific conditions such as:

```ts
if (widget === "slider" && semantic === "choice") { ... }
```

Separate:

1.  **Domain** --- what information exists.
2.  **Widget Adapter** --- how a visual widget represents a generic
    domain.
3.  **Mapping Generator** --- which compatible widget/domain pairs are
    selected.
4.  **Round State** --- current generated mapping and targets.
5.  **Stage Controller** --- Normal → Explore → Challenge.

A widget should operate on generic normalized values wherever possible.

## 4. Core Types

Suggested conceptual types:

```ts
type WidgetType =
  'slider' | 'checkbox' | 'radio' | 'dropdown' | 'number' | 'text' | 'date' | 'color';

type SemanticType = 'boolean' | 'choice' | 'quantity' | 'number' | 'text' | 'date' | 'color';

type Compatibility = 'yes' | 'maybe' | 'no' | 'normal';

interface SemanticDomain<T = unknown> {
  type: SemanticType;
  target: T;
  values?: T[];
  min?: number;
  max?: number;
  step?: number;
  display?: (value: T) => string;
  normalize: (value: T) => number; // normally 0..1
  denormalize: (value: number) => T;
  equals: (a: T, b: T) => boolean;
}

interface Mapping {
  widget: WidgetType;
  semantic: SemanticType;
  domain: SemanticDomain;
}

interface RunConfig {
  seed: string;
  mappings: Mapping[];
  stage: 'normal' | 'explore' | 'challenge';
}
```

Exact implementation may differ, but preserve this separation.

## 5. Normalized Value Layer

Use a normalized internal representation whenever practical.

Many semantic domains can map to `[0, 1]`.

Examples:

- Quantity 0--100 → 0.00--1.00
- Date Jan 1--Dec 31 → position in date range
- Choice of 5 values → indices 0, .25, .5, .75, 1
- Color → one or more normalized channels
- Boolean → 0 / 1

This allows widgets to render semantics generically.

Example:

A slider does not need special knowledge of dates.

It receives:

- normalized current value
- semantic display formatter
- setter

Moving to 0.75 might resolve to `2097-09-18`.

## 6. Domain Generators

Each semantic type owns a generator.

### BooleanDomain

Generate labels from a finite flavor bank:

- YES / NO
- OPEN / CLOSED
- STABLE / UNSTABLE
- ACTIVE / DORMANT

Underlying value remains boolean.

### ChoiceDomain

Generate 3--6 unique choices from finite procedural word banks.

Example word construction:

prefix: - Zo - Mi - Qua - Vex - Plu - No - Fi

middle: - rb - nk - zz - lor - mi - xa

suffix: - et - on - ip - ix - ul - a

This can create many labels without new assets.

### QuantityDomain

Generate:

- min
- max
- step
- target

Prefer readable ranges.

Examples:

- 0--10
- 0--20
- 0--100
- -10--10

### NumberDomain

Generate exact integer targets initially.

Decimals can come later.

### TextDomain

Generate short strings from the same fictional vocabulary system.

Avoid long typing tasks.

### DateDomain

Generate safe dates within a configured range.

Avoid locale ambiguity in goals: display month names,
e.g. `AUG 29, 2097`.

### ColorDomain

Generate from a finite palette.

Each color has:

- hex
- display name
- fictional alias

Example:

```ts
{
  hex: "#...",
  name: "violet",
  alias: "Glimmer Violet"
}
```

The player should never need exact RGB knowledge.

## 7. Compatibility Configuration

Store compatibility as data.

Example:

```ts
const compatibility = {
  slider: {
    boolean: 'yes',
    choice: 'yes',
    quantity: 'normal',
    number: 'yes',
    text: 'no',
    date: 'yes',
    color: 'yes',
  },
  // ...
};
```

Generation logic reads this table.

V0 Shift mode accepts only `"yes"`.

Stage 1 uses `"normal"`.

Future experimental builds can enable `"maybe"`.

## 8. Mapping Generation Algorithm

Input:

- desired mapping count, initially 4
- random seed
- allowed widgets
- allowed semantics
- compatibility table

Algorithm:

1.  Shuffle widget candidates using seeded RNG.
2.  Shuffle semantic candidates using seeded RNG.
3.  Search for a valid one-to-one assignment.
4.  Pair only cells marked YES.
5.  Reject conventional semantic matches.
6.  Ensure all selected semantics are unique.
7.  If assignment fails, retry/backtrack rather than weakening
    compatibility.
8.  Persist mapping for entire run.

Use a small bipartite matching/backtracking algorithm rather than
repeated blind random retries. With V0 sizes, this is trivial and
guarantees a valid mapping when one exists.

## 9. Seeded Randomness

Use a seeded PRNG.

Benefits:

- reproduce bugs,
- share interesting universes,
- deterministic tests,
- daily challenge later.

Example run identifier:

`REALITY-Q7M2`

The same seed should reproduce:

- mapping,
- generated labels,
- target values,
- challenge sequence.

## 10. Widget Adapter Contract

Each widget component should conform to a common contract.

Conceptually:

```ts
interface WidgetAdapterProps {
  domain: SemanticDomain;
  value: unknown;
  onChange: (value: unknown) => void;
  mode: 'normal' | 'explore' | 'challenge';
}
```

Each adapter answers:

> How can this visual widget expose this domain?

Examples:

### Slider adapter

Supports:

- boolean: two snap positions
- choice: N snap positions
- quantity: continuous/ranged
- number: numeric range
- date: normalized date range
- color: palette/hue positions

### Checkbox adapter

Supports:

- boolean: one checkbox
- choice: mutually interpreted checkbox set
- quantity: checked count
- number: checked count / encoded count

### Dropdown adapter

Supports nearly any discrete representation by converting domain values
into options.

### Text adapter

Can parse:

- boolean labels
- choice labels
- quantity/number
- dates
- color names

Keep parsing forgiving.

## 11. Important V0 Design Constraint

Do not force every widget to support every semantic.

A clean compatibility boundary is better than clever but unreadable
behavior.

The renderer should expose:

```ts
supports(widget, semantic): boolean
```

The randomizer must never generate unsupported pairs.

## 12. Stage State Machine

Suggested state:

```text
INTRO
  ↓
NORMAL
  ↓
SHIFT_TRANSITION
  ↓
EXPLORE
  ↓
CHALLENGE
  ↓
RESULT
  ↓
NEXT_REALITY
```

### NORMAL

- 3--5 micro tasks
- conventional mappings
- no timer pressure or generous timer

### SHIFT_TRANSITION

- 1--2 second visual glitch
- regenerate semantic mapping
- preserve selected widgets

### EXPLORE

- 30--45 second timer
- all selected widgets available
- current interpreted value visible
- no correctness requirement
- log interactions

### CHALLENGE

- 2--4 generated requirements
- mappings unchanged
- interpreted feedback reduced
- completion requires all targets satisfied

### RESULT

Show:

- completion time
- mappings discovered
- first-attempt accuracy
- seed
- replay / next universe

## 13. Exploration Observation System

Do not directly reveal:

`Slider = Choice`

Instead show evidence.

Example:

Player moves slider:

```text
CURRENT OUTPUT
ZORBL
```

moves again:

```text
CURRENT OUTPUT
MIP
```

Optional notebook:

```text
SLIDER OBSERVATIONS
ZORBL → MIP → QUONK
```

The notebook records values, not semantic labels.

This preserves deduction.

## 14. Challenge Generator

Challenge requirements come from the semantic domains already assigned
in the current run.

Example mappings:

```text
slider → choice
date → quantity
dropdown → color
color → date
```

Generated challenge:

```text
COMPANION: QUONK
REACTOR: 73
SIGNAL: GLIMMER VIOLET
ARRIVAL: AUG 29, 2097
```

The player must use all four widgets.

Do not generate a challenge value that was impossible to discover or
input.

## 15. Difficulty Within Tier 1

Difficulty can scale without Tier 2.

### Easy

- 3 mappings
- 45 sec exploration
- one-part challenge
- interpreted output remains visible

### Medium

- 4 mappings
- 35 sec exploration
- 2--3 challenge requirements
- output visible only during exploration

### Hard

- 5--6 mappings
- 25 sec exploration
- 3--5 requirements
- fewer notebook observations
- tighter challenge timer

## 16. Persistence

Use localStorage only for:

- audio settings
- best scores
- tutorial completed
- total universes stabilized
- optional achievement/discovery stats

Do NOT persist a mapping between runs. A new universe should feel
genuinely shifted.

## 17. Accessibility / Usability

The game intentionally breaks semantic expectations, but it should not
accidentally become inaccessible.

Important distinction:

**Game fiction may mismatch meaning; browser accessibility should still
identify controls reliably.**

Recommendations:

- Keyboard-operable controls.
- Visible focus states.
- Do not rely solely on color for challenge text.
- Provide reduced-motion option for glitch effects.
- Provide mute/music/SFX controls.
- Use ARIA carefully; do not intentionally lie to assistive technology
  merely because the visual game lies.
- For V0, consider presenting the game as experimental and prioritize
  mouse + keyboard desktop play.

## 18. Testing

### Unit tests

Test:

- every YES compatibility pair has a renderer,
- every NORMAL pair works,
- generator never returns NO/NORMAL in Shift mode,
- one-to-one assignments contain no duplicates,
- seeded generation is deterministic,
- semantic target is always representable.

### Property tests / randomized tests

Generate thousands of runs and assert:

- all mappings valid,
- all targets reachable,
- no duplicate mappings,
- challenge uses only current run domains.

### Playtesting

The critical tests are human:

- Does exploration create inference rather than brute-force confusion?
- Are outputs readable?
- Can players remember 3--4 mappings?
- Does the compound challenge feel satisfying?
- How long before repetition appears?

## 19. Suggested Repository Structure

```text
src/
  game/
    generator/
      mappingGenerator.ts
      seededRandom.ts
      compatibility.ts
    domains/
      boolean.ts
      choice.ts
      quantity.ts
      number.ts
      text.ts
      date.ts
      color.ts
    stages/
      NormalStage.tsx
      ExploreStage.tsx
      ChallengeStage.tsx
      ResultStage.tsx
    state/
      gameStore.ts
      types.ts

  widgets/
    SliderWidget.tsx
    CheckboxWidget.tsx
    RadioWidget.tsx
    DropdownWidget.tsx
    NumberWidget.tsx
    TextWidget.tsx
    DateWidget.tsx
    ColorWidget.tsx

  content/
    words.ts
    colors.ts
    flavorText.ts

  audio/
    audioManager.ts

  components/
    Terminal.tsx
    Timer.tsx
    ObservationLog.tsx
    ChallengeCard.tsx

  styles/
```

## 20. Build Order for Claude

### Milestone 1 --- Mechanics sandbox

Implement:

- semantic domain interfaces,
- 4 widgets: slider, checkbox, dropdown, date,
- 4 semantics: boolean, choice, quantity, date,
- compatibility table,
- seeded random valid mapping,
- a debug screen showing interpreted values.

No art.

### Milestone 2 --- Three-stage loop

Implement:

- Normal
- Shift transition
- timed Explore
- Challenge
- Result

### Milestone 3 --- Full V0 vocabulary

Add:

- radio
- number
- text
- color
- remaining semantics
- tests for all YES mappings

### Milestone 4 --- Presentation

Add:

- pixel-art terminal shell
- parallel-universe flavor text
- minimal animation
- music and SFX
- localStorage settings

### Milestone 5 --- Playtest pass

Do not add Tier 2.

Instead:

- remove confusing mappings,
- adjust exploration timer,
- adjust challenge size,
- improve feedback,
- tune generator weights.

Tier 2 begins only after Tier 1 produces repeatable fun.
