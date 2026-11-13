// ── Optics: framing and close-up reach ───────────────────────
// What a lens frames at a distance, how large it draws the subject, and
// how close it gets, alone or with a tube or a close-up lens in front.
//
// Distances run from the image sensor mark on the camera's top plate to
// the subject, the way a maker states a minimum focus distance. The
// model is the thin lens, D = f x (2 + m + 1/m), with one correction that
// makes it land on the maker's own pair, minimum focus distance and
// maximum magnification. Where the maker's distance is shorter than the
// thin lens allows, the lens shortens as it focuses (most macro lenses),
// so its focal length is eased from the marked one at infinity to the
// one that fits the pair. Where it is longer, the glass is thick (a
// retrofocus wide, a long barrel), and the excess is a fixed gap between
// its principal planes. Either way the two ends are the maker's and the
// figures between them are estimates, good to a few percent.

import { depthOfField } from './calc.js';

/** Flange distance: sensor to the mount's face, mm. */
export const FLANGE_MM = { 'Sony E': 18 };

/** Thin lens: sensor-to-subject distance in focal lengths, at magnification m. */
const span = m => 2 + m + 1 / m;

/**
 * The part of the sensor a movie mode records, turned for the frame.
 * `crop` is the mode's own (1 for the full width), `aspect` the frame's.
 */
export function imageArea({ sensor, crop = 1, orientation = 'h', aspect = 16 / 9 } = {}) {
  const long = sensor.widthMm / crop;
  const short = long / aspect;
  return orientation === 'v' ? { widthMm: short, heightMm: long } : { widthMm: long, heightMm: short };
}

/** Does the maker give the close-focus pair this lens can be calibrated on? */
export const hasClosePair = lens => lens?.mfdCm > 0 && lens?.maxMag > 0;

/**
 * How the maker's close-focus pair departs from the plain thin lens:
 * `closeMm` is the focal length at the closest focus, `gapMm` the fixed
 * gap between the principal planes. One of the two carries the whole
 * correction, which keeps the distance falling as magnification rises.
 */
function calibration(lens) {
  if (!hasClosePair(lens)) return { closeMm: lens.focalMm, gapMm: 0 };
  const d = lens.mfdCm * 10;
  const thin = lens.focalMm * span(lens.maxMag);
  return d >= thin ? { closeMm: lens.focalMm, gapMm: d - thin } : { closeMm: d / span(lens.maxMag), gapMm: 0 };
}

/** The focal length at the maker's closest focus: shorter than the marked one on a lens that shortens. */
export function closeFocal(lens) {
  return calibration(lens).closeMm;
}

/** Focal length eased from the marked one (far) to the calibrated one (closest). */
function focalAt(lens, m) {
  if (!hasClosePair(lens)) return lens.focalMm;
  return lens.focalMm + (closeFocal(lens) - lens.focalMm) * Math.min(1, m / lens.maxMag);
}

/** Sensor-to-subject distance, cm, at which the lens draws magnification m. */
export function distanceAt(lens, m) {
  return (focalAt(lens, m) * span(m) + calibration(lens).gapMm) / 10;
}

/**
 * Magnification at a focus distance (cm, from the sensor mark). Inside
 * the minimum focus distance the lens cannot focus, so the answer is the
 * one at that minimum, flagged. A lens with no maker pair is a plain thin
 * lens. A lens that only works at high magnification (`minMag`) has no
 * answer at a typed distance: `reach` gives its band instead.
 */
export function magnificationAt(lens, distanceCm) {
  if (!lens?.focalMm || !(distanceCm > 0)) return { ok: false, reason: 'incomplete' };
  if (lens.minMag > 0) return { ok: false, reason: 'band-only' };
  const calibrated = hasClosePair(lens);
  const insideMfd = lens.mfdCm > 0 && distanceCm < lens.mfdCm;
  const d = insideMfd ? lens.mfdCm : distanceCm;
  if (calibrated && insideMfd) return { ok: true, m: lens.maxMag, insideMfd, calibrated, focalMm: closeFocal(lens) };
  if (!calibrated && d * 10 < 4 * lens.focalMm) return { ok: false, reason: 'too-close' };
  // The distance falls as magnification rises, so bisect between a far subject and the closest reach.
  let lo = 1e-6;
  let hi = calibrated ? lens.maxMag : 1;
  if (calibrated && d <= distanceAt(lens, hi)) return { ok: true, m: hi, insideMfd, calibrated, focalMm: closeFocal(lens) };
  for (let i = 0; i < 60; i++) {
    const mid = Math.sqrt(lo * hi);
    if (distanceAt(lens, mid) > d) lo = mid; else hi = mid;
  }
  const m = Math.sqrt(lo * hi);
  return { ok: true, m, insideMfd, calibrated, focalMm: focalAt(lens, m) };
}

/** The frame at the subject, cm, for an image area and a magnification. */
export function fieldAt(area, m) {
  return { widthCm: area.widthMm / m / 10, heightCm: area.heightMm / m / 10 };
}

/**
 * The f-number the exposure sees once the lens is racked out for close
 * focus: N x (1 + m), taking the pupil magnification as 1. At 1:1 the
 * light is two stops down on the marked aperture.
 */
export function effectiveAperture(aperture, m) {
  return aperture * (1 + m);
}

/** Stops of light lost to that extension. */
export function extensionStops(m) {
  return 2 * Math.log2(1 + m);
}

/**
 * Depth of field at a magnification, through the same calculator as the
 * rest of the app: the subject sits f x (1 + 1/m) in front of the lens.
 */
export function depthAtMagnification({ lens, m, aperture, cocMm }) {
  const f = focalAt(lens, m);
  return depthOfField({ focalMm: f, aperture, distanceCm: (f * (1 + 1 / m)) / 10, cocMm });
}

/**
 * What a lens reaches, bare or with an accessory. Magnifications are the
 * far and near ends of what it can focus; `farCm` and `nearCm` say where
 * the subject sits, measured from `from`: the sensor mark for a bare lens
 * or a tube, the front of the close-up lens for a dioptre.
 *
 * A tube adds its length to the image side: m = tube / f with the lens at
 * infinity, and the lens's own maximum plus tube / f at its closest. A
 * close-up lens of d dioptres brings infinity to 1000 / d mm and scales
 * the closest magnification by (1 + u x d / 1000), u being the lens's own
 * closest subject distance. Both are thin-lens estimates.
 */
export function reach(lens, extra = null) {
  if (!lens?.focalMm) return { ok: false, reason: 'incomplete' };
  const pair = hasClosePair(lens);
  const { closeMm: fc, gapMm } = calibration(lens);
  if (!extra || extra.kind === 'none') {
    if (pair) {
      // A macro-only lens has a far end too: the maker's lowest magnification and where it sits.
      const band = lens.minMag > 0;
      return { ok: true, kind: 'bare', from: 'sensor', estimate: false,
        minMag: band ? lens.minMag : 0, maxMag: lens.maxMag, farCm: band ? lens.farCm : Infinity, nearCm: lens.mfdCm };
    }
    // A minimum focus distance with no magnification beside it: the plain thin lens, as an estimate.
    const at = lens.mfdCm > 0 ? magnificationAt(lens, lens.mfdCm) : { ok: false };
    if (!at.ok) return { ok: false, reason: 'no-pair' };
    return { ok: true, kind: 'bare', from: 'sensor', estimate: true, minMag: 0, maxMag: at.m, farCm: Infinity, nearCm: lens.mfdCm };
  }
  if (extra.kind === 'tube') {
    const t = extra.mm;
    if (!(t > 0)) return { ok: false, reason: 'incomplete' };
    const minMag = t / lens.focalMm;
    const maxMag = (pair ? lens.maxMag : 0) + t / fc;
    return { ok: true, kind: 'tube', from: 'sensor', estimate: true,
      minMag, maxMag,
      farCm: (lens.focalMm * span(minMag) + gapMm) / 10,
      nearCm: (fc * span(maxMag) + gapMm) / 10 };
  }
  if (extra.kind === 'dioptre') {
    const d = extra.dioptres;
    if (!(d > 0)) return { ok: false, reason: 'incomplete' };
    const minMag = (lens.focalMm * d) / 1000;
    const farMm = 1000 / d;
    if (!pair) return { ok: true, kind: 'dioptre', from: 'front', estimate: true, minMag, maxMag: minMag, farCm: farMm / 10, nearCm: farMm / 10 };
    const u = fc * (1 + 1 / lens.maxMag);
    return { ok: true, kind: 'dioptre', from: 'front', estimate: true,
      minMag, maxMag: lens.maxMag * (1 + (u * d) / 1000),
      farCm: farMm / 10,
      nearCm: 1 / (d / 1000 + 1 / u) / 10 };
  }
  return { ok: false, reason: 'unknown-extra' };
}

/**
 * Room between the front of the lens and the subject, cm, for a bare lens
 * or a tube: the sensor-to-subject distance less the flange, the tube and
 * the barrel. A barrel that grows as it focuses makes this optimistic,
 * so it is an estimate; a maker's stated working distance beats it.
 */
export function workingDistanceCm({ lens, distanceCm, tubeMm = 0, flangeMm = FLANGE_MM['Sony E'] }) {
  if (!lens?.lengthMm || !(distanceCm > 0)) return null;
  return distanceCm - (flangeMm + tubeMm + lens.lengthMm) / 10;
}

/** The magnification that makes a subject of `sizeCm` fill `share` of a frame side `sideMm`. */
export function magnificationToFill({ sizeCm, sideMm, share = 1 }) {
  if (!(sizeCm > 0) || !(sideMm > 0)) return null;
  return (share * sideMm) / (sizeCm * 10);
}
