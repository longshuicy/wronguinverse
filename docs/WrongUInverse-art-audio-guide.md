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

### A001 --- `bg_calibration_lab` --- RETIRED

**Filename:** `backgrounds/bg_calibration_lab.png`\
**Priority:** NOT USED (was REQUIRED)\
**Target:** wide background, compose for 16:9; final web version can be
cropped/scaled.\
**Usage:** none. The shell is a flat `--bg-page` surface with CSS
scanlines.

**Why it was retired.** Tried in the Milestone 3 build and removed. A
rendered environment painting worked against the game in three ways:

-   It was too loud. A detailed, high-contrast image behind translucent
    panels left nothing quiet enough for the interface to sit on, and
    forced a darkening veil that made the art pointless anyway.
-   It broke the palette. Generated art carries its own colours, so the
    screen stopped obeying the §7 weighting no matter what the tokens
    said.
-   It was not pixel art. Next to crisp 2px frames and a pixel typeface,
    a smooth render reads as a photograph behind a game rather than part
    of one.

A flat surface plus scanlines is both calmer and more convincingly 8-bit.

**If a background returns**, it should be authored at low resolution on
the same pixel grid as the UI, use only §7 palette colours, and stay
near-black in the centre two thirds. Treat it as a subtle texture, not a
picture. The manifest entry and loader fallback are still in place, so
dropping a file back in is a one-line change.

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
**Target:** 96px logical sprite after cleanup (see §8); 2--4 animation
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
sprites. A raw generation is roughly **100× too heavy to ship** and is
not on a pixel grid, so `image-rendering: pixelated` is actively wrong
for it.

This pipeline is **automated** --- do not hand-edit sprites:

``` bash
npm run art:clean    # process art-source/ into public/
npm run art:check    # verify shipped sprites are within budget (runs in CI)
```

### Where art lives

-   `art-source/creatures/`, `art-source/props/` --- raw generations.
    **Untracked**: they are heavy, and only the cleaned output ships.
    Keep your own copies; they are the master.
-   `public/creatures/`, `public/props/` --- cleaned sprites, committed.

Drop a new generation into `art-source/` with the exact filename from the
manifest in §4 and re-run `npm run art:clean`. Unchanged files are
skipped.

### What the script does

Implementing steps 1--5 below in `scripts/clean-sprites.mjs`:

1.  **crop** --- trims the empty margin around the subject,
2.  **background** --- already transparent in practice; alpha is
    preserved,
3.  **simplify noisy details** --- deletes detached blobs under four
    pixels. Generated art is full of faint sparkles that survive the
    downscale as orphaned specks. Removal is by *connected component*, so
    anything joined to the body (Zorblet's thin antennae, a satellite's
    mast) is kept however spindly,
4.  **logical pixel grid** --- longest side to 96px for creatures, 64px
    for props, aspect preserved; then a hard alpha cutoff so silhouettes
    stay crisp when magnified, then quantisation to a limited palette
    with dithering off (dithering scatters noise at this size),
5.  **export** --- palette PNG with transparency.

Steps 6--7 are the renderer's job and now hold, because the input is
finally a real sprite: `AssetImage` magnifies by a whole number from the
source's true dimensions, and `.wui-sprite` sets
`image-rendering: pixelated`.

Typical result: **3.2 MB of raw art becomes 56 KB**, with every sprite on
grid.

### Budget

`npm run art:check` fails if any shipped sprite exceeds its category size
or 16 KB. It runs in CI, where `art-source/` does not exist, so it checks
the outputs --- which is the property that actually matters.

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

### Saturation Means Meaning

The weighting above is easy to blow accidentally. The rule that keeps it
honest:

**A saturated colour must carry information. Anything decorative is
muted.**

Practical consequences, learned by getting this wrong first:

-   **Structure is never accent-coloured.** Panel borders, dividers and
    inactive frames use `--line` or a `-dim` derivation. A panel outlined
    in full cyan competes with the one value inside it that matters.
-   **Large areas are dimmed even when they are meaningful.** The
    exploration timer is a full-width bar; at full strength it is the
    loudest thing on screen for 45 seconds. It runs dimmed and turns
    coral only when it becomes urgent --- which also makes urgency read.
-   **Decorative colour is desaturated.** When a colour-picker-shaped
    control is driven by a non-colour domain, its swatches are standing
    in for "position 1..10" and mean nothing. Those use a muted palette.
    A colour picker driven by an actual colour domain uses the real
    palette at full strength, because there the colour *is* the answer.
-   **Glow is not a colour strategy.** Blurred shadows read as neon web
    design, not pixel art. See §8.

If everything is emphasised, nothing is.

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

### Sprites

-   Render sprites at native low resolution.
-   Scale with integer multiples.
-   Use `image-rendering: pixelated` **only for sprites already reduced
    to a logical pixel grid and then scaled UP.** Applied to a raw
    high-resolution source being scaled *down* it discards pixels instead
    of averaging them and looks harsh --- use `auto` until the asset has
    been through the §5 cleanup.
-   Avoid fractional sprite scaling.
-   Never force an aspect ratio. Set one dimension, let the other follow.
-   **Creatures 96px on the longest side; props 64px.** Keep animations
    2--4 frames when possible.

### Why not 24/32/48

This guide originally called for 24--48px character sprites, and that
turned out to be too small for art of this kind. At 48px Zorblet's
antennae thinned below one pixel, broke into fragments, and the
despeckle pass then swept the fragments away --- the character lost a
defining feature, and what remained magnified into soft blobs.

The lesson generalises: **"blurry" almost always means detail was lost on
the way DOWN, not on the way up.** Reach for a larger logical grid before
reaching for a different scaling filter.

96px is the ceiling, not a floor to keep raising. At 128px the sprite
stops reading as pixel art and starts looking like a shrunken
illustration, because the pixels are no longer large enough to see.

Downscaling with a smooth kernel also softens every boundary, so the
pipeline sharpens after the resize. Without that the result is
technically on-grid but every edge is a gradient, which magnifies into
mush rather than into pixels.

### The CSS is what makes it look like pixel art

Most of the pixel-art feel comes from the interface, not the sprites.
A dark theme with 1px hairlines, rounded corners and soft glows reads as
an ordinary web app no matter how good the art is. The rules:

1.  **No curves.** `border-radius: 0` everywhere. The single exception is
    the radio control, which must stay round to remain identifiable as a
    radio (§3, Layer A).
2.  **No blur.** No `filter: blur`, no soft `box-shadow`, no gradients on
    panels. Frames are drawn with hard, offset shadows. Flat fills only ---
    translucency muddies a limited palette.
3.  **One grid unit.** Define `--px: 4px` and make every size, gap,
    padding and border a whole multiple of it. Nothing should ever land
    on a half pixel.
4.  **Chunky borders.** 2px minimum. A 1px hairline is invisible at this
    scale and reads as "web".
5.  **Step the animation.** Use `steps()` timing and move in whole
    pixels. A smoothly interpolated 1.5px slide is just blur.

### The notched frame

The strongest single "8-bit" signal is a panel border with cut corners.
Four offset shadows draw an edge on each side and leave the corners
empty:

``` css
box-shadow:
  0 calc(-1 * var(--border)) 0 0 var(--frame-color),
  0 var(--border) 0 0 var(--frame-color),
  calc(-1 * var(--border)) 0 0 0 var(--frame-color),
  var(--border) 0 0 0 var(--frame-color);
```

Use this for panels, cards and buttons instead of `border`.

### CSS-driven motion

CSS can handle, without extra frames:

-   bobbing, floating, shaking
-   success bounce
-   brief chromatic offset
-   screen flicker
-   scanlines (a `repeating-linear-gradient` on whole-pixel bands ---
    this is a genuine pixel effect, unlike a glow)

Prefer these to generated animation sheets.

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

Typography does more for the pixel-art read than any sprite. A system
monospace in a dark theme looks like a code editor, not a terminal from
another universe.

### Chosen faces

Both are SIL Open Font License 1.1 and are **self-hosted** in
`src/styles/fonts/` --- the game must not depend on the network at
runtime (technical design §1). Total cost is about 11 KB.

-   **Press Start 2P** --- the wordmark, and nothing else. Gloriously
    chunky and nearly unreadable in quantity.
-   **Silkscreen** --- **everything else, with no exceptions**: headings,
    labels, values, form controls, buttons, and running prose.

Set `-webkit-font-smoothing: none` so the pixel faces stay crisp.

### No system-font escape hatch

There is **no fallback to a system UI font anywhere in the theme**, not
even for descriptive paragraphs. A single sans-serif paragraph in the
middle of a pixel interface is instantly legible as "this part is a
website" and undoes the illusion the rest of the screen is building. The
world is a terminal in another universe; its terminal does not have
system-ui.

This overrides the usual advice to reach for a readable UI font in body
copy. Prose is set in Silkscreen and made readable by *typesetting*
rather than by changing typeface:

-   **Leading of about 2.0.** Rows of pixels merge without it; this is
    the single most important setting.
-   **No added letter-spacing.** The face already carries its own.
-   **Line length capped around 58ch.**
-   14px minimum for paragraphs.

Silkscreen renders as small caps, so prose reads as uppercase terminal
output. That is the intended voice, not a defect.

### Legibility floor

Pixel faces fall apart when set small and tracked wide. Learned the hard
way:

-   **Minimum 12px** for Silkscreen. At 10px it is mush.
-   **Keep tracking under about 0.08em.** Wide letter-spacing on a pixel
    face separates glyphs into unreadable fragments; it does not look
    more "terminal".
-   Size on the `--px` grid: 12, 14, 16, 20.
-   De-emphasised text needs **more** contrast than it would in a system
    face, not less. A pixel glyph has no anti-aliased edge to help it.

Readability is bought with size, leading and contrast --- never by
abandoning the typeface.

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

1.  The pixel CSS discipline in §8 --- grid, chunky borders, notched
    frames, no blur. *(done)*
2.  Self-hosted pixel typography per §16. *(done)*
3.  Flat terminal surface with scanlines. No background painting. *(done)*
4.  Zorblet idle/confused/success states. *(done)*
5.  Real HTML/CSS gameplay widgets. *(done)*
6.  Actual `WrongUIᴎverse` wordmark implemented in code/manual
    lettering. *(done)*
7.  At least 3 anomaly props from A010.
8.  NES.css installed and overridden by the WrongUIᴎverse theme --- only
    if it still earns its place. The hand-written theme now covers the
    control language it was wanted for, so adopting it is optional rather
    than assumed; it should not be allowed to reintroduce rounded corners
    or its own palette.
9.  Calibration + Shift music loops.
10. Core UI/shift/correct/error SFX.

Secondary creatures A005--A009 can be added incrementally. Do not delay
mechanics for them.

The goal is a coherent, funny playable terminal---not a large art
library.
