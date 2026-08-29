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

## 3. Three Difficulty Tiers

### Tier 1 --- Semantic Shift --- V0 focus

The visual widget and its conventional semantic meaning are separated.

Examples:

- Slider → Choice
- Date picker → Quantity
- Checkbox group → Number
- Dropdown → Color
- Color picker → Date

The widget is still operated in a reasonably familiar way. Only the
semantic interpretation changes.

### Tier 2 --- Operation Shift --- Future

The widget's expected operation changes.

Examples:

- Slider moves by clicking discrete positions rather than dragging.
- Checkbox changes by dragging rather than clicking.
- Dropdown cycles by scrolling rather than opening normally.

Tier 2 should not be implemented until Tier 1 is proven fun.

### Tier 3 --- Gesture Shift --- Future

Low-level pointer behavior is remapped.

Examples:

- "Select" is triggered by hover.
- "Click" requires a double click.
- "Drag" requires click-and-hold followed by movement from a specific
  direction.
- A value changes based on cursor speed, dwell time, or entry
  direction.

Tier 3 is intended as expert/chaos mode.

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

The player receives approximately 30--45 seconds of free
experimentation.

During exploration:

- Every interaction gives immediate interpreted output.
- There is no failure.
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

- Challenge completion time
- First-attempt correct inputs
- Number of Stage 2 mappings successfully inferred
- Total interactions used during exploration

Optional humorous metric:

**Conventional Thinking: 68%**\
_"You still trust calendars."_

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
