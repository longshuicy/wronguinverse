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
 * How a control is physically worked.
 *
 * Tier 1 leaves every control on `native`. Tier 2 "Operation Shift" replaces
 * the gesture with one the control has no business wanting, which the player
 * has to discover the same way they discover a semantic. Which gestures a
 * widget may be given lives in `src/widgets/operations.ts`.
 */
export type OperationType =
  | 'native'
  /** Slider: click a detent. Dragging does nothing. */
  | 'clickStep'
  /** Dropdown, number: the wheel steps through values. */
  | 'wheelCycle'
  /** Checkbox: drag across a box rather than clicking it. */
  | 'dragToggle'
  /** Radio, colour: press and hold rather than clicking. */
  | 'holdToSelect'
  /** Text: typing only drafts; Enter commits. */
  | 'commitOnEnter'
  /** Calendar: the header arrows move the selection; the days are dead. */
  | 'stepArrows';

/** Which rules a run breaks. Tier 3 (gesture shift) is not built. */
export type TierId = 1 | 2;

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

/** One widget, what it means, and how it is worked, for one run. */
export interface Mapping {
  widget: WidgetType;
  semantic: SemanticType;
  domain: AnyDomain;
  /**
   * Required rather than optional: a Tier 1 mapping says `native` out loud.
   * Optional would let a consumer silently forget the axis exists.
   */
  operation: OperationType;
}

/**
 * How a widget should present itself. A deliberately small subset of `StageId`:
 * adapters care whether feedback is rich or reduced, not which screen is up.
 */
export type Stage = 'normal' | 'explore' | 'challenge';

/** The full generated ruleset for a single universe. */
export interface RunConfig {
  seed: string;
  mappings: Mapping[];
  stage: Stage;
  /** Which shift this universe applies. Calibration is always tier 1. */
  tier: TierId;
}

/** Screens in the run loop. See docs/WrongUInverse-technical-design.md §12. */
export type StageId =
  | 'intro'
  /** The Reality Index: the lore, read at the player's own pace. */
  | 'briefing'
  | 'normal'
  | 'shift'
  | 'explore'
  | 'challenge'
  | 'result';

/** One line of the compound objective, e.g. `COMPANION: QUONK`. */
export interface Requirement {
  /** The widget that must be driven to satisfy this line. */
  widget: WidgetType;
  /** Fictional field name shown to the player. */
  label: string;
  /** Pre-rendered target, so the card never re-derives it. */
  targetDisplay: string;
}

/** How far a hint has been unwound for one mapping: 0 = none, 3 = full reveal. */
export type HintLevel = 0 | 1 | 2 | 3;

/**
 * Gameplay telemetry, held in memory for the duration of a run and used to
 * derive the result screen's (entirely unserious) diagnosis. Never leaves the
 * browser. See technical design §15.
 */
export type GameEvent =
  | { type: 'interaction'; widget: WidgetType; at: number; interpretedValue: unknown }
  | {
      type: 'hint';
      widget: WidgetType;
      level: 1 | 2 | 3;
      at: number;
      /** Which ladder was unwound. Absent means the semantic one. */
      track?: 'semantic' | 'operation';
      /**
       * Where the hint was bought.
       *
       * Recorded rather than inferred from the timestamp: a hint taken in the
       * same millisecond the challenge starts is otherwise indistinguishable,
       * and only `challenge` hints are scored.
       */
      phase?: 'explore' | 'challenge';
    }
  | { type: 'mapping_discovered'; widget: WidgetType; at: number }
  | { type: 'challenge_attempt'; widget: WidgetType; correct: boolean; at: number }
  | { type: 'give_up'; at: number }
  | { type: 'reveal_rules'; at: number }
  | { type: 'retry_same'; at: number };

/** How a universe ended. `null` while it is still in progress. */
export type RunOutcome = 'stabilized' | 'gaveUp' | null;

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
  /** The gesture this control answers to. `native` is how it looks. */
  operation: OperationType;
}
