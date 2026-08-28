// ── Walkthroughs ─────────────────────────────────────────────
// Ordered passes through the camera for one intent each. A step points
// at a row in the camera replica (menuId), explains why in markdown,
// and may offer to write values into the active setup through the same
// data-path contract every other control uses.
//
// Contract (docs/plans/2026-08-22-rigcheck-rework.md C3), with one
// amendment made here: a set[].value may be a function of the config,
// because the right value can depend on what is already recorded (the
// flicker-clean shutter depends on the mains frequency). Tests call
// function values with blank() and assert the result is applicable.
//
// The photo track never writes: the setup object models a video shoot,
// and pretending stills fields exist is how notes drift from reality.
// Photo steps teach and point; the video track teaches, points and sets.

import { flicker } from '../engine/calc.js';

export const WALK_TRACKS = {
  video: {
    label: 'Video',
    blurb: 'The pass to run before a controlled video shoot. Every step can write the value it argues for into the active setup, and the Review re-judges as you go.',
  },
  photo: {
    label: 'Photography',
    blurb: 'The pass for stills. The setup object models video, so these steps point at the rows and explain; nothing here writes.',
  },
};

/** The flicker-clean shutter nearest the 180-degree ideal, for this config. */
function cleanShutter(c) {
  const f = flicker({ mainsHz: c.room.mainsHz, shutterDenom: null, fps: c.format.fps });
  if (!f.ok || !f.safeDenoms.length) return 50;
  const ideal = (c.format.fps || 25) * 2;
  return f.safeDenoms.reduce((best, d) =>
    Math.abs(Math.log2(d / ideal)) < Math.abs(Math.log2(best / ideal)) ? d : best, f.safeDenoms[0]);
}

export const WALKTHROUGHS = [
  // ── Video ──────────────────────────────────────────────────
  {
    id: 'v-file-format',
    track: 'video', phase: 'Format', title: 'Pick the container',
    menuId: 'file-format', lesson: 'codecs-and-bitrates', tool: 'card',
    why: `
XAVC HS is HEVC: every mode is 10-bit and the files are smaller for the same quality, but they are heavier to decode on the edit machine. XAVC S is AVC: bigger files, plays everywhere, and its 4K list mixes 8-bit and 10-bit rows. If the edit is CapCut or an older machine, S is the safe answer; if the pipeline handles HEVC, HS gets you 10-bit at lower bitrates.`,
    set: [],
  },
  {
    id: 'v-frame-rate',
    track: 'video', phase: 'Format', title: 'Set the frame rate',
    menuId: 'frame-rate', lesson: 'codecs-and-bitrates', tool: null,
    why: `
24p is the film look, 60p is the smooth look and the one that survives slowing down in the edit. The camera only offers the rates the chosen container supports, exactly as the body does, and 24p exists only on NTSC per Sony's own footnote. Displayed rates are rounded: 24 records 23.98, 60 records 59.94. Decide here, because the shutter step reads this.`,
    set: [],
  },
  {
    id: 'v-record-setting',
    track: 'video', phase: 'Format', title: 'Pick bitrate and chroma',
    menuId: 'record-setting', lesson: 'codecs-and-bitrates', tool: 'card',
    why: `
Inside a frame rate the remaining knobs are bitrate and chroma sampling. 10-bit 4:2:2 holds up under grading and keying; 8-bit is fine straight out of camera and fragile the moment you push it. An impossible combination is named as one rather than silently kept, the same check the Review runs. The card calculator turns the bitrate into minutes per card before you commit.`,
    set: [],
  },
  {
    id: 'v-shutter',
    track: 'video', phase: 'Exposure', title: 'Set the shutter by the mains, then leave it',
    menuId: 'shutter-speed', lesson: 'flicker-and-shutter', tool: 'flicker',
    why: `
Mains light pulses at twice the supply frequency. A shutter interval spanning a whole number of pulses collects the same light every frame; anything else bands, and banding is expensive and unreliable to fix in post. Apply sets manual shutter at the flicker-clean speed nearest the 180-degree ideal for your recorded frame rate and mains. If that lands far from the ideal, the lesson covers the compromise.`,
    set: [
      { path: 'exposure.shutter.mode', value: 'manual', label: 'Shutter mode' },
      { path: 'exposure.shutter.denom', value: cleanShutter, label: 'Flicker-clean speed for your mains' },
    ],
  },
  {
    id: 'v-auto-slow',
    track: 'video', phase: 'Exposure', title: 'Switch Auto Slow Shutter off',
    menuId: 'auto-slow-shut', lesson: 'shutter-speed', tool: null,
    why: `
Auto Slow Shut. lets the camera lengthen the shutter in dim light, which silently undoes the flicker arithmetic you just did and changes motion blur mid-take. Sony documents the override; the Review flags it whenever it is on with a manual shutter recorded. Off for any shoot you control.`,
    set: [{ path: 'exposure.autoSlowShutter', value: false, label: 'Auto Slow Shut. off' }],
  },
  {
    id: 'v-iso',
    track: 'video', phase: 'Exposure', title: 'Take ISO off auto',
    menuId: 'iso', lesson: 'iso-and-exposure', tool: 'equiv',
    why: `
Auto ISO changes exposure inside a take whenever the frame changes: a hand enters, a white surface rotates into view, and the brightness steps. That rule is empirical, from recorded shoots, and its chip says so. Manual ISO means every exposure change in the footage is one you made. If light varies between setups, change ISO between takes, not during them.`,
    set: [{ path: 'exposure.iso.mode', value: 'manual', label: 'ISO mode' }],
  },
  {
    id: 'v-zebra',
    track: 'video', phase: 'Exposure', title: 'Turn zebras on and trust them',
    menuId: 'zebra-display', lesson: 'metering-and-compensation', tool: null,
    why: `
The meter guesses what the scene should be; zebras report what the sensor is actually getting. Stripes at your chosen level are the one exposure instrument that does not depend on the monitor being right. 75 reads skin under a standard curve; push the level up to catch clipping instead. On a log curve the numbers move, which the log lesson covers.`,
    set: [{ path: 'monitoring.zebra.on', value: true, label: 'Zebra Display on' }],
  },
  {
    id: 'v-look',
    track: 'video', phase: 'Colour', title: 'Decide the look pipeline: Log or Picture Profile',
    menuId: 'log', lesson: 'log-vs-picture-profile', tool: null,
    why: `
This is the fork the whole colour menu hangs off. Log Shooting on records S-Log3 and forces Picture Profile to Off, Sony states it plainly; that buys grading room and commits you to grading every clip. A Picture Profile with a Cine gamma is the straight-to-edit trade. Decide here once, because white balance, LUTs and zebra levels all read this choice.`,
    set: [],
  },
  {
    id: 'v-wb',
    track: 'video', phase: 'Colour', title: 'Fix the white balance',
    menuId: 'white-balance', lesson: 'white-balance', tool: null,
    why: `
AWB re-decides colour whenever the frame changes, which is the colour version of auto ISO drift. Under controlled light, set a kelvin value and leave it; 5600 is a daylight-balanced starting point that Apply writes, adjust to your actual lights. If you shift G-M to rescue the subject from backdrop spill, that is a lighting problem wearing a colour costume, and the Review will say so.`,
    set: [
      { path: 'colour.wb.mode', value: 'custom-k', label: 'WB mode' },
      { path: 'colour.wb.kelvin', value: 5600, label: '5600K starting point' },
    ],
  },
  {
    id: 'v-focus-mode',
    track: 'video', phase: 'Focus', title: 'Match the focus mode to the rig',
    menuId: 'focus-mode', lesson: 'focus-basics', tool: null,
    why: `
Does the subject-to-camera distance change during the take? Locked-off product on a tripod: MF, set with the magnifier, or AF-S re-locked between takes. Hands demonstrating, people moving: AF-C, with the area doing the real work. The Review flags AF-C on a tripod with a static subject as all cost, and retracts the finding the moment the rig says otherwise.`,
    set: [],
  },
  {
    id: 'v-af-tuning',
    track: 'video', phase: 'Focus', title: 'Tune how AF-C moves',
    menuId: 'af-transition', lesson: 'focus-advanced', tool: null,
    why: `
Two rows shape continuous AF on video. AF Transition Speed (1 to 7) is how a refocus looks: low glides like an operator, high snaps. AF Subj. Shift Sens. (1 to 5) is whether an intrusion steals focus at all: low holds the subject through crossing hands, high hands over eagerly. Apply writes the stable pairing the presets use for product work; raise sensitivity only when handovers are the point.`,
    set: [
      { path: 'focus.transitionSpeed', value: 2, label: 'AF Transition Speed 2' },
      { path: 'focus.shiftSensitivity', value: 2, label: 'AF Subj. Shift Sens. 2' },
    ],
  },
  {
    id: 'v-steadyshot',
    track: 'video', phase: 'Focus', title: 'Stabiliser: match it to the support',
    menuId: 'steadyshot', lesson: 'focus-modes', tool: null,
    why: `
SteadyShot corrects hand shake. On a tripod there is none, and the stabiliser can add a slow drift while it hunts for motion that is not there, so off on sticks, on in the hand. The Review pins this to the rig: record the tripod field honestly and the finding takes care of itself.`,
    set: [],
  },
  {
    id: 'v-review',
    track: 'video', phase: 'Check', title: 'Run the review',
    menuId: null, lesson: null, tool: null,
    why: `
Everything above wrote into the active setup. The Review now judges the whole thing at once: contradictions, settings doing nothing, and the checks that passed, each finding naming where its claim comes from. Fix what it flags, or disagree with a rule and switch it off, both are recorded honestly.`,
    set: [],
  },

  // ── Photography ────────────────────────────────────────────
  {
    id: 'p-file-format',
    track: 'photo', phase: 'Format', title: 'Shoot RAW, decide the sidecar',
    menuId: 'still-file-format', lesson: 'codecs-and-bitrates', tool: null,
    why: `
RAW keeps what the sensor captured and defers every processing decision; JPEG and HEIF bake the camera's choices in. The practical question is whether you want a finished file straight off the card. RAW plus JPEG costs card space and buys an immediate deliverable. If you never open the RAWs, that is information too: switch to JPEG and stop paying for an option you do not exercise.`,
    set: [],
  },
  {
    id: 'p-drive-mode',
    track: 'photo', phase: 'Format', title: 'Set the drive mode deliberately',
    menuId: 'drive-mode', lesson: null, tool: null,
    why: `
Single shot for composed work, continuous for moments you cannot re-run, the self-timer for tripod frames where pressing the button is the vibration. Bracketing earns its place when the light range beats the sensor. The failure mode is inheriting yesterday's drive mode: a burst of nine identical product frames, or one frame of a moment that needed nine.`,
    set: [],
  },
  {
    id: 'p-mode',
    track: 'photo', phase: 'Exposure', title: 'Pick the exposure mode for the decision you care about',
    menuId: 'shoot-mode', lesson: 'exposure-modes', tool: null,
    why: `
A (aperture priority) when depth of field is the decision, S when motion is, M when the light is controlled and repeatable. M with Auto ISO is the working middle: you hold depth and motion, the camera rides gain inside limits you set next. P is for handing the camera to someone else.`,
    set: [],
  },
  {
    id: 'p-iso-auto',
    track: 'photo', phase: 'Exposure', title: 'Bound Auto ISO before trusting it',
    menuId: 'iso-range', lesson: 'iso-and-exposure', tool: null,
    why: `
Auto ISO is only as good as its limits. ISO Range Limit stops the gain running to values you would not accept; ISO AUTO Min. SS sets how slow the shutter may go before gain rises, and on this body a 55mm frames like an 84mm, so 1/100 is the handheld floor. Bounded, Auto ISO is a tool; unbounded, it is a surprise generator.`,
    set: [],
  },
  {
    id: 'p-metering',
    track: 'photo', phase: 'Exposure', title: 'Choose metering, then correct it',
    menuId: 'metering-mode', lesson: 'metering-and-compensation', tool: null,
    why: `
Multi is right most of the time. Spot earns its place for a subject against a very different background, a face at a window, a product on black. Whatever the mode, the meter aims for mid-grey: a white backdrop meters dark and a black one meters bright, every time, by design. Exposure compensation is the correction, and the histogram is the check that does not lie.`,
    set: [],
  },
  {
    id: 'p-shutter-type',
    track: 'photo', phase: 'Exposure', title: 'Mechanical or electronic shutter',
    menuId: 'shutter-type', lesson: 'shutter-speed', tool: null,
    why: `
Electronic is silent and vibration-free, but it reads the sensor line by line: fast subjects skew and LED light can band across the frame, the stills version of the flicker problem. Mechanical is the default for anything moving or artificially lit. Silent set-ups (events, tripod product frames under continuous light you have tested) are where electronic pays.`,
    set: [],
  },
  {
    id: 'p-focus-mode',
    track: 'photo', phase: 'Focus', title: 'AF-S unless the distance changes',
    menuId: 'focus-mode', lesson: 'focus-basics', tool: null,
    why: `
AF-S locks once and stays put, which is what composed stills want. AF-C is for subjects that move between the lock and the frame. DMF adds a manual override on top of AF-S for close work where the camera picks the wrong edge. On a tripod with the magnifier, MF beats them all for repeatability.`,
    set: [],
  },
  {
    id: 'p-focus-area',
    track: 'photo', phase: 'Focus', title: 'Shrink the area to your intent',
    menuId: 'focus-area', lesson: 'focus-areas', tool: null,
    why: `
Wide lets the camera choose, and it chooses the obvious thing, which is only sometimes your subject. Zone constrains without pinning; a spot pins exactly. The sharper the aperture thins your depth of field, the smaller the area should get, because at f/1.8 the difference between the eye and the ear is the whole photograph.`,
    set: [],
  },
  {
    id: 'p-recognition',
    track: 'photo', phase: 'Focus', title: 'Set the recognition target, or switch it off',
    menuId: 'subject-recognition', lesson: 'subject-recognition', tool: null,
    why: `
Recognition finds a class of subject inside your area and hands focus to it, the eye when it can see one. For people it collapses most of the area decision. But it looks for the class you set: pointed at a product with the target on people, it finds nothing and behaves as if it were off. No people in the frame, no recognition; check the target before blaming the AF.`,
    set: [],
  },
  {
    id: 'p-wb',
    track: 'photo', phase: 'Colour', title: 'White balance: AWB is fine, RAW makes it free',
    menuId: 'white-balance', lesson: 'white-balance', tool: null,
    why: `
For RAW stills, white balance is metadata: AWB with Priority Set in AWB on White is a sensible default, and the real decision happens in the converter. For JPEG and HEIF it is baked in, so treat it like video: a fixed kelvin under controlled light. The G-M shift warning from the video track applies here too: do not use it to rescue a subject from spill a flag should fix.`,
    set: [],
  },
  {
    id: 'p-check',
    track: 'photo', phase: 'Check', title: 'Zebras, histogram, then shoot',
    menuId: 'zebra-display', lesson: 'metering-and-compensation', tool: null,
    why: `
Before the first real frame: zebras at the clipping point, one test exposure, read the histogram. A pile against the right wall is gone for good; everything else is recoverable in RAW. Thirty seconds of instrument reading beats an afternoon of rescue grading, and it is the same habit the video track builds.`,
    set: [],
  },
];

export const WALK_BY_ID = Object.fromEntries(WALKTHROUGHS.map(s => [s.id, s]));

export function stepsForTrack(track) {
  return WALKTHROUGHS.filter(s => s.track === track);
}

/** Phases of a track, in first-appearance order. */
export function phasesForTrack(track) {
  const seen = [];
  for (const s of stepsForTrack(track)) if (!seen.includes(s.phase)) seen.push(s.phase);
  return seen;
}
