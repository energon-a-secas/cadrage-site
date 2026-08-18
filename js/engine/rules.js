// ── Rules ────────────────────────────────────────────────────
// Each rule is data. `applies` decides whether the rule has enough to say
// anything; `test` returns { fires, detail, fix? }. A rule that cannot be
// switched off by its own inputs is not a rule, so every test reads the
// config rather than hard-coding a verdict.

import { flicker, isSelectableStep, spillFalloff, depthOfField, SHUTTER_STEPS } from './calc.js';
import { PICTURE_PROFILES, GAMMAS, effectiveGamma, logForcesPpOff, BASE_ISO_CLAIMS } from '../data/gammas.js';
import { LENSES } from '../data/lenses.js';
import { isValidMode, modesAtFps, fpsFor, CHROMA_LABELS, FORMATS } from '../data/bodies.js';

export const AREAS = {
  exposure: 'Exposure',
  flicker: 'Flicker',
  colour: 'Colour',
  focus: 'Focus',
  lighting: 'Lighting',
  format: 'Format',
  post: 'Post',
  inert: 'Inert settings',
};

export const SEVERITY = {
  error: { label: 'Contradiction', weight: 4 },
  warn: { label: 'Worth changing', weight: 3 },
  note: { label: 'Worth knowing', weight: 2 },
  inert: { label: 'Doing nothing', weight: 1 },
};

export const RULES = [
  // ── Flicker ────────────────────────────────────────────────
  {
    id: 'flicker/shutter-vs-mains',
    area: 'flicker',
    severity: 'error',
    basis: 'physics',
    title: 'Shutter speed does not divide the light pulse',
    learn: 'flicker-and-shutter',
    applies: c => !!(c.exposure.shutter.denom && c.room.mainsHz),
    test: c => {
      const f = flicker({
        mainsHz: c.room.mainsHz,
        shutterDenom: c.exposure.shutter.denom,
        fps: c.format.fps,
      });
      if (f.clean) {
        return {
          fires: false,
          detail: `1/${c.exposure.shutter.denom} spans exactly ${f.pulsesPerExposure} light pulse${f.pulsesPerExposure === 1 ? '' : 's'} at ${c.room.mainsHz}Hz mains. Every frame collects the same light.`,
        };
      }
      const d = c.exposure.shutter.denom;
      return {
        fires: true,
        detail: `Mains at ${c.room.mainsHz}Hz makes the lights pulse at ${f.pulseHz}Hz, one pulse every ${f.pulseMs}ms. At 1/${d} the shutter is open ${f.exposureMs.toFixed(2)}ms, which is ${f.pulsesPerExposure.toFixed(3)} pulses. Because that is not a whole number, each frame catches a different slice of the cycle and the difference shows up as banding or a pulsing brightness. 1/${f.nearestSafe} is the nearest speed that lands on a whole pulse.`,
        fix: { path: 'exposure.shutter.denom', to: f.nearestSafe, label: `Set shutter to 1/${f.nearestSafe}` },
      };
    },
  },
  {
    id: 'flicker/shutter-not-selectable',
    area: 'flicker',
    severity: 'warn',
    basis: 'sony-spec',
    title: 'That shutter speed is not on the dial',
    learn: 'flicker-and-shutter',
    applies: c => !!c.exposure.shutter.denom,
    test: c => {
      const d = c.exposure.shutter.denom;
      if (isSelectableStep(d)) return { fires: false, detail: `1/${d} is a standard 1/3-stop step.` };
      const below = [...SHUTTER_STEPS].reverse().find(s => s < d);
      const above = SHUTTER_STEPS.find(s => s > d);
      return {
        fires: true,
        detail: `1/${d} is not one of the camera's 1/3-stop steps. The run goes ${below ? `1/${below}` : '...'} then ${above ? `1/${above}` : '...'}, with nothing between. Reaching 1/${d} needs Var. Shutter, which exposes fine-grained speeds in decimal form. If you set this from the normal dial you actually recorded a neighbouring value.`,
      };
    },
  },
  {
    id: 'flicker/anti-flicker-is-stills-only',
    area: 'flicker',
    severity: 'note',
    basis: 'sony-spec',
    title: 'Anti-flicker Shoot. does nothing while recording',
    learn: 'flicker-and-shutter',
    applies: c => c.flicker.antiFlicker === true,
    test: () => ({
      fires: true,
      detail: 'Anti-flicker Shoot. is a stills feature. Sony lists it as unavailable in movie shooting mode, and it detects only 100Hz or 120Hz sources by half-pressing the shutter. For video the equivalent control is Var. Shutter.',
      fix: { path: 'flicker.antiFlicker', to: false, label: 'Turn Anti-flicker Shoot. off' },
    }),
  },
  {
    id: 'flicker/var-shutter-off-with-flicker-risk',
    area: 'flicker',
    severity: 'warn',
    basis: 'sony-spec',
    title: 'The only anti-flicker tool that works for video is switched off',
    learn: 'flicker-and-shutter',
    applies: c => c.flicker.varShutter === false && !!c.room.mainsHz && c.room.lights.length > 0,
    test: c => {
      const f = flicker({ mainsHz: c.room.mainsHz, shutterDenom: c.exposure.shutter.denom, fps: c.format.fps });
      const unsure = c.room.lights.some(l => l.flickerFree === null || l.flickerFree === undefined);
      const alreadyClean = c.exposure.shutter.denom && f.clean;
      if (alreadyClean && !unsure) {
        return { fires: false, detail: 'Shutter already lands on a whole light pulse and the lights are known flicker-free, so Var. Shutter has nothing to fix.' };
      }
      return {
        fires: true,
        detail: `Var. Shutter is the one anti-flicker control Sony documents for movies, and it is off.${alreadyClean ? ' Your shutter is arithmetically clean for mains flicker, but' : ''} LED panels often pulse at their own driver frequency rather than the mains rate, which no shutter speed derived from ${c.room.mainsHz}Hz will cancel.${unsure ? ' You have not recorded whether these panels are flicker-free, so this is unresolved rather than fine.' : ''} Var. Shutter lets you tune the speed in fine steps while watching the bands disappear.`,
        fix: { path: 'flicker.varShutter', to: true, label: 'Turn Var. Shutter on' },
      };
    },
  },
  {
    id: 'flicker/var-shutter-needs-manual-shutter',
    area: 'flicker',
    severity: 'error',
    basis: 'sony-spec',
    title: 'Var. Shutter cannot be selected in this exposure mode',
    learn: 'flicker-and-shutter',
    applies: c => true,
    test: c => {
      const manualShutter = c.exposure.shutter.mode === 'manual' && !!c.exposure.shutter.denom;
      if (manualShutter) {
        return { fires: false, detail: 'Shutter speed is set manually, so Var. Shutter is available.' };
      }
      return {
        fires: true,
        detail: `Sony documents Var. Shutter as selectable only in exposure modes that let you set the shutter speed by hand: S or M. With shutter set to ${c.exposure.shutter.mode === 'auto' ? 'auto' : 'no fixed value'}, the option is not reachable. This is the part that makes flicker feel unfixable: the tool exists, the camera is simply not in a mode that offers it.`,
        fix: { path: 'exposure.shutter.mode', to: 'manual', label: 'Set shutter to manual' },
      };
    },
  },

  // ── Colour ─────────────────────────────────────────────────
  {
    id: 'colour/log-excludes-picture-profile',
    area: 'colour',
    severity: 'error',
    basis: 'sony-spec',
    title: 'Picture Profile is forced off by Log shooting',
    learn: 'log-vs-picture-profile',
    applies: c => logForcesPpOff(c.colour.log),
    test: c => {
      const pp = c.colour.pictureProfile;
      if (!pp || pp === 'off') {
        return { fires: false, detail: 'Log is on and Picture Profile is off, which is the only combination the camera allows.' };
      }
      return {
        fires: true,
        detail: `Sony states that Picture Profile "is fixed to [Off]" when Log Shooting is set to On (Flexible ISO). ${PICTURE_PROFILES[pp]?.label || pp} is recorded here as if it were active, but the camera is ignoring it. Every parameter under it (saturation, black level, detail) is doing nothing.`,
        fix: { path: 'colour.pictureProfile', to: 'off', label: 'Set Picture Profile to Off' },
      };
    },
  },
  {
    id: 'colour/pp-gamma-override',
    area: 'colour',
    severity: 'note',
    basis: 'sony-spec',
    title: 'The gamma here is an override, not what the preset means',
    learn: 'gamma-curves',
    applies: c => c.colour.log === 'off' && !!c.colour.pictureProfile && c.colour.pictureProfile !== 'off',
    test: c => {
      const eff = effectiveGamma(c.colour);
      if (!eff.overridden) {
        return { fires: false, detail: `${PICTURE_PROFILES[c.colour.pictureProfile]?.label} with its documented gamma, ${GAMMAS[eff.gamma]?.label || 'none'}.` };
      }
      const pp = PICTURE_PROFILES[c.colour.pictureProfile];
      return {
        fires: true,
        detail: `${pp.label} is documented by Sony as "an example setting using [${GAMMAS[eff.presetGamma]?.label}] gamma", but this setup sets ${GAMMAS[eff.gamma]?.label}. That is legal and may well be what you want, ${GAMMAS[eff.gamma]?.blurb ? `since ${GAMMAS[eff.gamma].label} ${GAMMAS[eff.gamma].blurb.charAt(0).toLowerCase()}${GAMMAS[eff.gamma].blurb.slice(1)}` : ''} The point is that "${pp.label}" no longer describes what you are shooting, so notes saying ${pp.label} will not reproduce this. Write down the gamma.`,
      };
    },
  },
  {
    id: 'colour/log-breaks-custom-wb',
    area: 'colour',
    severity: 'warn',
    basis: 'sony-spec',
    title: 'Custom white balance set up under Log can come out wrong',
    learn: 'white-balance',
    applies: c => logForcesPpOff(c.colour.log) && String(c.colour.wb.mode).startsWith('custom'),
    test: () => ({
      fires: true,
      detail: 'Sony notes that Log Shooting set to On "may cause an error in the white balance custom setup". The documented workaround is to switch Log off, run the custom white balance measurement, then turn Log back on. If custom WB was measured with Log already enabled, it is worth redoing.',
    }),
  },
  {
    id: 'colour/wb-compensates-for-backdrop',
    area: 'colour',
    severity: 'warn',
    basis: 'industry-convention',
    title: 'White balance is correcting a lighting problem',
    learn: 'colour-cast-vs-white-balance',
    applies: c => Math.abs(c.colour.wb.gm || 0) >= 2 && c.room.backdrop && c.room.backdrop !== 'none',
    test: c => {
      const gm = c.colour.wb.gm;
      const dir = gm > 0 ? 'magenta' : 'green';
      const backdropPushes = c.room.backdrop === 'green';
      if (!backdropPushes) {
        return { fires: false, detail: 'Backdrop is not a saturated colour, so the tint shift is unlikely to be compensating for spill.' };
      }
      const mainAtBackdrop = c.room.lights.some(l => l.aim === 'backdrop');
      return {
        fires: true,
        detail: `White balance is shifted ${Math.abs(gm)} steps toward ${dir}. Against a green backdrop that reads as a fix for green spill, but white balance applies to the whole frame: it shifts the subject as much as the cast. The result is a subject leaning ${dir} to make the background look neutral.${mainAtBackdrop ? ' The cast has a specific cause here: a light is aimed at the backdrop, so the backdrop is a green light source pointed at your subject.' : ''} Reducing the spill at its source lets white balance go back to describing your key light.`,
      };
    },
  },
  {
    id: 'colour/stacked-correction',
    area: 'post',
    severity: 'warn',
    basis: 'physics',
    title: 'The same axis is corrected twice',
    learn: 'correction-stacking',
    applies: c => !!c.post.editor && c.post.editor !== 'none' && Object.keys(c.post.values || {}).length > 0,
    test: c => {
      // Deliberately declarative: each axis names the in-camera and post
      // controls that move it, so adding an axis is data, not logic.
      const AXES = [
        { axis: 'Saturation', camera: () => c.colour.pp?.saturation, post: () => c.post.values.saturation, unit: 'PP saturation' },
        { axis: 'Shadow level', camera: () => c.colour.pp?.blackGamma?.level, post: () => c.post.values.light ?? c.post.values.shadow, unit: 'Black Gamma level' },
        { axis: 'Black point', camera: () => c.colour.pp?.blackLevel, post: () => c.post.values.black, unit: 'Black Level' },
        { axis: 'Tint', camera: () => c.colour.wb?.gm, post: () => c.post.values.tint, unit: 'WB G-M' },
        { axis: 'Sharpness', camera: () => c.colour.pp?.detail?.level, post: () => c.post.values.sharpen ?? c.post.values.clarity, unit: 'Detail Level' },
      ];
      const stacked = AXES
        .map(a => ({ ...a, camVal: a.camera(), postVal: a.post() }))
        .filter(a => Number.isFinite(a.camVal) && a.camVal !== 0 && Number.isFinite(a.postVal) && a.postVal !== 0);

      if (!stacked.length) {
        return { fires: false, detail: 'No axis is being pushed both in camera and in post.' };
      }

      const opposed = stacked.filter(a => Math.sign(a.camVal) !== Math.sign(a.postVal));
      const lines = stacked.map(a =>
        `${a.axis}: ${a.unit} ${a.camVal > 0 ? '+' : ''}${a.camVal} in camera, then ${a.postVal > 0 ? '+' : ''}${a.postVal} in ${c.post.editor}${Math.sign(a.camVal) !== Math.sign(a.postVal) ? ' (opposite directions)' : ''}`);

      return {
        fires: true,
        detail: `${stacked.length} axis${stacked.length === 1 ? '' : 'es'} get corrected in both places:\n${lines.map(l => `- ${l}`).join('\n')}\n\nThe two scales are not comparable, so these do not add up to a number. What they do is make the result impossible to reason about: when the footage comes out wrong you cannot tell which of the two corrections to change.${opposed.length ? ` ${opposed.length} of them pull in opposite directions, which is effort spent cancelling your own earlier setting.` : ''} Pick one place to fix each axis.`,
      };
    },
  },

  // ── Lighting ───────────────────────────────────────────────
  {
    id: 'lighting/main-aimed-at-backdrop',
    area: 'lighting',
    severity: 'error',
    basis: 'industry-convention',
    title: 'A light is pointed at a saturated backdrop',
    learn: 'spill-and-separation',
    applies: c => c.room.backdrop === 'green' && c.room.lights.some(l => l.aim === 'backdrop'),
    test: c => {
      const at = c.room.lights.filter(l => l.aim === 'backdrop');
      const gap = c.room.subjectToBackdropCm;
      const spill = gap ? spillFalloff({ fromCm: gap, toCm: Math.max(gap * 4, 30) }) : null;
      return {
        fires: true,
        detail: `${at.length} light${at.length === 1 ? ' is' : 's are'} aimed at the backdrop. A lit green surface is a green light source, and it is pointed at the back of your subject. This is the root cause that the tint shift, the saturation push and the HSL work in post are all downstream of.${gap ? ` The subject sits ${gap}cm from it, which is close enough that the backdrop fills much of the subject's view of the world.` : ''} A backdrop only needs enough light to read as its colour and be evenly lit; that is usually far less than a key light's worth, aimed across the surface rather than into it.`,
      };
    },
  },
  {
    id: 'lighting/subject-too-close-to-backdrop',
    area: 'lighting',
    severity: 'warn',
    basis: 'physics',
    title: 'Subject is inside the backdrop\'s near field',
    learn: 'spill-and-separation',
    applies: c => c.room.backdrop === 'green' && Number.isFinite(c.room.subjectToBackdropCm),
    test: c => {
      const gap = c.room.subjectToBackdropCm;
      const s = spillFalloff({ fromCm: gap, toCm: 50 });
      if (!s.inNearField) {
        return { fires: false, detail: `At ${gap}cm the subject is far enough back that distance is doing useful work.` };
      }
      return {
        fires: true,
        detail: `The subject is ${gap}cm from the backdrop. Moving it to 50cm is often quoted as a ${s.pointRatio.toFixed(0)}x reduction in spill using inverse-square, but that law describes point sources. A backdrop is a broad flat one, so the honest estimate is a range: somewhere between ${s.lowRatio.toFixed(1)}x and ${s.pointRatio.toFixed(0)}x, and at this distance the low end is the likely one. ${s.caveat}`,
      };
    },
  },
  {
    id: 'lighting/led-flicker-unknown',
    area: 'lighting',
    severity: 'note',
    basis: 'industry-convention',
    title: 'Whether these panels flicker is unrecorded',
    learn: 'flicker-and-shutter',
    applies: c => c.room.lights.length > 0,
    test: c => {
      const unknown = c.room.lights.filter(l => l.flickerFree === null || l.flickerFree === undefined);
      if (!unknown.length) return { fires: false, detail: 'Every light has its flicker behaviour recorded.' };
      return {
        fires: true,
        detail: `${unknown.length} of ${c.room.lights.length} light${c.room.lights.length === 1 ? '' : 's'} have no flicker-free status recorded. This matters because dimmable LED panels commonly pulse at their driver's PWM frequency, which has nothing to do with mains. A shutter speed derived from ${c.room.mainsHz}Hz will not cancel it, and running such a panel at full brightness often stops the pulsing entirely. Worth one test: point the camera at each panel at a fast shutter and look for bands.`,
      };
    },
  },

  // ── Exposure ───────────────────────────────────────────────
  {
    id: 'exposure/iso-auto-range-drift',
    area: 'exposure',
    severity: 'warn',
    basis: 'empirical-user',
    title: 'Auto ISO will change exposure inside a take',
    learn: 'iso-and-exposure',
    applies: c => c.exposure.iso.mode === 'auto',
    test: c => {
      const { min, max } = c.exposure.iso;
      if (!Number.isFinite(min) || !Number.isFinite(max)) {
        return { fires: true, detail: 'ISO is on auto with no recorded range, so the camera can move it anywhere in its span mid-take.', fix: { path: 'exposure.iso.mode', to: 'manual', label: 'Set ISO to manual' } };
      }
      const stops = Math.log2(max / min);
      return {
        fires: true,
        detail: `ISO is free to move between ${min} and ${max}, a range of ${stops.toFixed(1)} stops. On a locked-off shot of a rotating object that is the camera changing exposure while nothing about the scene changed: a reflective surface swings past, the meter reacts, and brightness drifts. It is the same drift that makes footage need exposure and colour correction per clip. A static subject under constant light has a single correct ISO, so setting it once removes the variable.`,
        fix: { path: 'exposure.iso.mode', to: 'manual', label: `Lock ISO (try ${max})` },
      };
    },
  },
  {
    id: 'exposure/dual-gain-dead-zone',
    area: 'exposure',
    severity: 'note',
    basis: 'unverified',
    title: 'ISO may sit below the second gain step',
    learn: 'iso-and-exposure',
    applies: c => {
      const claim = BASE_ISO_CLAIMS[effectiveGamma(c.colour).gamma];
      return !!claim && (Number.isFinite(c.exposure.iso.value) || Number.isFinite(c.exposure.iso.max));
    },
    test: c => {
      const gamma = effectiveGamma(c.colour).gamma;
      const claim = BASE_ISO_CLAIMS[gamma];
      const iso = Number.isFinite(c.exposure.iso.value) ? c.exposure.iso.value : c.exposure.iso.max;
      const [low, high] = claim.claimed;
      if (iso >= high) return { fires: false, detail: `ISO ${iso} is at or above the higher claimed step of ${high}.` };
      if (iso >= low) {
        return { fires: false, detail: `ISO ${iso} sits at or above the lower claimed step of ${low}.` };
      }
      return {
        fires: true,
        detail: `ISO ${iso} is below ${low}, the lower of the two figures commonly cited for ${GAMMAS[gamma]?.label || gamma} on this body. ${claim.note}`,
      };
    },
  },
  {
    id: 'exposure/auto-slow-shutter-on',
    area: 'exposure',
    severity: 'warn',
    basis: 'sony-spec',
    title: 'Auto Slow Shutter can override your frame timing',
    learn: 'flicker-and-shutter',
    applies: c => c.exposure.autoSlowShutter === true,
    test: () => ({
      fires: true,
      detail: 'Auto Slow Shutter lets the camera lengthen exposure in dim light. That silently undoes any shutter speed you chose for flicker or motion, and it does so only sometimes, which makes the result inconsistent between takes.',
      fix: { path: 'exposure.autoSlowShutter', to: false, label: 'Turn Auto Slow Shutter off' },
    }),
  },

  // ── Focus ──────────────────────────────────────────────────
  {
    id: 'focus/af-c-on-tripod',
    area: 'focus',
    severity: 'warn',
    basis: 'industry-convention',
    title: 'Continuous AF on a locked-off shot is all cost',
    learn: 'focus-modes',
    applies: c => c.focus.mode === 'af-c' && c.stabilisation.tripod === true,
    test: c => {
      const lens = LENSES[c.lens.id];
      const quirk = lens?.quirks?.find(q => q.id === 'af-c-aperture-drift');
      return {
        fires: true,
        detail: `The camera is on a tripod and focus mode is continuous. Nothing is changing distance, so AF-C has nothing to track, but it keeps evaluating, and while it evaluates it hunts. Each hunt is a visible focus shift, and on some lenses it drives aperture too, which moves exposure and colour with it.${quirk ? ` This lens is one of them: ${quirk.detail.charAt(0).toLowerCase()}${quirk.detail.slice(1)}` : ''} Focusing once with AF-S and then leaving it removes the whole class of problem.`,
        fix: { path: 'focus.mode', to: 'af-s', label: 'Switch to AF-S' },
      };
    },
  },
  {
    id: 'focus/dof-narrower-than-subject',
    area: 'focus',
    severity: 'note',
    basis: 'physics',
    title: 'Depth of field is thinner than the subject',
    learn: 'depth-of-field',
    applies: c => {
      const lens = LENSES[c.lens.id];
      return !!(lens?.focalMm && c.lens.aperture && c.room.subjectDistanceCm);
    },
    test: c => {
      const lens = LENSES[c.lens.id];
      // The calculator view lets you pick a circle of confusion; here the
      // strict 4K figure is used deliberately, since the complaint that
      // prompts this rule is pixel-level softness.
      const dof = depthOfField({ focalMm: lens.focalMm, aperture: c.lens.aperture, distanceCm: c.room.subjectDistanceCm });
      if (!dof.ok || dof.totalCm > 5) {
        return { fires: false, detail: dof.ok ? `About ${dof.totalCm.toFixed(1)}cm of depth at f/${c.lens.aperture}.` : 'Not enough information.' };
      }
      return {
        fires: true,
        detail: `At ${lens.focalMm}mm, f/${c.lens.aperture}, ${c.room.subjectDistanceCm}cm away, the zone that is genuinely sharp is about ${dof.totalCm.toFixed(1)}cm deep: ${dof.inFrontCm.toFixed(1)}cm in front of the focus point and ${dof.behindCm === Infinity ? 'the rest' : `${dof.behindCm.toFixed(1)}cm`} behind. Most objects are deeper than that, so the front face and the back of the same object cannot both be sharp. Closing to f/4 or f/5.6 costs background blur and buys a subject that is sharp all the way through.`,
      };
    },
  },
  {
    id: 'focus/mfd-vs-distance',
    area: 'focus',
    severity: 'error',
    basis: 'sony-spec',
    title: 'Subject is closer than the lens can focus',
    learn: 'depth-of-field',
    applies: c => {
      const lens = LENSES[c.lens.id];
      return !!(lens?.mfdCm && Number.isFinite(c.room.subjectDistanceCm));
    },
    test: c => {
      const lens = LENSES[c.lens.id];
      if (c.room.subjectDistanceCm >= lens.mfdCm) {
        return { fires: false, detail: `${c.room.subjectDistanceCm}cm clears the ${lens.mfdCm}cm minimum focus distance.` };
      }
      return {
        fires: true,
        detail: `${lens.label} cannot focus closer than ${lens.mfdCm}cm, and the subject is at ${c.room.subjectDistanceCm}cm. The lens will not achieve focus at all here; it will hunt and fail. Either move back to at least ${lens.mfdCm}cm or use a lens with a shorter minimum.`,
      };
    },
  },

  // ── Format ─────────────────────────────────────────────────
  {
    id: 'format/invalid-combination',
    area: 'format',
    severity: 'error',
    basis: 'sony-spec',
    title: 'That recording mode does not exist',
    learn: 'codecs-and-bitrates',
    applies: c => !!(c.format.container && c.format.fps && c.format.bitrate && c.format.chroma),
    test: c => {
      const { container, res, fps, bitrate, chroma } = c.format;
      if (isValidMode(container, res, fps, bitrate, chroma)) {
        return { fires: false, detail: `${FORMATS[container].label} ${res.toUpperCase()} ${fps}p ${bitrate}M ${CHROMA_LABELS[chroma]} is a documented mode.` };
      }
      const atFps = modesAtFps(container, res, fps);
      const rates = fpsFor(container, res);
      const alt = atFps.length
        ? `At ${fps}p this container offers ${atFps.map(m => `${m.bitrate}M ${CHROMA_LABELS[m.chroma]}`).join(', ')}.`
        : `${FORMATS[container].label} ${res.toUpperCase()} has no ${fps}p option at all; it offers ${rates.join('p, ')}p.`;
      return {
        fires: true,
        detail: `${FORMATS[container].label} ${res.toUpperCase()} at ${fps}p, ${bitrate}M, ${CHROMA_LABELS[chroma]} is not in Sony's Record Setting table. ${alt}`,
      };
    },
  },
  {
    id: 'format/embed-lut-locked-on-sd',
    area: 'format',
    severity: 'note',
    basis: 'sony-spec',
    title: 'Embed LUT File will not stay on with this card',
    learn: 'luts',
    applies: c => c.colour.embedLut === true,
    test: c => {
      const card = c.format.card;
      if (card === 'sdxc' || card === 'cfexpress') {
        return { fires: false, detail: 'Card type supports embedding the LUT file.' };
      }
      return {
        fires: true,
        detail: 'Sony locks Embed LUT File to Off when recording to SD or SDHC cards. If the setting looks enabled but the card is SD/SDHC, nothing is being embedded, and footage will arrive in the editor without the LUT that made it look right on the camera.',
      };
    },
  },

  // ── Inert settings ─────────────────────────────────────────
  {
    id: 'inert/lut-without-log',
    area: 'inert',
    severity: 'inert',
    basis: 'sony-spec',
    title: 'Select LUT has no effect without Log',
    learn: 'luts',
    applies: c => !!c.colour.lut,
    test: c => {
      if (logForcesPpOff(c.colour.log)) {
        return { fires: false, detail: 'Log is on, so the selected LUT applies to monitoring.' };
      }
      return {
        fires: true,
        detail: `A LUT is recorded here (${c.colour.lut}) but Log Shooting is off. LUT selection belongs to the Log pipeline; with a Picture Profile driving the image instead, the LUT is not in the path. It reads as an active part of the setup while doing nothing, which is exactly how a note becomes misleading.`,
        fix: { path: 'colour.lut', to: null, label: 'Clear the LUT' },
      };
    },
  },
  {
    id: 'inert/awb-priority-with-manual-wb',
    area: 'inert',
    severity: 'inert',
    basis: 'sony-spec',
    title: 'Priority Set in AWB does nothing here',
    learn: 'white-balance',
    applies: c => !!c.colour.wb.awbPriority && c.colour.wb.awbPriority !== 'standard',
    test: c => {
      if (c.colour.wb.mode === 'auto') {
        return { fires: false, detail: 'White balance is auto, so the AWB priority applies.' };
      }
      return {
        fires: true,
        detail: `Priority Set in AWB is set to "${c.colour.wb.awbPriority}", but it only steers automatic white balance. This setup measures white balance manually, so the camera never consults it. Harmless, but it is one more line in the notes that looks like it matters.`,
      };
    },
  },
  {
    id: 'inert/peaking-during-record',
    area: 'inert',
    severity: 'inert',
    basis: 'industry-convention',
    title: 'Peaking is a manual-focus aid',
    learn: 'focus-modes',
    applies: c => c.focus.peaking?.on === true,
    test: c => {
      if (c.focus.mode === 'mf' || c.focus.mode === 'dmf') {
        return { fires: false, detail: 'Manual focus, so peaking is doing its job.' };
      }
      return {
        fires: true,
        detail: `Peaking outlines what is in focus so you can focus by hand. With focus mode set to ${c.focus.mode.toUpperCase()} the camera is focusing itself, so the outlines are decoration. They also sit on top of the image while you judge exposure and colour, which is a small but real cost.`,
        fix: { path: 'focus.peaking.on', to: false, label: 'Turn peaking off' },
      };
    },
  },
  {
    id: 'inert/steadyshot-on-tripod',
    area: 'inert',
    severity: 'inert',
    basis: 'industry-convention',
    title: 'Stabilisation is working against a tripod',
    learn: 'focus-modes',
    applies: c => c.stabilisation.tripod === true && c.stabilisation.steadyShot === true,
    test: () => ({
      fires: true,
      detail: 'SteadyShot corrects for movement that a tripod has already removed. With nothing to correct it can still drift while hunting for motion, and it crops slightly into the frame. Off is the standard choice on a locked-off shot.',
      fix: { path: 'stabilisation.steadyShot', to: false, label: 'Turn SteadyShot off' },
    }),
  },

  // ── Post ───────────────────────────────────────────────────
  {
    id: 'post/not-colour-managed',
    area: 'post',
    severity: 'warn',
    basis: 'industry-convention',
    title: 'Grading decisions rest on an uncalibrated view',
    learn: 'monitoring-and-delivery',
    applies: c => !!c.post.editor && c.post.editor !== 'none' && c.post.colourManaged === false,
    test: c => ({
      fires: true,
      detail: `${c.post.editor} is being used without colour management, and the display it is judged on is not calibrated.${c.post.monitorNote ? ` Recorded workaround: "${c.post.monitorNote}"` : ''} Compensating by running the display dark makes every judgement relative to a guess: it can be undone only by remembering the guess. The cheap version of fixing this is not a probe but a reference: the same known-good clip, viewed on the delivery platform, as the thing you compare against.`,
    }),
  },
];

export const RULE_BY_ID = Object.fromEntries(RULES.map(r => [r.id, r]));
