// ── Optics and lens table tests ──────────────────────────────
// Plain node, no framework: `make test`. Two things are held here. The
// framing arithmetic must land on the makers' own close-focus figures,
// since everything between them is an estimate hung from those ends. And
// the lens table must carry a source for every lens it lets you choose,
// because a lens with no source is a rumour with a dropdown entry.

import {
  imageArea, closeFocal, distanceAt, magnificationAt, fieldAt, effectiveAperture, extensionStops,
  depthAtMagnification, reach, workingDistanceCm, magnificationToFill, hasClosePair,
} from '../js/engine/optics.js';
import { COC_PRESETS, sensorOf } from '../js/engine/calc.js';
import { BODIES, movieCrop } from '../js/data/bodies.js';
import { LENSES, LENS_GROUPS, CLOSE_UPS, LENS_EXTRAS, LENS_READ, DISTANCE_LENS_IDS } from '../js/data/lenses.js';
import { SHOPS } from '../js/data/lights.js';
import { loadPreset } from '../js/data/presets.js';
import { lint } from '../js/engine/lint.js';
import { DIFFRACTION_FROM } from '../js/engine/rules/focus.js';

let pass = 0;
const failures = [];
function ok(label, actual, expected = true) {
  const good = JSON.stringify(actual) === JSON.stringify(expected);
  if (good) pass++;
  else failures.push(`${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`);
}
function near(label, actual, expected, tol = 0.01) {
  const good = Math.abs(actual - expected) <= tol;
  if (good) pass++;
  else failures.push(`${label}\n    expected ~${expected}\n    actual    ${actual}`);
}

const zeiss = LENSES['zeiss-55-1.8'];
const sensor = sensorOf('a6700');

// ── The body ─────────────────────────────────────────────────
{
  ok('the a6700 sensor is Sony\'s 23.3 x 15.5 mm', [sensor.widthMm, sensor.heightMm], [23.3, 15.5]);
  ok('Sony states no crop for 4K up to 60p', movieCrop('a6700', { res: '4k', fps: 60 }), 1);
  ok('...and about 1.6x for 4K 120p', movieCrop('a6700', { res: '4k', fps: 120 }), 1.6);
  ok('...and for 100p', movieCrop('a6700', { res: '4k', fps: 100 }), 1.6);
  ok('HD at 120p is not the 4K crop', movieCrop('a6700', { res: 'hd', fps: 120 }), 1);
  ok('an unknown body takes no crop', movieCrop('nope', { res: '4k', fps: 120 }), 1);
  const h = imageArea({ sensor });
  near('a 16:9 movie uses the full 23.3 mm width', h.widthMm, 23.3, 1e-9);
  near('...and 13.1 mm of the height', h.heightMm, 13.106, 0.001);
  const v = imageArea({ sensor, orientation: 'v' });
  ok('a vertical frame is the same area turned', [v.widthMm, v.heightMm], [h.heightMm, h.widthMm]);
  near('the 120p crop narrows it to 14.6 mm', imageArea({ sensor, crop: 1.6 }).widthMm, 14.5625, 1e-6);
}

// ── The thin lens, hung from the maker's figures ─────────────
{
  ok('the Zeiss carries Sony\'s close-focus pair', [zeiss.mfdCm, zeiss.maxMag], [50, 0.14]);
  near('at its minimum focus distance it draws exactly its maximum magnification', magnificationAt(zeiss, 50).m, 0.14, 1e-6);
  near('...and the calibrated distance for that magnification is the 50 cm Sony gives', distanceAt(zeiss, 0.14), 50, 1e-9);
  near('a 55mm that focuses to 0.14x at 50 cm is nearly a plain thin lens (53.9 mm)', closeFocal(zeiss), 53.86, 0.01);
  ok('closer than the minimum it cannot focus, and says so', magnificationAt(zeiss, 45).insideMfd, true);
  ok('...at the maximum, not beyond it', magnificationAt(zeiss, 45).m, 0.14);
  ok('at the minimum itself it focuses', magnificationAt(zeiss, 50).insideMfd, false);
  const m90 = magnificationAt(zeiss, 90).m;
  near('from 90 cm the Zeiss draws about 0.069x', m90, 0.0691, 0.0008);
  ok('farther is smaller', magnificationAt(zeiss, 150).m < m90, true);
  for (const d of [50, 60, 75, 90, 120, 200, 500]) {
    near(`magnification and distance invert each other at ${d} cm`, distanceAt(zeiss, magnificationAt(zeiss, d).m), d, 1e-6);
  }
  const v = imageArea({ sensor, orientation: 'v' });
  const f90 = fieldAt(v, m90);
  near('...a vertical frame 19 cm wide', f90.widthCm, 18.97, 0.25);
  near('...and 33.7 cm tall, not the 38 cm of sensor over focal length', f90.heightCm, 33.72, 0.4);
  const f50 = fieldAt(v, 0.14);
  near('at 50 cm the frame is 16.6 cm tall', f50.heightCm, 16.64, 0.01);
  near('...so a 2 cm head is an eighth of it', 2 / f50.heightCm, 0.12, 0.005);

  // A lens that shortens as it focuses: the plain thin lens would need 36 cm for life size.
  const macro = { focalMm: 90, mfdCm: 28, maxMag: 1 };
  near('a 90mm macro that reaches 1.0x at 28 cm is calibrated onto that', magnificationAt(macro, 28).m, 1, 1e-6);
  ok('...where an uncalibrated 90mm cannot focus at all', magnificationAt({ focalMm: 90 }, 28).reason, 'too-close');
  near('a plain thin lens reaches life size at four focal lengths', magnificationAt({ focalMm: 90 }, 36).m, 1, 1e-6);
  // A retrofocus wide is long for its focal length: the pair sits outside the thin lens the other way.
  const wide = { focalMm: 15, mfdCm: 20, maxMag: 0.12 };
  near('a 15mm that draws 0.12x at 20 cm is calibrated too', magnificationAt(wide, 20).m, 0.12, 1e-6);
  ok('...by a gap between its principal planes: the focal length stays 15 mm', closeFocal(wide), 15);
  near('...so the pair is 15 x (2 + m + 1/m) plus 43 mm', distanceAt(wide, 0.12), 20, 1e-9);
  ok('...and farther is still smaller, all the way out', [20, 21, 25, 40, 90, 300].every((d, i, a) => i === 0 || magnificationAt(wide, d).m < magnificationAt(wide, a[i - 1]).m), true);
  // A long life-size lens with a thick barrel: the gap model must not fold back near 1.0x.
  const thick = { focalMm: 55, mfdCm: 27, maxMag: 1 };
  near('a thick 55mm that reaches 1.0x at 27 cm lands on it', magnificationAt(thick, 27).m, 1, 1e-6);
  ok('...with one answer per distance', [27, 28, 30, 40, 60, 120].every((d, i, a) => i === 0 || magnificationAt(thick, d).m < magnificationAt(thick, a[i - 1]).m), true);
  ok('no pair, no calibration', hasClosePair({ focalMm: 50, mfdCm: 45 }), false);
  ok('incomplete input is reported, not guessed', magnificationAt(zeiss, null).ok, false);
}

// ── What closer costs ────────────────────────────────────────
{
  near('life size at f/8 exposes like f/16', effectiveAperture(8, 1), 16, 1e-9);
  near('...two stops down', extensionStops(1), 2, 1e-9);
  near('at 0.14x the loss is under half a stop', extensionStops(0.14), 0.378, 0.001);
  const c = COC_PRESETS['1080p'].mm;
  const whole = depthAtMagnification({ lens: zeiss, m: magnificationAt(zeiss, 90).m, aperture: 8, cocMm: c });
  near('f/8 holds about 4.7 cm on a whole model from 90 cm, judged at 1080p', whole.totalCm, 4.7, 0.25);
  const macro = { focalMm: 90, mfdCm: 28, maxMag: 1 };
  near('...about 3 mm at 0.3x', depthAtMagnification({ lens: macro, m: 0.3, aperture: 8, cocMm: c }).totalCm, 0.30, 0.02);
  near('...and about 0.4 mm at life size', depthAtMagnification({ lens: macro, m: 1, aperture: 8, cocMm: c }).totalCm, 0.0416, 0.002);
  near('a 2 cm detail fills half of a 23.3 mm side at 0.58x', magnificationToFill({ sizeCm: 2, sideMm: 23.3, share: 0.5 }), 0.5825, 1e-9);
  ok('the diffraction limit the notes use is f/11', DIFFRACTION_FROM, 11);
}

// ── Tubes and close-up lenses ────────────────────────────────
{
  const bare = reach(zeiss);
  ok('a bare lens reaches its maker\'s figures', [bare.maxMag, bare.nearCm, bare.farCm === Infinity, bare.estimate], [0.14, 50, true, false]);
  const t16 = reach(zeiss, { kind: 'tube', mm: 16 });
  near('16 mm behind a 55mm starts at 16 / 55', t16.minMag, 16 / 55, 1e-9);
  near('...and ends at the lens\'s own 0.14x plus the tube over the close focal length', t16.maxMag, 0.14 + 16 / closeFocal(zeiss), 1e-9);
  ok('...a band, with the near end nearer', t16.nearCm < t16.farCm && t16.farCm < 50, true);
  ok('a tube is an estimate, and says so', t16.estimate, true);
  const t26 = reach(zeiss, { kind: 'tube', mm: 26 });
  ok('more tube, more magnification', t26.maxMag > t16.maxMag && t26.minMag > t16.minMag, true);
  const d5 = reach(zeiss, { kind: 'dioptre', dioptres: 5 });
  near('a +5 brings infinity in to 20 cm from its front', d5.farCm, 20, 1e-9);
  near('...where a 55mm draws 0.275x', d5.minMag, 0.275, 1e-9);
  ok('...and the lens\'s own close focus takes it further', d5.maxMag > d5.minMag && d5.nearCm < d5.farCm, true);
  ok('a close-up lens measures from its own front', d5.from, 'front');
  ok('no accessory, no answer', reach(zeiss, { kind: 'filter' }).ok, false);
  near('room in front of the Zeiss at 50 cm: the distance less flange and barrel', workingDistanceCm({ lens: zeiss, distanceCm: 50 }), 50 - (18 + zeiss.lengthMm) / 10, 1e-9);
  ok('no barrel length, no working distance', workingDistanceCm({ lens: { focalMm: 50 }, distanceCm: 50 }), null);
}

// ── The lens table ───────────────────────────────────────────
{
  const groups = new Set(LENS_GROUPS.map(g => g.id));
  ok('the read date is a date', /^\d{4}-\d{2}-\d{2}$/.test(LENS_READ), true);
  for (const [id, l] of Object.entries(LENSES)) {
    if (id === 'other') continue;
    ok(`${id}: in a group the select lists`, groups.has(l.group), true);
    ok(`${id}: has a short name`, typeof l.short === 'string' && l.short.length > 3, true);
    ok(`${id}: says what kind of lens it is`, typeof l.kind === 'string' && l.kind.length > 10, true);
    ok(`${id}: names its source`, typeof l.src === 'string' && /^https:\/\//.test(l.url || ''), true);
    // A macro-only lens is never offered where the smallest aperture is read, so it may be unknown.
    const closes = l.minMag > 0 && l.apertureMax === null ? [] : [l.apertureMax];
    ok(`${id}: focal length and apertures are numbers`, [l.focalMm, l.apertureMin, ...closes].every(Number.isFinite), true);
    ok(`${id}: opens wider than it closes`, closes.every(a => l.apertureMin < a), true);
    ok(`${id}: autofocus is stated`, typeof l.af, 'boolean');
    if (l.mfdCm !== null) ok(`${id}: minimum focus is beyond four calibrated focal lengths`, l.mfdCm > 0, true);
    if (hasClosePair(l) && !(l.minMag > 0)) {
      // A zoom's pair belongs to its long end.
      const at = l.zoom ? { ...l, focalMm: l.focalMaxMm } : l;
      near(`${id}: the model lands on its own pair`, magnificationAt(at, l.mfdCm).m, l.maxMag, 1e-6);
      ok(`${id}: the calibrated focal length is positive and no longer than the marked one`, closeFocal(at) > 5 && closeFocal(at) <= at.focalMm, true);
      const ms = [l.mfdCm, l.mfdCm * 1.05, l.mfdCm * 1.5, l.mfdCm * 3, 300].map(d => magnificationAt(at, d).m);
      ok(`${id}: farther is smaller, with no fold in the curve`, ms.every((m, i) => i === 0 || m < ms[i - 1]), true);
    }
    if (l.minMag > 0) {
      ok(`${id}: a macro-only lens gives both ends of its band`, [l.farCm > 0, l.maxMag > l.minMag, reach(l).minMag === l.minMag], [true, true, true]);
      ok(`${id}: ...and has no answer at a typed distance`, magnificationAt(l, 90).reason, 'band-only');
    }
    for (const p of l.prices || []) {
      ok(`${id}: price shop '${p.shop}' is a known shop`, !!SHOPS[p.shop], true);
      ok(`${id}: price at ${p.shop} is a number or a range`, Number.isFinite(p.clp) || Array.isArray(p.clp), true);
      ok(`${id}: price at ${p.shop} links to the listing`, /^https:\/\//.test(p.url || ''), true);
    }
    for (const q of l.quirks || []) ok(`${id}: quirk ${q.id} explains itself`, q.detail.length > 40, true);
  }
  ok('the lenses you own are marked', Object.values(LENSES).filter(l => l.own).map(l => l.short).length >= 2, true);
  ok('every owned lens is in the first group', Object.values(LENSES).filter(l => l.own).every(l => l.group === LENS_GROUPS[0].id), true);
  ok('the depth of field and lighting selects leave out macro-only lenses and the placeholder', DISTANCE_LENS_IDS.some(id => id === 'other' || LENSES[id].minMag > 0), false);
  ok('...and keep every lens that focuses at a distance', DISTANCE_LENS_IDS.length, Object.keys(LENSES).length - 2);
  ok('there is at least one macro lens to choose', Object.values(LENSES).some(l => l.group === 'macro' && l.maxMag >= 1), true);
  ok('nothing in the fast group is a macro', Object.values(LENSES).filter(l => l.group === 'fast').every(l => !(l.maxMag >= 0.5)), true);
  ok('the stored lens ids still resolve', ['zeiss-55-1.8', 'sony-15-1.4g', 'sony-18-135', 'other'].every(id => !!LENSES[id]), true);

  ok('the accessory list starts with none', Object.keys(CLOSE_UPS)[0], 'none');
  for (const [id, c] of Object.entries(CLOSE_UPS)) {
    ok(`${id}: kind valid`, ['none', 'tube', 'dioptre'].includes(c.kind), true);
    if (c.kind === 'none') continue;
    ok(`${id}: reaches further than the bare Zeiss`, reach(zeiss, c).maxMag > zeiss.maxMag, true);
    ok(`${id}: has a phrase for the verdict`, typeof c.phrase === 'string' && c.phrase.length > 3, true);
    ok(`${id}: its product is in the list`, !!LENS_EXTRAS[c.product], true);
  }
  for (const [id, p] of Object.entries(LENS_EXTRAS)) {
    ok(`${id}: names its source`, typeof p.src === 'string' && /^https:\/\//.test(p.url || ''), true);
    for (const x of p.prices || []) ok(`${id}: price shop '${x.shop}' is a known shop`, !!SHOPS[x.shop], true);
  }
}

// ── The review, with the lens in it ──────────────────────────
{
  const base = loadPreset('turntable-55');
  const find = (cfg, id) => lint(cfg).findings.find(f => f.id === id);
  const at = (aperture, distanceCm) => { const c = structuredClone(base); c.lens.aperture = aperture; c.room.subjectDistanceCm = distanceCm; return c; };
  const wide = find(at(1.8, 60), 'focus/dof-narrower-than-subject');
  ok('wide open, the depth note says to close down', /Closing to f\/8 deepens it/.test(wide.detail), true);
  const stopped = find(at(8, 90), 'focus/dof-narrower-than-subject');
  ok('at f/8 it no longer says to "close" to f/4', /f\/4/.test(stopped.detail), false);
  ok('...it names the diffraction limit and the distance instead', /f\/11/.test(stopped.detail) && /from 180cm/.test(stopped.detail), true);
  const tiny = find(at(16, 60), 'focus/dof-narrower-than-subject');
  ok('past f/11 the only lever it names is distance', /Distance is the lever left/.test(tiny.detail), true);
  ok('with room to spare the note retracts', find(at(8, 300), 'focus/dof-narrower-than-subject') === undefined, true);
  const close = find(at(8, 45), 'focus/mfd-vs-distance');
  ok('inside the minimum focus the review says where the distance is measured', /sensor mark/.test(close.detail), true);
  ok('...and what the lens frames at its closest', /At 50cm it frames about 16\.6 x 9\.4cm/.test(close.detail), true);
  ok('...and it clears at the minimum itself', find(at(8, 50), 'focus/mfd-vs-distance') === undefined, true);
  // Sony gives the 15mm G a nearer pair for manual focus: 17 cm against 20.
  const hands = loadPreset('handson-15');
  const handsAt = (mode, distanceCm) => { const c = structuredClone(hands); c.focus.mode = mode; c.room.subjectDistanceCm = distanceCm; return c; };
  ok('the 15mm at 18 cm is too close for autofocus', !!find(handsAt('af-c', 18), 'focus/mfd-vs-distance'), true);
  ok('...and focuses there in manual focus', find(handsAt('mf', 18), 'focus/mfd-vs-distance') === undefined, true);
  ok('...but not at 16 cm, in either', !!find(handsAt('mf', 16), 'focus/mfd-vs-distance'), true);
  ok('the body records its sensor', BODIES.a6700.sensor.widthMm, 23.3);
}

// ── Report ───────────────────────────────────────────────────
if (failures.length) {
  console.error(`\n${failures.length} failed, ${pass} passed\n`);
  for (const f of failures) console.error(`  FAIL ${f}\n`);
  process.exit(1);
}
console.log(`${pass} assertions passed`);
