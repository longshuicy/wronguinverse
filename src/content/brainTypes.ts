// brainTypes.ts
// Interface Brain Types, and the creature that represents each one.
//
// This is the single place a brain type is defined: its id, the creature that
// stands for it, and every word shown on the result screen. The classification
// logic in game/metrics.ts returns an id and nothing else, so a type can never
// end up with a name here and different wording there.
//
// Kept as a typed module rather than a JSON file on purpose: JSON would have to
// be fetched or imported untyped, and every AssetId here needs checking against
// the asset manifest at build time. A typo in a creature name should fail the
// build, not render a missing image to a player.
//
// These are comedy outputs, not a psychological assessment. See
// docs/WrongUInverse-game-design.md §11.

import type { AssetId } from './assets.ts';

export type BrainTypeId =
  'poker' | 'reasonable' | 'uxDesigner' | 'engineer' | 'theorist' | 'normie' | 'walkedAway';

export interface BrainType {
  id: BrainTypeId;
  /** The creature's own name, shown above the type. */
  creatureName: string;
  creature: AssetId;
  /** The type itself. */
  name: string;
  /** One line, the punchline. */
  blurb: string;
  /** A longer read, in the manner of a personality profile that is not one. */
  description: string;
  /** Why this creature, so the pairing is not re-rolled on a whim. */
  because: string;
}

export const BRAIN_TYPES: Record<BrainTypeId, BrainType> = {
  poker: {
    id: 'poker',
    creatureName: 'QUONK',
    creature: 'creature_quonk',
    name: 'THE POKER',
    blurb: 'Touched everything until reality gave up.',
    description:
      'You do not form a theory. You form a WORKLOAD. Where others sat and reasoned about what a ' +
      'calendar might secretly mean, you clicked it fourteen times and watched what fell out, ' +
      'which is, annoyingly, a completely valid epistemology. Every control in this universe has ' +
      'now been touched by you personally. Some of them twice, in case they were lying the first ' +
      'time. You will never be the fastest to understand a system, but you are frequently the ' +
      'first to make it do something, and in a universe where the manual is wrong that is worth ' +
      'more than it sounds.',
    because: 'A squat blob with two tiny floating hands. Built for prodding.',
  },
  reasonable: {
    id: 'reasonable',
    creatureName: 'NOXU',
    creature: 'creature_noxu',
    name: 'REASONABLE HUMAN BEING',
    blurb: 'Used hints instead of arguing with a calendar.',
    description:
      'At some point you looked at a control that had personally wronged you, considered the ' +
      'hours you could spend proving it wrong, and simply ASKED. This is the rarest result in ' +
      'the set. Most people would rather lose to an interface than admit it beat them, and you ' +
      'declined to play that game. You are not here to win an argument with a date picker. You ' +
      'are here to stabilize a dimension and then have a nice evening. The universe finds this ' +
      'faintly disappointing and deeply sensible.',
    because: 'A floating jelly with a steady blinking core. Unbothered.',
  },
  uxDesigner: {
    id: 'uxDesigner',
    creatureName: 'VELORI',
    creature: 'creature_velori',
    name: 'THE UX DESIGNER',
    blurb: 'Immediately assumed the interface was wrong.',
    description:
      'You did not experience confusion. You experienced VINDICATION. The moment the mappings ' +
      'drifted you thought "yes, obviously" and got to work, because some part of you has always ' +
      'suspected that a checkbox owes you nothing. You landed every requirement without asking ' +
      'for help, which suggests either genuine insight or a lifetime of using software built by ' +
      'people who thought exactly this hard about labels. Be careful: the ease with which you ' +
      'accepted that nothing means what it says is not, in most contexts, a good sign.',
    because: 'Tall, crescent-headed, faintly above it all.',
  },
  engineer: {
    id: 'engineer',
    creatureName: 'MIP',
    creature: 'creature_mip',
    name: 'THE ENGINEER',
    blurb: 'Brute-forced the semantic space, methodically.',
    description:
      'Every control, in order, one variable at a time. You did not guess; you SWEPT. Somewhere ' +
      'in the middle of this run you stopped playing a puzzle game and started running an ' +
      'experiment, complete with a control group and, presumably, feelings about sample size. It ' +
      'worked, because it always works, and it took longer than it needed to, because it always ' +
      'does. There was a shortcut. You saw it. You decided it was not rigorous.',
    because: 'Three eyes and a cursor for a tail. Scans everything in order.',
  },
  theorist: {
    id: 'theorist',
    creatureName: 'PLIM',
    creature: 'creature_plim',
    name: 'THE THEORIST',
    blurb: 'Barely touched anything. Just knew.',
    description:
      'You looked at the board, thought about it, and were mostly RIGHT, which is the single ' +
      'most irritating way to play this game. Your interaction count is low enough to raise ' +
      'questions. Where everyone else was generating data, you were sitting very still ' +
      'assembling a model, and then you walked over and set four controls like someone who had ' +
      'read the answer. This works beautifully until the day the universe does something your ' +
      'model did not allow for, at which point you will sit there considerably longer.',
    because: 'A cube whose face moves between surfaces. Thinks in boxes.',
  },
  /**
   * The only type that is not earned by how a run was PLAYED.
   *
   * An abandoned run has no honest reading in it — the classifier judges
   * interaction counts against a run that finished, so a player who left after
   * touching nothing used to be told they were THE THEORIST, who "thought about
   * it and was mostly RIGHT". Being congratulated on insight you did not have,
   * for a dimension you walked out of, is the worst thing the report could say.
   * Abandonment short-circuits to this instead, and the tone follows
   * `GIVE_UP_RESPONSE`: leaving is a legitimate ending, not a failure state.
   */
  walkedAway: {
    id: 'walkedAway',
    creatureName: 'SKEDD',
    creature: 'creature_skedd',
    name: 'PERSON WITH BOUNDARIES',
    blurb: 'Decided the dimension could stabilize itself.',
    description:
      'You reached the point where a reasonable person stops, and then you actually STOPPED, ' +
      'which is rarer than it sounds. The meanings were wrong, the controls were hostile, and ' +
      'rather than grind on out of spite you put it down and walked into the corridor. The ' +
      'dimension remains unstable. It will go on being unstable. It was, on inspection, not ' +
      'your dimension. Everyone else in this cast is still in there losing an argument with a ' +
      'calendar, and you are outside in the light, having correctly worked out that no part of ' +
      'your life improves by winning this. The universe would like you to know that it is fine. ' +
      'It is not fine. That remains its problem.',
    because:
      'Seen only from behind, mid-stride, already leaving. The one specimen ' +
      'the lab never got a good look at.',
  },

  normie: {
    id: 'normie',
    creatureName: 'WUBBIT',
    creature: 'creature_wubbit',
    name: 'THE NORMIE',
    blurb: 'Attempted to use every control correctly. Adorable.',
    description:
      'You did nothing wrong. That is the problem. You approached each control the way it asked ' +
      'to be approached, gave it the benefit of the doubt, and were betrayed by it personally ' +
      'and repeatedly. A slider appeared, so you slid it. A calendar appeared, so you picked a ' +
      'sensible date. This is exactly correct behaviour in every universe except this one. You ' +
      'are the reason interface conventions exist, and this dimension is the reason they cannot ' +
      'be trusted. Somewhere a designer owes you an apology.',
    because: 'The lab assistant who still believes the labels.',
  },
};
