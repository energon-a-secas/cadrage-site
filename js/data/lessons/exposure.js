// ── Lessons: the exposure triangle ───────────────────────────
// Basics first, then the parts that only matter once the basics are
// habits. Every lesson names its basis the way a rule does, because a
// lesson that cannot say where its claim comes from teaches a guess.
//
// Bodies are markdown (see utils.renderMarkdown). No backticks inside a
// body: the file is a template literal.

export const EXPOSURE_LESSONS = [
  {
    id: 'exposure-triangle',
    title: 'The exposure triangle',
    level: 'basics',
    track: 'exposure',
    order: 10,
    basis: 'physics',
    summary: 'Aperture, shutter speed and ISO each buy light with a different currency. One stop is the unit they all trade in.',
    menu: ['iso', 'shutter-speed', 'exposure-comp'],
    tools: ['equiv'],
    related: ['aperture', 'shutter-speed', 'iso-and-exposure'],
    body: `
Exposure is how much light reaches the sensor, and how hard the sensor is asked to amplify what arrives. Three settings control it:

- **Aperture** (the f-number) is the size of the opening in the lens. A smaller number is a bigger hole and more light.
- **Shutter speed** is how long the sensor collects that light. 1/50 collects twice as long as 1/100.
- **ISO** is amplification applied after the light has landed. It does not add light; it turns up what is there, noise included.

### Stops

A stop is a doubling or halving of light. The three settings are laid out so that one step in any of them is one stop:

- Aperture: f/1.4, f/2, f/2.8, f/4, f/5.6, f/8, f/11, f/16. Each step halves the light. The numbers look odd because the area of the opening scales with the square of the number.
- Shutter: 1/25, 1/50, 1/100, 1/200, 1/400. Each step halves the time.
- ISO: 100, 200, 400, 800, 1600. Each step doubles the gain.

Because they share a unit, a change in one can be paid for by an opposite change in another. Open up one stop and halve the time, and the exposure is the same. That is the whole triangle. The **Exposure equivalence** calculator does this arithmetic for you.

### Why the triangle is not a free choice

Each currency has a side effect, and the side effect is usually the reason you chose the value in the first place:

- Aperture also sets **depth of field**. Wide open is thin focus; stopped down is deep.
- Shutter speed also sets **motion blur**, and on video it sets how the footage feels and whether it flickers under mains light.
- ISO also sets **noise**, and on a log curve it moves where the highlights clip.

So in practice you fix the one whose side effect you care most about, set the second by the same logic, and let the third absorb the difference. For a tripod product shot that is aperture (for depth), then shutter (for flicker and the 180-degree look), then ISO. For a handheld street photo it is usually shutter first.

### Where the camera shows it

On the A6700 the three live in different places: ISO and shutter speed are dials and Fn items, with menu rows under **Exposure/Color > Exposure**. Aperture is the front dial in A or M mode. **Exposure Comp.** shifts the target the automatic modes aim for; it does nothing in full manual unless ISO is on auto.
`,
  },
  {
    id: 'aperture',
    title: 'Aperture, and what it costs',
    level: 'basics',
    track: 'exposure',
    order: 20,
    basis: 'physics',
    summary: 'The f-number sets light and depth of field at once. Wide open is bright and thin; stopped down is dim and deep.',
    menu: ['exposure-mode', 'aperture-dial'],
    tools: ['dof', 'equiv'],
    related: ['depth-of-field', 'exposure-triangle'],
    body: `
The f-number is the focal length divided by the diameter of the opening. That is why a 55mm at f/1.8 has a 30mm hole and a 15mm at f/1.4 has an 11mm one, and why the number, not the hole, is what you compare across lenses.

### What opening up buys

- **Light.** Each full stop (f/2 to f/1.4, say) doubles it.
- **Background separation.** Depth of field gets thinner. For a product on a turntable with a backdrop 5cm behind it, that is a problem as much as a look: at f/1.8 and 60cm on a 55mm, the sharp zone is a few centimetres. The **Depth of field** calculator shows the number rather than the vibe.

### What stopping down buys

- **Depth.** f/5.6 to f/8 keeps a whole product sharp front to back at table distance.
- **Lens performance.** Most lenses are sharper and cleaner in the corners two stops in from wide open. This is convention, not physics; test your own.

### What stopping down costs

- **Light**, paid back with ISO or time.
- **Diffraction.** Past about f/11 on an APS-C sensor, the opening is small enough that light bends around its edge and softens fine detail. The cost is gentle at f/11 and obvious by f/22. The exact threshold depends on pixel pitch, so treat f/11 as a soft ceiling rather than a law.

### On the body

Aperture is set with the front dial in **A** and **M** modes. In **P** and **S** the camera chooses it. For video, set it once and leave it: an aperture change in a take is visible as a brightness step and, on many lenses, a small focus breathing jump. If the light changes mid-take, ISO in manual steps or a variable ND is the tool, not the aperture ring.
`,
  },
  {
    id: 'shutter-speed',
    title: 'Shutter speed, stills and video',
    level: 'basics',
    track: 'exposure',
    order: 30,
    basis: 'physics',
    summary: 'For stills it is about freezing or blurring motion. For video it is about the look, and about not banding under mains light.',
    menu: ['shutter-speed', 'shutter-type', 'auto-slow-shut'],
    tools: ['flicker'],
    related: ['flicker-and-shutter', 'exposure-triangle'],
    body: `
### Stills

The shutter decides how much the subject, and your hands, move during the exposure.

- **Freezing motion.** Walking people are sharp around 1/250; sport wants 1/1000 and up.
- **Handheld.** The old rule is one over the focal length, in full-frame terms. On the A6700 a 55mm behaves like an 84mm, so 1/100 is the floor without stabilisation. SteadyShot buys a few stops of hand shake, none of subject motion.
- **Deliberate blur.** Water, light trails and panning are the cases where slower is the point. A tripod and a 2-second self-timer beat touching the shutter button.

The A6700 offers mechanical and electronic shutter. Electronic is silent and reaches faster speeds, but it reads the sensor line by line, so fast-moving subjects skew and LED lighting can band. **Shutter Type** lives under Shooting > Shutter/Silent.

### Video

Video shutter speed is chosen for look first and flicker second, and both prefer you to set it once and never touch it in a take.

- **The 180-degree rule.** Shutter at twice the frame rate (1/50 at 25p, 1/120 at 60p) gives motion blur that reads as natural. Faster looks staccato, slower smears. It is a convention from film cameras, and a good default rather than a law.
- **Flicker.** Mains-powered light pulses at twice the supply frequency. A shutter interval that spans a whole number of pulses collects the same light every frame. 1/50 and 1/100 are clean at 50Hz; 1/60 and 1/120 are clean at 60Hz. Mix them and every frame catches a different slice, which is the banding. The **Shutter and flicker** calculator, and the Review, work this out for your setup.

When the 180-degree ideal and the flicker-clean speed disagree, the flicker-clean one wins, because banding cannot be fixed in post and motion blur is barely noticed.

### Two menu rows that quietly override you

- **Auto Slow Shut.** lets the camera lengthen the shutter in dim light. On a take that is a visible change in motion and flicker. Off for anything you care about.
- **Var. Shutter** allows fine shutter steps (1/50.1, 1/50.2) for chasing a flicker frequency that no standard step divides. Only selectable in S or M with the shutter set by hand.
`,
  },
  {
    id: 'exposure-modes',
    title: 'P, A, S, M and what each one gives away',
    level: 'basics',
    track: 'exposure',
    order: 40,
    basis: 'sony-spec',
    summary: 'The mode dial decides which side of the triangle you hold and which the camera is free to move.',
    menu: ['exposure-mode', 'exposure-ctrl-type'],
    tools: [],
    related: ['exposure-triangle', 'metering-and-compensation'],
    body: `
- **P (Program).** The camera picks aperture and shutter. You steer with exposure compensation and ISO. Fine for snapshots, wrong for anything where depth of field or motion matters.
- **A (Aperture priority).** You set the aperture; the camera sets the shutter. The usual stills mode when depth of field is the decision. Watch the shutter it picks in dim light: below 1/100 handheld on this body, raise ISO or accept blur.
- **S (Shutter priority).** You set the shutter; the camera sets the aperture. For sport, panning and anywhere motion is the decision.
- **M (Manual).** You set both. With **ISO Auto**, M becomes a third priority mode: you hold depth and motion and the camera rides gain. That combination, with an **ISO Range Limit** so it cannot run away, is the everyday mode for a lot of event work.

### Video

The A6700 separates stills and movie with the Still/Movie/S&Q dial, and the mode dial applies inside each. For video, **M** with manual ISO is the default for a controlled shoot: every exposure change in a take is then one you made.

**Exposure Ctrl Type** (Exposure/Color > Exposure) switches between the P/A/S/M dial and a Flexible Exp. Mode where aperture, shutter and ISO are each set to Auto or Manual independently. Both are legitimate; the Review assumes the P/A/S/M model because that is what the setup object records.

### The rule of thumb

Decide which side effect you cannot afford to lose, and pick the mode that locks that setting. Everything else is detail.
`,
  },
  {
    id: 'iso-and-exposure',
    title: 'ISO, gain and where the noise comes from',
    level: 'intermediate',
    track: 'exposure',
    order: 50,
    basis: 'sony-spec',
    summary: 'ISO is amplification, not sensitivity. Auto ISO in a take moves the exposure while you are not looking.',
    menu: ['iso', 'iso-range', 'iso-auto-min-ss'],
    tools: ['equiv'],
    related: ['exposure-triangle', 'metering-and-compensation', 'log-vs-picture-profile'],
    body: `
ISO is gain applied to what the sensor captured. Doubling ISO doubles the signal and the noise with it, so a dark scene at ISO 6400 is noisy not because 6400 is a bad number but because there was little light to amplify. The fix for noise is light; ISO is what you use when there is no more light to be had.

### Ranges on this body

Sony documents ISO 100 to 32000 for movies and a wider range for stills, with the note that below ISO 100 the recordable brightness range may decrease, and that the available range changes with the Gamma set under Picture Profile. Both rows are in the data as Sony spec.

### Base ISO, and why the Review is careful

A common claim is that this sensor has two base ISOs, often quoted as 800 and 2500. Sony's help guide does not state a base or dual-base figure anywhere, so Cadrage stores the pair as **unverified** and ships the rule that reads it switched off. Turn it on if you have measured it yourself; the finding will say where its claim comes from.

### Auto ISO

For stills, Auto ISO with **ISO Range Limit** and **ISO AUTO Min. SS** is a good working mode: you bound the gain and you bound how slow the shutter may go before gain rises.

For video it is a different story. Auto ISO changes exposure inside a take whenever the frame changes, which is exactly when you did not want it to. A hand entering frame, a white product rotating into view, and the brightness steps. The Review flags an auto range wider than about a stop as a drift risk. This is an **empirical** rule from real shoots, not a spec, and it is labelled that way.

### Log and ISO

Under Log Shooting the camera pins the curve to a fixed range and ISO becomes a choice between noise in the shadows and clipping in the highlights. The metering target for S-Log3 is lower than a standard curve; the usual advice to expose brighter and pull it down in post is convention from production practice. The lesson on log versus picture profile covers the rest.
`,
  },
  {
    id: 'metering-and-compensation',
    title: 'Metering, compensation, and what the meter is for',
    level: 'intermediate',
    track: 'exposure',
    order: 60,
    basis: 'sony-spec',
    summary: 'The meter suggests; zebras and the histogram tell the truth. Compensation moves the suggestion, not the truth.',
    menu: ['metering-mode', 'exposure-comp', 'zebra-display', 'zebra-level', 'histogram'],
    tools: [],
    related: ['exposure-modes', 'iso-and-exposure'],
    body: `
A light meter does not know what the scene is. It assumes the average of what it sees should come out mid-grey, so a white product on a white backdrop is underexposed and a black one is overexposed, every time, by design.

### The modes, as Sony lists them

- **Multi.** The frame split into zones, weighed together. The default, and right most of the time.
- **Center.** Weighted to the middle. Useful when the subject is central and the edges are wildly different.
- **Spot (Standard / Large).** A small circle, tied to the focus point if you set it so. The tool for a bright subject on a dark stage or a face against a window.
- **Entire Screen Avg.** Everything, equally. Steady when the subject moves around the frame, which is why it suits some video.
- **Highlight.** Exposes for the brightest part of the frame so nothing clips. Good for a stage light, wrong for a backlit face.

### Compensation

Exposure Comp. tells the automatic part of the camera to aim brighter or darker than its meter says. In A, S and P it moves the setting the camera controls. In M it does nothing unless ISO is on Auto, in which case it moves the ISO. The dial runs in 1/3 stops.

### The things that do not lie

- **Zebra Display** paints stripes on pixels above a level you choose. Two habits: a zebra at 70 for skin under a standard curve, and a zebra at the clipping point for highlights. On a log curve the numbers move, because the curve places mid-grey and clip at different levels.
- **Histogram** shows the whole distribution. A pile against the right wall is clipped, and no correction in post brings it back.

The Review does not read the meter, because the meter is a suggestion. It reads what you recorded.
`,
  },
  {
    id: 'exposure-advanced',
    title: 'Equivalence, ND and holding exposure across a shoot',
    level: 'advanced',
    track: 'exposure',
    order: 70,
    basis: 'physics',
    summary: 'Once the triangle is a habit, the interesting problems are holding exposure constant when something outside the camera changes.',
    menu: ['exposure-std-adjust', 'iso', 'shutter-speed'],
    tools: ['equiv', 'flicker'],
    related: ['exposure-triangle', 'shutter-speed', 'flicker-and-shutter'],
    body: `
### Video has two locked sides

For a controlled video shoot, shutter is fixed by flicker and look, and aperture is fixed by depth of field. That leaves ISO, and ISO is the worst of the three to move because it shows as noise and, on log, as a shift in where things clip. So the real fourth side of the triangle for video is **neutral density**: glass that removes light in stops without changing anything else. Shooting at f/1.8 and 1/50 in daylight means an ND of four to six stops. A variable ND trades a little colour shift and a possible cross pattern at the strong end for not carrying a set.

### Equivalence is arithmetic

One stop is one stop. If the lights go from 100% to 50% output, the scene is one stop darker and exactly one of: aperture one stop wider, shutter one stop longer, or ISO doubled, restores it. The **Exposure equivalence** calculator takes one change and prints what each of the others would have to do. It is the tool for "the venue is 60Hz and I have to go from 1/100 to 1/120, what do I lose".

### Reciprocity, for the one case it still matters

Film had reciprocity failure: very long exposures needed more time than the arithmetic said. Digital sensors do not, but very long exposures still heat the sensor and raise noise, and Long Exposure NR doubles the time by taking a dark frame. On this body that matters for night stills, not for video.

### Exposure Std. Adjust

Exposure/Color > Exposure carries a row that shifts the meter's idea of correct by a fixed amount per metering mode. It is for a body whose meter you have measured against a reference and found consistently off. It is not a substitute for compensation, and it is a trap when someone else picks up the camera, because it is invisible. Leave it at zero unless you have the measurement.
`,
  },
];
