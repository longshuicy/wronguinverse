# WrongUIᴎverse --- Game Design Document

> **Display title:** **WrongUIᴎverse**  
> **ASCII / technical name:** `wronguinverse`  
> The title intentionally combines **Wrong + UI + inverse + universe**. The reversed **ᴎ** should be treated as a visual branding element; use the ASCII name for repository names, URLs, package identifiers, and other tooling-sensitive contexts.

## 1. High Concept

**WrongUIᴎverse** is a short-session browser puzzle game about
breaking learned assumptions about user interfaces.

A parallel-universe event has shifted the relationship between familiar
computer controls and what they mean. A slider may now select a date. A
date picker may represent a quantity. A checkbox may choose among
several options.

The controls are not broken. The player's assumptions are.

The game uses familiar UI widgets, randomly remaps their semantics
within a curated compatibility system, gives the player time to discover
the new rules, then tests whether they can use those rules to complete a
compound task.

The game is frontend-only and should work as a static site.

## 1.1 Title & Branding

The game is titled **WrongUIᴎverse**.

The capitalization is intentional: **U** and **I** should be visually emphasized through typography so the title reads simultaneously as “wrong universe” and “wrong UI.” The logo should play with the letterforms, weight, baseline, size, inversion, or pixel treatment of **U** and **I** rather than adding extra explanatory words.

The title itself should feel like the first tiny UI violation: recognizable, cute, slightly incorrect, and deliberate.

Working tagline: **Everything works as unintended.**

## 2. Design Thesis

A UI convention is not a law of nature.

A slider does not inherently mean "quantity." A checkbox does not
inherently mean "boolean." A date picker does not inherently mean
"date." These are mappings people have learned.

The game should communicate this through play rather than explanation.

The desired player realization is:

> "I know how to operate this thing, but I was wrong about what it
> means."

## 3. Three Tiers

> **"Tier" and "level" are different things.** They were both called "tier"
> in earlier drafts, which caused steady confusion.
>
> - A **TIER** is *which rules are broken*. There are three, below, and all
>   three ship. This is what the music follows.
> - A **LEVEL** is *how hard a run within a tier is* --- how many mappings and
>   how much help. There are three, in §11.
>
> The two are INDEPENDENT: every tier is played at every level, so there are
> nine runs, not three. The landing page calls them WHAT DRIFTED and HOW DEEP
> rather than tier and level --- in game vocabulary those two words are
> synonyms, both meaning "how far up", and players read the pair as one
> difficulty scale with a diagonal through it. The page draws a kind (stacked
> rows) and a quantity (a meter of pips) so they cannot be mistaken for each
> other, prints a sentence assembled from both, and lets only the tier change
> the music.
>
> "WrongUIᴎverse 1.0 --- Semantic Shift" is Tier 1 with three levels.

### Tier 1 --- Semantic Shift --- shipped in 1.0

The visual widget and its conventional semantic meaning are separated.

Examples:

- Slider → Choice
- Date picker → Quantity
- Checkbox group → Number
- Dropdown → Color
- Color picker → Date

The widget is still operated in a reasonably familiar way. Only the
semantic interpretation changes.

### Tier 2 --- Operation Shift --- shipped

The widget's expected operation changes.

Examples:

- Slider moves by clicking discrete positions rather than dragging.
- Checkbox changes by dragging rather than clicking.
- Dropdown cycles by scrolling rather than opening normally.

Tier 2 was held back until Tier 1 was proven fun; it is additive on
Tier 1, keeping the semantic shift and layering gestures on top.

### Tier 3 --- Gesture Shift --- shipped

Low-level pointer behavior is remapped. One LAW per run, drawn from a
pool and applied to the whole page --- the chrome and the lore screen
included, not just the bench. That universality is the teaching
mechanism: a player learns the law by watching it act on a button they
did not care about.

The pool:

- **Hover commits.** Dwelling on a control is the press.
- **Once is not enough.** Every commit needs two presses in a window.
- **The cursor is not where you left it.** Presses land at a fixed
  offset from the pointer; the ring shows the true point, and the
  player aims off-target to compensate.
- **The pointer runs backwards.** A virtual cursor moves opposite to the
  real one; the ring is the only honest cursor on screen.
- **A hurried hand is ignored.** The control answers only a pointer that
  has come to a stop and stayed stopped while the ring fills.

Dragging survives every law. A law swallows the press, and for a
while that swallowed the drag with it, leaving sliders placeable only
one press at a time. Granting a commit on a positional control now
grants a grip on it too: movement keeps committing until the grip ends
— on release for the laws that judge a press, on stepping off the
control for `hoverCommit`, which has no button to hold. A drag is never
re-judged while it runs, or `A hurried hand` would read every frame of
one as hurry.

Three rules hold across every law:

1. **Pointer only.** The keyboard is never governed. That is what keeps
   hints reachable, Escape honest, and the tier playable without a
   mouse-accurate hand.
2. **The law is not a hint.** It is printed in the chrome for free and
   cannot be bought. Knowing how the cursor commits says nothing about
   what a control MEANS, so the Tier 1 puzzle survives intact.
A law can be opened directly for debugging with `?law=<id>`, which
overrides both the tier's pool and the seed's draw.

Two controls had to stop being native for any of this to hold. A
`<select>`'s option list and an `<input type="number">`'s spinner are
drawn outside the page, where no rule the game imposes can reach them:
under Tier 3 they were simply dead to the pointer, and under Tier 2 the
spinner was a second, ungoverned route to the value. Both are built out
of real buttons now, which is also what lets Tier 2's wheel scroll a
list the player can actually see.

3. **It arrives with the drift, and is named as it arrives.** The
   reality index and the calibration pass are the player's HOME
   universe and stay untouched — no law, and no universe palette. The
   shift screen prints the law in full, and the first bench under it is
   Explore, which is unscored.

Tier 3 layers on Tier 1 and NOT on Tier 2 --- it keeps the wrong
meanings and leaves every gesture native. The two are different second
wrongnesses on the same base, and neither contains the other. Stacked,
each widget's shifted gesture would have to survive the run's pointer
law, and half those pairings are incoherent rather than hard (a checkbox
that wants a drag, under a law that already committed it on hover). All
three at once belongs later, as a modifier with the broken pairings
excluded --- not as the definition of a tier.

## 4. Core Round Structure

Every run generates a temporary set of interface rules. Those rules
remain stable through all three stages of that run.

### Stage 1 --- NORMAL / Calibration

Purpose: reinforce conventional expectations before breaking them.

The player completes 3--5 extremely short ordinary UI tasks.

Examples:

- Choose ORBITAL BLUE using a color picker.
- Set reactor power to 7 using a slider.
- Select a creature using a dropdown.
- Pick a date using a date picker.

This stage should take approximately 15--25 seconds.

No tricks.

### Stage 2 --- SHIFT / Free Exploration

A parallel-universe disturbance occurs.

Message example:

**REALITY INDEX DESYNCHRONIZED**\
**INTERFACE SEMANTICS SHIFTED**

The same family of widgets now represents shuffled semantics.

Exploration is **untimed**. The player moves on when they say they
understand the universe.

A countdown was tried and removed. It turned deduction into a race and
punished exactly the players who were enjoying it most --- the ones
reading the outputs and forming a theory before touching anything. The
stage has no failure state, so a clock had nothing to enforce except
haste.

Effort is still measured, by **counting interactions** rather than
seconds. That number is shown live during exploration and reported at the
end, so the player always knows what is being counted.

During exploration:

- Every interaction gives immediate interpreted output.
- There is no failure and no clock.
- The player can try widgets repeatedly.
- The game does NOT directly state mappings such as "Slider = Choice."
- The game can show observed output, e.g. moving a slider displays
  creature names.
- A small field-notes panel may automatically record examples the
  player has observed.

The player should be able to infer the mappings.

### Stage 3 --- STABILIZE / Challenge

Exploration output and explicit observation aids disappear or become
limited.

Hints are the exception, and deliberately so. Both ladders cross into
this stage at exactly the rung the player left them on, at every level.
What a control MEANS is learned once; resetting the ladders only made the
player buy the same hint a second time, which taught nothing and cost a
click. The bench values are what start fresh here, not the notes.

Exploration remains unscored, so a hint bought there is still free. Only
hints bought once stabilization has begun are counted in the report.

The player receives a compound objective requiring several learned
mappings.

Example:

**STABILIZE SECTOR Q-9**

- Destination: VELOR MOON
- Reactor level: 73
- Signal color: GLIMMER VIOLET
- Companion: ZORBLET

If the current shuffled rules are:

- Slider → Choice
- Date → Quantity
- Dropdown → Color
- Color picker → Date

the player must remember and apply those mappings.

Challenge complexity can ramp:

1.  One requirement.
2.  Two requirements.
3.  Three requirements.
4.  Four or more requirements with a timer.

## 5. The Hook

The hook is not randomness itself.

The hook is:

**Learn how this parallel universe's computer works before reality
collapses.**

Each run creates a temporary "physics of interface." The player gets a
short laboratory period to reverse-engineer it, then must use that
knowledge under pressure.

The pleasure comes from:

- violating a strong expectation,
- experimentation,
- the "ohhh, THAT'S what this means" moment,
- remembering the new rules,
- executing a multi-part solution quickly,
- seeing bizarre but coherent futuristic consequences.

## 6. World / Story

A failed experiment has caused nearby parallel universes to overlap.

Human interface conventions are among the things that shifted.

Computers still function, but semantic associations differ between
realities.

The player operates a small **Reality Calibration Terminal** used to
stabilize anomalies.

Each run is a newly contacted universe with its own interface rules.

The world should be playful rather than lore-heavy.

Possible terminology:

- Reality Calibration Terminal
- Semantic Drift
- Convention Collapse
- Interface Flux
- Parallel Input Event
- Reality Index
- Shift Event
- Stabilization Protocol

### Creatures / Objects

Use invented, meaningless futuristic names so the player cannot rely too
heavily on real-world semantics.

Examples:

- Zorblet
- Mip
- Quonk
- Velori
- Plim
- Wubbit
- Noxu
- Fizzlepod
- Glorp
- Tinki

Locations / materials / colors can also be fictional:

- Velor Moon
- Sector Q-9
- Nib Nebula
- Glimmer Violet
- Flux Amber
- Quasar Mint
- Void Peach

These are flavor labels, not new mechanics.

## 7. Tier 1 Vocabulary

### Visual Widget Vocabulary --- V0

Use eight widgets first:

1.  Slider
2.  Checkbox / checkbox group
3.  Radio group
4.  Dropdown
5.  Number input / stepper
6.  Text input
7.  Date picker
8.  Color picker

Potential later additions:

- Button
- Time picker
- Calculator
- Tabs
- Progress bar
- Search
- File upload

### Semantic Vocabulary --- V0

Use seven semantic domains:

1.  Boolean
2.  Choice
3.  Quantity
4.  Number
5.  Text
6.  Date
7.  Color

The generator is allowed to choose from many values inside each
semantic. It must NOT be limited to fixed examples such as "green."

Examples:

**Boolean** - YES / NO - ENABLED / DISABLED - STABLE / UNSTABLE - OPEN /
CLOSED

**Choice** - ZORBL / MIP / QUONK - MOON / LAB / VOID - ALPHA / BETA /
GAMMA / DELTA - invented creature names generated from a finite word
bank

**Quantity** - 0--10 - 0--100 - -5--5 - percentages - arbitrary bounded
ranges

**Number** - exact integer or decimal targets

**Text** - short generated words/codes - creature names - sector codes -
2--8 character strings

**Date** - generated dates within a safe range

**Color** - generated palette values with fictional display names

## 8. Compatibility Matrix --- V0

Legend:

- **YES** = good random pairing
- **MAYBE** = allow only after playtesting / renderer support
- **NO** = rule out
- **NORMAL** = conventional pairing; use in Stage 1, exclude from
  shifted mappings

---

Looks like Boolean Choice Quantity Number Text Date Color
↓ /  
Actually  
means →

---

Slider YES YES NORMAL YES NO YES YES

Checkbox NORMAL YES YES YES NO NO MAYBE

Radio YES NORMAL YES YES MAYBE YES YES

Dropdown YES NORMAL YES YES YES YES YES

Number YES YES YES NORMAL MAYBE YES YES

Text YES YES YES YES NORMAL YES YES

Date YES YES YES YES NO NORMAL MAYBE

Color YES YES YES YES NO MAYBE NORMAL
----------------------------------------------------------------------------

### Recommended V0 policy

The randomizer should use only **YES** cells initially.

Do not hard-code individual puzzle combinations. Hard-code only the
compatibility matrix and generic rendering capabilities.

After playtesting, MAYBE cells can be promoted or removed.

## 9. Random Generation Rules

For each run:

1.  Select N widgets, initially 4.
2.  Select N semantic domains.
3.  Generate a one-to-one shuffled mapping.
4.  Reject:
    - conventional pairings during Shift/Challenge,
    - compatibility = NO,
    - duplicate semantic assignments,
    - mappings unsupported by the renderer.
5.  Keep the accepted mapping fixed for Stage 2 and Stage 3.
6.  Generate values independently from the semantic domain.

Important: randomness should occur at the semantic/domain level, not
through giant lists of handcrafted puzzles.

## 10. Feedback Rules

Every interaction in Stage 2 must visibly communicate the interpreted
result.

Examples:

- Slider moved → output label changes from QUONK to MIP.
- Date selected → meter reads 64%.
- Checkbox toggled → interpreted number changes.
- Dropdown item selected → swatch changes.

Avoid "wrong" feedback during exploration.

During Stage 3:

- Correct requirement: lock it with a satisfying confirmation.
- Incorrect value: show current interpreted value but do not reveal
  the mapping.
- Avoid instant game-over for one mistake.

## 11. Scoring

V0 scoring can be simple:

- **Total interactions used** --- the headline number, since the run is
  untimed
- First-attempt correct inputs
- Hints used
- Number of controls the player actually touched

Do **not** report elapsed time. Nothing in the game asks the player to
manage a clock, so grading them on one would be measuring something they
were never told about.

Optional humorous metric:

**Conventional Thinking: 68%**\
_"You still trust calendars."_

### An abandoned run is not scored

Giving up produces **no percentage and no earned brain type**. Both
outputs are read against a run that FINISHED: every term in the
Conventional Thinking index is a ratio whose denominator assumes the
player worked through all their requirements, and the brain-type tests
compare interaction counts to the same. So walking away early scored
flatteringly low, revealing the rules on the way out scored *worse* than
leaving in silence, and a player who quit after touching nothing was told
they were THE THEORIST, who "thought about it and was mostly RIGHT".

Being congratulated on insight you did not have, about a dimension you
walked out of, is the worst thing the report could say. So the report
prints `N/A --- NO READING TAKEN` in place of the figure, and shows a
seventh brain type reserved for it:

**PERSON WITH BOUNDARIES** (`SKEDD`) --- *"Decided the dimension could
stabilize itself."*

This is the only type not earned by how a run was played, and its tone
follows `GIVE_UP_RESPONSE`: leaving is a legitimate ending, not a failure
state, and the report never shames it.

## 11.1 Difficulty Levels

Three levels within Tier 1. Difficulty scales by widening the mapping set
and narrowing the player's aids --- never by adding new mechanics, which
is what a Tier is for.

  --------------------------------------------------------------------------
  Level                  Mappings   What changes
  ---------------------- ---------- ----------------------------------------
  SLIGHTLY WRONG         4          Every objective is printed on the
                                    control that answers it.

  DEEPLY WRONG           6          The order is a separate list; matching
                                    it to the bench is now part of the
                                    puzzle. Fewer notebook entries.

  THE WrongUIᴎverse      8          Every widget is in play, and the
                                    challenge no longer shows what a control
                                    reads as --- a requirement locking is the
                                    only feedback.
  --------------------------------------------------------------------------

Eight is the ceiling, not an arbitrary stopping point: a run gives every
widget a distinct semantic, and there are eight of each. A fourth level
needs a ninth semantic implemented first.

**Hints are not part of the scale.** Both ladders are open at every
level. What a level narrows is what the game volunteers unasked --- the
notebook, the READS AS readout --- never what the player may ask for.
THE WrongUIᴎverse withheld them once, and the result was that the players
who most needed a nudge were the only ones who could not buy one; a
missing hint strip read as a broken build rather than as a rule.

Music belongs to the TIER, not the level (art guide §11).

## 12. Session Length

Target:

- One run: 2--4 minutes.
- First session: 5--10 minutes.
- Easy "one more universe" replayability.

## 13. V0 Success Criteria

The prototype succeeds if new players, without being told the thesis:

1.  Understand Stage 1 immediately.
2.  Become confused but curious in Stage 2.
3.  Experiment rather than stop.
4.  Verbally or mentally realize that widget meaning has changed.
5.  Can remember at least some mappings in Stage 3.
6.  Want to try another randomized universe.

The most important playtest question:

> "When the rules changed, did you want to figure out how the interface
> worked?"

If the answer is no, do not add more content. Fix Stage 2 feedback and
Stage 3 motivation first.
