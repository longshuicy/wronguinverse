# WrongUIᴎverse --- Art, Asset & Audio Direction

> **Display title:** **WrongUIᴎverse**  
> **ASCII / technical name:** `wronguinverse`  
> The title intentionally combines **Wrong + UI + inverse + universe**. The reversed **ᴎ** should be treated as a visual branding element; use the ASCII name for repository names, URLs, package identifiers, and other tooling-sensitive contexts.

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

Use the exact title **WrongUIᴎverse**. The unusual capitalization is part of the concept.

Visually emphasize the adjacent **U** and **I** so viewers can discover “UI” inside “universe.” Possible treatments include:

- contrasting font weight between U/I and the surrounding letters,
- slightly different pixel typefaces for U and I,
- offsetting one letter by a pixel or two,
- reversing/inverting one letter during the reality-shift animation,
- briefly glitching the U/I pair independently from the rest of the wordmark.

Keep the permanent logo readable and cute rather than heavily glitched. Do not rely on Midjourney to render the final title; create the wordmark with real typography/CSS or manually authored pixel lettering.

Optional tagline: **Everything works as unintended.**

## 2. Visual Direction

Keywords:

- pixel art
- retro-futuristic
- electric
- weird
- cute
- slightly glitchy
- scientific terminal
- parallel universe
- compact arcade machine
- playful rather than dystopian
- 16-bit / 32-bit-inspired, but clean enough for modern screens

Avoid:

- photorealism
- huge detailed backgrounds
- complex character animation
- excessive cyberpunk neon
- dark horror
- unreadable glitch effects
- assets containing important UI text

## 3. Visual Hierarchy

The screen should have three layers.

### Layer A --- Gameplay UI

Real HTML/CSS controls.

These must remain crisp and readable.

Examples:

- sliders
- checkboxes
- dropdowns
- date controls
- text fields
- color controls

They can be styled to match the terminal, but must still visually
communicate their conventional widget identity.

This is essential to the game concept.

### Layer B --- Terminal Shell

Reusable pixel-art framing:

- panel borders
- corner brackets
- warning lights
- small screens
- cables
- indicator LEDs
- vents
- tiny antenna
- scan lines
- decorative meters

Mostly CSS + a few sprite assets.

### Layer C --- Parallel-Universe Flavor

Small decorative creatures and phenomena:

- creatures observing the terminal
- floating anomaly
- tiny moon
- anti-gravity object
- portal
- strange plant
- floating crystal
- miniature satellite

These do not need gameplay logic in V0.

## 4. Asset Budget

V0 can ship with approximately:

### Backgrounds

1.  Main calibration lab / terminal background
2.  Shifted-universe variant
3.  Optional result-screen variant

These can potentially be one background with CSS effects rather than
three separate assets.

### Creatures

Generate 6--8 small fictional creatures.

Each creature needs only:

- idle
- blink / secondary idle
- excited/success

Optional:

- confused

That is 3--4 states, not full animation sets.

### Decorative Objects

8--12 reusable objects:

- floating crystal
- tiny moon
- portal
- antenna
- reactor
- plant
- cube
- orb
- satellite
- anomaly blob
- cable creature
- anti-gravity rock

### UI Decorations

Prefer CSS.

Only generate sprites if needed:

- warning icon
- reality-shift icon
- tiny terminal mascot
- star/spark particles
- portal particles

## 5. Creature Design

Creatures should look like things that do not have obvious real-world
categories.

Avoid simply:

- cat
- dog
- fish
- snail

Instead use silhouettes that feel nameable but unfamiliar.

Examples:

### Zorblet

Round body, two uneven antennae, one oversized foot, floating ear-like
fins.

### Mip

Tiny triangular creature with three eyes and a tail shaped like a
cursor.

### Quonk

Squat blob with a transparent helmet and two disconnected floating
hands.

### Velori

Tall soft creature with a crescent head and tiny glowing legs.

### Plim

Cube-like organism with a face that shifts between its surfaces.

### Noxu

Small floating jelly creature with a blinking core.

The creatures exist mainly to make generated Choice domains charming.

## 6. Midjourney Strategy

Generate **sprite-sheet-like concept references**, then manually
crop/clean or redraw final tiny sprites as needed.

Do not rely on Midjourney to render text or actual gameplay controls.

Useful prompt structure:

> pixel art sprite sheet, six original cute alien creatures from a
> quirky parallel-universe computer game, retro futuristic laboratory
> aesthetic, simple silhouettes, limited palette, each creature isolated
> with clear spacing, front-facing and side-facing variations, playful
> electric science fiction, crisp pixel edges, no text, plain background

For a terminal environment:

> pixel art retro-futuristic parallel universe calibration laboratory,
> quirky scientific computer terminal, small arcade-like control
> station, floating anti-gravity objects, electric anomalies, playful
> not dystopian, compact composition, 16-bit inspired pixel art, no
> readable text, no characters blocking the interface

For decorative objects:

> pixel art sprite sheet of strange retro-futuristic laboratory objects,
> floating crystal, portal, antenna, reactor orb, anti-gravity rock,
> alien plant, tiny satellite, anomaly blob, isolated objects,
> consistent scale, limited palette, no text

Important: use generated art as inspiration/source assets, but keep the
actual HTML UI native and controllable.

## 7. Palette

Keep one base interface palette and allow universe shifts through CSS
variables.

Suggested conceptual palette roles:

- near-black / deep-space background
- dark terminal panel
- bright electric accent
- warm warning accent
- pale terminal text
- secondary cool accent
- success highlight

Do not make every object neon.

The "electric" quality should come from accents and animation.

### Universe Variation

Each generated universe can shift CSS variables:

- accent hue
- background hue
- warning hue
- glow intensity

This creates visual variation without new art assets.

## 8. Pixel Art Implementation

Recommended:

- Render sprites at native low resolution.
- Scale with integer multiples.
- Use `image-rendering: pixelated`.
- Avoid fractional sprite scaling.
- Keep character sprites roughly 24×24, 32×32, or 48×48 logical
  pixels.
- Keep animations 2--4 frames when possible.

CSS can handle:

- bobbing
- shaking
- floating
- glow
- brief chromatic offset
- screen flicker
- scan line
- success bounce

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

## 10. Sound Direction

Music:

**minimal funky electronic laboratory groove**

Think:

- playful synth bass
- tiny drum machine
- electronic percussion
- short arpeggio
- odd bleeps
- slightly off-kilter rhythm
- curious, not stressful

Avoid:

- cinematic soundtrack
- huge EDM drops
- aggressive glitch noise
- constant high-frequency beeping

The music should tolerate looping for many short runs.

## 11. Music Asset Budget

V0 needs only 2--3 loops.

### 1. Calibration Loop

Normal, orderly, slightly sterile.

Approx. 45--90 second seamless loop.

### 2. Shift / Exploration Loop

Same musical identity but stranger:

- syncopation
- warped synth
- slightly unstable pitch texture
- more playful bass

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

- electric
- funky
- synthetic
- bubbly
- tactile
- arcade
- tiny
- slightly alien

Examples:

**UI click:** dry synth tick\
**Value movement:** tiny ascending/descending blips\
**Shift:** short electrical sweep + reversed pop\
**Correct:** bright two- or three-note synth chirp\
**Complete:** compact funky chord/stinger\
**Creature:** synthesized "bwoop" rather than realistic animal noise

## 14. Generating / Sourcing Audio

Prefer:

- small custom synth sounds,
- CC0/licensed SFX,
- procedural Web Audio bleeps,
- generated music with clear commercial-use rights if the game is
  distributed.

Many UI sounds can be created procedurally with Web Audio API, reducing
asset count dramatically.

For V0, a strong option is:

- one music loop,
- Web Audio generated click/tick/confirmation sounds,
- one authored shift sound.

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

- headings
- status messages
- flavor labels

Use a highly readable UI font for:

- task requirements
- values
- timers
- form controls

Do not sacrifice readability for retro aesthetics.

## 17. Animation Budget

Keep animation mostly procedural/CSS.

Recommended reusable animations:

- idle float
- blink
- success bounce
- error shake
- terminal flicker
- reality glitch
- particle sparkle
- anti-gravity drift

Eight reusable animations are enough.

## 18. Asset Naming

Suggested structure:

```text
public/
  art/
    backgrounds/
    creatures/
      zorblet/
      mip/
      quonk/
    props/
    fx/

  audio/
    music/
    sfx/
```

File examples:

```text
zorblet_idle_01.png
zorblet_idle_02.png
zorblet_success_01.png

prop_flux_crystal.png
prop_antigrav_rock.png

sfx_shift_zap.ogg
sfx_correct.ogg
music_calibration_loop.ogg
music_shift_loop.ogg
```

## 19. What NOT to Generate Yet

Do not spend Midjourney time on:

- dozens of backgrounds
- complete creature animation sheets
- UI controls
- buttons with text
- icons for every semantic
- cutscenes
- story illustrations
- unique art for every random value

The game must first work with plain HTML controls.

## 20. V0 Art Milestone

Only after the mechanical prototype is fun:

1.  Choose one terminal visual direction.
2.  Generate one background concept.
3.  Generate 6 creature concepts.
4.  Select/redraw 3 creatures for V0.
5.  Add one shift visual effect.
6.  Add one music loop.
7.  Add approximately 6 SFX.
8.  Playtest again.

The art should amplify the feeling of entering a strange parallel
computer, not hide weak mechanics.
