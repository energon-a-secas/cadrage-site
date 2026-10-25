// ── Engine tests ─────────────────────────────────────────────
// Plain node, no framework: `make test` (or `node tests/engine.test.mjs`).
// The point of these is not coverage. It is that every rule must be able to
// retract itself when its own inputs change — a rule that fires regardless
// of the config is an opinion wearing a rule's clothes.

import { loadPreset, blank, fromPartial } from '../js/data/presets.js';
import { lint, applyFix, unverifiedSkips } from '../js/engine/lint.js';
import { RULES } from '../js/engine/rules.js';
import { flicker, isSelectableStep, depthOfField, spillFalloff, cardMinutes, cardMatch, equivalence } from '../js/engine/calc.js';
import { isValidMode, fpsFor, modesAtFps, resFor, withStored, FORMATS, BODIES } from '../js/data/bodies.js';
import { CARD_FLOORS, SONY_RECORD_TIMES, sonyRecordTime } from '../js/data/cards.js';
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

// XAVC S-I: Intra, 4:2:2 10bit only, one bitrate per frame rate.
ok('XAVC S-I 4K 60p 600M 4:2:2 10bit is valid', isValidMode('xavc-s-i', '4k', 60, 600, '422-10'), true);
ok('XAVC S-I 4K 50p runs at 500M, not 600M', isValidMode('xavc-s-i', '4k', 50, 600, '422-10'), false);
ok('XAVC S-I HD 24p 89M 4:2:2 10bit is valid', isValidMode('xavc-s-i', 'hd', 24, 89, '422-10'), true);
ok('XAVC S-I has no 4:2:0 rows', isValidMode('xavc-s-i', '4k', 60, 600, '420-10'), false);
ok('XAVC S-I has no 120p', fpsFor('xavc-s-i', '4k').includes(120), false);
ok('XAVC S HD 120p 100M 4:2:0 8bit is valid', isValidMode('xavc-s', 'hd', 120, 100, '420-8'), true);
ok('XAVC HS records no HD', resFor('xavc-hs'), ['4k']);
ok('the a6700 lists every container that has rows', BODIES.a6700.formats, Object.keys(FORMATS));
ok('a valid S-I HD mode raises no finding',
  fires(edit(turntable, c => { Object.assign(c.format, { container: 'xavc-s-i', res: 'hd', bitrate: 222 }); }), 'format/invalid-combination'), false);
{
  const hd = lint(edit(turntable, c => { c.format.res = 'hd'; })).findings.find(x => x.id === 'format/invalid-combination');
  ok('XAVC HS HD is named as off the File Format list', /XAVC HS in 4K only/.test(hd?.detail || ''), true);
  const si = lint(edit(turntable, c => { c.format.container = 'xavc-s-i'; })).findings.find(x => x.id === 'format/invalid-combination');
  ok('S-I at the HS bitrate points at the 600M row', /offers 600M 4:2:2 10bit/.test(si?.detail || ''), true);
}
ok('a stored value outside the table stays selectable',
  withStored([{ value: 600, label: '600M' }], 100, '100M').map(o => o.label), ['600M', '100M (not offered)']);
ok('an offered value adds nothing', withStored([{ value: 600, label: '600M' }], 600, '600M').length, 1);

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
near('XAVC S-I 600M fills it in about 26 (Sony: 25)', cardMinutes({ bitrate: 600, cardGb: 128 }).minutes, 26.45, 0.5);
{
  const eq = equivalence({ aperture: 1.8, shutterDenom: 120, iso: 800 }, { shutterDenom: 100 });
  ok('1/120 to 1/100 is a gain of light', eq.deltaStops < 0, true);
  ok('...offset by lowering ISO', eq.compensate.iso < 800, true);
}

// ── Memory cards: Sony's table and the SDA's marks ───────────
{
  const v30 = { gb: 128, bus: 'uhs-i', uhs: 'u3', video: 'v30' };
  const v60 = { gb: 128, bus: 'uhs-ii', uhs: 'u3', video: 'v60' };
  const at = (fmt = {}, card = v30, extra = {}) =>
    cardMatch({ container: 'xavc-hs', res: '4k', fps: 60, bitrate: 100, card, ...fmt, ...extra });
  const hs = at();
  ok('Sony lists V60 for XAVC HS 4K movies', hs.floor.mark, 'v60');
  ok('a V30 card is below it', hs.meetsSony, false);
  ok('...yet 30 MB/s covers 100M at 12.5 MB/s', [hs.streamMBs, hs.rateCovered], [12.5, true]);
  ok('a V60 UHS-II card meets it', at({}, v60).meetsSony, true);
  ok('V60 on a UHS-I card is no such card', at({}, { ...v60, bus: 'uhs-i' }).noSuchCard, true);
  const si = at({ container: 'xavc-s-i', bitrate: 600 }, v60);
  ok('XAVC S-I 4K wants V90', si.floor.mark, 'v90');
  ok('600M outruns a V60 floor at 75 MB/s', [si.streamMBs, si.rateCovered], [75, false]);
  ok('a 32 GB SDHC card is off the list for 4K', at({}, { ...v30, gb: 32 }).mediaOk, false);
  ok('...but XAVC S HD takes SDHC', at({ container: 'xavc-s', res: 'hd', bitrate: 50 }, { ...v30, gb: 32 }).meetsSony, true);
  const vOnly = at({ container: 'xavc-s', res: 'hd', bitrate: 50 }, { gb: 128, bus: 'uhs-i', video: 'v30' });
  ok('V30 without U3 is not the U3 Sony names', [vOnly.markOk, vOnly.otherFamily], [false, true]);
  ok('S&Q wants V90 at Sony\'s 500 Mbps maximum', [at({ mode: 'sq' }).floor.mark, at({ mode: 'sq' }).streamMbps], ['v90', 500]);
  ok('time-lapse wants U3 and states no rate', [at({ mode: 'timelapse' }).floor.mark, at({ mode: 'timelapse' }).streamMbps], ['u3', null]);
  ok('a proxy adds 16 Mbps', at({}, v30, { proxy: true }).streamMbps, 116);
  ok('no proxy in XAVC S-I', at({ container: 'xavc-s-i', bitrate: 600 }, v30, { proxy: true }).reason, 'no-proxy-intra');
  ok('no proxy at 120p', at({ fps: 120, bitrate: 280 }, v30, { proxy: true }).reason, 'no-proxy-high-rate');
  ok('a card with no speed mark covers nothing', at({}, { gb: 128, bus: 'uhs-i' }).rateCovered, false);
  ok('Sony lists 2 h 10 min for 100M on 128 GB',
    sonyRecordTime({ container: 'xavc-hs', res: '4k', fps: 60, bitrate: 100, cardGb: 128 }), 130);
  ok('Sony lists no 256 GB times', sonyRecordTime({ container: 'xavc-hs', res: '4k', fps: 60, bitrate: 100, cardGb: 256 }), null);
}

// The setup's card: Sony's list as a note, the card's own floor as a warning.
ok('turntable records a U3 V30 card', [turntable.format.cardUhs, turntable.format.cardVideo], ['u3', 'v30']);
ok('below Sony\'s V60 is flagged on the real config', fires(turntable, 'format/card-below-sony-list'), true);
ok('...but 30 MB/s covers 100M, so no rate warning', fires(turntable, 'format/card-slower-than-stream'), false);
{
  const f = lint(turntable).findings.find(x => x.id === 'format/card-below-sony-list');
  ok('the note states both answers', /SDXC V60 or higher/.test(f.detail) && /covers this Record Setting/.test(f.detail), true);
  ok('...as a note, not a fault', f.severity, 'note');
}
ok('a V60 card meets Sony\'s list', fires(edit(turntable, c => { c.format.cardVideo = 'v60'; }), 'format/card-below-sony-list'), false);
ok('a U1 card falls behind 100M',
  fires(edit(turntable, c => { c.format.cardUhs = 'u1'; c.format.cardVideo = null; }), 'format/card-slower-than-stream'), true);
ok('XAVC S-I 600M outruns a V60 card',
  fires(edit(turntable, c => { Object.assign(c.format, { container: 'xavc-s-i', bitrate: 600, cardVideo: 'v60' }); }), 'format/card-slower-than-stream'), true);
ok('SDHC is off Sony\'s list for 4K at any speed',
  fires(edit(turntable, c => { Object.assign(c.format, { card: 'sdhc', cardVideo: 'v60' }); }), 'format/card-below-sony-list'), true);
ok('no marks recorded, both card rules sit out',
  [fires(blank(), 'format/card-below-sony-list'), fires(blank(), 'format/card-slower-than-stream')], [false, false]);

// Every card row names a real File Format, every File Format has its rows,
// and every Sony record time is a mode the camera offers.
for (const [mode, byProxy] of Object.entries(CARD_FLOORS)) {
  for (const [proxy, rows] of Object.entries(byProxy)) {
    for (const key of Object.keys(rows)) {
      const [container, res] = key.split('/');
      ok(`card row ${mode}/${proxy}/${key} is a File Format`, resFor(container).includes(res), true);
    }
  }
}
for (const [container, f] of Object.entries(FORMATS)) {
  for (const res of Object.keys(f.modes)) {
    for (const mode of Object.keys(CARD_FLOORS)) {
      ok(`Sony lists a ${mode} card for ${container}/${res}`, !!CARD_FLOORS[mode].off[`${container}/${res}`], true);
    }
  }
}
for (const r of SONY_RECORD_TIMES) {
  ok(`Sony record time ${r.container} ${r.res} ${r.bitrate}M is a real mode`,
    r.fps.every(f => modesAtFps(r.container, r.res, f).some(m => m.bitrate === r.bitrate)), true);
}

// ── Report ───────────────────────────────────────────────────
if (failures.length) {
  console.error(`\n${failures.length} failed, ${pass} passed\n`);
  for (const f of failures) console.error(`  FAIL ${f}\n`);
  process.exit(1);
}
console.log(`${pass} assertions passed`);
