# Changelog

## Unreleased

### Hints

- **Both hint ladders are open at every level.** THE WrongUIᴎverse used to
  withhold them entirely, and because the chosen level survives every run in a
  session, the strip stayed missing until the page was reloaded. That read as a
  bug, not as a rule, and it took the nudges away from the players most likely
  to need one. The `hintPolicy` field is gone rather than retuned: a level
  narrows what the game volunteers unasked, never what the player may ask for.
- **Hints carry into stabilization.** Both ladders now cross the stage boundary
  at the rung the player left them on. Winding them back only made the same
  hint get bought a second time, which taught nothing and cost a click. The
  bench values still reset, so stabilization opens from the resting state the
  order was generated against.
- Exploration stays unscored, so a hint bought there is still free. Only hints
  bought once stabilization has begun are counted in the report.

## 1.0.0-beta3

The first release with all three tiers playable. A run is now chosen on two
independent axes: which rules are broken, and how much of the bench they reach.

### Tiers

- **Tier 3, Gesture Shift.** One page-wide pointer LAW per run, drawn from five
  and applied to the whole page rather than to any one control: the cursor
  commits on dwell, once is not enough, presses land off-target, the pointer
  runs backwards, or a hurried hand is ignored. Three rules hold across all of
  them. The keyboard is never governed, which keeps hints reachable and the tier
  playable without a mouse-accurate hand. The law is printed in the chrome for
  free, because how the pointer behaves was never the puzzle. And it arrives
  with the drift: the reality index and the calibration pass are the player's
  home universe and stay untouched.
- Tier 3 branches off Tier 1 rather than continuing the ladder. It keeps the
  wrong meanings and leaves every gesture native, because stacking it on Tier 2
  produces pairings that are incoherent rather than hard.
- Dragging survives every law: a granted commit also grants a grip.

### The landing page

- Two axes named WHAT DRIFTED and HOW DEEP. In game vocabulary "tier" and
  "level" are synonyms, so the old pair read as one difficulty scale with a
  diagonal through it.
- A kind is drawn as stacked rows, a quantity as one pip per control, and a
  manifest sentence above them is assembled from both choices.
- Music follows the tier rather than the level, which says the axes are
  independent without asking anyone to read.

### The report

- Dealt out in five beats, skippable with any press or key.
- An abandoned run is no longer scored. Both outputs were read against a run
  that finished, so leaving early scored flatteringly low and a player who quit
  having touched nothing was told they had insight they did not have. Giving up
  now earns PERSON WITH BOUNDARIES, the seventh Interface Brain Type.
- The seven types are collected as a cast across runs, with unearned ones shown
  as blanked silhouettes.

### Feel

- Every press in the game makes a sound. `ui_click` and `selection_confirm`
  shipped with the sound set and were called by nothing.
- Calibration ticks. The bench that exists to teach the player what NORMAL feels
  like was silent while the shifted one blipped at every reading.
- Presses move, stage changes cut, changed readings flash, locked requirements
  bump, and a cosmetic instability meter reacts to every miss. It gates nothing:
  the game has no clock on purpose.
- Zorblet says something, keyed to the state it was already in. It never
  comments on what a control means, only on how the player is going.

### Controls

- The dropdown and the number stepper are built out of real buttons. A native
  `<select>` list and a native spinner are drawn outside the page, where no rule
  the game imposes can reach them.

### Known gaps

Tier 2 applies at most one operation shift per widget. Widgets and semantics are
still the original eight of each. The report is staged but not yet animated in
any depth. See the issue tracker.
