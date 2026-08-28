// ── Lessons: colour ──────────────────────────────────────────
// White balance and casts first, then gamma, Log and LUTs. Same
// contract as exposure.js: markdown bodies in template literals, no
// backticks or dollar-brace inside a body. Sony claims trace to
// rules.js, menu.js, gammas.js and interactions.js; anything beyond
// them is named as convention in the prose.

export const COLOUR_LESSONS = [

  {
    id: 'white-balance',
    title: 'White balance, and the three ways to set it',
    level: 'basics',
    track: 'colour',
    order: 10,
    basis: 'sony-spec',
    summary: 'White balance describes the light so neutrals record neutral: three ways to set it, two shift axes, and one documented Log trap.',
    menu: ['white-balance', 'color-temp', 'awb-priority', 'log'],
    tools: [],
    related: ['colour-cast-vs-white-balance', 'log-vs-picture-profile'],
    body: `
White balance tells the camera what colour the light is, so that a neutral surface records as neutral. It is a description of the light, not a look: get the description right and everything in the frame keeps its own colour. On this body the rows live under Exposure/Color > Color/Tone.

### The three ways to set it

- **AWB.** The camera estimates the light on its own. Fine when you are moving between rooms; for controlled work the standard objection applies: a value the camera re-decides is a value that can change between takes.
- **C.Temp/Filter.** You state the colour temperature in kelvin, 2500K to 9900K in 100K steps. The number is a claim about the light, and the camera corrects for the light you claim, so a wrong claim shifts the whole frame.
- **Custom 1 to 3.** You run the custom white balance measurement, conventionally from a white or grey reference under the working light, and the result is stored in one of three registers. The most exact option, since it measures the light instead of describing it.

### The shift axes

Whatever sets the base, two axes shift it: **G-M** and **A-B**, each running -7 to +7. By convention the letters read green to magenta and amber to blue, and in this tool a positive G-M value is a shift toward magenta. Both sit on the Color Temp/Filter row, and both apply to the whole frame, which is the entire subject of the colour-cast lesson.

### Priority Set in AWB

Under AWB, **Priority Set in AWB** offers Standard, Ambience and White. The names suggest the bias (Ambience keeping the warmth of the scene, White favouring neutral whites), and that reading comes from the names, not from anything recorded in this tool's data. What is recorded: the setting only steers automatic white balance. With WB on C.Temp/Filter or a custom register the camera never consults it, and the Review lists it as doing nothing rather than letting it look like it matters.

### Custom WB and Log

Sony notes that Log Shooting set to On "may cause an error in the white balance custom setup". The documented workaround is to switch Log off, run the custom measurement, then turn Log back on. A custom register measured with Log already enabled is worth redoing, not trusting.
`,
  },
  {
    id: 'colour-cast-vs-white-balance',
    title: 'A colour cast is not a white balance error',
    level: 'intermediate',
    track: 'colour',
    order: 20,
    basis: 'industry-convention',
    summary: 'A tint shift that corrects the subject for backdrop spill treats a lighting problem as a colour problem; the camera cannot tell the difference.',
    menu: ['color-temp', 'white-balance'],
    tools: ['spill'],
    related: ['white-balance', 'spill-and-separation', 'correction-stacking'],
    body: `
Two failures look the same on the monitor: the light itself has a tint, or a coloured surface is bouncing onto the subject. White balance is the correct fix for exactly one of them.

### What a shift actually does

White balance applies to the whole frame. Against a green backdrop, a G-M shift of two or more steps toward magenta reads as a fix for green spill, but the shift moves the subject as much as it moves the cast. The result is a subject leaning magenta so that the background can look neutral. And when a light is aimed at the backdrop, the cast has a specific cause: a lit green surface is a green light source pointed at the back of your subject.

### Why the camera cannot tell, and the review can

The camera sees one frame and nothing else. It has no way to know whether the green arrived in the light or bounced off a surface, so it will record either answer. The review has what the camera lacks: the backdrop colour, where each light is aimed, and how far the subject stands from the surface. That context is what turns "the image is green" into "the backdrop is lighting your subject".

### Fix the light, not the description

- **Aim.** A backdrop needs only enough light to read as its colour and be evenly lit, usually far less than a key light's worth, aimed across the surface rather than into it.
- **Separation.** Distance helps less than the inverse-square figure suggests: a backdrop is a broad flat source, so inside its half-width the honest estimate is a range, and the low end is the likely one. The **Spill falloff** calculator prints both bounds.
- **A flag.** Something opaque between backdrop and subject blocks the bounce path directly. Standard lighting practice, not anything this body documents.

Fixing the spill at its source lets white balance go back to describing your key light.

### When the shift is the honest tool

When the tint is in the light itself, a G-M shift describes the light truthfully and corrects the whole frame at once. The usual field test is a white card beside the subject: if the card reads green, the light is green, shift away. If the card reads neutral and the subject does not, the green arrived by reflection, and no whole-frame correction fixes a local problem. Shifting anyway is how the same tint axis ends up corrected again in post, which is its own finding.
`,
  },

  {
    id: 'gamma-curves',
    title: 'Gamma curves, family by family',
    level: 'intermediate',
    track: 'colour',
    order: 30,
    basis: 'sony-spec',
    summary: 'A gamma curve decides how tones are written to the file, not colour. The A6700 groups its curves into families, and the documented presets each carry one.',
    menu: ['picture-profile', 'pp-gamma', 'creative-look'],
    tools: [],
    related: ['log-vs-picture-profile', 'luts', 'iso-and-exposure'],
    body: `
A gamma curve is the mapping between the brightness the sensor measured and the value written to the file. It decides how tones are distributed: where shadows sit, how highlights roll off, how much of the file the mid-tones get. It is not colour. Saturation, Color Mode and white balance are separate controls, and two setups can share a gamma while looking nothing alike in hue.

### The families on this body

Cadrage models the curves Sony documents for the A6700, grouped the way they behave:

- **Movie and Still.** The standard gammas: one for movie recording, one for still images.
- **Cine1 to Cine4.** Sony's one-line differences: Cine1 softens contrast in dark parts and emphasises tonal changes in bright parts, a gentle filmic image. Cine2 is close to Cine1 but optimised for editing, with up to 100% video signal. Cine3 strengthens the contrast between light and dark more than Cine1 and strengthens black gradation. Cine4 strengthens the contrast in dark parts more than Cine3.
- **ITU709 and ITU709(800%).** The broadcast pair. The 800% variant is documented for checking scenes on the assumption of shooting with S-Log2 or S-Log3.
- **S-Log2 and S-Log3.** Log curves. Both assume grading in post; S-Log3 has characteristics closer to film. Neither is a look; both are a storage format for tones.
- **HLG, HLG1 to HLG3.** The HDR family. HLG1 favours noise reduction with a narrower dynamic range, HLG3 favours dynamic range and carries more noise, HLG2 sits between. Under any HLG gamma, Sony fixes Black Gamma at 0 and limits Color Mode to BT.2020 or 709.

### Picture Profiles are presets that carry a gamma

Sony documents each numbered profile as an example setting built on a named gamma: PP1 is Movie, PP2 Still, PP3 and PP4 ITU709, PP5 Cine1, PP6 Cine2, PP10 HLG2. Nothing is documented for PP7 to PP9 or PP11 on this body, and neither Cine4 nor S-Log3 is assigned to any numbered preset. With Picture Profile off, Creative Look applies instead.

### Overriding the gamma inside a preset

The Gamma row under Picture Profile params can set a different curve inside any preset. That is legal, and the camera obeys it. But PP6 is documented as an example setting using Cine2, so PP6 with Cine4 inside it is no longer what PP6 means, and a note that just says PP6 will not reproduce the setup. The Review reports this as worth knowing rather than a contradiction (rule colour/pp-gamma-override): keep the override if it is what you want, and write down the gamma.
`,
  },
  {
    id: 'log-vs-picture-profile',
    title: 'Log Shooting or a Picture Profile, not both',
    level: 'intermediate',
    track: 'colour',
    order: 40,
    basis: 'sony-spec',
    summary: 'On (Flexible ISO) fixes Picture Profile to Off, so log and a profile never run together. The choice is grading room against straight-to-edit footage.',
    menu: ['log', 'picture-profile', 'pp-gamma'],
    tools: [],
    related: ['gamma-curves', 'luts', 'iso-and-exposure', 'white-balance'],
    body: `
### Log Shooting is not a plain on-off switch

The menu row offers two values: Off, and On (Flexible ISO). Sony's name for the on state matters: it is log recording with ISO adjustable to suit the scene. Those are the only documented values on this body. The Gamma row under a Picture Profile does offer S-Log2 and S-Log3 as overrides, but that is a profile wearing a log curve, not the log pipeline: Select LUT keys off the Log Shooting row, not the gamma.

That last part is a stated exclusion, not a preference. Sony states that Picture Profile is fixed to Off when Log Shooting is set to On (Flexible ISO). The Review treats a setup recording both as a contradiction (rule colour/log-excludes-picture-profile): the profile is written down as if active, but the camera ignores it, along with every parameter under it, saturation, black level and detail included. With Log on, the curve in effect is S-Log3.

### What log buys

A log curve stores tones so that grading can move them later without falling apart. That is the whole purchase: room in post. Sony's descriptions of both S-Log curves say they assume grading, and the footage off the card looks flat and desaturated until it gets one.

### What log costs

- **A mandatory grade.** Every clip passes through correction before delivery. There is no straight-out-of-camera option.
- **Exposure discipline.** Sony's S-Log2 description says it plainly: it needs correct exposure to be worth using, and by convention the same discipline is applied to S-Log3. The common advice to expose log brighter and pull it down in post is production convention, not a Sony instruction.
- **A custom white balance trap.** Sony notes that Log Shooting set to On may cause an error in the white balance custom setup. The documented workaround: switch Log off, measure, switch it back on.
- **An ISO question with no official answer.** A dual base of 800 and 2500 is widely repeated for S-Log3 on this body, but Sony publishes no base ISO figure at all, so Cadrage stores the pair as unverified. Your own tests outrank the forum number.

### When a Cine gamma is the better trade

If the footage goes straight to an edit with light correction, a Picture Profile carrying a Cine gamma keeps a soft tone curve without the mandatory grade. Cine2 in particular is documented as close to Cine1 but optimised for editing, with up to 100% video signal, and PP6 carries it as its documented gamma. For a one-person pipeline delivering the same week, that is often the honest choice: less latitude, far less obligation.
`,
  },
  {
    id: 'luts',
    title: 'LUTs on this body: viewing, embedding, baking',
    level: 'intermediate',
    track: 'colour',
    order: 50,
    basis: 'sony-spec',
    summary: 'Select LUT changes the monitor, not the file, and only while Log is on. The embed row other bodies have does not exist here, and the data now says so.',
    menu: ['select-lut', 'manage-user-luts', 'log'],
    tools: [],
    related: ['log-vs-picture-profile', 'gamma-curves', 'monitoring-and-delivery'],
    body: `
A LUT (lookup table) converts one set of tone and colour values into another. On the A6700 it exists for one reason: log footage is hard to judge by eye, so the LUT shows a corrected view while the card keeps the log original.

### Select LUT is tied to Log

Select LUT applies to monitoring only while Log Shooting is on. With Log off and a Picture Profile driving the image, the LUT is not in the path at all: the Review lists it as doing nothing (rule inert/lut-without-log), a setting that reads as active in your notes while having no effect. The options are ITU709, ITU709(800%), S-Log3 and User LUT 1.

Which one follows from the gamma lesson: ITU709 previews a broadcast-standard conversion, ITU709(800%) is the variant Sony documents for checking scenes on the assumption of S-Log2 or S-Log3, and a User LUT previews the look you actually plan to grade toward.

### The embed row this body does not have

Sony's FX line carries an Embed LUT File row that attaches the LUT to the clip, locked to Off on SD and SDHC cards. Cadrage used to state that as A6700 spec. A pass through the help guide's full menu list (2026-08-28) found no such row anywhere on this body, so the claim is now stored as unverified and its rule ships switched off, listed with the other deliberate omissions. The setup keeps the field, because a note written for a different body is still a note worth judging honestly. User LUTs themselves are real here: **Manage User LUTs** is a listed menu row for loading them.

### Monitoring versus baking

Keep the two pipelines apart:

- **Monitoring with a LUT** changes the screen. The card records log; the LUT is a pair of glasses, removable and absent from the file.
- **Baking a LUT in** writes the conversion into the pixels. On this body that is not what Select LUT does. The bake is an editor step, applying a LUT and exporting, and once it happens the latitude that justified shooting log is spent.

So the working order is: Log on, LUT chosen for what you need to judge, Embed on with a card that accepts it, and the actual look decided in the grade, where it can still change.
`,
  },
];
