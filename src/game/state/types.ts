// types.ts
// Core vocabulary shared by the generator, domains, widget adapters and stages.
// See docs/WrongUInverse-technical-design.md §4.

/**
 * Every visual control the game can put on screen.
 *
 * The full union is declared up front so Tier 2/3 and later widgets slot in
 * without a rewrite, but only the widgets present in the widget registry are
 * actually renderable — see `src/widgets/registry.ts`.
 */
export type WidgetType =
  | 'slider'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'number'
  | 'text'
  | 'date'
  | 'color'
  | 'button'
  | 'time'
  | 'calculator'
  | 'tabs'
  | 'progress'
  | 'fileUpload';

/** Every kind of information a widget can be made to represent. */
export type SemanticType =
  | 'action'
  | 'boolean'
  | 'choice'
  | 'quantity'
  | 'number'
  | 'text'
  | 'date'
  | 'time'
  | 'color'
  | 'arithmetic'
  | 'navigation'
  | 'progress'
  | 'dataFile';

/**
 * How well a widget can stand in for a semantic.
 *
 * - `yes`    — good random pairing; the only cell the V0 shift generator uses.
 * - `maybe`  — plausible, gated behind playtesting.
 * - `no`     — ruled out.
 * - `normal` — the conventional pairing. Used by Stage 1 calibration and
 *              deliberately excluded from shifted mappings.
 */
export type Compatibility = 'yes' | 'maybe' | 'no' | 'normal';

/**
 * A generated body of information, independent of how it is displayed.
 *
 * Domains expose a normalized `[0, 1]` projection so a widget can drive them
 * without knowing what they mean — a slider does not need to know about dates.
 */
export interface SemanticDomain<T = unknown> {
  type: SemanticType;
  /** The value the challenge will ask the player to produce. */
  target: T;
  /** Present when the domain is discrete; the full set of possible values. */
  values?: T[];
  min?: number;
  max?: number;
  step?: number;
  /** Player-facing rendering of a value, e.g. `AUG 29, 2097`. */
  display: (value: T) => string;
  /** Project a value into `[0, 1]`. */
  normalize: (value: T) => number;
  /** Recover a value from a `[0, 1]` position. */
  denormalize: (position: number) => T;
  equals: (a: T, b: T) => boolean;
}

/**
 * Domains are stored heterogeneously (a run holds a boolean domain next to a
 * date domain), so they are erased to `unknown` at the boundary. Build them
 * with `defineDomain` in `domains/defineDomain.ts` to get the cast in one place.
 */
export type AnyDomain = SemanticDomain<unknown>;

/** One widget and the semantic it means for the duration of a run. */
export interface Mapping {
  widget: WidgetType;
  semantic: SemanticType;
  domain: AnyDomain;
}

export type Stage = 'normal' | 'explore' | 'challenge';

/** The full generated ruleset for a single universe. */
export interface RunConfig {
  seed: string;
  mappings: Mapping[];
  stage: Stage;
}

/**
 * The contract every widget adapter implements.
 *
 * `value` is a domain value (not a normalized number); the adapter converts via
 * `domain.normalize` / `domain.denormalize`. This keeps each adapter answering a
 * single question: how can this visual control expose an arbitrary domain?
 */
export interface WidgetAdapterProps {
  domain: AnyDomain;
  value: unknown;
  onChange: (value: unknown) => void;
  mode: Stage;
}
