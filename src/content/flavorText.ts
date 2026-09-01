// flavorText.ts
// Player-facing copy. Tone matters here: the game teases, it never punishes.
// A player who gives up gets "Understandable.", not a scolding.
// See docs/WrongUInverse-game-design.md §4, §6, §11.

import type { OperationType, SemanticType, TierId, WidgetType } from '../game/state/types.ts';

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

/** Plain-language name for the gesture a widget conventionally answers to. */
const CONVENTIONAL_GESTURE: Partial<Record<WidgetType, string>> = {
  slider: 'being dragged',
  checkbox: 'being clicked',
  radio: 'being clicked',
  dropdown: 'being opened',
  number: 'being typed into',
  text: 'being typed into',
  date: 'having its days picked',
  color: 'having its swatches clicked',
};

/** Level 2 hint: what the control DOES want, without naming the gesture. */
const OPERATION_CATEGORY_CLUE: Partial<Record<OperationType, string>> = {
  clickStep: 'It would rather be aimed at than pushed along.',
  wheelCycle: 'It wants to be turned, not touched.',
  dragToggle: 'A tap is not enough. It wants the distance.',
  holdToSelect: 'It responds to patience.',
  commitOnEnter: 'It hears you, but it is waiting for you to finish.',
  stepArrows: 'The body of it is scenery. Look at the edges.',
};

export const OPERATION_DISPLAY_NAME: Partial<Record<OperationType, string>> = {
  native: 'AS BUILT',
  clickStep: 'CLICK A POSITION',
  wheelCycle: 'SCROLL OVER IT',
  dragToggle: 'DRAG ACROSS IT',
  holdToSelect: 'PRESS AND HOLD',
  commitOnEnter: 'TYPE, THEN ENTER',
  stepArrows: 'USE THE ARROWS',
};

/**
 * The gesture ladder, mirroring `hintText`: nudge → category → reveal.
 *
 * Kept as a separate ladder rather than extra rungs on the semantic one,
 * because "what does this mean" and "how do I work it" are different questions
 * and a player stuck on one should not have to buy the other to reach it.
 */
export function operationHintText(
  widget: WidgetType,
  operation: OperationType,
  level: 1 | 2 | 3,
): string {
  const widgetName = WIDGET_DISPLAY_NAME[widget] ?? widget.toUpperCase();

  switch (level) {
    case 1:
      return `That ${widgetName.toLowerCase()} has lost interest in ${
        CONVENTIONAL_GESTURE[widget] ?? 'the usual approach'
      }.`;
    case 2:
      return OPERATION_CATEGORY_CLUE[operation] ?? 'It wants something else from you.';
    case 3:
      return `${widgetName} → ${OPERATION_DISPLAY_NAME[operation] ?? operation.toUpperCase()}`;
  }
}

export const SHIFT_HEADLINE = 'REALITY INDEX DESYNCHRONIZED';
export const SHIFT_SUBHEAD = 'INTERFACE SEMANTICS SHIFTED';

/**
 * Rotating skip copy, so a returning player gets a different joke.
 *
 * Kept generic about interfaces rather than naming a specific control: the
 * calibration set is generated, so a line about sliders can appear on a screen
 * with no slider on it.
 */
export const SKIP_CALIBRATION_COPY = [
  'SKIP: I have used a computer before',
  'SKIP: I already know what things mean',
  'SKIP: My assumptions are load-bearing',
  'SKIP: Unfortunately, I know UX',
  'SKIP: I have read a design system',
  'SKIP: Conventions and I go way back',
];

export const GIVE_UP_RESPONSE = 'Understandable.';

export const CALIBRATION_INTRO =
  'Baseline calibration. Ordinary controls, ordinary meanings. Set every reading, ' +
  'then confirm. Enjoy it while it lasts.';

// No deadline is implied: exploration is untimed, and promising a closing
// window when nothing closes would be a lie the interface tells for free.
export const EXPLORE_INTRO =
  'The controls are not broken. Work out what they mean, then stabilize the dimension.';

/**
 * The first-run card laid over the exploration bench.
 *
 * Says what this stage is, what it costs, and how to leave it — and nothing
 * about the mapping. Naming the stage is help; naming the answer is the game.
 */
export const EXPLORE_BRIEF_HEADLINE = 'PRACTICE RANGE';
export const EXPLORE_BRIEF_LINES = [
  'Every control behind this card means something other than it looks like.',
  'Push all of them and watch the readouts. Hints are free here.',
  'Nothing is scored yet, and there is no clock.',
];
/**
 * How the stage ends, and what ending it costs.
 *
 * The button is QUOTED rather than described: a player scanning the bar is
 * matching letters, and a paraphrase would send them looking for a control
 * that is not there. No directions to a corner of the screen either, since the
 * stage bar's actions sit right on a wide window and wrap left on a narrow one.
 *
 * The second line is the part testers were missing. They read exploration as
 * the game, pressed the button to see what it did, and found themselves in a
 * scored round they had not agreed to start.
 */
export const EXPLORE_BRIEF_EXIT = [
  'When you have it worked out, press "I understand this universe" in the bar at the top.',
  'That ends practice for good. The next screen is the real run: it is scored, hints cost you, and the readings have to be right.',
];
export const EXPLORE_BRIEF_DISMISS = 'Let me poke it';

export const CHALLENGE_INTRO = 'Set every reading to stabilize this dimension.';

/** Result-screen sign-off, chosen by outcome rather than score. */
export function resultHeadline(outcome: 'stabilized' | 'gaveUp'): string {
  return outcome === 'stabilized' ? 'DIMENSION STABILIZED' : 'DIMENSION ABANDONED';
}

/**
 * The tagline.
 *
 * "Everything works as unintended" was a decent pun and said nothing. This
 * lists the crimes, which is both funnier and an accurate description of the
 * game: every one of these is a real thing the generator can do to you.
 */
export const TAGLINE = 'Every control lies. None of them are broken.';

/**
 * What a run IS, in one sentence, assembled from the two axes.
 *
 * The landing page's whole difficulty is that "which rules broke" and "how many
 * controls" are independent, and two stacked pickers do not say so — they read
 * as one difficulty scale with a diagonal through it. A sentence naming the
 * product of the two choices is the shortest way to show that they compose:
 * change either half and only that half of the sentence moves.
 */
const DRIFT_CLAUSE: Record<TierId, string> = {
  1: 'nothing means what it looks like',
  2: 'nothing means what it looks like, and nothing answers to the gesture it invites',
  3: 'nothing means what it looks like, and the pointer is not yours',
};

const COUNT_WORD: Record<number, string> = { 4: 'four', 6: 'six', 8: 'all eight' };

/**
 * The count leads, and is named once.
 *
 * The first draft read "A universe where the controls mean the wrong things,
 * across four controls" — which says "controls" twice and leans on "across" to
 * carry a meaning it does not have. Putting the size of the bench in the
 * opening clause lets the rest of the sentence describe the drift without
 * having to name the things it is happening to.
 */
export function runManifest(tier: TierId, controlCount: number): string {
  const count = COUNT_WORD[controlCount] ?? String(controlCount);
  return `A universe of ${count} controls, where ${DRIFT_CLAUSE[tier]}.`;
}

/**
 * The Reality Index, as read before a run.
 *
 * Tier-dependent because the lore has to describe the rules the player is
 * about to meet: a tier 2 operator told only about meanings would be ambushed
 * by the gestures.
 *
 * The middle of it argues that conventions are agreements rather than laws.
 * That is the game's actual thesis, and stating it here means the shift reads
 * as a different set of agreements rather than as damage.
 *
 * Every character is typed out on the briefing screen, so length here is time
 * the player SITS THERE. That makes this the one piece of copy where cutting a
 * good sentence is usually right: the thesis needs one paragraph, not three,
 * and the examples are more convincing on the bench than in prose. Anything
 * added here has to be worth the wait it costs.
 */
export function briefingParagraphs(tier: TierId): string[] {
  // Each variant leads with the sentence that is NOT shared. Four of the five
  // paragraphs are common to every tier, so a variant that opened with the same
  // two examples as the others read as identical text to anyone who had seen
  // the index before, and the one paragraph carrying the tier's actual warning
  // went unread.
  const drift =
    tier === 3
      ? 'Two agreements lapsed here instead of one: what a control MEANS, and who the pointer belongs to. A slider may select a date. Your cursor may not go where you send it. You will be told which rule has taken it, and your keyboard answers to you throughout.'
      : tier === 2
        ? 'Two agreements lapsed here instead of one: what a control MEANS, and what it wants you to DO. A slider may select a date, and refuse to be dragged. A checkbox may name a creature, and answer only to a drag across it.'
        : 'One agreement lapsed here. A slider may select a date. A checkbox may name a creature. A calendar may hold a percentage. The hardware is fine; this universe simply settled on different agreements than yours.';

  return [
    'REALITY CALIBRATION TERMINAL // CLEARANCE: PROVISIONAL',
    'An experiment two sectors over went wrong. Nearby universes now overlap. Most of it is harmless: slightly different gravity, slightly different Tuesdays.',
    'Interface conventions were not harmless, and not because they broke. They were never laws. A slider means a quantity the way a red light means stop: by agreement, repeated until it felt like physics. Here the agreement lapsed.',
    drift,
    'You calibrate in your own universe first, so you remember what normal feels like. Then the drift hits. Nothing during exploration is scored, so poke everything.',
  ];
}
