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
    related: ['memory-cards', 'monitoring-and-delivery', 'flicker-and-shutter', 'luts'],
    body: `
The Record Setting screen looks like four independent choices: container, frame rate, bitrate, chroma. On the A6700 it is one choice: a row in Sony's format table. Cadrage transcribes that table from Sony's Movie Settings page, so an invalid combination can be rejected instead of guessed.

### Three containers, two sizes

File Format picks the container and the size together: XAVC HS 4K, XAVC S 4K, XAVC S HD, XAVC S-I 4K or XAVC S-I HD. 4K is 3840×2160 and HD is 1920×1080; XAVC HS has no HD option.

- **XAVC HS** records HEVC (H.265). Every HS mode is 10-bit. The codec is efficient, more picture per megabit, but heavier to decode: the editor pays at playback what the card saved at record time.
- **XAVC S** records AVC (H.264), with wider editor support. Its tables mix 8-bit and 10-bit rows, so choosing XAVC S does not by itself decide bit depth. The row does.
- **XAVC S-I** compresses every frame on its own (Intra), where the other two compress groups of frames together (Long GOP). Sony says Intra responds better when editing and Long GOP compresses more efficiently, so the cost is card space: every S-I row is 4:2:2 10bit, 4K 60p runs at 600M, and Sony lists an SDXC V90 card or faster for it. It cannot record a proxy alongside, either.

### Inside a frame rate, two knobs

Fix a container, a size and a frame rate and what remains is a short list of bitrate and chroma pairings. XAVC HS 4K at 60p runs from 45M 4:2:0 10bit up to 200M 4:2:2 10bit. Bitrate buys compression headroom. Chroma decides how much colour resolution survives: 4:2:2 keeps twice the colour samples of 4:2:0, which matters for keying and heavy grading more than for straight viewing. XAVC S-I leaves no choice at all: one row per frame rate, its bitrate set by the rate, from 600M at 4K 60p down to 89M at HD 24p.

Not every pairing exists at every rate. XAVC HS has no 8-bit rows at all, and no 4K 30p; XAVC S-I has no 4:2:0 rows and no 120p. When a setup records a combination that is not in the table, the Review names it as invalid and lists what the container does offer at that rate, rather than silently keeping it: a note claiming a mode the camera does not offer is a note that cannot be reproduced.

### Displayed rates versus recorded rates

Two footnote-grade facts from Sony's tables:

- 24p exists only with the camera set to NTSC; a PAL-region body will not offer the row at all. The data marks 30, 60 and 120 the same way.
- The displayed rates are rounded. 24, 30, 60 and 120 record as 23.98, 29.97, 59.94 and 119.88. On one camera that is trivia; the moment you sync to separately recorded audio or a second body, the real number is the one that matters.

### Card time is arithmetic

Bitrate is megabits per second, so record time is division. 100M is 0.75 GB per minute; a 128 GB card holds roughly 158 minutes of it, or about 57 minutes at 280M. XAVC S-I 4K 60p at 600M is the far end: about 26 minutes by the same arithmetic, and 25 in Sony's own recordable-time table. The **Card for a format** calculator does this arithmetic, assuming formatted capacity around 93% of the sticker figure and a constant bitrate. Sony notes the camera records at a variable bit rate, so fast motion shortens the real time; treat the result as an estimate rather than a countdown.
`,
  },
  {
    id: 'memory-cards',
    title: 'Which card a recording format needs',
    level: 'basics',
    track: 'format',
    order: 15,
    basis: 'sony-spec',
    summary: 'Sony lists one card per File Format and shooting mode; a card\'s marks promise a minimum write speed. Read both, and the bitrate between them.',
    menu: ['file-format', 'proxy-settings', 's-q-settings', 'format-card'],
    tools: ['card'],
    related: ['codecs-and-bitrates'],
    body: `
A card's label carries three separate promises: how much it holds, how slowly it may write, and how fast its bus can move data. Sony's card table names the first two. The third is a ceiling rather than a floor, and it matters mostly for getting footage off the card.

### What the marks promise

The SD Association defines every mark on the label:

- **Capacity standard.** SDHC is over 2 GB up to 32 GB and formats as FAT32; SDXC is over 32 GB up to 2 TB and formats as exFAT. The logo on the card says which.
- **Speed marks.** Each is a minimum sequential write speed: U1 and V10 promise 10 MB/s, U3 and V30 promise 30 MB/s, V60 promises 60 MB/s and V90 promises 90 MB/s. A device that names a mark is met by a card in the same family at the same or a higher number. Across families the SDA promises nothing, even at the same speed, so a card marked V30 alone does not formally answer a request for U3.
- **Bus.** The I or II on the label. UHS-I tops out at 104 MB/s; UHS-II at 156 MB/s, or 312 MB/s in half duplex. V60 and V90 exist only on UHS-II and faster cards, while V30 can be either. The a6700 takes both buses.

The bus is a ceiling: how fast data can move. The speed mark is a floor: how slow the card may get while recording. Recording needs the floor.

### What Sony lists for the a6700

Sony's memory card page gives one card per File Format and shooting mode. For movie recording with Proxy Recording off:

- XAVC HS 4K and XAVC S 4K: SDXC V60 or higher, sized for 280 Mbps.
- XAVC S HD: SDHC or SDXC, U3 or higher, sized for 100 Mbps.
- XAVC S-I 4K and XAVC S-I HD: SDXC V90 or higher, sized for 600 and 222 Mbps.

S&Q Motion raises the bitrate, up to 560 Mbps for XAVC S 4K, and with Proxy Recording off every format asks for V90 there. With a proxy the main stream is capped lower and Sony asks for V60, or U3 for XAVC S HD movies. Time-lapse states no bitrate and asks least: U3 for the Long GOP formats with Proxy Recording off. XAVC S-I cannot record a proxy at all, and neither can a 120p or 100p recording.

### The gap between the table and the bitrate

Sony sizes each card for the format's highest bitrate and lists nothing lower for lower Record Settings, which leaves a gap worth stating plainly. XAVC HS 4K at 100M writes 12.5 MB/s. A V30 card promises 30 MB/s, more than twice that, and the turntable setup records exactly this on a V30 card without trouble. It is still below the V60 Sony lists for the format. Both statements are true, and they answer different questions: the card's floor covers this Record Setting, while Sony's table, read as written, asks for more.

The margin is arithmetic, so it moves with the bitrate. At 200M the stream is 25 MB/s and the V30 margin is down to 5 MB/s. At 120p, 280M is 35 MB/s, past what V30 promises. The **Card for a format** calculator runs this check for any File Format, frame rate and card.

### Capacity and record time

Record time is division on the bitrate, as the recording format lesson works through. Sony's own table runs below the division: 100M on a 128 GB card is 2 h 10 min there, and about 2 h 39 min by division. Sony notes the camera records at a variable bit rate, so the shorter figure is the safer plan. Two card notes from Sony: a long XAVC S recording on an SDHC card is split into 4 GB files, and a time-lapse stops just before that split; and a card formatted on a computer is not guaranteed to work, so format it in the camera.
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
