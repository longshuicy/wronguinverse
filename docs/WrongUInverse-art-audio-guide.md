# WrongUIᴎverse --- Art, Asset & Audio Direction

> **Display title:** **WrongUIᴎverse**\
> **ASCII / technical name:** `wronguinverse`\
> The title intentionally combines **Wrong + UI + inverse + universe**.
> The reversed **ᴎ** should be treated as a visual branding element; use
> the ASCII name for repository names, URLs, package identifiers, and
> other tooling-sensitive contexts.

## 1. Art Goal

The game should feel like a **tiny futuristic computer terminal from a
parallel universe**, rendered in playful pixel art.

The interface should be recognizable enough that players instantly
identify familiar UI conventions, while the surrounding world feels
strange, synthetic, and slightly unstable.

The art must support a very small asset budget.

Primary rule:

**Use procedural UI for gameplay. Use generated art for atmosphere and
personality.**

Do not bake gameplay controls into images.

## 1.1 Logo / Wordmark

Use the exact title **WrongUIᴎverse**. The unusual capitalization is
part of the concept.

Visually emphasize the adjacent **U** and **I** so viewers can discover
"UI" inside "universe." Possible treatments include:

-   contrasting font weight between U/I and the surrounding letters,
-   slightly different pixel typefaces for U and I,
-   offsetting one letter by a pixel or two,
-   reversing/inverting one letter during the reality-shift animation,
-   briefly glitching the U/I pair independently from the rest of the
    wordmark.

Keep the permanent logo readable and cute rather than heavily glitched.
Do not rely on Midjourney to render the final title; create the wordmark
with real typography/CSS or manually authored pixel lettering.

Optional tagline: **Everything works as unintended.**

## 2. Visual Direction

Keywords:

-   pixel art
-   retro-futuristic
-   electric
-   weird
-   cute
-   slightly glitchy
-   scientific terminal
-   parallel universe
-   compact arcade machine
-   playful rather than dystopian
-   16-bit / 32-bit-inspired, but clean enough for modern screens

Avoid:

-   photorealism
-   huge detailed backgrounds
-   complex character animation
-   excessive cyberpunk neon
-   dark horror
-   unreadable glitch effects
-   assets containing important UI text

## 3. Visual Hierarchy

The screen should have three layers.

### Layer A --- Gameplay UI

Real HTML/CSS controls.

These must remain crisp and readable.

Examples:

-   sliders
-   checkboxes
-   dropdowns
-   date controls
-   text fields
-   color controls

They can be styled to match the terminal, but must still visually
communicate their conventional widget identity.

This is essential to the game concept.

### Layer B --- Terminal Shell

Reusable pixel-art framing:

-   panel borders
-   corner brackets
-   warning lights
-   small screens
-   cables
-   indicator LEDs
-   vents
-   tiny antenna
-   scan lines
-   decorative meters

Mostly CSS + a few sprite assets.

### Layer C --- Parallel-Universe Flavor

Small decorative creatures and phenomena:

-   creatures observing the terminal
-   floating anomaly
-   tiny moon
-   anti-gravity object
-   portal
-   strange plant
-   floating crystal
-   miniature satellite

These do not need gameplay logic in V0.

## 4. V0 Asset Manifest

The UI itself should be built from HTML/CSS. **Do not generate pixel-art
versions of sliders, buttons, checkboxes, dropdowns, tabs, progress
bars, text inputs, date pickers, calculators, or file-upload controls.**

Use **NES.css** as the starting pixel-style UI framework and override it
with the WrongUIᴎverse palette, spacing, borders, glow, and terminal
treatment. This keeps the actual gameplay widgets interactive and
dynamically remappable.

Generated art should focus on assets CSS cannot provide efficiently: one
environment, one mascot with reactions, a handful of secondary
creatures, and reusable anomaly props.

### A001 --- `bg_calibration_lab`

**Filename:** `backgrounds/bg_calibration_lab.png`\
**Priority:** REQUIRED\
**Target:** wide background, compose for 16:9; final web version can be
cropped/scaled.\
**Usage:** shell/background behind the DOM terminal in all stages. Stage
variations should primarily use CSS overlays rather than separate
paintings.

**Midjourney prompt:**

> pixel art retro-futuristic parallel universe calibration laboratory,
> quirky scientific computer terminal room, empty central workspace
> reserved for a web interface overlay, floating anti-gravity objects
> around the edges, tiny cables vents antennae reactor details, playful
> electric science fiction, cute and curious not dystopian, compact
> 16-bit inspired pixel art, strong readable silhouettes, limited
> palette, no readable text, no people, no UI controls, no interface
> panels occupying the center, widescreen composition

**Post-process:** crop so the center remains visually quiet. Do not bake
the title or controls into the image.

### A002--A004 --- Zorblet mascot states

Zorblet is the primary reactive observer.

**Files:**

-   `creatures/mascot_zorblet_idle.png`
-   `creatures/mascot_zorblet_confused.png`
-   `creatures/mascot_zorblet_success.png`

**Priority:** REQUIRED\
**Target:** 32×32 or 48×48 logical sprite after cleanup; 2--4 animation
frames per state if practical.

**Midjourney prompt:**

> original cute alien laboratory assistant named Zorblet, round
> asymmetric body, two mismatched antennae, tiny floating hands,
> oversized pixel eyes, one oversized foot, friendly weird scientist
> companion, strong simple silhouette, retro futuristic parallel
> universe game, 16-bit pixel art sprite sheet concept, idle pose,
> confused skeptical pose, delighted success pose, isolated poses with
> generous spacing, limited palette, no text, plain solid background, no
> UI

**Implementation mapping:**

-   Stage 1 → idle
-   Stage 2 → watching/idle
-   repeated conventional mistake → confused
-   mapping discovery → success
-   Stage 3 success → success
-   give up → confused/neutral

### A005 --- `creature_mip`

**Filename:** `creatures/creature_mip.png`\
**Priority:** OPTIONAL V0 flavor\
**Design:** triangular body, three eyes, cursor-shaped tail.

**Prompt:**

> cute original alien creature, triangular soft body, three expressive
> eyes, cursor-arrow shaped tail, quirky friendly parallel universe
> laboratory specimen, strong simple silhouette, 16-bit pixel art
> sprite, isolated, limited palette, no text, plain background

### A006 --- `creature_quonk`

**Filename:** `creatures/creature_quonk.png`\
**Design:** squat blob, transparent helmet, floating hands.

**Prompt:**

> cute original alien named Quonk, squat blob body, transparent bubble
> helmet, two tiny floating hands, odd cheerful expression, quirky retro
> futuristic science game, crisp 16-bit pixel art sprite, isolated,
> limited palette, no text, plain background

### A007 --- `creature_velori`

**Filename:** `creatures/creature_velori.png`\
**Design:** tall soft creature, crescent head, glowing legs.

**Prompt:**

> cute original tall alien creature, crescent-shaped head, soft narrow
> body, two softly glowing legs, elegant but goofy, quirky parallel
> universe science game, crisp 16-bit pixel art sprite, isolated,
> limited palette, no text, plain background

### A008 --- `creature_plim`

**Filename:** `creatures/creature_plim.png`\
**Design:** cube organism whose face appears on different surfaces.

**Prompt:**

> cute original cube-shaped alien organism, tiny face appearing on one
> cube surface, impossible playful geometry, quirky parallel universe
> laboratory creature, crisp 16-bit pixel art sprite, isolated, limited
> palette, no text, plain background

### A009 --- `creature_noxu`

**Filename:** `creatures/creature_noxu.png`\
**Design:** floating jelly with blinking core.

**Prompt:**

> cute original floating jelly alien, translucent rounded body, bright
> blinking central core, tiny dangling appendages, friendly strange
> laboratory specimen, retro futuristic parallel universe, crisp 16-bit
> pixel art sprite, isolated, limited palette, no text, plain background

### A010 --- Prop sprite sheet

**Source filename:** `props/props_anomaly_sheet_source.png`\
**Export individual files:**

-   `props/prop_flux_crystal.png`
-   `props/prop_reactor_orb.png`
-   `props/prop_antenna.png`
-   `props/prop_antigravity_rock.png`
-   `props/prop_alien_plant.png`
-   `props/prop_tiny_satellite.png`
-   `props/prop_anomaly_blob.png`
-   `props/prop_portal.png`

**Priority:** 3--4 props required; full set optional.

**Prompt:**

> pixel art sprite sheet of eight quirky retro-futuristic parallel
> universe laboratory objects: floating flux crystal, glowing reactor
> orb, crooked antenna, anti-gravity rock, tiny alien plant, miniature
> satellite, soft anomaly blob, small dimensional portal, each object
> isolated with generous spacing, consistent scale, playful electric
> science fiction, crisp 16-bit pixel art, limited palette, no text,
> plain background

### A011 --- Logo concept reference

**Filename:** `branding/logo_concept_reference.png`\
**Priority:** OPTIONAL REFERENCE ONLY

Midjourney should **not** create the final wordmark because the spelling
and reversed `ᴎ` must be exact.

**Prompt:**

> visual moodboard for a quirky pixel-art science fiction game logo,
> wrong universe, inverted letter motif, playful broken computer
> convention, retro electric laboratory aesthetic, chunky pixel
> lettering inspiration, asymmetrical baseline, cute not horror, no
> requirement for readable or correct text

Build the actual **WrongUIᴎverse** title in HTML/CSS or manually
authored pixel lettering.

## 5. Asset Processing Rules

Midjourney outputs are concept/source art, not guaranteed production
sprites.

For each selected source:

1.  crop the chosen object/pose,
2.  remove background,
3.  simplify noisy details,
4.  resize/redraw to a consistent logical pixel grid,
5.  export PNG with transparency where appropriate,
6.  use integer scaling in the browser,
7.  set `image-rendering: pixelated`.

Do not spend time producing large animation sheets. CSS should handle
bobbing, shaking, floating, glow, glitch, and success bounce.

## 6. UI Library / Generated-Art Boundary

Use **NES.css** for the initial 8-bit component language. It is CSS-only
and MIT-licensed. The game still owns layout, palette, semantic
remapping, terminal shell, and special effects.

Use library/CSS for:

-   containers and pixel borders,
-   buttons,
-   checkbox/radio styling,
-   progress presentation,
-   basic form-control visual language.

Use custom CSS for:

-   slider/date/time/color/file/calculator/tabs treatment where NES.css
    does not cover the needed control,
-   universe palette shifts,
-   electric glow,
-   scanlines,
-   tiny terminal lights,
-   distortion/glitch,
-   stage transitions.

Use generated art only for:

-   background/environment,
-   mascot/creatures,
-   anomaly props,
-   optional branding reference.

This boundary is intentional: the game depends on real browser controls
remaining programmable.

## 7. Theme Color System

The default **WrongUIᴎverse** theme should feel like a playful
parallel-universe science terminal: dark enough for luminous controls,
colorful enough to feel curious rather than dystopian, and deliberately
a little "electrically wrong."

### Core Palette --- `HOME / ELECTRIC LAB`

  -----------------------------------------------------------------------
  Token                   Hex                     Role
  ----------------------- ----------------------- -----------------------
  `--space-950`           `#090B18`               deepest page/background

  `--space-900`           `#11152A`               terminal shell / large
                                                  panels

  `--space-800`           `#1A2040`               raised panels / input
                                                  backgrounds

  `--terminal-ink`        `#F4F2E8`               primary text; warm
                                                  off-white

  `--terminal-muted`      `#A9B0C7`               secondary labels /
                                                  inactive text

  `--electric-cyan`       `#38E8FF`               primary interaction
                                                  accent / focus / active
                                                  controls

  `--inverse-lime`        `#C8FF4D`               success, discoveries,
                                                  "correctly wrong"
                                                  moments

  `--anomaly-violet`      `#B46CFF`               reality shift /
                                                  semantic drift /
                                                  special universe accent

  `--warning-coral`       `#FF6B72`               warning, mismatch,
                                                  timer urgency

  `--flux-amber`          `#FFC857`               hints, observation
                                                  notebook, curiosity
                                                  state

  `--void-mint`           `#72F2C2`               optional secondary cool
                                                  highlight
  -----------------------------------------------------------------------

### Intended Visual Balance

Do **not** make every object neon.

Approximate visual weighting:

-   65--75% deep-space navy / dark terminal surfaces
-   15--20% off-white and muted text
-   5--10% electric cyan
-   remaining accents split between lime, violet, coral, amber, and mint

This keeps the screen readable and lets the "wrong" moments actually
pop.

### Semantic Color Roles

Use colors consistently for game feedback even though widget
**semantics** are intentionally inconsistent.

-   **Cyan** = interactive / selected / focus
-   **Lime** = discovery / correct / stabilized
-   **Violet** = reality anomaly / semantic shift
-   **Coral** = mismatch / urgency / unstable
-   **Amber** = hint / clue / observation
-   **Off-white** = ordinary terminal information

The game can lie about what a slider *means*. It should not randomly
change the entire feedback language every second.

### Stage Treatment

#### Stage 1 --- HOME UNIVERSE

Mostly stable navy + cyan + off-white.

-   Background: `#090B18`
-   Panels: `#11152A` / `#1A2040`
-   Primary accent: `#38E8FF`
-   Success: `#C8FF4D`

The interface should look orderly and trustworthy.

#### Shift Transition

Briefly introduce anomaly violet and coral:

-   `#B46CFF`
-   `#FF6B72`

Use palette inversion/flicker sparingly for the 1--2 second shift.

#### Stage 2 --- SEMANTIC DRIFT

Keep the same base palette, but increase violet presence and use amber
for hints.

This is important: the universe should feel changed without becoming a
completely different website.

#### Stage 3 --- STABILIZE

Return cyan to the foreground. Introduce coral as timer pressure and
lime as each requirement locks into place.

On completion, let lime briefly dominate before settling back to the
base theme.

### CSS Tokens

Claude should begin with these tokens in `universe-variables.css`:

``` css
:root {
  --space-950: #090b18;
  --space-900: #11152a;
  --space-800: #1a2040;

  --terminal-ink: #f4f2e8;
  --terminal-muted: #a9b0c7;

  --electric-cyan: #38e8ff;
  --inverse-lime: #c8ff4d;
  --anomaly-violet: #b46cff;
  --warning-coral: #ff6b72;
  --flux-amber: #ffc857;
  --void-mint: #72f2c2;

  --bg-page: var(--space-950);
  --bg-panel: var(--space-900);
  --bg-control: var(--space-800);
  --text-primary: var(--terminal-ink);
  --text-secondary: var(--terminal-muted);

  --accent-primary: var(--electric-cyan);
  --accent-success: var(--inverse-lime);
  --accent-anomaly: var(--anomaly-violet);
  --accent-danger: var(--warning-coral);
  --accent-hint: var(--flux-amber);
}
```

Use CSS custom properties rather than scattering literal hex values
through components. This makes Cursed Universes and future palette
variants inexpensive.

### Universe Palette Variants

Different universes should usually **remap accent roles**, not require
new art.

Examples:

**VOID MINT** - primary → `#72F2C2` - anomaly → `#B46CFF`

**FLUX AMBER** - primary → `#FFC857` - anomaly → `#FF6B72`

**INVERSE VIOLET** - primary → `#B46CFF` - success → `#C8FF4D`

**MOSTLY NORMAL** - deliberately desaturate anomaly effects until the
player discovers the one wrong mapping.

Rare Cursed Universes may temporarily violate the normal palette, but
the default game should always remain recognizably WrongUIᴎverse.

### Midjourney Palette Phrase

Append this phrase to generated environment/creature prompts when
useful:

> deep-space navy base, electric cyan highlights, radioactive lime
> details, anomaly violet glow, tiny warm coral and amber accents,
> limited cohesive 16-bit game palette

Do not require Midjourney to reproduce exact hex values. Exact color
consistency is enforced during sprite cleanup and in CSS.

## 8. Pixel Art Implementation

Recommended:

-   Render sprites at native low resolution.
-   Scale with integer multiples.
-   Use `image-rendering: pixelated`.
-   Avoid fractional sprite scaling.
-   Keep character sprites roughly 24×24, 32×32, or 48×48 logical
    pixels.
-   Keep animations 2--4 frames when possible.

CSS can handle:

-   bobbing
-   shaking
-   floating
-   glow
-   brief chromatic offset
-   screen flicker
-   scan line
-   success bounce

This avoids generating many animation frames.

## 9. Shift Transition

The transition between Stage 1 and Stage 2 is a major identity moment.

Target duration: approximately 1--2 seconds.

Sequence idea:

1.  Terminal briefly freezes.
2.  Small electrical pop.
3.  UI shifts horizontally by a few pixels.
4.  Palette flickers.
5.  Decorative objects float upward as gravity briefly reverses.
6.  Text appears:

**REALITY INDEX LOST**

then:

**SEMANTIC DRIFT DETECTED**

7.  Stage 2 begins.

Keep it short. It should be fun on the twentieth playthrough.

Provide reduced-motion alternative.

## Semantic Content and Assets

Semantic-specific art should remain optional.

The expanded V0 semantic set includes:

-   Action
-   Boolean
-   Choice
-   Quantity
-   Number
-   Text
-   Date
-   Time
-   Color
-   Arithmetic
-   Navigation
-   Progress
-   Data / File

Most of these should be represented through HTML, typography, CSS, and
generated labels rather than unique art.

Generated pixel-art assets are most useful for **Choice** and
**Navigation** flavor: creatures, planets, sectors, props, and
locations. A random semantic value should never require a unique image
asset to exist.

## 10. Sound Direction

Music:

**minimal funky electronic laboratory groove**

Think:

-   playful synth bass
-   tiny drum machine
-   electronic percussion
-   short arpeggio
-   odd bleeps
-   slightly off-kilter rhythm
-   curious, not stressful

Avoid:

-   cinematic soundtrack
-   huge EDM drops
-   aggressive glitch noise
-   constant high-frequency beeping

The music should tolerate looping for many short runs.

## 11. Music Asset Budget

V0 needs only 2--3 loops.

### 1. Calibration Loop

Normal, orderly, slightly sterile.

Approx. 45--90 second seamless loop.

### 2. Shift / Exploration Loop

Same musical identity but stranger:

-   syncopation
-   warped synth
-   slightly unstable pitch texture
-   more playful bass

### 3. Challenge Loop --- optional

Faster or more rhythmic version of the exploration loop.

Alternatively, reuse exploration music and add a ticking/percussion
layer during Challenge.

This is cheaper and creates continuity.

## 12. Sound Effect Budget

Keep it tiny: roughly 10 reusable SFX.

1.  UI ordinary click
2.  UI value tick
3.  UI selection confirmation
4.  Semantic "weird output" blip
5.  Reality shift zap
6.  Timer warning
7.  Challenge item correct
8.  Challenge complete
9.  Failure / mismatch buzz
10. Creature chirp

Optional:

11. New universe boot
12. Result stamp

Each should be very short.

## 13. SFX Character

Sound keywords:

-   electric
-   funky
-   synthetic
-   bubbly
-   tactile
-   arcade
-   tiny
-   slightly alien

Examples:

**UI click:** dry synth tick\
**Value movement:** tiny ascending/descending blips\
**Shift:** short electrical sweep + reversed pop\
**Correct:** bright two- or three-note synth chirp\
**Complete:** compact funky chord/stinger\
**Creature:** synthesized "bwoop" rather than realistic animal noise

## 14. Generating / Sourcing Audio

Prefer:

-   small custom synth sounds,
-   CC0/licensed SFX,
-   procedural Web Audio bleeps,
-   generated music with clear commercial-use rights if the game is
    distributed.

Many UI sounds can be created procedurally with Web Audio API, reducing
asset count dramatically.

For V0, a strong option is:

-   one music loop,
-   Web Audio generated click/tick/confirmation sounds,
-   one authored shift sound.

## 15. Audio Behavior

Audio should reinforce game states.

### Stage 1

Stable beat.

Predictable UI clicks.

### Shift

Music briefly filters/cuts.

Reality-shift zap.

### Stage 2

Funkier/stranger variation.

Each new interpreted output gets a tiny blip.

### Stage 3

Add subtle rhythmic urgency.

Correct requirements produce satisfying tonal confirmations that stack
harmonically.

Completing the final requirement resolves into a short chord/stinger.

This can make a compound challenge feel satisfying without additional
visual assets.

## 16. UI Typography

Use a readable pixel-inspired display font only for:

-   headings
-   status messages
-   flavor labels

Use a highly readable UI font for:

-   task requirements
-   values
-   timers
-   form controls

Do not sacrifice readability for retro aesthetics.

## 17. Animation Budget

Keep animation mostly procedural/CSS.

Recommended reusable animations:

-   idle float
-   blink
-   success bounce
-   error shake
-   terminal flicker
-   reality glitch
-   particle sparkle
-   anti-gravity drift

Eight reusable animations are enough.

## 18. Asset Naming

Use the exact IDs and filenames defined in **V0 Asset Manifest**. Do not
rename assets ad hoc during implementation.

Runtime code should reference semantic asset IDs from the technical
design, with a single manifest mapping IDs to files. Optional art must
have CSS/placeholder fallbacks so missing decorative assets do not block
gameplay.

## 19. What NOT to Generate Yet

Do not spend Midjourney time on:

-   dozens of backgrounds
-   complete creature animation sheets
-   UI controls
-   buttons with text
-   icons for every semantic
-   cutscenes
-   story illustrations
-   unique art for every random value

The game must first work with plain HTML controls.

## 20. V0 Art Milestone

A visually complete V0 requires only:

1.  NES.css installed and overridden by the WrongUIᴎverse theme.
2.  `bg_calibration_lab`.
3.  Zorblet idle/confused/success states.
4.  At least 3 anomaly props from A010.
5.  Real HTML/CSS gameplay widgets.
6.  Actual `WrongUIᴎverse` wordmark implemented in code/manual
    lettering.
7.  Calibration + Shift music loops.
8.  Core UI/shift/correct/error SFX.

Secondary creatures A005--A009 can be added incrementally. Do not delay
mechanics for them.

The goal is a coherent, funny playable terminal---not a large art
library.
