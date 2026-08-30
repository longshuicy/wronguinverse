// flavorText.ts
// Player-facing copy. Tone matters here: the game teases, it never punishes.
// A player who gives up gets "Understandable.", not a scolding.
// See docs/WrongUInverse-game-design.md §4, §6, §11.

import type { SemanticType, WidgetType } from '../game/state/types.ts';

/** Plain-language name for what a widget conventionally deals in. */
const CONVENTIONAL_SUBJECT: Partial<Record<WidgetType, string>> = {
  slider: 'numbers',
  checkbox: 'yes-or-no',
  radio: 'options',
  dropdown: 'options',
  number: 'numbers',
  text: 'words',
  date: 'dates',
  color: 'colours',
};

/** Level 2 hint: the category a widget is really dealing in, without naming it. */
const SEMANTIC_CATEGORY_CLUE: Partial<Record<SemanticType, string>> = {
  boolean: 'It only seems to have two states.',
  choice: 'It appears to be naming something.',
  quantity: 'It seems to be counting.',
  number: 'It seems to be counting.',
  date: 'It seems to be dealing with time.',
  time: 'It seems to be dealing with time.',
  color: 'It seems to care about how things look.',
  text: 'It seems to be spelling something.',
};

export const WIDGET_DISPLAY_NAME: Partial<Record<WidgetType, string>> = {
  slider: 'SLIDER',
  checkbox: 'CHECKBOX',
  radio: 'RADIO',
  dropdown: 'DROPDOWN',
  number: 'NUMBER',
  text: 'TEXT',
  date: 'CALENDAR',
  color: 'COLOUR',
};

export const SEMANTIC_DISPLAY_NAME: Partial<Record<SemanticType, string>> = {
  boolean: 'BOOLEAN',
  choice: 'CHOICE',
  quantity: 'QUANTITY',
  number: 'NUMBER',
  text: 'TEXT',
  date: 'DATE',
  time: 'TIME',
  color: 'COLOUR',
};

/**
 * Progressive hint text: nudge → category → reveal.
 *
 * Levels 1 and 2 point at the shape of the answer without naming it, so the
 * player still gets the deduction. Only level 3 gives the mapping away.
 */
export function hintText(widget: WidgetType, semantic: SemanticType, level: 1 | 2 | 3): string {
  const widgetName = WIDGET_DISPLAY_NAME[widget] ?? widget.toUpperCase();

  switch (level) {
    case 1:
      return `That ${widgetName.toLowerCase()} doesn't seem very interested in ${
        CONVENTIONAL_SUBJECT[widget] ?? 'what you expect'
      }.`;
    case 2:
      return SEMANTIC_CATEGORY_CLUE[semantic] ?? 'It is dealing with something else entirely.';
    case 3:
      return `${widgetName} → ${SEMANTIC_DISPLAY_NAME[semantic] ?? semantic.toUpperCase()}`;
  }
}

export const SHIFT_HEADLINE = 'REALITY INDEX DESYNCHRONIZED';
export const SHIFT_SUBHEAD = 'INTERFACE SEMANTICS SHIFTED';

/** Rotating skip copy, so a returning player gets a different joke. */
export const SKIP_CALIBRATION_COPY = [
  'SKIP: I still remember how buttons work',
  'SKIP: I live in this universe',
  'SKIP: Yes yes, sliders slide',
  'SKIP: Unfortunately, I know UX',
];

export const GIVE_UP_RESPONSE = 'Understandable.';

export const CALIBRATION_INTRO =
  'Baseline calibration. Ordinary controls, ordinary meanings. Confirm each reading.';

// No deadline is implied: exploration is untimed, and promising a closing
// window when nothing closes would be a lie the interface tells for free.
export const EXPLORE_INTRO =
  'The controls are not broken. Work out what they mean, then stabilize the dimension.';

export const CHALLENGE_INTRO = 'Set every reading to stabilize this dimension.';

/** Result-screen sign-off, chosen by outcome rather than score. */
export function resultHeadline(outcome: 'stabilized' | 'gaveUp'): string {
  return outcome === 'stabilized' ? 'DIMENSION STABILIZED' : 'DIMENSION ABANDONED';
}
