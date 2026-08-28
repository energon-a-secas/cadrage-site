// ── Lessons: light ───────────────────────────────────────────
// Flicker under mains power, then spill off a lit backdrop. Bodies
// are markdown; no backticks or dollar-braces inside a body, because
// the file is template literals.

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
    related: ['colour-cast-vs-white-balance', 'white-balance', 'correction-stacking'],
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
];
