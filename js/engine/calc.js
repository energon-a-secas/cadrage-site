// ── Calculators ──────────────────────────────────────────────
// Pure functions. Each returns its inputs alongside its result so a
// finding can show the arithmetic instead of asserting a number.

import { BODIES, ACTUAL_FPS } from '../data/bodies.js';
import { CARD_FLOORS, SPEED_MARKS, capacityStandard } from '../data/cards.js';

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
    note: 'Assumes formatted capacity around 93% of the sticker figure and a constant bitrate. Sony notes the camera records at a variable bit rate, so fast motion shortens the real time.',
  };
}

// ── Card match ───────────────────────────────────────────────

/**
 * Does a card suit a recording format? Sony's table and the card's own
 * promise are answered separately, because they can disagree: a V30
 * card is below the V60 Sony lists for XAVC HS 4K, yet its 30 MB/s floor
 * covers a 100M Record Setting (12.5 MB/s) with room to spare.
 */
export function cardMatch({ container, res, fps, bitrate, mode = 'movie', proxy = false, card = {} }) {
  if (proxy && container === 'xavc-s-i') return { ok: false, reason: 'no-proxy-intra' };
  if (proxy && (fps === 120 || fps === 100)) return { ok: false, reason: 'no-proxy-high-rate' };
  const floor = CARD_FLOORS[mode]?.[proxy ? 'on' : 'off']?.[`${container}/${res}`];
  if (!floor) return { ok: false, reason: 'no-floor' };

  // A setup records the capacity standard itself; the calculator, a size.
  const standard = card.standard || (card.gb ? capacityStandard(card.gb) : null);
  const mediaOk = standard ? floor.media.includes(standard) : null;
  const want = SPEED_MARKS[floor.mark];
  const marks = [card.uhs, card.video].map(id => SPEED_MARKS[id]).filter(Boolean);
  // The SDA's matching rule: same family, same or higher number.
  const kin = marks.find(m => m.family === want.family);
  const markOk = !!kin && kin.mbs >= want.mbs;
  const promisedMBs = marks.length ? Math.max(...marks.map(m => m.mbs)) : 0;

  // What the card has to keep up with: the Record Setting in movie mode,
  // Sony's stated maximum in S&Q (the rate rises in slow motion), and
  // nothing for time-lapse, where Sony states no rate.
  const proxyMbps = proxy ? floor.proxyMbps || 0 : 0;
  const streamMbps = mode === 'movie' ? bitrate + proxyMbps
    : mode === 'sq' ? floor.maxMbps + proxyMbps : null;
  const streamMBs = streamMbps === null ? null : streamMbps / 8;

  return {
    ok: true,
    floor, standard, mediaOk, markOk,
    meetsSony: mediaOk !== false && markOk,
    // Sony's speed under a different SDA family (V30 where Sony names U3),
    // which the SDA does not count as a match.
    otherFamily: !kin && promisedMBs >= want.mbs,
    marks: marks.map(m => m.label),
    promisedMBs,
    noSuchCard: card.bus === 'uhs-i' && marks.some(m => m.uhsTwoOnly),
    streamMbps, streamMBs,
    rateCovered: streamMBs === null ? null : promisedMBs >= streamMBs,
  };
}

// ── Light on a model ─────────────────────────────────────────

/**
 * The incident-light meter constant, in lux seconds: E = N² C / (t S).
 * ISO 2720 allows a range for a flat receptor and 250 is the figure in
 * common use. With it, f/8, 1/100 and ISO 800 ask for 2,000 lux on a card
 * facing the camera.
 */
export const INCIDENT_C = 250;

/** ISO in 1/3 stops over the a6700's movie range, 100 to 32000. */
export const ISO_STEPS = [
  100, 125, 160, 200, 250, 320, 400, 500, 640, 800, 1000, 1250, 1600,
  2000, 2500, 3200, 4000, 5000, 6400, 8000, 10000, 12800, 16000, 20000,
  25600, 32000,
];

/** f-numbers as the dial marks them, in 1/3 stops. */
export const APERTURE_STEPS = [
  1.4, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3.2, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8,
  9, 10, 11, 13, 14, 16, 18, 20, 22,
];

/** The step nearest a value, measured in stops rather than in units. */
export function nearestStep(value, steps) {
  return steps.reduce((best, s) =>
    Math.abs(Math.log2(s / value)) < Math.abs(Math.log2(best / value)) ? s : best, steps[0]);
}

/**
 * Illuminance from one light, from its figure at 1 m. A small source (a
 * bare bulb, a reflector) follows inverse square. A panel or a softbox is
 * a broad one: on axis, a uniform disc of radius R gives E ∝ 1/(R² + d²),
 * which tends to inverse square far away and falls off much slower up
 * close. A rectangle becomes the disc of the same area, which on axis
 * lands within a few percent of the exact rectangle at these sizes.
 */
export function illuminanceAt({ lux1m, distanceCm, areaCm2 = 0, table = null } = {}) {
  if (!(lux1m > 0) || !(distanceCm > 0)) return { ok: false, reason: 'incomplete' };
  const d2 = (distanceCm / 100) ** 2;
  const r2 = areaCm2 / 1e4 / Math.PI;
  const fromTable = tableLux(table, distanceCm);
  return {
    ok: true,
    lux1m, distanceCm, areaCm2,
    radiusCm: Math.sqrt(r2) * 100,
    // A maker's measured figures, scaled with the light, where they reach.
    lux: fromTable === null ? (lux1m * (1 + r2)) / (r2 + d2) : (lux1m * fromTable) / tableLux(table, 100),
    fromTable: fromTable !== null,
    // What inverse square alone would promise from the same 1 m figure.
    pointLux: lux1m / d2,
  };
}

/**
 * A maker's illuminance table, [[cm, lux], ...] in order of distance, read
 * at any distance: straight lines between its points on log-log axes, the
 * last segment carried on past them, and inverse square from the first
 * point closer in, where the table says nothing. A reflector's beam need
 * not follow inverse square, which is why a maker's own figures beat
 * extrapolating from 1 m. Tables are for small sources only.
 */
export function tableLux(table, distanceCm) {
  if (!Array.isArray(table) || table.length < 2) return null;
  const [c0, l0] = table[0];
  if (distanceCm < c0) return l0 * (c0 / distanceCm) ** 2;
  let i = table.findIndex(([cm]) => cm >= distanceCm);
  if (i === -1) i = table.length - 1; // past the table: extend the last segment
  if (i === 0) return l0;
  const [[ca, la], [cb, lb]] = [table[i - 1], table[i]];
  const slope = Math.log(lb / la) / Math.log(cb / ca);
  return la * (distanceCm / ca) ** slope;
}

/**
 * A modifier's figure at 1 m, worked out from the light inside it when
 * the maker publishes none. Both are treated as even, flat emitters, so
 * the light leaving the front is the light going in times `flux`, spread
 * over the modifier's area instead of the source's.
 */
export function modifiedLux1m({ lux1m, flux, fromAreaCm2 = 0, areaCm2 }) {
  const r2 = a => a / 1e4 / Math.PI;
  return (flux * lux1m * (1 + r2(fromAreaCm2))) / (1 + r2(areaCm2));
}

/**
 * The light on a model from several lights. Each row gets its
 * illuminance at the model and the share of it that lands on a card
 * facing the camera, which is what exposure is set on: the cosine of
 * its angle off the camera axis, and nothing from behind or from a
 * light aimed at the backdrop. `output` is the dimmer, in percent.
 */
export function lightMix(lights = []) {
  const rows = lights.map(l => {
    const at = illuminanceAt({ lux1m: l.lux1m * ((l.output ?? 100) / 100), distanceCm: l.distanceCm, areaCm2: l.areaCm2, table: l.table });
    const atModel = at.ok && !l.aimedAway ? at.lux : 0;
    const facing = l.aimedAway ? 0 : Math.max(0, Math.cos((l.angleDeg * Math.PI) / 180));
    return {
      ...l,
      atModel,
      fromTable: at.ok && at.fromTable,
      pointLux: at.ok && !l.aimedAway ? at.pointLux : 0,
      facing,
      onCard: atModel * facing,
    };
  });
  const byRole = {};
  for (const r of rows) byRole[r.role] = (byRole[r.role] || 0) + r.atModel;
  return {
    ok: true,
    rows,
    byRole,
    onCard: rows.reduce((sum, r) => sum + r.onCard, 0),
  };
}

/** The light an exposure asks for on a card facing the camera, in lux. */
export function luxForExposure({ aperture, shutterDenom, iso, C = INCIDENT_C } = {}) {
  if (!aperture || !shutterDenom || !iso) return null;
  return (aperture * aperture * C * shutterDenom) / iso;
}

/**
 * The exposure the light allows: the ISO it asks for at one aperture,
 * and the aperture it allows at one ISO, each rounded to the dial. The
 * offsets are in stops, positive when the dial value comes out brighter
 * than the exact one.
 */
export function exposureFromLux({
  lux, aperture, iso, shutterDenom, C = INCIDENT_C, apertureMin = 1.4, apertureMax = 22,
} = {}) {
  if (!(lux > 0) || !aperture || !iso || !shutterDenom) return { ok: false, reason: 'incomplete' };
  const isoExact = (aperture * aperture * C * shutterDenom) / lux;
  const apertureExact = Math.sqrt((lux * iso) / (C * shutterDenom));
  const apertures = APERTURE_STEPS.filter(a => a >= apertureMin && a <= apertureMax);
  const isoDial = nearestStep(isoExact, ISO_STEPS);
  const apertureDial = nearestStep(apertureExact, apertures);
  return {
    ok: true,
    lux, aperture, iso, shutterDenom, C,
    isoExact,
    isoDial,
    isoOffStops: Math.log2(isoDial / isoExact),
    isoBelowRange: isoExact < ISO_STEPS[0] / 2 ** (1 / 6),
    isoAboveRange: isoExact > ISO_STEPS[ISO_STEPS.length - 1] * 2 ** (1 / 6),
    apertureExact,
    apertureDial,
    apertureOffStops: 2 * Math.log2(apertureExact / apertureDial),
    apertureBelowLens: apertureExact < apertures[0] / 2 ** (1 / 12),
    apertureAboveLens: apertureExact > apertures[apertures.length - 1] * 2 ** (1 / 12),
  };
}

/** Sensor dimensions for a body, defaulting to APS-C. */
export function sensorOf(bodyId) {
  return BODIES[bodyId]?.sensor || { widthMm: 23.5, heightMm: 15.6, label: 'APS-C' };
}

export { ACTUAL_FPS };
