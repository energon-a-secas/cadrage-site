// ── Calculators ──────────────────────────────────────────────
// Five standalone what-if tools over engine/calc.js. They do not read the
// stored setup: the review already judges that, these exist for questions
// the setup does not answer ("what if the venue is 60Hz", "what does
// stopping down buy"). The one exception is asked for: the card tool's
// "Use the active setup" copies the setup's format in, once. Inputs live
// in the static shell and are never re-rendered on keystroke; only the
// `#out-*` blocks patch, so a field never loses the caret while you type.
// Selects re-render the view, because the card calculator's Record
// Setting options depend on the File Format and frame rate chosen above.
//
// Two knobs are shared with the rest of the app on purpose: the circle of
// confusion preset and the card you own (capacity, bus, speed marks) are
// preferences, not per-question inputs, so they live in state.prefs.

import { escHtml, $ } from '../utils.js';
import { state, savePrefs } from '../state.js';
import { panel, kvRows, basisChip } from '../ui.js';
import {
  flicker, depthOfField, spillFalloff, equivalence, cardMinutes, cardMatch,
  SHUTTER_STEPS, COC_PRESETS,
} from '../engine/calc.js';
import { FORMATS, fpsFor, modesAtFps, resFor, CHROMA_LABELS, RES_LABELS } from '../data/bodies.js';
import {
  SPEED_MARKS, CARD_BUSES, CARD_SIZES_GB, CAPACITY_STANDARDS, SHOOT_MODES,
  capacityStandard, floorLabel, sizeLabel, sonyRecordTime,
} from '../data/cards.js';
import { LENSES } from '../data/lenses.js';

const DEFAULTS = {
  flicker: { mainsHz: 50, fps: 60, denom: 120 },
  dof: { lensId: 'zeiss-55-1.8', aperture: 1.8, distanceCm: 60 },
  spill: { fromCm: 5, toCm: 50, widthCm: 150 },
  equiv: { aperture: 1.8, denom: 120, iso: 800, field: 'denom', to: 100 },
  card: { container: 'xavc-hs', res: '4k', fps: 60, bitrate: 100, mode: 'movie', proxy: 'off' },
};

/** Session-local inputs, seeded from the defaults on first render. */
const toolState = {};

function inputs(tool) {
  if (!toolState[tool]) toolState[tool] = { ...DEFAULTS[tool] };
  return toolState[tool];
}

/** The card you own, kept beside cardGb in prefs. */
const CARD_PREFS = ['cardBus', 'cardUhs', 'cardVideo'];

/** Called from events.js for any `[data-tool]` control. */
export function setToolValue(tool, key, raw, kind) {
  let value = raw;
  if (kind === 'number') {
    value = raw === '' ? null : Number(raw);
  } else if (raw !== '' && /^-?\d+(\.\d+)?$/.test(raw)) {
    value = Number(raw);
  }
  // Shared preferences live in prefs, not in the per-tool bag.
  if (tool === 'dof' && key === 'coc') { state.prefs.coc = String(raw); savePrefs(); return; }
  if (tool === 'card' && key === 'cardGb') { state.prefs.cardGb = Number(raw); savePrefs(); return; }
  if (tool === 'card' && CARD_PREFS.includes(key)) { state.prefs[key] = raw || null; savePrefs(); return; }
  inputs(tool)[key] = value;
}

/**
 * Called from events.js: copy the active setup's format into the card
 * tool. The setup records neither S&Q nor a proxy, so both go back to
 * the plain movie row.
 */
export function loadToolFromSetup(tool, config) {
  if (tool !== 'card') return;
  const { container, res, fps, bitrate } = config.format;
  Object.assign(inputs('card'), { container, res, fps, bitrate, mode: 'movie', proxy: 'off' });
}

/**
 * Re-render every visible `#out-*` block. Inputs are untouched, so the
 * field being typed in keeps focus and caret without any restore dance.
 */
export function patchToolOutputs() {
  for (const c of CALCS) {
    const box = $(`out-${c.id}`);
    if (box) box.innerHTML = OUTPUTS[c.id]();
  }
}

// ── Control helpers ──────────────────────────────────────────

function sel(tool, key, value, options, label) {
  const opts = options.map(o => {
    const v = String(o.value);
    return `<option value="${escHtml(v)}"${v === String(value) ? ' selected' : ''}>${escHtml(o.label)}</option>`;
  }).join('');
  return `
    <label class="calc-field">
      <span class="calc-field__label">${escHtml(label)}</span>
      <select class="field__input" data-tool="${escHtml(tool)}" data-key="${escHtml(key)}" data-kind="select">${opts}</select>
    </label>`;
}

function num(tool, key, value, label, { min, max, step = 1, unit = '' } = {}) {
  return `
    <label class="calc-field">
      <span class="calc-field__label">${escHtml(label)}${unit ? ` (${escHtml(unit)})` : ''}</span>
      <input class="field__input" type="number" data-tool="${escHtml(tool)}" data-key="${escHtml(key)}" data-kind="number"
        value="${value === null || value === undefined ? '' : escHtml(value)}"
        ${Number.isFinite(min) ? `min="${min}"` : ''}${Number.isFinite(max) ? ` max="${max}"` : ''} step="${step}">
    </label>`;
}

/**
 * The 1/3-stop run, plus the current value if it is off-dial. The whole
 * point of the flicker lesson is that 1/120 can be worth analysing even
 * though the camera cannot select it, so the select must be able to show it.
 */
function shutterOptions(current) {
  const offDial = current && !SHUTTER_STEPS.includes(current);
  const list = offDial ? [...SHUTTER_STEPS, current].sort((a, b) => a - b) : SHUTTER_STEPS;
  return list.map(d => ({
    value: d,
    label: `1/${d}${offDial && d === current ? ' (not on the dial)' : ''}`,
  }));
}

// ── The view ─────────────────────────────────────────────────

const CALCS = [
  { id: 'flicker', title: 'Shutter and flicker', learn: 'flicker-and-shutter',
    blurb: 'Mains light pulses at twice the supply frequency. A shutter interval that spans a whole number of pulses is clean; one that does not bands.' },
  { id: 'dof', title: 'Depth of field', learn: 'depth-of-field',
    blurb: 'How much of the scene is acceptably sharp, with the circle of confusion as the choice it actually is rather than a constant.' },
  { id: 'spill', title: 'Backdrop spill falloff', learn: 'spill-and-separation',
    blurb: 'What moving the subject off the backdrop buys. A broad flat source does not follow inverse-square at short range, so the answer is a range.' },
  { id: 'equiv', title: 'Exposure equivalence', learn: 'iso-and-exposure',
    blurb: 'One setting changes; what has to move to hold the same exposure, and by how much.' },
  { id: 'card', title: 'Card for a format', learn: 'memory-cards', basis: ['sony-spec', 'physics'], grouped: true,
    blurb: 'Which card Sony lists for a File Format, what your card\'s marks promise, and how long each size lasts. The two answers can disagree, so both are shown.',
    actions: '<button type="button" class="btn btn--secondary btn--sm" data-tool-load="card">Use the active setup</button>' },
];

export function renderTools() {
  const only = state.route.param;
  const list = CALCS.filter(c => !only || c.id === only);
  const missing = only && !CALCS.some(c => c.id === only);
  return `
    <div class="view view--tools">
      ${only && !missing ? `<p class="calc-back"><a class="btn btn--ghost btn--sm" href="#/tools">All five calculators</a></p>` : ''}
      ${missing ? panel({ title: 'No such calculator', body: `<div class="empty"><p><a class="btn btn--secondary btn--sm" href="#/tools">All five calculators</a></p></div>` }) : ''}
      ${list.map(c => calcPanel(c)).join('')}
    </div>`;
}

function calcPanel(c) {
  return panel({
    title: c.title,
    lead: `${escHtml(c.blurb)} ${(c.basis || ['physics']).map(basisChip).join(' ')} <a class="btn btn--ghost btn--sm" href="#/learn/${c.learn}">Read the lesson</a>`,
    actions: c.actions || '',
    body: `
      <div class="calc-fields${c.grouped ? ' calc-fields--grouped' : ''}">${INPUTS[c.id]()}</div>
      <div class="calc-out" id="out-${c.id}">${OUTPUTS[c.id]()}</div>`,
    id: `calc-${c.id}`,
  });
}

// ── Inputs per calculator ────────────────────────────────────

const FPS_OPTIONS = [24, 25, 30, 50, 60, 100, 120].map(f => ({ value: f, label: `${f}p` }));

const INPUTS = {
  flicker() {
    const s = inputs('flicker');
    return [
      sel('flicker', 'mainsHz', s.mainsHz, [{ value: 50, label: '50 Hz' }, { value: 60, label: '60 Hz' }], 'Mains supply'),
      sel('flicker', 'fps', s.fps, FPS_OPTIONS, 'Frame rate'),
      sel('flicker', 'denom', s.denom, shutterOptions(s.denom), 'Shutter'),
    ].join('');
  },
  dof() {
    const s = inputs('dof');
    return [
      sel('dof', 'lensId', s.lensId, Object.entries(LENSES).filter(([id]) => id !== 'other').map(([id, l]) => ({ value: id, label: l.label })), 'Lens'),
      num('dof', 'aperture', s.aperture, 'Aperture', { min: 1, max: 22, step: 0.1, unit: 'f' }),
      num('dof', 'distanceCm', s.distanceCm, 'Subject distance', { min: 5, max: 2000, unit: 'cm' }),
      sel('dof', 'coc', state.prefs.coc, Object.entries(COC_PRESETS).map(([id, p]) => ({ value: id, label: p.label })), 'Sharpness standard'),
    ].join('');
  },
  spill() {
    const s = inputs('spill');
    return [
      num('spill', 'fromCm', s.fromCm, 'Subject to backdrop', { min: 1, max: 500, unit: 'cm' }),
      num('spill', 'toCm', s.toCm, 'Moving it to', { min: 1, max: 1000, unit: 'cm' }),
      num('spill', 'widthCm', s.widthCm, 'Lit backdrop width', { min: 30, max: 600, step: 10, unit: 'cm' }),
    ].join('');
  },
  equiv() {
    const s = inputs('equiv');
    return [
      num('equiv', 'aperture', s.aperture, 'Aperture', { min: 1, max: 22, step: 0.1, unit: 'f' }),
      sel('equiv', 'denom', s.denom, shutterOptions(s.denom), 'Shutter'),
      num('equiv', 'iso', s.iso, 'ISO', { min: 100, max: 32000, step: 50 }),
      sel('equiv', 'field', s.field, [
        { value: 'denom', label: 'Shutter' },
        { value: 'aperture', label: 'Aperture' },
        { value: 'iso', label: 'ISO' },
      ], 'Change which'),
      num('equiv', 'to', s.to, 'To', { min: 1, max: 32000 }),
    ].join('');
  },
  card() {
    const s = inputs('card');
    // A container switch can invalidate the stored size and frame rate, and
    // a frame rate switch can invalidate the bitrate. Fall back to the first
    // offered value rather than render a select pointing at nothing.
    const sizes = resFor(s.container);
    if (!sizes.includes(s.res)) s.res = sizes[0];
    const fpsList = fpsFor(s.container, s.res);
    if (!fpsList.includes(s.fps)) s.fps = fpsList[0];
    const modes = modesAtFps(s.container, s.res, s.fps);
    const bitrates = [...new Set(modes.map(m => m.bitrate))];
    if (!bitrates.includes(s.bitrate)) s.bitrate = bitrates[0] ?? null;
    const p = state.prefs;
    const none = { value: '', label: 'None' };
    return [
      '<p class="calc-sub calc-fields__head">The format</p>',
      sel('card', 'container', s.container, Object.entries(FORMATS).map(([id, f]) => ({ value: id, label: f.label })), 'File Format'),
      sel('card', 'res', s.res, sizes.map(r => ({ value: r, label: RES_LABELS[r] || r })), 'Size'),
      sel('card', 'fps', s.fps, fpsList.map(f => ({ value: f, label: `${f}p` })), 'Frame rate'),
      sel('card', 'bitrate', s.bitrate, bitrates.map(b => {
        const chromas = [...new Set(modes.filter(m => m.bitrate === b).map(m => m.chroma))];
        return { value: b, label: `${b}M (${chromas.map(ch => CHROMA_LABELS[ch]).join(' or ')})` };
      }), 'Record Setting'),
      sel('card', 'mode', s.mode, Object.entries(SHOOT_MODES).map(([value, label]) => ({ value, label })), 'Shooting'),
      sel('card', 'proxy', s.proxy, [{ value: 'off', label: 'Off' }, { value: 'on', label: 'On' }], 'Proxy Recording'),
      '<p class="calc-sub calc-fields__head">Your card</p>',
      sel('card', 'cardGb', p.cardGb, CARD_SIZES_GB.map(g => ({ value: g, label: `${sizeLabel(g)} (${CAPACITY_STANDARDS[capacityStandard(g)].label})` })), 'Capacity'),
      sel('card', 'cardBus', p.cardBus, Object.entries(CARD_BUSES).map(([value, b]) => ({ value, label: b.label })), 'Bus'),
      sel('card', 'cardUhs', p.cardUhs ?? '', [none, ...['u1', 'u3'].map(id => ({ value: id, label: SPEED_MARKS[id].label }))], 'UHS Speed Class'),
      sel('card', 'cardVideo', p.cardVideo ?? '', [none, ...['v10', 'v30', 'v60', 'v90'].map(id => ({ value: id, label: SPEED_MARKS[id].label }))], 'Video Speed Class'),
    ].join('');
  },
};

// ── Outputs per calculator ───────────────────────────────────

const x = v => (v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2)) + 'x';
const stopFmt = v => `${v > 0 ? '+' : ''}${v.toFixed(2)} stops`;
const mbs = v => (Number.isInteger(v) ? String(v) : v.toFixed(1));
const MODE_PHRASES = { movie: 'movie recording', sq: 'S&Q Motion', timelapse: 'time-lapse' };

/** Minutes as "2h 38m", rounding the total first so 59.6 never prints as 60m. */
function duration(minutes) {
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${total} min`;
}

/**
 * Minutes on every size, by division and from Sony's own table where it
 * has the row. Movie recording only: in S&Q and time-lapse the shooting
 * time and the movie length differ, on settings this tool does not model.
 */
function recordTimes(s, m, card, proxy) {
  if (s.mode !== 'movie') {
    return `<p class="calc-note">Record time is not worked out for ${escHtml(SHOOT_MODES[s.mode])}: shooting time and movie length differ there, and depend on frame rate or interval settings this tool does not model.</p>`;
  }
  const rows = CARD_SIZES_GB.map(gb => {
    const standard = capacityStandard(gb);
    const r = cardMinutes({ bitrate: m.streamMbps, cardGb: gb });
    const sony = proxy ? null : sonyRecordTime({ container: s.container, res: s.res, fps: s.fps, bitrate: s.bitrate, cardGb: gb });
    const mine = m.floor.media.includes(standard) ? duration(r.minutes) : 'off Sony\'s list';
    return `<tr${gb === card.gb ? ' class="is-current"' : ''}><th scope="row">${sizeLabel(gb)} ${CAPACITY_STANDARDS[standard].label}</th><td>${mine}</td><td>${sony === null ? 'not listed' : duration(sony)}</td></tr>`;
  }).join('');
  const r = cardMinutes({ bitrate: m.streamMbps, cardGb: card.gb });
  return `
    <p class="calc-sub">Record time at ${m.streamMbps} Mbps${proxy ? ', proxy included' : ''}, ${r.gbPerMinute.toFixed(2)} GB per minute:</p>
    <table class="calc-table"><thead><tr><th>Card</th><th>By division</th><th>Sony's table</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="calc-note">${escHtml(r.note)} Sony tabulates 64 and 128 GB only, with Proxy Recording off, and its figures run below the division.</p>`;
}

const OUTPUTS = {
  flicker() {
    const s = inputs('flicker');
    const f = flicker({ mainsHz: s.mainsHz, shutterDenom: s.denom, fps: s.fps });
    const verdict = f.clean
      ? `<p class="calc-verdict is-good">1/${s.denom} spans exactly ${Math.round(f.pulsesPerExposure)} pulse${Math.round(f.pulsesPerExposure) > 1 ? 's' : ''} at ${s.mainsHz} Hz mains. Every frame collects the same light.</p>`
      : `<p class="calc-verdict is-bad">1/${s.denom} spans ${f.pulsesPerExposure.toFixed(3)} pulses at ${s.mainsHz} Hz mains. Each frame catches a different slice of the cycle, which is the banding.${f.nearestSafe ? ` 1/${f.nearestSafe} is the nearest clean speed.` : ''}</p>`;
    const rows = [
      ['Light pulses at', `${f.pulseHz} Hz, one every ${f.pulseMs.toFixed(2)} ms`],
      ['Shutter open for', `${f.exposureMs.toFixed(2)} ms at 1/${s.denom}`],
      ['Pulses per exposure', `${f.pulsesPerExposure.toFixed(3)}`],
      ['Clean speeds on the dial', f.safeDenoms.map(d => `1/${d}`).join(', ')],
      [`180-degree ideal at ${s.fps}p`, `1/${f.motionIdeal}${f.motionIdealSelectable ? '' : ', not on the 1/3-stop run'}${f.motionIdealClean ? ', flicker-clean' : ', not flicker-clean here'}`],
      ['Closest clean and selectable', `1/${f.compromise} (${stopFmt(f.compromiseStops)} from the ideal)`],
    ];
    const warn = f.fasterThanPulse
      ? `<p class="calc-warn">Faster than one pulse per exposure: every frame samples a different slice of the cycle. This is the worst case for banding.</p>`
      : '';
    return `${verdict}${kvRows(rows)}${warn}`;
  },

  dof() {
    const s = inputs('dof');
    const lens = LENSES[s.lensId];
    const coc = COC_PRESETS[state.prefs.coc] || COC_PRESETS['4k'];
    if (!s.aperture || !s.distanceCm) return '<p class="calc-warn">Fill in aperture and distance.</p>';
    const d = depthOfField({ focalMm: lens.focalMm, aperture: s.aperture, distanceCm: s.distanceCm, cocMm: coc.mm });
    if (!d.ok) return '<p class="calc-warn">Fill in aperture and distance.</p>';

    const mfd = lens.mfdCm && s.distanceCm < lens.mfdCm
      ? `<p class="calc-warn">Inside this lens's minimum focus distance (${lens.mfdCm}cm). It cannot focus here at all, so the numbers below are theoretical.</p>`
      : '';

    const rows = [
      ['Sharp from', `${d.nearCm.toFixed(1)} cm`],
      ['Sharp to', d.farCm === Infinity ? 'infinity' : `${d.farCm.toFixed(1)} cm`],
      ['In front of the subject', `${d.inFrontCm.toFixed(1)} cm`],
      ['Behind the subject', d.behindCm === Infinity ? 'infinite' : `${d.behindCm.toFixed(1)} cm`],
      ['Total depth', d.totalCm === Infinity ? 'infinite' : `${d.totalCm.toFixed(1)} cm`],
      ['Hyperfocal distance', d.hyperfocalCm >= 1000 ? `${(d.hyperfocalCm / 100).toFixed(1)} m` : `${d.hyperfocalCm.toFixed(0)} cm`],
    ];

    const standards = Object.entries(COC_PRESETS).map(([id, p]) => {
      const alt = depthOfField({ focalMm: lens.focalMm, aperture: s.aperture, distanceCm: s.distanceCm, cocMm: p.mm });
      return `<tr${id === state.prefs.coc ? ' class="is-current"' : ''}><th scope="row">${escHtml(p.label)}</th><td>${p.mm}mm</td><td>${alt.ok && alt.totalCm !== Infinity ? `${alt.totalCm.toFixed(1)} cm` : 'infinite'}</td></tr>`;
    }).join('');

    return `
      <p class="calc-verdict">${escHtml(lens.label)} at f/${s.aperture}, ${s.distanceCm}cm: <strong>${d.totalCm === Infinity ? 'infinite' : `${d.totalCm.toFixed(1)}cm`} of depth</strong> (${escHtml(coc.label)}).</p>
      ${kvRows(rows)}
      ${mfd}
      <p class="calc-sub">The standard is a choice, and it moves the answer:</p>
      <table class="calc-table"><thead><tr><th>Standard</th><th>CoC</th><th>Total depth</th></tr></thead><tbody>${standards}</tbody></table>`;
  },

  spill() {
    const s = inputs('spill');
    const r = spillFalloff({ fromCm: s.fromCm, toCm: s.toCm, sourceWidthCm: s.widthCm });
    if (!r.ok) return '<p class="calc-warn">Fill in both distances.</p>';
    const closer = s.toCm < s.fromCm
      ? '<p class="calc-warn">That moves the subject closer to the backdrop, which increases spill rather than cutting it. The figures run as entered.</p>'
      : '';
    const rows = [
      ['Inverse-square would claim', x(r.pointRatio)],
      ['A flat backdrop bounds it at', x(r.discRatio)],
      ['So the honest answer is', `between ${x(r.lowRatio)} and ${x(r.highRatio)} (${stopFmt(r.stopsLow).replace('+', '')} to ${stopFmt(r.stopsHigh)})`],
      ['Near field ends around', `${r.nearFieldCm.toFixed(0)}cm from the backdrop`],
    ];
    return `
      <p class="calc-verdict">Moving from ${s.fromCm}cm to ${s.toCm}cm changes spill by <strong>${x(r.lowRatio)} to ${x(r.highRatio)}</strong>. Anyone quoting a single number is quoting the one that flatters distance.</p>
      ${kvRows(rows)}
      ${closer}
      <p class="calc-note">${escHtml(r.caveat)}</p>`;
  },

  equiv() {
    const s = inputs('equiv');
    if (!s.aperture || !s.denom || !s.iso || s.to === null || s.to === undefined) {
      return '<p class="calc-warn">Fill in the exposure and the change.</p>';
    }
    const before = { aperture: s.aperture, shutterDenom: s.denom, iso: s.iso };
    const change = { [{ denom: 'shutterDenom', aperture: 'aperture', iso: 'iso' }[s.field]]: s.to };
    const r = equivalence(before, change);
    if (!r.ok) return '<p class="calc-warn">Fill in the exposure and the change.</p>';

    const fieldLabel = { denom: `1/${s.denom} to 1/${s.to}`, aperture: `f/${s.aperture} to f/${s.to}`, iso: `ISO ${s.iso} to ${s.to}` }[s.field];
    const gaining = r.deltaStops < 0; // negative EV shift = more light
    const verdict = Math.abs(r.deltaStops) < 0.01
      ? `<p class="calc-verdict">${escHtml(fieldLabel)} changes nothing measurable.</p>`
      : `<p class="calc-verdict">${escHtml(fieldLabel)}: <strong>${Math.abs(r.deltaStops).toFixed(2)} stops ${gaining ? 'more' : 'less'} light</strong>. To hold exposure, one of these moves alone:</p>`;

    const rows = [
      ['ISO becomes', `${r.compensate.iso}`],
      ['or aperture becomes', `f/${r.compensate.aperture}`],
      ['or shutter becomes', `1/${r.compensate.shutterDenom} (nearest dial step)`],
    ];
    return `${verdict}${kvRows(rows)}
      <p class="calc-note">ISO is rounded to a whole number and shutter to the nearest 1/3-stop step, so each compensation lands within a third of a stop of exact.</p>`;
  },

  card() {
    const s = inputs('card');
    const p = state.prefs;
    const card = { gb: p.cardGb, bus: p.cardBus, uhs: p.cardUhs, video: p.cardVideo };
    const proxy = s.proxy === 'on';
    const name = `${FORMATS[s.container].label} ${String(s.res).toUpperCase()}`;
    const m = cardMatch({ container: s.container, res: s.res, fps: s.fps, bitrate: s.bitrate, mode: s.mode, proxy, card });
    if (!m.ok) {
      const why = {
        'no-proxy-intra': 'Sony: the camera cannot record a proxy in the XAVC S-I format, so Sony lists no card for it. Set Proxy Recording to Off.',
        'no-proxy-high-rate': `Sony: proxy recording is not available at ${s.fps}p. Set Proxy Recording to Off, or pick a lower frame rate.`,
      }[m.reason] || `Sony's card table has no row for ${name} in ${SHOOT_MODES[s.mode]}.`;
      return `<p class="calc-warn">${escHtml(why)}</p>`;
    }
    const where = `${name} ${MODE_PHRASES[s.mode]}${proxy ? ' with a proxy' : ''}`;
    const want = `<strong>${escHtml(floorLabel(m.floor))}</strong>`;
    const std = CAPACITY_STANDARDS[m.standard];
    const marks = m.marks.join(' ');
    const theCard = m.marks.length ? `a ${marks} card promises ${m.promisedMBs} MB/s` : 'a card with no speed mark promises no minimum';
    const rate = m.streamMBs === null ? null : `${mbs(m.streamMBs)} MB/s`;

    let verdict;
    if (!m.mediaOk) {
      verdict = `<p class="calc-verdict is-bad">Off Sony's list: a ${sizeLabel(card.gb)} card is ${std.label}, and for ${escHtml(where)} Sony lists ${want}.</p>`;
    } else if (m.meetsSony) {
      verdict = `<p class="calc-verdict is-good">Meets the card Sony lists for ${escHtml(where)}: ${want}.</p>`;
    } else if (m.rateCovered) {
      verdict = `<p class="calc-verdict">Below the card Sony lists for ${escHtml(where)} (${want}), but this card's own floor covers the setting: it writes ${rate}, and ${escHtml(theCard)}.</p>`;
    } else if (m.rateCovered === false) {
      verdict = `<p class="calc-verdict is-bad">Below the card Sony lists for ${escHtml(where)} (${want}), and below this setting's rate too: it writes ${rate}, and ${escHtml(theCard)}.</p>`;
    } else {
      verdict = `<p class="calc-verdict">Below the card Sony lists for ${escHtml(where)} (${want}). Sony states no bitrate for time-lapse, so there is no rate to weigh the card against.</p>`;
    }

    const notes = [];
    if (m.noSuchCard) notes.push(['warn', `No such card: the SD Association puts V60 and V90 only on UHS-II and UHS-III cards, so a UHS-I card cannot carry ${SPEED_MARKS[card.video].label}. Check for the II on the label.`]);
    if (m.mediaOk && !m.markOk && m.otherFamily) notes.push(['note', `Sony names ${SPEED_MARKS[m.floor.mark].label} here. ${marks} promises the same speed under another SD Association family, and the SDA only counts a match within one family, so check the label for ${SPEED_MARKS[m.floor.mark].label} as well.`]);
    // The gap only exists below the bitrate Sony sized the card for.
    if (m.mediaOk && !m.markOk && s.mode === 'movie' && s.bitrate < m.floor.maxMbps) notes.push(['note', `Sony gives one card per File Format and shooting mode, sized for the format's highest bitrate (${m.floor.maxMbps} Mbps${proxy ? ' plus a 16 Mbps proxy' : ''}), and lists nothing lower for lower Record Settings.`]);
    if (s.mode === 'sq') notes.push(['note', 'Sony: in slow motion the recording bitrate is higher than usual, so the rate here is Sony\'s S&Q maximum for the format, not the Record Setting.']);
    if (m.standard === 'sdhc') notes.push(['note', 'Sony: on an SDHC card a long XAVC S recording is split into 4 GB files, and a time-lapse stops just before the split.']);

    const bus = CARD_BUSES[card.bus];
    const rows = [
      ['Sony lists', `${escHtml(floorLabel(m.floor))}${m.floor.maxMbps ? `, for up to ${m.floor.maxMbps} Mbps${proxy ? ' plus a 16 Mbps proxy' : ''}` : ''}`],
      ['This setting writes', m.streamMbps === null ? 'no rate stated by Sony for time-lapse' : `${m.streamMbps} Mbps, ${rate}${s.mode === 'sq' ? ' (Sony\'s S&Q maximum)' : ''}`],
      ['Your card promises', m.marks.length ? `${m.promisedMBs} MB/s minimum sequential write (${escHtml(m.marks.join(', '))})` : 'no minimum write speed: no speed mark chosen'],
      ['Capacity standard', `${std.label}: ${std.range}, ${std.fs}`],
      ['Bus', `${bus.label}, ${bus.ceiling}. The a6700 takes UHS-I and UHS-II.`],
    ];

    return `
      ${verdict}
      ${notes.map(([kind, text]) => `<p class="calc-${kind}">${escHtml(text)}</p>`).join('')}
      ${kvRows(rows)}
      ${recordTimes(s, m, card, proxy)}`;
  },
};
