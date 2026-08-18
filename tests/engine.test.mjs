// ── Engine tests ─────────────────────────────────────────────
// Plain node, no framework: `make test` (or `node tests/engine.test.mjs`).
// The point of these is not coverage. It is that every rule must be able to
// retract itself when its own inputs change — a rule that fires regardless
// of the config is an opinion wearing a rule's clothes.

import { loadPreset, blank, fromPartial } from '../js/data/presets.js';
import { lint, applyFix, unverifiedSkips } from '../js/engine/lint.js';
import { RULES } from '../js/engine/rules.js';
import { flicker, isSelectableStep, depthOfField, spillFalloff, cardMinutes, equivalence } from '../js/engine/calc.js';
import { isValidMode } from '../js/data/bodies.js';
import { effectiveGamma, PICTURE_PROFILES } from '../js/data/gammas.js';

let pass = 0;
const failures = [];

function ok(label, actual, expected) {
  const good = JSON.stringify(actual) === JSON.stringify(expected);
  if (good) pass++;
  else failures.push(`${label}\n    expected ${JSON.stringify(expected)}\n    actual   ${JSON.stringify(actual)}`);
}

function near(label, actual, expected, tol = 0.01) {
  const good = Math.abs(actual - expected) <= tol;
  if (good) pass++;
  else failures.push(`${label}\n    expected ~${expected}\n    actual    ${actual}`);
}

const fires = (cfg, id, enabled) => lint(cfg, enabled).findings.some(f => f.id === id);
const edit = (cfg, fn) => { const c = structuredClone(cfg); fn(c); return c; };

const turntable = loadPreset('turntable-55');

// ── Flicker: the headline claim ──────────────────────────────
{
  const f = flicker({ mainsHz: 50, shutterDenom: 120, fps: 60 });
  ok('50Hz mains pulses at 100Hz', f.pulseHz, 100);
  near('1/120 is 8.33ms', f.exposureMs, 8.333, 0.001);
  near('1/120 spans 0.833 pulses at 50Hz', f.pulsesPerExposure, 0.8333, 0.001);
  ok('1/120 is not clean at 50Hz', f.clean, false);
  ok('nearest safe speed is 1/100', f.nearestSafe, 100);
  ok('safe denominators at 50Hz', f.safeDenoms, [4, 5, 10, 20, 25, 50, 100]);

  const at60 = flicker({ mainsHz: 60, shutterDenom: 120, fps: 60 });
  ok('1/120 IS clean at 60Hz mains', at60.clean, true);
  ok('...but 1/120 is not a selectable 1/3-stop step', isSelectableStep(120), false);
  ok('...so both-satisfied stays false', at60.bothSatisfied, false);

  ok('1/100 is clean at 50Hz', flicker({ mainsHz: 50, shutterDenom: 100 }).clean, true);
  ok('1/50 spans two pulses at 50Hz', flicker({ mainsHz: 50, shutterDenom: 50 }).pulsesPerExposure, 2);
}

// A rule must be refutable by its own inputs.
ok('shutter-vs-mains fires at 50Hz/1÷120', fires(turntable, 'flicker/shutter-vs-mains'), true);
ok('shutter-vs-mains retracts at 60Hz', fires(edit(turntable, c => { c.room.mainsHz = 60; }), 'flicker/shutter-vs-mains'), false);
ok('shutter-vs-mains retracts once fixed', fires(applyFix(turntable, { path: 'exposure.shutter.denom', to: 100 }), 'flicker/shutter-vs-mains'), false);
ok('shutter-not-selectable fires on 1/120', fires(turntable, 'flicker/shutter-not-selectable'), true);
ok('shutter-not-selectable retracts on 1/100', fires(applyFix(turntable, { path: 'exposure.shutter.denom', to: 100 }), 'flicker/shutter-not-selectable'), false);

// Var. Shutter: available only in S/M with a manual shutter.
ok('var-shutter unavailable with auto shutter', fires(turntable, 'flicker/var-shutter-needs-manual-shutter'), true);
ok('var-shutter available once shutter is manual',
  fires(edit(turntable, c => { c.exposure.shutter.mode = 'manual'; c.exposure.shutter.denom = 100; }), 'flicker/var-shutter-needs-manual-shutter'), false);
ok('anti-flicker flagged as stills-only when on',
  fires(edit(turntable, c => { c.flicker.antiFlicker = true; }), 'flicker/anti-flicker-is-stills-only'), true);
ok('anti-flicker silent when off', fires(turntable, 'flicker/anti-flicker-is-stills-only'), false);

// ── Log vs Picture Profile ───────────────────────────────────
ok('log on + PP set -> contradiction',
  fires(edit(turntable, c => { c.colour.log = 'on-flexible-iso'; }), 'colour/log-excludes-picture-profile'), true);
ok('log off + PP set -> no contradiction', fires(turntable, 'colour/log-excludes-picture-profile'), false);
ok('log on + PP off -> no contradiction',
  fires(edit(turntable, c => { c.colour.log = 'on-flexible-iso'; c.colour.pictureProfile = 'off'; }), 'colour/log-excludes-picture-profile'), false);

// PP6 is Cine2; Cine4 inside it is an override.
ok('PP6 preset gamma is cine2', PICTURE_PROFILES.pp6.gamma, 'cine2');
{
  const eff = effectiveGamma(turntable.colour);
  ok('cine4 under PP6 is flagged as an override', eff.overridden, true);
  ok('...and reports the preset gamma it replaced', eff.presetGamma, 'cine2');
  ok('pp-gamma-override fires', fires(turntable, 'colour/pp-gamma-override'), true);
  ok('pp-gamma-override retracts when gamma matches the preset',
    fires(edit(turntable, c => { c.colour.gamma = 'cine2'; }), 'colour/pp-gamma-override'), false);
}

// ── Inert settings ───────────────────────────────────────────
ok('LUT inert with log off', fires(edit(turntable, c => { c.colour.lut = 'itu709-800'; }), 'inert/lut-without-log'), true);
ok('LUT active with log on',
  fires(edit(turntable, c => { c.colour.lut = 'itu709-800'; c.colour.log = 'on-flexible-iso'; }), 'inert/lut-without-log'), false);
ok('AWB priority inert with manual WB', fires(turntable, 'inert/awb-priority-with-manual-wb'), true);
ok('AWB priority active with auto WB',
  fires(edit(turntable, c => { c.colour.wb.mode = 'auto'; }), 'inert/awb-priority-with-manual-wb'), false);
ok('peaking inert under AF-C', fires(edit(turntable, c => { c.focus.peaking.on = true; }), 'inert/peaking-during-record'), true);
ok('peaking useful under MF',
  fires(edit(turntable, c => { c.focus.peaking.on = true; c.focus.mode = 'mf'; }), 'inert/peaking-during-record'), false);
ok('steadyshot flagged on a tripod',
  fires(edit(turntable, c => { c.stabilisation.steadyShot = true; }), 'inert/steadyshot-on-tripod'), true);

// ── Format matrix, from Sony's Record Setting table ──────────
ok('XAVC HS 4K 60p 100M 4:2:2 10bit is valid', isValidMode('xavc-hs', '4k', 60, 100, '422-10'), true);
ok('XAVC HS has no 8-bit modes', isValidMode('xavc-hs', '4k', 60, 150, '420-8'), false);
ok('XAVC S 4K 60p 100M 4:2:2 10bit does not exist', isValidMode('xavc-s', '4k', 60, 100, '422-10'), false);
ok('XAVC HS 4K has no 30p', isValidMode('xavc-hs', '4k', 30, 100, '422-10'), false);
ok('XAVC S 4K 30p 100M 4:2:0 8bit is valid', isValidMode('xavc-s', '4k', 30, 100, '420-8'), true);
ok('valid mode raises no finding', fires(turntable, 'format/invalid-combination'), false);
ok('invalid mode raises a finding',
  fires(edit(turntable, c => { c.format.container = 'xavc-s'; }), 'format/invalid-combination'), true);

// ── The unverified claim stays off ───────────────────────────
{
  const logLow = edit(turntable, c => {
    c.colour.log = 'on-flexible-iso';
    c.colour.pictureProfile = 'off';
    c.exposure.iso = { mode: 'manual', value: 250, min: null, max: null };
  });
  ok('dual-gain rule is off by default', fires(logLow, 'exposure/dual-gain-dead-zone'), false);
  ok('dual-gain rule fires only when enabled', fires(logLow, 'exposure/dual-gain-dead-zone', { 'exposure/dual-gain-dead-zone': true }), true);
  ok('and it is reported as a deliberate omission',
    unverifiedSkips(lint(logLow)).some(s => s.rule.id === 'exposure/dual-gain-dead-zone'), true);

  // Switching one on must not hide its own switch, or the choice is one-way.
  const on = { 'exposure/dual-gain-dead-zone': true };
  const listed = unverifiedSkips(lint(logLow, on)).find(s => s.rule.id === 'exposure/dual-gain-dead-zone');
  ok('an enabled unverified rule stays listed', !!listed, true);
  ok('...marked as on', listed.enabled, true);
  ok('...and as firing', listed.fired, true);
  const quiet = unverifiedSkips(lint(turntable, on)).find(s => s.rule.id === 'exposure/dual-gain-dead-zone');
  ok('on but not firing is distinguishable', [quiet.enabled, quiet.fired], [true, false]);
}

// ── Focus and optics ─────────────────────────────────────────
ok('AF-C on a tripod is flagged', fires(turntable, 'focus/af-c-on-tripod'), true);
ok('AF-C handheld is not', fires(edit(turntable, c => { c.stabilisation.tripod = false; }), 'focus/af-c-on-tripod'), false);
ok('subject inside minimum focus distance is an error',
  fires(edit(turntable, c => { c.room.subjectDistanceCm = 30; }), 'focus/mfd-vs-distance'), true);
ok('subject beyond MFD is fine', fires(turntable, 'focus/mfd-vs-distance'), false);

{
  const d = depthOfField({ focalMm: 55, aperture: 1.8, distanceCm: 60, cocMm: 0.0065 });
  ok('shallow DoF at 55mm f/1.8 is under a centimetre', d.totalCm < 1, true);
  const stopped = depthOfField({ focalMm: 55, aperture: 8, distanceCm: 60, cocMm: 0.0065 });
  ok('stopping down deepens it', stopped.totalCm > d.totalCm, true);
}

// ── Spill: a range, never a single confident multiplier ──────
{
  const s = spillFalloff({ fromCm: 5, toCm: 50 });
  ok('inverse-square would claim 100x', Math.round(s.pointRatio), 100);
  ok('the disc model bounds it far lower', s.lowRatio < 5, true);
  ok('and the two bounds are reported separately', s.lowRatio < s.highRatio, true);
  ok('near-field is flagged at 5cm', s.inNearField, true);
  ok('far from the backdrop it leaves the near field', spillFalloff({ fromCm: 100, toCm: 300 }).inNearField, false);
}

// ── Correction stacking ──────────────────────────────────────
ok('stacked corrections detected on the real config', fires(turntable, 'colour/stacked-correction'), true);
ok('no post values, no stacking finding',
  fires(edit(turntable, c => { c.post = { editor: 'none', values: {}, summable: false }; }), 'colour/stacked-correction'), false);
{
  const f = lint(turntable).findings.find(x => x.id === 'colour/stacked-correction');
  ok('stacking never prints a summed total', /\d+\s*\+\s*\d+\s*=/.test(f.detail), false);
}

// ── Lighting root cause ──────────────────────────────────────
ok('light aimed at the backdrop is the root cause', fires(turntable, 'lighting/main-aimed-at-backdrop'), true);
ok('aim every light at the subject and it retracts',
  fires(edit(turntable, c => { c.room.lights.forEach(l => { l.aim = 'subject'; }); }), 'lighting/main-aimed-at-backdrop'), false);
ok('WB compensating for a backdrop is flagged', fires(turntable, 'colour/wb-compensates-for-backdrop'), true);
ok('no tint shift, no finding', fires(edit(turntable, c => { c.colour.wb.gm = 0; }), 'colour/wb-compensates-for-backdrop'), false);

// ── Exposure drift ───────────────────────────────────────────
ok('auto ISO flagged', fires(turntable, 'exposure/iso-auto-range-drift'), true);
ok('manual ISO not flagged',
  fires(edit(turntable, c => { c.exposure.iso = { mode: 'manual', value: 800, min: null, max: null }; }), 'exposure/iso-auto-range-drift'), false);

// ── Whole-config behaviour ───────────────────────────────────
{
  const r = lint(turntable);
  ok('no rule threw', r.errors.map(e => `${e.rule.id}:${e.phase}`), []);
  ok('the real config produces findings', r.counts.total > 8, true);
  ok('errors sort above notes', r.findings[0].severity, 'error');
  ok('every finding names its basis', r.findings.every(f => f.basis && f.basisLabel), true);
  ok('every finding explains itself', r.findings.every(f => f.detail && f.detail.length > 40), true);

  const clean = lint(loadPreset('clean-start'));
  ok('a deliberately plain config is silent', clean.counts.total, 0);
  ok('...and threw nothing either', clean.errors.length, 0);

  const b = lint(blank());
  ok('the blank shape lints without throwing', b.errors.length, 0);
}

// Every rule must declare the fields the runner and UI depend on.
for (const rule of RULES) {
  const good = !!(rule.id && rule.area && rule.severity && rule.basis && rule.title
    && typeof rule.applies === 'function' && typeof rule.test === 'function');
  ok(`rule ${rule.id} is well-formed`, good, true);
}

// ── Calculators ──────────────────────────────────────────────
near('100M fills a 128GB card in about 159 minutes', cardMinutes({ bitrate: 100, cardGb: 128 }).minutes, 158.7, 1);
{
  const eq = equivalence({ aperture: 1.8, shutterDenom: 120, iso: 800 }, { shutterDenom: 100 });
  ok('1/120 to 1/100 is a gain of light', eq.deltaStops < 0, true);
  ok('...offset by lowering ISO', eq.compensate.iso < 800, true);
}

// ── Report ───────────────────────────────────────────────────
if (failures.length) {
  console.error(`\n${failures.length} failed, ${pass} passed\n`);
  for (const f of failures) console.error(`  FAIL ${f}\n`);
  process.exit(1);
}
console.log(`${pass} assertions passed`);
