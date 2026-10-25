// ── Lessons: light ───────────────────────────────────────────
// Flicker under mains power, spill off a lit backdrop, then lighting a
// model on a turntable. Bodies are markdown; no backticks or
// dollar-braces inside a body, because the file is template literals.

export const LIGHT_LESSONS = [
  {
    id: 'flicker-and-shutter',
    title: 'Flicker under mains light',
    level: 'basics',
    track: 'light',
    order: 10,
    basis: 'physics',
    summary: 'Mains light pulses at twice the supply frequency. A shutter spanning whole pulses collects the same light every frame; anything else bands.',
    menu: ['shutter-speed', 'var-shutter', 'anti-flicker', 'auto-slow-shut', 'frame-rate'],
    tools: ['flicker'],
    related: ['shutter-speed', 'exposure-triangle', 'exposure-advanced'],
    body: `
Both halves of each AC cycle produce light, so a mains-powered lamp pulses at twice the supply frequency: 100 pulses per second on 50Hz mains, 120 on 60Hz.

### The arithmetic

A shutter interval that spans a whole number of pulses collects the same light every frame. One that does not collects a varying amount, and the variation is the banding.

- At 50Hz the pulse lasts 10ms. The clean speeds on the dial are 1/4, 1/5, 1/10, 1/20, 1/25, 1/50 and 1/100.
- At 60Hz it lasts 8.33ms. The clean set runs 1/4, 1/5, 1/6, 1/8, 1/10, 1/15, 1/20, 1/30, 1/40, 1/60.

This is why 1/120 bands at 50Hz: 8.33ms of exposure spans 0.83 of a 10ms pulse, so each frame catches a different slice of the cycle. And at 60Hz mains, 1/120 is arithmetically clean but is not on the 1/3-stop run (the dial goes 1/100, then 1/125), so reaching it needs Var. Shutter. The **Shutter and flicker** calculator does this arithmetic for any combination.

### The 180-degree compromise

The 180-degree convention wants the shutter at twice the frame rate. At 25p under 50Hz mains the ideal, 1/50, is also clean: no compromise. At 60p under 50Hz it is not, and the nearest clean speed is 1/100, about a quarter of a stop from ideal. When the two disagree, the flicker-clean speed wins: banding is expensive and unreliable to fix in post, and a fraction of a stop of motion blur is barely noticed.

### Three rows on the body

- **Anti-flicker Set.** is a stills feature. Sony lists it as unavailable in movie shooting mode, and it detects only 100Hz or 120Hz sources on a half-press. For video it does nothing.
- **Var. Shutter** is the one anti-flicker control Sony documents for movies. It exposes fine-grained speeds in decimal form for chasing a frequency no standard step divides, and it is selectable only in S or M with the shutter set by hand. In any other mode the tool exists but is unreachable.
- **Auto Slow Shut.** lets the camera lengthen the exposure in dim light. That silently undoes the shutter you chose for flicker, and only sometimes, so takes come out inconsistent. Off.

### LED panels are a separate problem

Dimmable LED panels commonly pulse at their driver's frequency, which has nothing to do with mains, so no speed derived from 50Hz cancels it. Whether a given panel flickers is unrecorded until you test it. Point the camera at the panel at a fast shutter and look for bands, or film it with a phone in slow motion (a field habit, not a spec, and it works). Running a panel at full brightness often stops the pulsing entirely.
`,
  },
  {
    id: 'spill-and-separation',
    title: 'Backdrop spill and subject separation',
    level: 'intermediate',
    track: 'light',
    order: 20,
    basis: 'physics',
    summary: 'A lit green backdrop is a green light source aimed at your subject. Move the subject, re-aim the light, flag it, and only then correct colour.',
    menu: [],
    tools: ['spill'],
    related: ['colour-cast-vs-white-balance', 'white-balance', 'correction-stacking', 'turntable-lighting'],
    body: `
Point a key light at a saturated backdrop and the backdrop stops being scenery. A lit green surface is a green light source, and it is aimed at the back of your subject. The tint shift toward magenta, the saturation push, the per-clip HSL work in post: all of it is downstream of this one decision.

A backdrop needs only enough light to read as its colour and be evenly lit. That is usually far less than a key light's worth, aimed across the surface rather than into it.

### Why distance underdelivers up close

The figure people quote comes from the inverse-square law: move the subject from 5cm to 50cm and spill drops a hundredfold. But inverse-square describes point sources, and a lit backdrop is a broad flat one. Cadrage models it as a uniform disc instead: falloff tends to inverse-square once the subject is well back, and to almost none while the subject sits closer than the backdrop's half-width (75cm on a 150cm-wide surface). Inside that near field the honest estimate is a range between the disc model and the point model, and the low end is the likely one: moving back buys a real reduction, just far less than the quoted figure. The **Backdrop spill falloff** calculator reports both bounds instead of one confident-wrong number.

Distance is still the cheap fix. It costs nothing and needs no gear, and past roughly the half-width, inverse-square becomes a fair approximation and every centimetre starts paying properly.

### The order of fixes

1. **Move the subject** as far from the backdrop as the frame allows. Free, so it goes first.
2. **Re-aim the light** so it rakes across the backdrop instead of firing into it. Aiming the light off the backdrop moves more than distance does.
3. **Flag it.** A card or flag between the backdrop and the subject cuts the bounce path. Standard grip practice rather than anything in a menu.
4. **Only then correct colour.** White balance applies to the whole frame: a shift that neutralises the green cast pushes the subject the same distance toward magenta. Reduce the spill at its source and white balance goes back to describing your key light.

### What the Review reads

The Review works from the recorded room, not from the frame. A light aimed at a green backdrop is a Contradiction, named as the root cause. A subject inside the near field gets the honest range rather than the inverse-square promise. A white balance shifted two or more tint steps against a green backdrop is read as correcting a lighting problem.
`,
  },
  {
    id: 'turntable-lighting',
    title: 'Lighting a model on a turntable',
    level: 'intermediate',
    track: 'light',
    order: 30,
    basis: 'physics',
    summary: 'Three lights, three jobs: key, fill and rim. Distance before buying, large soft sources for gloss, and colour you do not have to correct.',
    menu: ['iso', 'aperture', 'white-balance', 'zebra-level'],
    tools: ['lights'],
    related: ['iso-and-exposure', 'depth-of-field', 'spill-and-separation', 'white-balance', 'flicker-and-shutter'],
    body: `
A model kit on a turntable is a hard subject to light. It is small, so a light's distance changes fast compared with its size. It is glossy or metallic in places, so it reflects the lights themselves. And it turns: every side passes the camera, and a light that flatters the front lights the back badly half a turn later.

### Three lights, three jobs

- **Key.** In front of the model, about 45 degrees off the camera axis, and the closest light. It sets the exposure and draws the shape.
- **Fill.** On the other side, about half the key: farther away or dimmer, a stop under. It keeps the shadow side from going black without erasing it.
- **Rim.** Behind the model and above it, aimed at the model's edges rather than at the backdrop. It outlines a dark model against a black background, which nothing in front can do.

Three panels all in front do something else. Two equal lights from the front give twice the light of one; a third from the front adds only half again, a little over half a stop, and it fills the very shadows that show the shape. The same third panel used as a rim adds no exposure, because exposure is set on the side facing the camera, and it gives the model an edge.

### Distance before buying

Light from a small source falls with the square of the distance: half the distance gives four times the light, and 70% of the distance gives twice the light, one stop. Moving the key and the fill closer costs nothing, and on a table it is usually the largest single gain there is.

Exposure counts the light that lands on the side facing the camera, where the white card is held. A light at 45 degrees puts about 71% of its light there, and a rim behind puts none.

Broad sources bend the square law up close. A panel or a softbox is a surface, not a point, and while the model is about as close as the source is wide, moving the source closer gains less than the square promises: a 60 x 60 softbox brought from 60 cm to 30 cm gives about 2.3 times the light, not 4. The same property is why it lights the whole model evenly.

### What the light buys

The incident-light exposure equation turns light into settings: E = N² x C / (t x S), with E the light on the card in lux, N the f-number, t the shutter time, S the ISO and C about 250 for a flat card (ISO 2720 allows 240 to 400). At f/8 and 1/100, ISO 800 asks for about 2,000 lux. Twice the light buys a stop, and there are two ways to spend it:

- **A lower ISO.** 2,000 lux at ISO 800 becomes 4,000 lux at ISO 400. On this a6700 an ISO ladder in Cine4 found the gain step between ISO 320 and 400 (your notes, 2026-10-24), so 400 is the lowest ISO of the cleaner stage. ISO 320 and 250 sit below the step: at the same light they measured noisier than 400, and an ISO under 400 pays only with much more light. Never darken the picture with ISO; use the aperture or the dimmer.
- **More depth of field.** The same doubling turns f/8 into f/11, about 40% more depth: 9 cm instead of 6.5 cm at 1 m, judged at 1080p. That keeps wings and weapons sharp as they swing toward the lens. It works only with the model centred on the turntable: anything off the axis swings toward and away from the focus once a turn, by more than any aperture holds.

### Soft light for gloss and metal

A glossy or metallic part does not show the light so much as reflect the light source. A small source, a bare LED or a reflector, makes a small hard hot spot that slides across the part as it turns. A large source close to the model makes a smooth gradient instead. What counts is the size as the model sees it: a 60 cm softbox 60 cm away is a large source, the same softbox 3 m away is a small one.

- **Diffusion** smooths a light. The translucent disc of a 5-in-1 reflector held over a panel's face blends its LED dots into one even highlight; held farther from the panel it also makes the source larger, though more of the light then misses it. It costs about a stop, so diffusion pays only once the light is close. Keep a disc out of the frame: with the 55mm at 1 m, an 80 cm disc at 45 degrees and closer than about 50 cm reaches into the picture.
- **A softbox** does the same job for a COB light: it spreads one bright point over 60 cm and keeps the light pointed forward. Makers rarely publish the light through one. Aputure and amaran do for larger lights, and there a 55 to 90 cm softbox gives 0.36 to 0.55 of the bare light at 1 m: about a stop down.
- **Cards** finish the job: a white card beside the model bounces light into the dark side, and a black card takes an unwanted reflection out of a glossy panel.

### Colour you do not have to correct

Two indices describe how faithfully a light renders colour, and both run to 100. CRI (its Ra figure) scores eight pastel samples as the eye sees them. TLCI was built for the EBU, Europe's broadcasters' union, to score how a television camera renders colours under the light.

Cheap panels publish neither, and many lean green, so the camera needs a magenta shift on the white balance before a white card comes out neutral. That fixes the white and leaves the rest: a light missing parts of the spectrum renders gold, decals and saturated reds wrong in ways no white balance undoes. A light rated CRI 96 and TLCI 97 or better should need no magenta shift, and a custom white balance on the card does the rest.

Mixed lights show it: beside a neutral key, green panels used as fill or rim keep their green in the shadows. A 1/8 minus green gel (a pale magenta) on each panel brings them close. Set the white balance on the key.

### Measure what you have

Generic panels state no output, so measure one with the camera as the meter: one panel alone at full power, 1 m from the white card and facing it, at f/8 and 1/100. Raise the ISO until the card reads the level you expose it at. The light at 1 m is 1,600,000 divided by that ISO: 2,000 lux at ISO 800, 1,000 at ISO 1600, 500 at ISO 3200. Type it into the [lighting simulator](#/tools/lights) and every panel there follows it.

### In order of cost

- **Free.** Give each light its job, then bring the key and the fill closer. At 70% of the distance the light doubles, which is the stop from ISO 800 to 400.
- **Cheap.** Diffusion for the glossy parts. It spends the stop that moving closer gained, so it is a trade, not an upgrade.
- **Best value.** One high-CRI COB light as the key, in a softbox, with the panels kept as fill and rim: about as much light as the panels give up close, but soft, and with a white that needs no correction.
- **More.** A second COB as the fill, so the shadows carry no green either.

The simulator works each tier out at your exposure, and the panel under it lists the lights with their figures, prices and shops in Chile, each price with the date it was checked.
`,
  },
];
