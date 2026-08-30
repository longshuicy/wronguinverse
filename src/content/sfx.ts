// sfx.ts
// The sound-effect manifest.
//
// Covers the budget in art guide §12, minus the timer warning — exploration is
// untimed, so there is no deadline to warn about.
//
// Files are short mono WAVs, procedurally synthesized for this game (see
// public/sound/sound-effect/README.txt). Left uncompressed on purpose: the
// whole set is ~300KB, and a WAV decodes instantly, which matters for a click
// that has to land on the same frame as the input.

export type SfxId =
  | 'ui_click'
  | 'value_tick'
  | 'selection_confirm'
  | 'semantic_blip'
  | 'reality_shift'
  | 'requirement_correct'
  | 'stabilization_complete'
  | 'mismatch'
  | 'zorblet_chirp';

/**
 * Variants for the two sounds that fire most often.
 *
 * A single click sample repeated on every drag of a slider turns into a
 * machine-gun rattle; rotating between near-identical takes is the cheapest
 * way to stop the ear locking onto it.
 */
const VARIANTS: Partial<Record<SfxId, string[]>> = {
  ui_click: ['ui_click', 'ui_click_1', 'ui_click_2', 'ui_click_3'],
  semantic_blip: ['semantic_blip', 'semantic_blip_1', 'semantic_blip_2', 'semantic_blip_3'],
};

export function sfxUrl(file: string): string {
  return `${import.meta.env.BASE_URL}sound/sound-effect/${file}.wav`;
}

/** Every file that belongs to an effect, so the manager can preload them. */
export function sfxFiles(id: SfxId): string[] {
  return VARIANTS[id] ?? [id];
}
