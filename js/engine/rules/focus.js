// ── Rules: focus ─────────────────────────────────────────────
// The focus rules, the second area moved out of rules.js: the lens work
// of 2026-11-13 touched them, and rules.js is past the size guideline.
// rules.js spreads them back in at the same position, so the order the
// review lists them in is unchanged.

import { depthOfField, sensorOf } from '../calc.js';
import { imageArea, fieldAt } from '../optics.js';
import { LENSES } from '../../data/lenses.js';
import { movieCrop } from '../../data/bodies.js';

/**
 * Past this f-number the aperture's own diffraction softens a 4K frame
 * from an APS-C sensor: at f/11 the Airy disc (2.44 x 0.55 um x N) is
 * about 15 um across, against a 4K pixel of about 6 um on this sensor.
 */
export const DIFFRACTION_FROM = 11;

const cmTxt = v => (v === Infinity ? 'unlimited' : `${v.toFixed(1)}cm`);

/** Total depth at the review's strict 4K circle, cm. */
const depthCm = (lens, aperture, distanceCm) => depthOfField({ focalMm: lens.focalMm, aperture, distanceCm }).totalCm;

/**
 * What deepens the zone from where this setup already is. The aperture
 * has room only up to the diffraction limit; after that it is distance,
 * which a 4K frame delivered at 1080p can pay for with a crop.
 */
function depthAdvice(lens, c) {
  const n = c.lens.aperture;
  const d = c.room.subjectDistanceCm;
  const smallest = lens.apertureMax || 22;
  const back = `from ${d * 2}cm the zone is ${cmTxt(depthCm(lens, n, d * 2))} deep, and a 4K frame cropped to half its width is still a full 1080p frame`;
  if (n < 5.6) {
    const to = Math.min(8, smallest);
    return `Closing to f/${to} deepens it to ${cmTxt(depthCm(lens, to, d))}, for ${(2 * Math.log2(to / n)).toFixed(1)} stops less light and a background that blurs less.`;
  }
  if (n < DIFFRACTION_FROM && smallest >= DIFFRACTION_FROM) {
    return `The aperture is already closed down: f/${DIFFRACTION_FROM} gives ${cmTxt(depthCm(lens, DIFFRACTION_FROM, d))}, and past it diffraction softens a 4K frame from this sensor faster than the extra depth sharpens it. Distance is the stronger lever: ${back}.`;
  }
  return `Closing further trades sharpness for depth: past f/${DIFFRACTION_FROM} diffraction softens a 4K frame from this sensor. Distance is the lever left: ${back}.`;
}

/**
 * The lens at its closest in this setup's focus mode. Sony gives some
 * lenses a nearer pair for manual focus (the 15mm G: 17 cm against 20).
 */
const closest = (lens, c) => (lens?.mf && c.focus.mode === 'mf' ? { ...lens, ...lens.mf } : lens);

/** The tightest frame the lens draws, at its minimum focus distance, cm (long side first). */
function closestFrame(lens, c) {
  if (!(lens.maxMag > 0)) return null;
  const area = imageArea({ sensor: sensorOf(c.body), crop: movieCrop(c.body, c.format) });
  const f = fieldAt(area, lens.maxMag);
  return `${f.widthCm.toFixed(1)} x ${f.heightCm.toFixed(1)}cm`;
}

export const FOCUS_RULES = [
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
        detail: `At ${lens.focalMm}mm, f/${c.lens.aperture}, ${c.room.subjectDistanceCm}cm away, the zone that is genuinely sharp is about ${dof.totalCm.toFixed(1)}cm deep: ${dof.inFrontCm.toFixed(1)}cm in front of the focus point and ${dof.behindCm === Infinity ? 'the rest' : `${dof.behindCm.toFixed(1)}cm`} behind. Most objects are deeper than that, so the front face and the back of the same object cannot both be sharp. ${depthAdvice(lens, c)}`,
      };
    },
  },
  {
    id: 'focus/mfd-vs-distance',
    area: 'focus',
    severity: 'error',
    basis: 'sony-spec',
    title: 'Subject is closer than the lens can focus',
    learn: 'close-ups-and-magnification',
    applies: c => {
      const lens = LENSES[c.lens.id];
      return !!(lens?.mfdCm && Number.isFinite(c.room.subjectDistanceCm));
    },
    test: c => {
      const lens = closest(LENSES[c.lens.id], c);
      if (c.room.subjectDistanceCm >= lens.mfdCm) {
        return { fires: false, detail: `${c.room.subjectDistanceCm}cm clears the ${lens.mfdCm}cm minimum focus distance.` };
      }
      const frame = closestFrame(lens, c);
      return {
        fires: true,
        detail: `${lens.label} cannot focus closer than ${lens.mfdCm}cm, measured from the sensor mark on the camera's top plate, and the subject is at ${c.room.subjectDistanceCm}cm. The lens will not achieve focus at all here; it will hunt and fail. ${frame ? `At ${lens.mfdCm}cm it frames about ${frame}, the tightest it gets. ` : ''}Move back to at least ${lens.mfdCm}cm, or go closer with an extension tube, a close-up lens or a macro lens.`,
      };
    },
  },
];
