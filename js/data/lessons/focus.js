// ── Lessons: focus ───────────────────────────────────────────
// From "which mode do I pick" to the movie-only tuning rows. Same
// contract as exposure.js: markdown bodies in template literals, no
// backticks or dollar-brace inside a body.

export const FOCUS_LESSONS = [
  {
    id: 'focus-basics',
    title: 'The four focus modes',
    level: 'basics',
    track: 'focus',
    order: 10,
    basis: 'sony-spec',
    summary: 'AF-S locks once, AF-C never stops, DMF is AF with a manual override, MF is you. Pick by whether the distance changes.',
    menu: ['focus-mode'],
    tools: [],
    related: ['focus-areas', 'focus-modes', 'manual-focus-aids'],
    body: `
Focus Mode decides when the camera is allowed to move focus. Everything else in the focus menu decides where it looks and how fast it moves. Get this one right first.

- **AF-S (Single-shot).** Half-press, the camera focuses once and locks. Nothing moves until you release and press again. For subjects that hold still: products, portraits where nobody leans, anything on a tripod.
- **AF-C (Continuous).** The camera refocuses for as long as you hold the half-press, and while recording. For subjects whose distance actually changes: people walking, hands demonstrating a product, anything you follow.
- **DMF (Direct Manual Focus).** AF-S, then the focus ring works. The camera gets you close, you place the final millimetres. The practical mode for close work where AF picks the wrong edge.
- **MF (Manual Focus).** The ring is the only input. For repeatable setups: a locked-off product shot where the distance never changes, focus set once with the magnifier, then left alone.

### The decision, compressed

Does the subject-to-camera distance change during the shot?

- No, and the camera is on a tripod: **MF**, or AF-S if you re-frame between takes.
- No, but you are handheld: **AF-S** or **DMF**. Your own sway is a distance change at wide apertures, so keep some depth of field in reserve.
- Yes: **AF-C**, and spend your attention on the Focus Area lesson, because in AF-C the area choice decides what the camera follows.

### What this looks like in the review

A setup that records AF-C on a tripod gets a finding: continuous AF on a locked-off shot is all cost, since there is nothing to track and the camera may still hunt when the light or the frame changes. That rule is convention, not physics, and its chip says so. If you are tracking a moving product on a turntable, that is a real distance change and AF-C is the honest answer; the finding retracts when the tripod field is off.
`,
  },
  {
    id: 'focus-areas',
    title: 'Focus areas: where the camera is allowed to look',
    level: 'basics',
    track: 'focus',
    order: 20,
    basis: 'sony-spec',
    summary: 'Wide lets the camera choose, Zone constrains it, a spot pins it, Tracking follows what you picked.',
    menu: ['focus-area'],
    tools: [],
    related: ['focus-basics', 'subject-recognition'],
    body: `
Focus Area sets the region the autofocus system may use. The trade is always the same: a bigger area finds things faster and picks the wrong thing more often; a smaller area is precise and easy to lose.

- **Wide.** The whole frame. The camera decides what matters. Fine when the subject is obvious against a plain background, which is exactly the case where any area works. The first thing to change when focus lands on the backdrop instead of the product.
- **Zone.** A block of the frame you position. The useful middle: the camera still chooses within the zone, but it cannot wander to the edge of the frame. A turntable shot with hands entering the frame is a Zone case, the zone sits on the product and the hands pass through without stealing focus.
- **Center Fix.** A fixed central area. Predictable and rigid: compose, focus, and either keep the subject centred or accept focus-and-recompose, which shifts the plane slightly at close distance.
- **Spot / Flexible Spot.** A small movable point you place exactly. The precision tool for a specific edge, an eye, a label. The cost is that everything depends on the point staying on the subject.
- **Tracking.** You place a start point, the camera follows the object. In AF-C this is the mode for a subject that moves through the frame rather than just toward or away from you.

### Two habits worth having

Set the area with the touch screen when the camera is on a tripod and the touch is deliberate; recompose with the dial when handheld and your thumb is faster than your framing. And when a shot misfocuses, ask which decision failed: the mode (when focus moves) or the area (where it looked). They fail differently and are fixed in different rows.
`,
  },
  {
    id: 'focus-modes',
    title: 'Focus modes in practice: the tripod, the peaking, the stabiliser',
    level: 'intermediate',
    track: 'focus',
    order: 30,
    basis: 'industry-convention',
    summary: 'Three settings that are right or wrong depending on the rig, not on taste. The review reads the rig.',
    menu: ['focus-mode', 'peaking-display', 'steadyshot'],
    tools: [],
    related: ['focus-basics', 'manual-focus-aids', 'depth-of-field'],
    body: `
Three focus-adjacent settings only make sense read against the rig you recorded, which is why the review asks whether the camera is on a tripod at all.

### AF-C on a locked-off shot

Nothing changes distance on a tripod with a fixed subject, so continuous AF has nothing to do. What it can still do is move: a light flickers, a hand crosses the frame, and AF-C re-evaluates. On a product take that is a visible focus pulse you then reshoot. AF-S for framed-then-still work, MF for a set-and-forget rig. This is production convention, and the finding says so rather than dressing it as physics.

### Peaking is a manual-focus aid

Peaking Display paints a colour on high-contrast edges, which is a proxy for what is in focus. Autofocus does not read it; it exists for your eyes while you turn the ring. Leaving it on in AF-C costs nothing but tells you nothing either, so the review lists it as inert rather than wrong. Where it earns its place: MF and DMF, especially with the magnifier, see the manual-focus lesson.

### The stabiliser on a tripod

SteadyShot corrects hand shake. A tripod has none, so the stabiliser is left correcting its own sensor noise, and on long exposures or long takes it can introduce a slow drift as it hunts. Off on the tripod, on in the hand. The review pins this to the SteadyShot row whenever the setup records a tripod.

### The shape of all three

Each one is a setting whose value is neither good nor bad alone. The same AF-C that is waste on a tripod is the only right answer for a walking subject. This is why Cadrage's rules read the whole setup instead of keeping a list of correct values: the rig is half the configuration.
`,
  },
  {
    id: 'subject-recognition',
    title: 'Subject recognition, and what tracking actually follows',
    level: 'intermediate',
    track: 'focus',
    order: 40,
    basis: 'sony-spec',
    summary: 'Recognition finds a class of subject (people, animals, vehicles) inside the focus area. It narrows the area choice, it does not replace it.',
    menu: ['subject-recognition', 'focus-area'],
    tools: [],
    related: ['focus-areas', 'focus-basics'],
    body: `
Subject recognition is a classifier running on the live image: it looks for a chosen class of subject, and when it finds one, focus priority goes to it, an eye if it can see one. Tracking then follows that subject as it moves through the frame.

### What it changes

With recognition on and a person in frame, Wide stops meaning "the camera picks anything" and starts meaning "the camera picks the person". That collapses most of the area decision for people-in-frame work: hands-on demos, pieces to camera, interviews. The setup object records it as a single flag, because for the review the question is only whether the classifier is in the loop or not.

### What it does not change

- **It looks inside the focus area.** A spot area with recognition on still constrains where the search happens. If the subject is outside the area, recognition does not see it.
- **It has a target class.** The camera looks for the class you set (people, animals, birds, insects, vehicles on this generation of bodies). Pointed at a product with recognition set to people, it finds nothing and behaves as if recognition were off. Check the target when focus behaves strangely on a set with no people in it.
- **It does not fix distance problems.** Recognition picks the subject; depth of field still decides whether the whole subject is sharp. An eye in focus at f/1.8 is an ear out of focus.

### For product work specifically

A turntable shot has no recognisable subject, so recognition contributes nothing and the honest setting is off, with a Zone area doing the real work. The moment hands enter the frame to demonstrate, recognition set to people flips from useless to exactly right, and it will hold the hands rather than the product. Decide per shot which of those two you are making.
`,
  },
  {
    id: 'depth-of-field',
    title: 'Depth of field: the sharp zone is a number',
    level: 'intermediate',
    track: 'focus',
    order: 50,
    basis: 'physics',
    summary: 'Aperture, distance and focal length set a sharp zone you can compute. If it is thinner than the subject, no focus mode saves you.',
    menu: ['focus-mode'],
    tools: ['dof'],
    related: ['aperture', 'focus-basics', 'manual-focus-aids'],
    body: `
Depth of field is the range of distances that render acceptably sharp. Three inputs you control set it: aperture (wider is thinner), focus distance (closer is thinner), and focal length (longer is thinner at the same framing distance). The fourth input is a choice pretending to be a constant.

### The circle of confusion

"Acceptably sharp" depends on how big a blur circle the final viewing can hide. That is the circle of confusion, and it is set by your delivery, not your camera: a 4K frame inspected at 100% tolerates less blur than a phone-sized preview. The calculator exposes the preset instead of burying it, because changing it moves every answer and pretending it is fixed is how two people compute different truths from the same lens.

### Where this bites on a table

At product distances the numbers get small fast. A 55mm at f/1.8 focused at 60cm has a sharp zone of roughly a centimetre either side. A product deeper than that cannot be all in focus, whatever the focus mode does. The review checks the recorded subject size against the computed zone and says so when the zone is thinner, with the arithmetic shown. The fixes, in order of cost: stop down, back up, or accept and choose which plane matters.

### The floor under everything: minimum focus distance

Every lens has a distance below which it cannot focus at all. The Zeiss 55mm in the lens data stops at 50cm; the 15mm G at 20cm. A subject closer than the MFD is not a focus-technique problem, and the review flags it as a contradiction rather than a warning, because no setting on the body fixes it. Distance, extension tubes, or a different lens.

Run the numbers in the **Depth of field** calculator before blaming the autofocus. Most "the camera missed" complaints at close range are a zone thinner than the subject, computed in advance and ignored.
`,
  },
  {
    id: 'manual-focus-aids',
    title: 'Peaking and the magnifier: focusing by eye, honestly',
    level: 'intermediate',
    track: 'focus',
    order: 60,
    basis: 'industry-convention',
    summary: 'Peaking shows edges, the magnifier shows truth. Use peaking to get close and the magnifier to be sure.',
    menu: ['peaking-display', 'peaking-level', 'peaking-color', 'focus-magnifier'],
    tools: ['dof'],
    related: ['focus-basics', 'depth-of-field'],
    body: `
Manual focus on a mirrorless body is better than it ever was on film, because the viewfinder can lie less. Two aids do the work.

### Peaking

Peaking Display outlines high-contrast edges in a colour you pick. It is a contrast detector, not a focus detector, and that difference is the whole skill of using it:

- On a textured subject it lights up at the focus plane and reads almost like a rangefinder.
- On a smooth subject (glass, plastic, gradients) it stays dark even in perfect focus, because there is no edge contrast to detect.
- Wide open at close range it can light a zone thicker than the true depth of field, because "contrasty" is a looser test than "sharp".

Level is a sensitivity trade: high finds edges everywhere and overstates the zone; low is strict and dark. Mid, then adjust per scene. Colour is legibility only, pick whatever the scene is not: white washes out on bright sets, red vanishes on warm products.

### The magnifier

Focus Magnifier punches into the live view at pixel level. It is the only aid that shows actual sharpness rather than a proxy, and the tripod workflow is built on it: frame, magnify on the detail that matters, turn the ring until texture snaps, back out, do not touch the ring again. On a static product shot this beats any autofocus for repeatability, which is why the MF lesson keeps recommending it.

### The honest combination

Peaking to get near, magnifier to land, peaking back on during the take as a drift alarm: if the outline migrates off the subject mid-take, something moved. And remember what the review reminds you of: with autofocus driving, peaking is decoration. It earns its battery cost only when a human is turning the ring.
`,
  },
  {
    id: 'focus-advanced',
    title: 'Movie AF tuning: transition speed and shift sensitivity',
    level: 'advanced',
    track: 'focus',
    order: 70,
    basis: 'sony-spec',
    summary: 'Two rows shape how AF-C behaves on video: how fast focus moves, and how stubbornly it stays on the current subject.',
    menu: ['af-transition', 'af-shift'],
    tools: [],
    related: ['focus-basics', 'subject-recognition'],
    body: `
Continuous AF for video has two failure modes: it moves too abruptly, which reads as a technical event in the footage, and it moves too eagerly, which reads as indecision. The a6700 gives each its own dial.

### AF Transition Speed (1 to 7)

How fast focus travels when it has decided to move. High values snap, low values glide. Speed is not quality: a snap that lands mid-take looks like a mistake, while the same distance covered in a slow glide looks like a camera operator pulling focus. For product and demo work, low values (2 to 3) make every refocus look intended. High values belong where the subject genuinely jumps distance and a glide would lag: sports, kids, pets.

This row is also a creative tool. A deliberate rack focus between two props is just AF at a slow transition speed with you moving the area, and it is repeatable in a way a hand-pulled rack on a focus ring is not.

### AF Subj. Shift Sens. (1 to 5)

How easily the camera abandons its current subject for a new one at a different distance. At 1 (locked on) a hand crossing the frame is ignored and focus holds on the product behind it. At 5 (responsive) the hand takes focus the moment it appears. Neither is right in general:

- Demos where hands should take over: high.
- Turntables and interviews where intrusions must not steal focus: low.

### Reading the two together

Transition speed is about how a refocus looks; shift sensitivity is about whether it happens at all. Most "the AF ruined the take" complaints are a sensitivity problem wearing a speed costume: the camera should never have left the subject, and no transition speed makes an unwanted refocus good. Set sensitivity for the shot first, then speed for the look. Both rows live under Focus in the camera menu, movie mode; the setup records both, and the defaults in the presets (speed 2, sensitivity 2) encode the turntable bias toward stability.
`,
  },
];
