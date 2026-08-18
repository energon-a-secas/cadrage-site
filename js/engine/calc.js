// ── Calculators ──────────────────────────────────────────────
// Pure functions. Each returns its inputs alongside its result so a
// finding can show the arithmetic instead of asserting a number.

import { BODIES, ACTUAL_FPS } from '../data/bodies.js';

/** Shutter denominators the camera offers in 1/3-stop steps. */
export const SHUTTER_STEPS = [
  4, 5, 6, 8, 10, 13, 15, 20, 25, 30, 40, 50, 60, 80, 100, 125, 160, 200,
  250, 320, 400, 500, 640, 800, 1000, 1250, 1600, 2000, 2500, 3200, 4000,
  5000, 6400, 8000,
];

/** Nearest selectable step to an ideal denominator. */
export function nearestShutterStep(denom) {
  return SHUTTER_STEPS.reduce((best, s) =>
    Math.abs(s - denom) < Math.abs(best - denom) ? s : best, SHUTTER_STEPS[0]);
}

export function isSelectableStep(denom) {
  return SHUTTER_STEPS.includes(denom);
}

// ── Flicker ──────────────────────────────────────────────────

/**
 * Mains-powered light pulses at twice the supply frequency, because both
 * halves of the AC cycle produce light. A shutter interval that spans a
 * whole number of those pulses collects the same amount of light every
 * frame; one that does not collects a varying amount, which is the banding.
 */
export function flicker({ mainsHz = 50, shutterDenom = null, fps = null } = {}) {
  if (!mainsHz) return { ok: false, reason: 'no-mains' };

  const pulseHz = mainsHz * 2;
  const pulseMs = 1000 / pulseHz;

  // Safe denominators are those whose exposure spans a whole number of light
  // pulses. Since exposure = 1/denom seconds and a pulse lasts 1/pulseHz,
  // pulses-per-exposure = pulseHz/denom — whole only when denom divides
  // pulseHz. At 50Hz that is 1/100, 1/50, 1/25, 1/20, 1/10, 1/5, 1/4.
  const exact = SHUTTER_STEPS.filter(d => Number.isInteger(pulseHz / d));

  const result = {
    ok: true,
    mainsHz,
    pulseHz,
    pulseMs,
    safeDenoms: exact,
    fastestSafe: exact.length ? exact[exact.length - 1] : null,
    shutterDenom,
    fps,
  };

  if (shutterDenom) {
    const exposureMs = 1000 / shutterDenom;
    const pulsesPerExposure = pulseHz / shutterDenom;
    result.exposureMs = exposureMs;
    result.pulsesPerExposure = pulsesPerExposure;
    result.clean = Number.isInteger(pulsesPerExposure);
    result.nearestSafe = exact.length
      ? exact.reduce((b, d) => Math.abs(d - shutterDenom) < Math.abs(b - shutterDenom) ? d : b, exact[0])
      : null;
    // Faster than one pulse per exposure and every frame samples a different
    // slice of the cycle, which is the worst case for banding.
    result.fasterThanPulse = shutterDenom > pulseHz;
  }

  if (fps) {
    // The 180-degree convention: shutter open half of each frame interval.
    const ideal = fps * 2;
    result.motionIdeal = ideal;
    result.motionIdealSelectable = isSelectableStep(ideal);
    result.motionIdealStep = nearestShutterStep(ideal);
    // Cleanliness is arithmetic; selectability is a separate question. At
    // 60Hz mains, 1/120 is perfectly clean but is not on the 1/3-stop run,
    // so both facts have to be reported rather than merged into one flag.
    result.motionIdealClean = Number.isInteger(pulseHz / ideal);
    result.bothSatisfied = result.motionIdealClean && result.motionIdealSelectable;
    // The closest denominator that is both flicker-clean and selectable.
    result.compromise = exact.length
      ? exact.reduce((b, d) => Math.abs(d - ideal) < Math.abs(b - ideal) ? d : b, exact[0])
      : null;
    result.compromiseStops = result.compromise
      ? Math.log2(result.compromise / ideal) : null;
  }

  return result;
}

/** How far a candidate denominator sits from the 180-degree convention, in stops. */
export function shutterStopsFromIdeal(denom, fps) {
  if (!denom || !fps) return null;
  return Math.log2(denom / (fps * 2));
}

// ── Depth of field ───────────────────────────────────────────

/**
 * Circle of confusion is a *choice*, not a constant: it encodes how much
 * blur counts as sharp at your viewing size. The 0.019mm figure common for
 * APS-C assumes an 8x10 print at arm's length. Judging 4K at 100% on a
 * monitor is far stricter, so it is a parameter here.
 */
export const COC_PRESETS = {
  print: { label: 'Print / casual viewing', mm: 0.019,
    blurb: 'The traditional APS-C figure. Assumes an 8x10 print at normal distance.' },
  '1080p': { label: '1080p delivery', mm: 0.013,
    blurb: 'Stricter. Roughly the sensor height divided by 1200.' },
  '4k': { label: '4K, judged at 100%', mm: 0.0065,
    blurb: 'Strictest. Pixel-level scrutiny shows blur the print figure forgives.' },
};

export function depthOfField({
  focalMm, aperture, distanceCm, sensorHeightMm = 15.6, cocMm = COC_PRESETS['4k'].mm,
} = {}) {
  if (!focalMm || !aperture || !distanceCm) return { ok: false, reason: 'incomplete' };

  const s = distanceCm * 10; // to mm
  const f = focalMm;
  const N = aperture;
  const c = cocMm;

  const hyperfocalMm = (f * f) / (N * c) + f;

  const near = (s * (hyperfocalMm - f)) / (hyperfocalMm + s - 2 * f);
  const farDenom = hyperfocalMm - s;
  const far = farDenom <= 0 ? Infinity : (s * (hyperfocalMm - f)) / farDenom;

  const total = far === Infinity ? Infinity : far - near;

  return {
    ok: true,
    focalMm, aperture, distanceCm, cocMm, sensorHeightMm,
    hyperfocalCm: hyperfocalMm / 10,
    nearCm: near / 10,
    farCm: far === Infinity ? Infinity : far / 10,
    totalCm: total === Infinity ? Infinity : total / 10,
    inFrontCm: (s - near) / 10,
    behindCm: far === Infinity ? Infinity : (far - s) / 10,
  };
}

// ── Spill falloff ────────────────────────────────────────────

/**
 * Inverse-square is a point-source law. A backdrop is a large flat surface,
 * so at very short range it behaves closer to a plane (little falloff at
 * all) and only approaches inverse-square once you are well back from it.
 * Reporting a single multiplier here would be the kind of confident-wrong
 * number this tool exists to catch, so the answer is a range.
 */
export const NEAR_FIELD_MM = 300;

export function spillFalloff({ fromCm, toCm, sourceWidthCm = 150 } = {}) {
  if (!fromCm || !toCm || fromCm <= 0 || toCm <= 0) return { ok: false, reason: 'incomplete' };

  // Upper bound: treat the backdrop as a point. This is the number people
  // reach for, and at short range it is wildly optimistic.
  const pointRatio = (toCm / fromCm) ** 2;

  // Lower bound: treat it as a uniform disc of radius R. On-axis irradiance
  // is proportional to R²/(R²+d²), which gives ratio (R²+d1²)/(R²+d2²).
  // This tends to inverse-square once d >> R and to no falloff when d << R,
  // so it covers both regimes with one expression instead of a fudge factor.
  const R = sourceWidthCm / 2;
  const discRatio = (R * R + fromCm * fromCm) / (R * R + toCm * toCm);
  const discReduction = 1 / discRatio;

  const nearFieldCm = Math.max(NEAR_FIELD_MM / 10, R);
  const inNearField = toCm < nearFieldCm;

  const lowRatio = Math.min(discReduction, pointRatio);
  const highRatio = Math.max(discReduction, pointRatio);

  return {
    ok: true,
    fromCm, toCm, sourceWidthCm, radiusCm: R, nearFieldCm, inNearField,
    pointRatio,
    discRatio: discReduction,
    lowRatio,
    highRatio,
    stopsLow: Math.log2(lowRatio),
    stopsHigh: Math.log2(highRatio),
    caveat: inNearField
      ? `A backdrop is a broad flat source, not a point. While the subject sits closer than the backdrop's half-width (${R}cm), moving it back buys far less than inverse-square predicts: roughly ${lowRatio.toFixed(1)}x rather than ${pointRatio.toFixed(0)}x. Aiming the light off the backdrop moves more than distance does.`
      : `Past roughly the backdrop half-width (${R}cm), inverse-square becomes a fair approximation and distance starts paying properly.`,
  };
}

// ── Exposure equivalence ─────────────────────────────────────

export function exposureValue({ aperture, shutterDenom, iso }) {
  if (!aperture || !shutterDenom || !iso) return null;
  // EV at ISO 100, then corrected for actual ISO.
  return Math.log2((aperture * aperture * shutterDenom) / (iso / 100));
}

/**
 * What has to move, and by how much, to hold exposure after one change.
 */
export function equivalence({ aperture, shutterDenom, iso }, change) {
  const before = exposureValue({ aperture, shutterDenom, iso });
  if (before === null) return { ok: false, reason: 'incomplete' };

  const next = { aperture, shutterDenom, iso, ...change };
  const after = exposureValue(next);
  const deltaStops = after - before;

  return {
    ok: true,
    before: { aperture, shutterDenom, iso },
    after: next,
    deltaStops,
    // To hold exposure, each of these alone would have to absorb deltaStops.
    compensate: {
      iso: Math.round(next.iso * 2 ** deltaStops),
      aperture: +(next.aperture / 2 ** (deltaStops / 2)).toFixed(2),
      shutterDenom: nearestShutterStep(next.shutterDenom / 2 ** deltaStops),
    },
  };
}

// ── Card minutes ─────────────────────────────────────────────

export function cardMinutes({ bitrate, cardGb = 128, fps = null }) {
  if (!bitrate || !cardGb) return { ok: false, reason: 'incomplete' };
  // Bitrate is megabits per second; cards are sold in decimal gigabytes and
  // formatted capacity is lower, so this is deliberately conservative.
  const usableGb = cardGb * 0.93;
  const megabits = usableGb * 1000 * 8;
  const seconds = megabits / bitrate;
  return {
    ok: true,
    bitrate, cardGb, usableGb, fps,
    minutes: seconds / 60,
    gbPerMinute: (bitrate * 60) / 8 / 1000,
    note: 'Assumes formatted capacity around 93% of the sticker figure and a constant bitrate. Long-GOP modes vary with scene complexity.',
  };
}

/** Sensor dimensions for a body, defaulting to APS-C. */
export function sensorOf(bodyId) {
  return BODIES[bodyId]?.sensor || { widthMm: 23.5, heightMm: 15.6, label: 'APS-C' };
}

export { ACTUAL_FPS };
