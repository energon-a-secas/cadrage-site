// ── Quick edit ───────────────────────────────────────────────
// The subset of the config that changes what the findings say. Enough to
// prove a rule retracts when its own input changes, without waiting for
// the full menu simulator.
//
// Every control carries a `data-path` naming the dotted config path it
// writes. events.js reads that and nothing else, so adding a field here
// needs no matching handler.

import { escHtml } from '../utils.js';
import { FORMATS, fpsFor, modesAtFps, CHROMA_LABELS } from '../data/bodies.js';
import { LENSES } from '../data/lenses.js';
import { PICTURE_PROFILES, GAMMAS, LOG_MODES } from '../data/gammas.js';
import { SHUTTER_STEPS } from '../engine/calc.js';
import { panel } from '../ui.js';

const AIMS = [
  { value: 'subject', label: 'at the subject' },
  { value: 'backdrop', label: 'at the backdrop' },
  { value: 'ceiling', label: 'bounced off the ceiling' },
  { value: 'fill', label: 'as broad fill' },
];

function select({ path, label, value, options, hint = '' }) {
  const opts = options.map(o => {
    const val = typeof o === 'object' ? o.value : o;
    const text = typeof o === 'object' ? o.label : o;
    const v = val === null ? '' : String(val);
    return `<option value="${escHtml(v)}"${v === (value === null || value === undefined ? '' : String(value)) ? ' selected' : ''}>${escHtml(text)}</option>`;
  }).join('');
  return `
    <label class="field">
      <span class="field__label">${escHtml(label)}</span>
      <select class="field__input" data-path="${escHtml(path)}" data-kind="select">${opts}</select>
      ${hint ? `<span class="field__hint">${escHtml(hint)}</span>` : ''}
    </label>`;
}

function number({ path, label, value, min, max, step = 1, hint = '' }) {
  return `
    <label class="field">
      <span class="field__label">${escHtml(label)}</span>
      <input class="field__input" type="number" data-path="${escHtml(path)}" data-kind="number"
        value="${value === null || value === undefined ? '' : escHtml(value)}"
        ${Number.isFinite(min) ? `min="${min}"` : ''}${Number.isFinite(max) ? ` max="${max}"` : ''} step="${step}">
      ${hint ? `<span class="field__hint">${escHtml(hint)}</span>` : ''}
    </label>`;
}

function toggle({ path, label, checked, hint = '' }) {
  return `
    <label class="field field--toggle">
      <input type="checkbox" data-path="${escHtml(path)}" data-kind="bool"${checked ? ' checked' : ''}>
      <span class="field__label">${escHtml(label)}</span>
      ${hint ? `<span class="field__hint">${escHtml(hint)}</span>` : ''}
    </label>`;
}

export function quickEditPanel(config) {
  return panel({
    title: 'The setup being checked',
    lead: 'Change anything here and every finding recalculates. A rule that survives its own input changing is not a rule.',
    body: `
      <div class="edit-grid">
        ${roomGroup(config)}
        ${exposureGroup(config)}
        ${formatGroup(config)}
        ${colourGroup(config)}
        ${opticsGroup(config)}
        ${lightsGroup(config)}
      </div>`,
    id: 'quickEdit',
  });
}

function group(title, note, fields) {
  return `
    <fieldset class="edit-group">
      <legend>${escHtml(title)}</legend>
      ${note ? `<p class="edit-group__note">${escHtml(note)}</p>` : ''}
      <div class="edit-group__fields">${fields}</div>
    </fieldset>`;
}

function roomGroup(c) {
  return group('Room', 'Mains frequency governs every flicker answer and appears in no camera menu, which is why notes never carry it.', [
    select({
      path: 'room.mainsHz', label: 'Mains frequency', value: c.room.mainsHz,
      options: [{ value: 50, label: '50 Hz' }, { value: 60, label: '60 Hz' }],
      hint: 'Europe, most of Asia, South America: 50. North America: 60.',
    }),
    number({ path: 'room.subjectDistanceCm', label: 'Camera to subject', value: c.room.subjectDistanceCm, min: 5, max: 2000, hint: 'cm' }),
    number({ path: 'room.subjectToBackdropCm', label: 'Subject to backdrop', value: c.room.subjectToBackdropCm, min: 0, max: 1000, hint: 'cm' }),
    select({
      path: 'room.backdrop', label: 'Backdrop', value: c.room.backdrop,
      options: [
        { value: 'none', label: 'None / neutral wall' },
        { value: 'green', label: 'Green screen' },
        { value: 'white', label: 'White' },
        { value: 'black', label: 'Black' },
      ],
    }),
  ].join(''));
}

function exposureGroup(c) {
  return group('Exposure', '', [
    select({
      path: 'exposure.shutter.mode', label: 'Shutter', value: c.exposure.shutter.mode,
      options: [{ value: 'manual', label: 'Set by hand (S or M)' }, { value: 'auto', label: 'Auto' }],
      hint: 'Var. Shutter needs this on manual.',
    }),
    select({
      path: 'exposure.shutter.denom', label: 'Shutter speed', value: c.exposure.shutter.denom,
      options: [{ value: '', label: 'not recorded' }, ...SHUTTER_STEPS.map(d => ({ value: d, label: `1/${d}` })),
        ...(c.exposure.shutter.denom && !SHUTTER_STEPS.includes(c.exposure.shutter.denom)
          ? [{ value: c.exposure.shutter.denom, label: `1/${c.exposure.shutter.denom} (not a standard step)` }]
          : [])],
    }),
    select({
      path: 'exposure.iso.mode', label: 'ISO', value: c.exposure.iso.mode,
      options: [{ value: 'manual', label: 'Locked' }, { value: 'auto', label: 'Auto' }],
    }),
    number({ path: 'exposure.iso.value', label: 'ISO value', value: c.exposure.iso.value, min: 100, max: 32000, step: 50, hint: 'used when locked' }),
    number({ path: 'exposure.iso.min', label: 'Auto ISO min', value: c.exposure.iso.min, min: 100, max: 32000, step: 50 }),
    number({ path: 'exposure.iso.max', label: 'Auto ISO max', value: c.exposure.iso.max, min: 100, max: 32000, step: 50 }),
    toggle({ path: 'exposure.autoSlowShutter', label: 'Auto Slow Shutter', checked: c.exposure.autoSlowShutter }),
    toggle({ path: 'flicker.varShutter', label: 'Var. Shutter', checked: c.flicker.varShutter }),
    toggle({ path: 'flicker.antiFlicker', label: 'Anti-flicker Shoot.', checked: c.flicker.antiFlicker }),
  ].join(''));
}

function formatGroup(c) {
  const rates = fpsFor(c.format.container, c.format.res);
  const modes = modesAtFps(c.format.container, c.format.res, c.format.fps);
  const bitrates = [...new Set(modes.map(m => m.bitrate))];
  const chromas = [...new Set(modes.map(m => m.chroma))];
  return group('Record Setting', 'Options come from Sony\'s own Record Setting table, so an impossible combination can be named as impossible.', [
    select({
      path: 'format.container', label: 'Container', value: c.format.container,
      options: Object.entries(FORMATS).map(([id, f]) => ({ value: id, label: `${f.label} (${f.codec})` })),
    }),
    select({
      path: 'format.fps', label: 'Frame rate', value: c.format.fps,
      options: rates.map(r => ({ value: r, label: `${r}p` })),
    }),
    select({
      path: 'format.bitrate', label: 'Bitrate', value: c.format.bitrate,
      options: (bitrates.length ? bitrates : [c.format.bitrate]).map(b => ({ value: b, label: `${b}M` })),
    }),
    select({
      path: 'format.chroma', label: 'Sampling', value: c.format.chroma,
      options: (chromas.length ? chromas : [c.format.chroma]).map(ch => ({ value: ch, label: CHROMA_LABELS[ch] || ch })),
    }),
    select({
      path: 'format.card', label: 'Card', value: c.format.card,
      options: [
        { value: 'sdxc', label: 'SDXC / SDUC' },
        { value: 'sdhc', label: 'SDHC' },
        { value: 'sd', label: 'SD' },
      ],
      hint: 'On the FX bodies that have the embed row, SD and SDHC lock it off.',
    }),
  ].join(''));
}

function colourGroup(c) {
  return group('Colour', '', [
    select({
      path: 'colour.log', label: 'Log Shooting', value: c.colour.log,
      options: Object.entries(LOG_MODES).map(([id, m]) => ({ value: id, label: m.label })),
    }),
    select({
      path: 'colour.pictureProfile', label: 'Picture Profile', value: c.colour.pictureProfile,
      options: Object.entries(PICTURE_PROFILES).map(([id, p]) => ({
        value: id,
        label: p.gamma ? `${p.label} · ${GAMMAS[p.gamma].label}` : p.label,
      })),
    }),
    select({
      path: 'colour.gamma', label: 'Gamma', value: c.colour.gamma,
      options: [{ value: '', label: 'as the profile sets it' },
        ...Object.entries(GAMMAS).map(([id, g]) => ({ value: id, label: g.label }))],
    }),
    select({
      path: 'colour.lut', label: 'Select LUT', value: c.colour.lut,
      options: [{ value: '', label: 'none' },
        { value: 'itu709', label: 'ITU709' },
        { value: 'itu709-800', label: 'ITU709(800%)' },
        { value: 'slog3', label: 'S-Log3' },
        { value: 'user1', label: 'User LUT 1' }],
    }),
    toggle({ path: 'colour.embedLut', label: 'Embed LUT File', checked: c.colour.embedLut,
      hint: 'No such row in the a6700 help guide; documented for the FX line. Kept in case the note describes another body.' }),
    select({
      path: 'colour.wb.mode', label: 'White balance', value: c.colour.wb.mode,
      options: [
        { value: 'auto', label: 'Auto' },
        { value: 'custom-k', label: 'Colour temperature' },
        { value: 'custom-1', label: 'Custom 1 (measured)' },
        { value: 'custom-2', label: 'Custom 2 (measured)' },
        { value: 'custom-3', label: 'Custom 3 (measured)' },
      ],
    }),
    number({ path: 'colour.wb.kelvin', label: 'Kelvin', value: c.colour.wb.kelvin, min: 2500, max: 9900, step: 100 }),
    number({ path: 'colour.wb.gm', label: 'WB shift G-M', value: c.colour.wb.gm, min: -7, max: 7, hint: 'negative green, positive magenta' }),
    number({ path: 'colour.pp.saturation', label: 'PP Saturation', value: c.colour.pp?.saturation, min: -32, max: 32 }),
  ].join(''));
}

function opticsGroup(c) {
  return group('Lens and focus', '', [
    select({
      path: 'lens.id', label: 'Lens', value: c.lens.id,
      options: Object.entries(LENSES).map(([id, l]) => ({ value: id, label: l.label })),
    }),
    number({ path: 'lens.aperture', label: 'Aperture', value: c.lens.aperture, min: 1, max: 22, step: 0.1, hint: 'f-number' }),
    select({
      path: 'focus.mode', label: 'Focus mode', value: c.focus.mode,
      options: [
        { value: 'af-s', label: 'AF-S (once)' },
        { value: 'af-c', label: 'AF-C (continuous)' },
        { value: 'dmf', label: 'DMF' },
        { value: 'mf', label: 'MF' },
      ],
    }),
    toggle({ path: 'focus.peaking.on', label: 'Peaking Display', checked: c.focus.peaking?.on }),
    toggle({ path: 'stabilisation.tripod', label: 'On a tripod', checked: c.stabilisation.tripod }),
    toggle({ path: 'stabilisation.steadyShot', label: 'SteadyShot', checked: c.stabilisation.steadyShot }),
  ].join(''));
}

function lightsGroup(c) {
  const lights = c.room.lights || [];
  if (!lights.length) {
    return group('Lights', 'No lights recorded, so the spill and flicker-source rules have nothing to read.', '');
  }
  const fields = lights.map((l, i) => `
    <div class="light-row">
      <span class="light-row__name">${escHtml(l.id || `light ${i + 1}`)}${l.model ? ` · ${escHtml(l.model.toUpperCase())}` : ''}</span>
      ${select({ path: `room.lights.${i}.aim`, label: 'Aimed', value: l.aim, options: AIMS })}
      ${select({
        path: `room.lights.${i}.flickerFree`, label: 'Flicker-free?',
        value: l.flickerFree === null || l.flickerFree === undefined ? '' : String(l.flickerFree),
        options: [{ value: '', label: 'not tested' }, { value: 'true', label: 'tested, no flicker' }, { value: 'false', label: 'tested, it flickers' }],
      })}
    </div>`).join('');
  return group('Lights', 'A light aimed at a coloured backdrop makes the backdrop a light source of that colour.', fields);
}
