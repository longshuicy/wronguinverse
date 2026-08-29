// sanity.test.ts
// Placeholder smoke test so `vitest run` (and CI) has something to execute
// until real generator/domain tests land (see docs/WrongUInverse-technical-design.md §18).

import { describe, expect, it } from 'vitest';

describe('scaffold sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
