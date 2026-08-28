// ── Lessons: format and post ─────────────────────────────────
// Recording formats, monitoring you can trust, and the two-layer correction problem.

export const FORMAT_POST_LESSONS = [
  {
    id: 'codecs-and-bitrates',
    title: 'The recording format matrix',
    level: 'basics',
    track: 'format',
    order: 10,
    basis: 'sony-spec',
    summary: 'Container, frame rate, bitrate and chroma are one row in the Sony format table, not four free choices, and card time is division on the bitrate.',
    menu: ['file-format', 'frame-rate', 'record-setting'],
    tools: ['card'],
    related: ['monitoring-and-delivery', 'flicker-and-shutter', 'luts'],
    body: `
The Record Setting screen looks like four independent choices: container, frame rate, bitrate, chroma. On the A6700 it is one choice: a row in Sony's format table. Cadrage transcribes that table from Sony's Movie Settings page, so an invalid combination can be rejected instead of guessed.

### The two containers

- **XAVC HS** records HEVC (H.265). Every HS mode is 10-bit. The codec is efficient, more picture per megabit, but heavier to decode: the editor pays at playback what the card saved at record time.
- **XAVC S** records AVC (H.264), with wider editor support. Its 4K table mixes 8-bit and 10-bit rows, so choosing XAVC S does not by itself decide bit depth. The row does.

### Inside a frame rate, two knobs

Fix a container and a frame rate and what remains is a short list of bitrate and chroma pairings. XAVC HS 4K at 60p runs from 45M 4:2:0 10bit up to 200M 4:2:2 10bit. Bitrate buys compression headroom. Chroma decides how much colour resolution survives: 4:2:2 keeps twice the colour samples of 4:2:0, which matters for keying and heavy grading more than for straight viewing.

Not every pairing exists at every rate. XAVC HS has no 8-bit rows at all, and no 4K 30p. When a setup records a combination that is not in the table, the Review names it as invalid and lists what the container does offer at that rate, rather than silently keeping it: a note claiming a mode the camera does not offer is a note that cannot be reproduced.

### Displayed rates versus recorded rates

Two footnote-grade facts from Sony's tables:

- 24p exists only with the camera set to NTSC; a PAL-region body will not offer the row at all. The data marks 30, 60 and 120 the same way.
- The displayed rates are rounded. 24, 30, 60 and 120 record as 23.98, 29.97, 59.94 and 119.88. On one camera that is trivia; the moment you sync to separately recorded audio or a second body, the real number is the one that matters.

### Card time is arithmetic

Bitrate is megabits per second, so record time is division. 100M is 0.75 GB per minute; a 128 GB card holds roughly 158 minutes of it, or about 57 minutes at 280M. The **Record time per card** calculator does this arithmetic, assuming formatted capacity around 93% of the sticker figure and a constant bitrate. Long-GOP modes vary with scene complexity, so treat the result as an estimate rather than a countdown.
`,
  },
  {
    id: 'monitoring-and-delivery',
    title: 'Judging the image on a screen you can trust',
    level: 'intermediate',
    track: 'format',
    order: 20,
    basis: 'industry-convention',
    summary: 'Zebras and the histogram read the recorded signal; an uncalibrated display reads back a guess that every other screen then re-corrects.',
    menu: ['zebra-display', 'select-lut'],
    tools: [],
    related: ['metering-and-compensation', 'luts', 'correction-stacking'],
    body: `
A grade is a series of judgements about brightness and colour, and every judgement is made on some screen, so the screen's errors become the footage's corrections.

### The argument the Review makes

The not-colour-managed rule fires when an editor is in use without colour management and the display it is judged on is uncalibrated. Its argument: every decision on that display is relative to a guess. The display runs bright, so the footage gets darkened; the display leans blue, so it gets warmed. Every other screen then adds its own errors on top, so the footage is effectively re-corrected on each one, and none of the corrections agree.

### Instruments that do not depend on the monitor

Two in-camera displays read the recorded signal rather than the panel, so a bad monitor cannot bend them:

- **Zebra Display** paints stripes on pixels above a level you set. It reports signal level, not what the screen makes of it.
- The **histogram** shows the distribution of recorded levels. A pile against the right wall is clipped, however the monitor chooses to render it.

Exposure decided by zebras survives a bad monitor. Exposure decided by eye does not.

### The recorded workaround

The turntable preset carries a note: the display is run at 40% brightness as a proxy for how the footage lands elsewhere. Cadrage records the workaround because a remembered workaround is a setting and a forgotten one is a mystery. But it is not calibration. It moves the guess without removing it: every judgement is now relative to a dimmed display, and undoing it means remembering the dimming.

### Monitoring through a LUT

Under Log Shooting, **Select LUT** picks the LUT applied to monitoring: it changes what the screen shows, not the log recording. The viewing intent stays on the camera; carrying it into the edit is a note or a user LUT in the editor, since the embed row other Sony bodies have does not exist here (the LUTs lesson has the full story).

### What colour management actually changes

Colour management means the editor knows what the footage is (its gamma and gamut) and what the display is, and converts between the two. A value in the footage then means one thing, instead of whatever the panel happens to show. It does not make a cheap panel accurate; it makes its errors consistent and accountable.

### The cheap fix

The rule suggests not a probe but a reference: one known-good clip, viewed on the actual delivery platform, as the thing you compare against. It anchors the guessing to the screen that matters.
`,
  },
  {
    id: 'correction-stacking',
    title: 'Correcting the same axis twice',
    level: 'intermediate',
    track: 'post',
    order: 30,
    basis: 'physics',
    summary: 'An axis pushed in camera and again in the editor is two corrections stacked; the scales do not add, so decide which layer owns the look.',
    menu: [],
    tools: [],
    related: ['colour-cast-vs-white-balance', 'log-vs-picture-profile', 'monitoring-and-delivery'],
    body: `
Cadrage records two layers that most notes keep apart: what the camera bakes in (Picture Profile parameters, the white balance shift) and what the editor applies afterwards. The stacked-correction rule reads both and asks one question per axis: is this axis being pushed in both places?

### The axes

The rule is deliberately declarative. Each axis names the in-camera control and the editor control that move it, so a doubled correction becomes visible instead of staying spread across two menus:

- Saturation: PP Saturation in camera, then the saturation slider
- Shadow level: Black Gamma level, then light or shadow
- Black point: Black Level, then black
- Tint: the WB G-M shift, then tint
- Sharpness: Detail Level, then sharpen or clarity

### The second correction corrects the first

An in-camera adjustment is baked into every clip before the editor opens it. When the editor then moves the same axis, it is not adjusting the scene; it is adjusting the camera's adjustment. The turntable preset shows the shape: PP Saturation at +4 in camera, then saturation at +15 in CapCut. Whatever the footage actually needed, part of that +15 is a response to the +4.

### The numbers do not add

It is tempting to summarise the stack as one number per axis. The config stores an explicit flag refusing to, and the rule states why: the two scales are not comparable. PP Saturation runs from -32 to +32 on Sony's scale; the editor slider is a different scale applied to footage the camera has already transformed. A +4 and a +15 do not make +19 of anything. The honest description is per-layer: what the camera did, then what the editor did, in that order. When the two pull in opposite directions the rule says so separately, because that is effort spent cancelling your own earlier setting.

### The fix is ownership

Not zeroing everything: deciding which layer owns each axis. Bake the look in camera and leave the editor slider alone, or record neutral and grade in post. Either works. Running both does not, because when the result comes out wrong you cannot tell which of the two corrections to change.
`,
  },
];
