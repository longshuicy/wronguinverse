// setup.ts
// Vitest global setup.

/**
 * jsdom implements no media playback, so anything that reaches Howler prints a
 * wall of "Not implemented: HTMLMediaElement.prototype.play". Starting a run
 * starts the music, so the store tests hit this constantly — and that noise is
 * exactly what hides a real failure.
 *
 * Stubbed at the DOM level rather than by mocking the audio manager, so the
 * real audio code still runs and can still break a test if it throws.
 */
for (const method of ['play', 'pause', 'load'] as const) {
  Object.defineProperty(HTMLMediaElement.prototype, method, {
    configurable: true,
    writable: true,
    value: method === 'play' ? () => Promise.resolve() : () => {},
  });
}
