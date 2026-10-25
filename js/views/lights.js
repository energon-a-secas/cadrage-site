// ── Light on a turntable ─────────────────────────────────────
// The lighting simulator: lights placed by role around a turntable, the
// light they put on the model, and the exposure and depth of field that
// light buys. Its inputs sit in tools.js's session bag beside the other
// calculators'; the PL48 figure you measured is a preference, because it
// describes your gear rather than one question. Nothing here writes on
// its own: events.js reaches lightAction through tools.js, which hands
// over the bag it owns.

import { escHtml } from '../utils.js';
import { state } from '../state.js';
import { kvRows } from '../ui.js';
import { sel, num, shutterOptions } from './calc-fields.js';
import { lightMix, exposureFromLux, luxForExposure, depthOfField, COC_PRESETS } from '../engine/calc.js';
import {
  LIGHTS, LIGHT_ROLES, ACCESSORIES, SHOPS, SCENARIOS, SCENARIO_BY_ID, ESTIMATES, CHECKED,
  PANEL_PLACEHOLDER_LUX, REFERENCE_EXPOSURE, REFERENCE_LUX, SHOP_NOTE,
  resolveLight, tierCost, priceLabel, clp,
} from '../data/lights.js';
import { GAIN_STEP_MEASURED } from '../data/gammas.js';
import { LENSES } from '../data/lenses.js';

export const MAX_LIGHTS = 5;

export const LIGHT_DEFAULTS = {
  aperture: 8, denom: 100, iso: 400, cameraCm: 100, lensId: 'zeiss-55-1.8',
  lights: SCENARIO_BY_ID.today.lights,
};

const STEP = GAIN_STEP_MEASURED.cine4;
const PRESET_OPTIONS = Object.entries(LIGHTS).map(([value, l]) => ({ value, label: l.label }));
const ROLE_OPTIONS = Object.entries(LIGHT_ROLES).map(([value, r]) => ({ value, label: r.label }));

/** Repair what a preset switch or an old session left behind. */
function normalise(s) {
  if (!Array.isArray(s.lights) || !s.lights.length) s.lights = structuredClone(SCENARIO_BY_ID.today.lights);
  for (const l of s.lights) {
    if (!LIGHTS[l.preset]) l.preset = 'custom';
    const def = LIGHTS[l.preset];
    if (!def.mods[l.mod]) l.mod = def.defaultMod;
    if (!LIGHT_ROLES[l.role]) l.role = 'key';
  }
  if (!LENSES[s.lensId] || s.lensId === 'other') s.lensId = LIGHT_DEFAULTS.lensId;
}

/** Called through tools.js for a `[data-tool-act="lights"]` button. */
export function lightAction(s, act, arg) {
  normalise(s);
  if (act === 'scenario' && SCENARIO_BY_ID[arg]) {
    s.lights = structuredClone(SCENARIO_BY_ID[arg].lights);
    // Back to the layout row, which also brings "Load it above" up to the simulator.
    return { toast: `Layout: ${SCENARIO_BY_ID[arg].label}`, focus: `.light-layouts [data-arg="${arg}"]` };
  }
  if (act === 'add' && s.lights.length < MAX_LIGHTS) {
    const used = new Set(s.lights.map(l => l.role));
    const role = ['key', 'fill', 'rim', 'front', 'backdrop'].find(r => !used.has(r)) || 'fill';
    s.lights.push({ preset: 'pl48', mod: 'panel', role, distanceCm: 80, output: 100, lux1m: null });
    return { focus: `[data-tool="lights"][data-key="lights.${s.lights.length - 1}.preset"]` };
  }
  if (act === 'remove' && s.lights.length > 1) {
    s.lights.splice(Number(arg), 1);
    return { focus: '[data-tool-act="lights"][data-act="add"]' };
  }
  return null;
}

// ── Inputs ───────────────────────────────────────────────────

export function lightInputs(s) {
  normalise(s);
  const p = state.prefs;
  const lenses = Object.entries(LENSES).filter(([id]) => id !== 'other').map(([value, l]) => ({ value, label: l.label }));
  return `
    <div class="light-layouts">
      <span class="calc-field__label" id="light-layouts-label">Load a layout</span>
      <div class="light-layouts__buttons" role="group" aria-labelledby="light-layouts-label">${SCENARIOS.map(sc => `
        <button type="button" class="btn btn--secondary btn--sm" data-tool-act="lights" data-act="scenario" data-arg="${escHtml(sc.id)}">${escHtml(sc.label)}</button>`).join('')}
      </div>
    </div>
    <div class="calc-fields calc-fields--grouped">
      <p class="calc-sub calc-fields__head">Exposure</p>
      ${num('lights', 'aperture', s.aperture, 'Aperture', { min: 1, max: 22, step: 0.1, unit: 'f' })}
      ${sel('lights', 'denom', s.denom, shutterOptions(s.denom), 'Shutter')}
      ${num('lights', 'iso', s.iso, 'ISO you want', { min: 100, max: 32000, step: 1 })}
      ${num('lights', 'cameraCm', s.cameraCm, 'Camera to model', { min: 20, max: 1000, unit: 'cm' })}
      ${sel('lights', 'lensId', s.lensId, lenses, 'Lens')}
      ${sel('lights', 'coc', p.coc, Object.entries(COC_PRESETS).map(([value, c]) => ({ value, label: c.label })), 'Sharpness standard')}
      <p class="calc-sub calc-fields__head">Your PL48 panels</p>
      ${num('lights', 'panelLux1m', p.panelLux1m, 'Lux at 1 m, measured', { min: 1, max: 100000, unit: 'lux', placeholder: String(PANEL_PLACEHOLDER_LUX) })}
      <p class="calc-note calc-fields__wide">Nobody publishes this figure, so measure it with the camera: one panel alone at full power, 1 m from the white card and facing it, at f/8 and 1/100. Raise the ISO until the card reads the level you expose it at (${escHtml(REFERENCE_EXPOSURE.card)} on ${escHtml(REFERENCE_EXPOSURE.date)}). The light is 1,600,000 divided by that ISO: 2,000 lux at ISO 800, 500 at ISO 3200. Left empty, the simulator uses ${PANEL_PLACEHOLDER_LUX}, a placeholder.</p>
    </div>
    <div class="light-list">
      ${s.lights.map((l, i) => lightCard(l, i, s.lights.length)).join('')}
      ${s.lights.length < MAX_LIGHTS ? '<button type="button" class="btn btn--secondary btn--sm light-list__add" data-tool-act="lights" data-act="add">Add a light</button>' : ''}
    </div>`;
}

function lightCard(l, i, count) {
  const def = LIGHTS[l.preset];
  const k = key => `lights.${i}.${key}`;
  const typed = def.mods[l.mod].lux1m === 'typed';
  return `
    <div class="light-card" role="group" aria-labelledby="light-${i}-name">
      <div class="light-card__head">
        <span class="light-card__num" aria-hidden="true">${i + 1}</span>
        <span class="light-card__name" id="light-${i}-name">Light ${i + 1}: ${escHtml(LIGHT_ROLES[l.role].label)}, ${escHtml(def.short)}</span>
        ${count > 1 ? `<button type="button" class="btn btn--ghost btn--sm" data-tool-act="lights" data-act="remove" data-arg="${i}" aria-label="Remove light ${i + 1}">Remove</button>` : ''}
      </div>
      <div class="light-card__fields">
        ${sel('lights', k('preset'), l.preset, PRESET_OPTIONS, 'Light')}
        ${sel('lights', k('mod'), l.mod, Object.entries(def.mods).map(([value, m]) => ({ value, label: m.label })), 'Fitted')}
        ${sel('lights', k('role'), l.role, ROLE_OPTIONS, 'Role')}
        ${num('lights', k('distanceCm'), l.distanceCm, 'To the model', { min: 10, max: 1000, unit: 'cm' })}
        ${num('lights', k('output'), l.output, 'Output', { min: 1, max: 100, unit: '%' })}
        ${typed ? num('lights', k('lux1m'), l.lux1m, 'Lux at 1 m', { min: 1, max: 200000, unit: 'lux' }) : ''}
      </div>
    </div>`;
}

// ── Outputs ──────────────────────────────────────────────────

const lx = v => `${v < 10 ? v.toFixed(1) : Math.round(v).toLocaleString('en-US')} lux`;
// "With its Hyper Reflector" mid-sentence, keeping the product's capitals.
const lowerFirst = t => t.charAt(0).toLowerCase() + t.slice(1);
const times = v => `${v >= 10 ? v.toFixed(0) : v >= 0.1 ? v.toFixed(1) : v.toPrecision(1)}x`;
const stopTxt = v => `${Math.abs(v).toFixed(1)} stop${Math.abs(v).toFixed(1) === '1.0' ? '' : 's'}`;
const cmTxt = d => (d === Infinity ? 'infinite' : `${d.toFixed(1)} cm`);

/** The PL48 figure the simulator uses, yours when you have measured it. */
const panelLux = () => state.prefs.panelLux1m;

function resolveAll(s) {
  return s.lights.map(l => resolveLight(l, { panelLux1m: panelLux() }));
}

export function lightOutputs(s) {
  normalise(s);
  const resolved = resolveAll(s);
  const mix = lightMix(resolved.map(r => ({ ...r, lux1m: r.lux1m ?? 0 })));
  const lens = LENSES[s.lensId];
  const coc = COC_PRESETS[state.prefs.coc] || COC_PRESETS['4k'];
  if (!s.aperture || !s.denom || !s.iso || !s.cameraCm) {
    return '<p class="calc-warn">Fill in the aperture, shutter, ISO and camera distance.</p>';
  }
  const missing = (test, what, then = '') => {
    const n = resolved.map((r, i) => (test(r) ? i + 1 : null)).filter(Boolean);
    return n.length ? [`Light ${n.join(' and ')} has no ${what} yet, so it counts as dark.${then}`] : [];
  };
  const warnings = [
    ...missing(r => r.lux1m === null, 'figure at 1 m', ' Type the lux it gives at 1 m.'),
    ...missing(r => !(r.distanceCm > 0), 'distance to the model'),
  ];
  const figure = plan(s, mix.rows);
  if (!(mix.onCard > 0)) {
    return `${warnings.map(w => `<p class="calc-warn">${escHtml(w)}</p>`).join('')}
      <p class="calc-verdict is-bad">No light reaches the side of the model facing the camera. A rim or a backdrop light shapes the model, but exposure is set on the front: give one light the key.</p>${figure}`;
  }

  const e = exposureFromLux({ lux: mix.onCard, aperture: s.aperture, iso: s.iso, shutterDenom: s.denom, apertureMin: lens.apertureMin, apertureMax: lens.apertureMax });
  const at = `f/${s.aperture} and 1/${s.denom}`;
  const head = `<strong>${lx(mix.onCard)}</strong> on a card facing the camera, ${times(mix.onCard / REFERENCE_LUX)} the light of ${REFERENCE_EXPOSURE.date}.`;
  let verdict;
  if (e.isoAboveRange) {
    verdict = `<p class="calc-verdict is-bad">${head} At ${at} that asks for ISO ${Math.round(e.isoExact).toLocaleString('en-US')}, past the camera's 32000. Bring the lights closer or open the aperture.</p>`;
  } else if (e.isoExact < STEP.lowestClean) {
    verdict = `<p class="calc-verdict is-good">${head} At ${at} that asks for ISO ${Math.round(e.isoExact)}: more than ISO ${STEP.lowestClean} needs. Stay at ${STEP.lowestClean} and spend the spare light (below).</p>`;
  } else {
    verdict = `<p class="calc-verdict">${head} At ${at} that asks for ISO ${Math.round(e.isoExact).toLocaleString('en-US')}: <strong>ISO ${e.isoDial}</strong> on the dial.</p>`;
  }

  const notes = [];
  // The measured gain step, for the ISO asked for and the ISO solved for.
  if (s.iso < STEP.lowestClean || (e.isoExact < STEP.lowestClean && !e.isoAboveRange)) {
    const which = s.iso < STEP.lowestClean ? `ISO ${s.iso}, the ISO you asked for,` : `ISO ${Math.round(e.isoExact)}, what this light asks for at f/${s.aperture},`;
    notes.push(['warn', `${which} sits below the gain step your ISO ladder found in Cine4 on ${STEP.measured}, between ISO 320 and 400, so ${STEP.lowestClean} is the lowest ISO of the cleaner stage. At the same light 320 and 250 measured noisier than 400, and an ISO under 400 pays only with much more light (ISO 100 wants four times the light of 400). Darken with the aperture or the dimmer, never with ISO.`]);
  }
  notes.push(...colourNotes(mix.rows).map(t => ['note', t]));
  notes.push(...modelNotes(mix.rows).map(t => ['note', t]));

  return `
    ${warnings.map(w => `<p class="calc-warn">${escHtml(w)}</p>`).join('')}
    ${verdict}
    ${figure}
    ${lightList(mix)}
    ${kvRows(exposureRows(s, e, lens, coc))}
    ${notes.map(([kind, text]) => `<p class="calc-${kind}">${escHtml(text)}</p>`).join('')}
    <p class="calc-note">Exposure here is the incident-light equation, E = N² x C / (t x S) with C = 250, set on a card facing the camera; on ${escHtml(REFERENCE_EXPOSURE.date)}, f/${REFERENCE_EXPOSURE.aperture}, 1/${REFERENCE_EXPOSURE.shutterDenom} and ISO ${REFERENCE_EXPOSURE.iso} put your white card at ${escHtml(REFERENCE_EXPOSURE.card)}, which is ${lx(REFERENCE_LUX)} by the same equation. A light's share on that card is the cosine of its angle off the camera axis: 71% at 45 degrees, none from behind.</p>`;
}

/** One line per light: what it gives at the model and on the card. */
function lightList(mix) {
  const total = mix.onCard;
  const rows = mix.rows.map((r, i) => {
    const where = r.distanceCm > 0 ? `${r.distanceCm} cm` : 'no distance';
    const what = `${escHtml(LIGHT_ROLES[r.role].label)}: ${escHtml(r.short)}, ${escHtml(lowerFirst(r.modLabel))}, ${where}${r.output !== 100 ? ` at ${r.output}%` : ''}`;
    const gives = r.aimedAway
      ? 'aimed at the backdrop, nothing on the model'
      : `${lx(r.atModel)} at the model, ${r.onCard > 0 ? `${lx(r.onCard)} on the card (${Math.round((r.onCard / total) * 100)}% of it)` : 'none on the card: it lights the edges'}`;
    return `<li class="light-rows__row"><span class="light-rows__num" aria-hidden="true">${i + 1}</span><span><strong>${what}</strong><br>${gives}${figureTag(r)}</span></li>`;
  }).join('');
  const lines = [];
  const key = mix.byRole.key || 0;
  if (key && mix.byRole.fill) {
    const share = mix.byRole.fill / key;
    const under = Math.log2(key / mix.byRole.fill);
    if (Math.abs(under) < 0.1) lines.push('The fill matches the key: even light from both sides, so the shadows that show the shape fill in.');
    else if (under < 0) lines.push(`The fill is ${Math.round(share * 100)}% of the key, brighter than it: swap their roles, or move the fill back.`);
    else lines.push(`The fill is ${Math.round(share * 100)}% of the key, ${stopTxt(under)} under${share > 0.8 ? ': close to even, so the shadows that show the shape fill in' : share < 0.25 ? ': a deep shadow side' : ''}.`);
  }
  if (key && mix.byRole.rim) lines.push(`The rim is ${Math.round((mix.byRole.rim / key) * 100)}% of the key at the model. A rim at or above the key outlines a dark model against black.`);
  return `
    <ol class="light-rows">${rows}</ol>
    ${lines.length ? `<p class="calc-verdict">${escHtml(lines.join(' '))}</p>` : ''}`;
}

function figureTag(r) {
  if (r.figure === 'maker') return '';
  const text = { yours: 'your figure', estimate: 'estimated figure', placeholder: 'placeholder figure' }[r.figure];
  return ` <span class="light-rows__tag">${text}</span>`;
}

function exposureRows(s, e, lens, coc) {
  const depthAt = n => depthOfField({ focalMm: lens.focalMm, aperture: n, distanceCm: s.cameraCm, cocMm: coc.mm });
  const here = depthAt(s.aperture);
  const rows = [];
  const isoTxt = e.isoAboveRange ? 'past 32000: not enough light'
    : e.isoExact < STEP.lowestClean ? `${Math.round(e.isoExact)} exact, under the step: stay at ISO ${STEP.lowestClean}`
      : `${Math.round(e.isoExact).toLocaleString('en-US')} exact, ISO ${e.isoDial} on the dial${Math.abs(e.isoOffStops) >= 0.05 ? `, ${stopTxt(e.isoOffStops)} ${e.isoOffStops > 0 ? 'brighter' : 'darker'}` : ''}`;
  rows.push([`ISO at f/${s.aperture}`, isoTxt]);

  // The spare light, spent on depth or the dimmer, never on an ISO under the step.
  if (e.isoExact < STEP.lowestClean && !e.isoAboveRange) {
    const at400 = exposureFromLux({ lux: e.lux, aperture: s.aperture, iso: STEP.lowestClean, shutterDenom: s.denom, apertureMin: lens.apertureMin, apertureMax: lens.apertureMax });
    const dim = `keep f/${s.aperture} and dim every light to ${Math.round((e.isoExact / STEP.lowestClean) * 100)}%`;
    const depth = at400.apertureAboveLens
      ? `more than f/${lens.apertureMax} needs`
      : `close to f/${at400.apertureDial} (exact ${at400.apertureExact.toFixed(1)}) for ${cmTxt(depthAt(at400.apertureDial).totalCm)} of depth`;
    // At ISO 400 the aperture row below already says how far to close.
    rows.push([`Spare light at ISO ${STEP.lowestClean}`, s.iso === STEP.lowestClean && !at400.apertureAboveLens ? `close the aperture (below), or ${dim}` : `${depth}, or ${dim}`]);
  }

  const reach = e.apertureBelowLens
    ? `wider than the lens opens (f/${lens.apertureMin}): not enough light at ISO ${s.iso}`
    : e.apertureAboveLens
      ? `past f/${lens.apertureMax}: more light than ISO ${s.iso} needs`
      : `f/${e.apertureDial} on the dial (exact ${e.apertureExact.toFixed(1)}), ${cmTxt(depthAt(e.apertureDial).totalCm)} of depth`;
  rows.push([`Aperture at ISO ${s.iso}`, reach]);

  const want = luxForExposure({ aperture: s.aperture, shutterDenom: s.denom, iso: STEP.lowestClean });
  if (e.isoExact > STEP.lowestClean) {
    rows.push([`Light for ISO ${STEP.lowestClean} at f/${s.aperture}`, `${lx(want)}: ${times(want / e.lux)} this layout, ${stopTxt(Math.log2(want / e.lux))} more`]);
  }
  rows.push([`Depth at f/${s.aperture}, ${s.cameraCm} cm`, here.ok
    ? `${cmTxt(here.totalCm)} (${escHtml(coc.label)}): ${here.inFrontCm.toFixed(1)} cm in front of the focus, ${cmTxt(here.behindCm)} behind`
    : 'fill in the distance']);
  return rows;
}

/** What the light's colour asks of the white balance. */
function colourNotes(rows) {
  const lit = rows.filter(r => r.onCard > 0 || r.atModel > 0);
  if (!lit.length) return [];
  const key = [...lit].sort((a, b) => b.onCard - a.onCard)[0];
  const out = [];
  if (key.colour.leansGreen) {
    out.push(`The brightest light on the card is a ${key.short}: no CRI or TLCI from anyone, and whites leaned green under these panels in your footage. A custom white balance on the card (or a shift toward magenta) takes the green out of the white, not out of the gold and the reds.`);
  } else if (key.colour.cri) {
    out.push(`The brightest light on the card, the ${key.short}, is rated CRI ${key.colour.cri}${key.colour.atLeast ? ' or more' : ''} and TLCI ${key.colour.tlci}${key.colour.atLeast ? ' or more' : ''}: a custom white balance on the card should need no magenta shift.`);
  }
  const panels = lit.filter(r => r.colour.leansGreen);
  if (!key.colour.leansGreen && key.colour.cri && panels.length) {
    out.push(`The ${panels.length === 1 ? 'panel keeps its' : 'panels keep their'} green beside a neutral key, so it shows in the ${[...new Set(panels.map(p => LIGHT_ROLES[p.role].label.toLowerCase()))].join(' and ')}. A 1/8 minus green (magenta) gel on each panel brings them close; set the white balance on the key.`);
  }
  const bi = [...new Set(lit.filter(r => r.colour.biColour).map(r => r.short))];
  if (bi.length) out.push(`The ${bi.join(' and ')} ${bi.length === 1 ? 'is' : 'are'} bi-colour: set ${bi.length === 1 ? 'it' : 'them'} to 5600 K beside daylight lights. The figures here are at 5600 K.`);
  return out;
}

/** Notes on the model behind the figures: broad sources, estimates, placeholders. */
function modelNotes(rows) {
  const out = [];
  const broad = rows.filter(r => r.areaCm2 > 0 && r.atModel > 0 && r.pointLux > 0 && r.atModel / r.pointLux < 0.9)
    .sort((a, b) => a.atModel / a.pointLux - b.atModel / b.pointLux)[0];
  if (broad) {
    out.push(`Light ${rows.indexOf(broad) + 1} is a broad source ${broad.distanceCm} cm away: it gives ${Math.round((broad.atModel / broad.pointLux) * 100)}% of what inverse square from its 1 m figure promises. Up close a panel or a softbox falls off slower than a point, so moving it closer gains less than the square of the distance, and the light is more even across the model.`);
  }
  const far = rows.filter(r => r.fromTable && r.distanceCm > 100 && r.atModel > 0);
  if (far.length) {
    const r = far[0];
    out.push(`Past 1 m, ${far.length === 1 ? 'light' : 'lights'} ${far.map(f => rows.indexOf(f) + 1).join(' and ')} ${far.length === 1 ? 'follows' : 'follow'} the maker's own figures at 2 and 3 m rather than inverse square: the ${r.short} ${lowerFirst(r.modLabel)} gives ${lx(r.atModel)} at ${r.distanceCm} cm, where the square law from its 1 m figure would give ${lx(r.pointLux)}.`);
  }
  const estimates = [...new Set(rows.filter(r => r.estimate).map(r => r.estimate))];
  for (const id of estimates) {
    const est = ESTIMATES[id];
    out.push(id === 'softbox'
      ? `Softbox figures are estimates: no maker publishes the light through a softbox for these lights. Aputure and amaran publish it for larger lights, where a 55 to 90 cm softbox gives 0.36 to 0.55 of the bare figure at 1 m; Cadrage takes the middle, ${est.label}, which can be off by about a third of a stop either way.`
      : `Diffusion figures are estimates: ${est.label}, the usual rating of about a stop (${est.range[0]} to ${est.range[1]}, by fabric).`);
  }
  if (rows.some(r => r.figure === 'placeholder')) {
    out.push(`The PL48 figure is a placeholder, ${PANEL_PLACEHOLDER_LUX} lux at 1 m, not a measurement. Measure yours (above) and every PL48 here follows it.`);
  }
  return out;
}

// ── The plan, seen from above ────────────────────────────────

function plan(s, rows) {
  const W = 320;
  const H = 300;
  const cx = W / 2;
  const cy = 150;
  const reach = Math.max(60, s.cameraCm || 0, ...rows.map(r => r.distanceCm || 0));
  const k = 120 / reach; // px per cm: the farthest thing sits 120 px out
  const at = (deg, cm) => {
    const a = (deg * Math.PI) / 180;
    return [cx + Math.sin(a) * cm * k, cy + Math.cos(a) * cm * k];
  };
  // Lights sharing a role fan out by 14 degrees, for the drawing only.
  // The view box is cropped to what is drawn, so a layout with nothing
  // behind the model does not leave an empty band above it.
  const ys = [cy - 20, cy + 20];
  const seen = {};
  const count = {};
  for (const r of rows) count[r.role] = (count[r.role] || 0) + 1;
  const marks = rows.map((r, i) => {
    const j = seen[r.role] = (seen[r.role] ?? -1) + 1;
    const deg = r.angleDeg + (j - (count[r.role] - 1) / 2) * 14;
    const [x, y] = at(deg, r.distanceCm || 0);
    const [nx, ny] = at(deg, (r.distanceCm || 0) + 15 / k);
    const side = r.areaCm2 ? Math.max(8, Math.sqrt(r.areaCm2) * k) : 0;
    const body = side
      ? `<rect class="plan__light${r.aimedAway ? ' plan__light--away' : ''}" x="${(-side / 2).toFixed(1)}" y="-2.5" width="${side.toFixed(1)}" height="5" rx="1.5" transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(-deg).toFixed(1)})"/>`
      : `<circle class="plan__light${r.aimedAway ? ' plan__light--away' : ''}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5"/>`;
    const beamTo = r.aimedAway ? at(deg, (r.distanceCm || 0) + 40 / k) : [cx, cy];
    ys.push(y - side / 2 - 6, y + side / 2 + 6, ny - 9, ny + 9, beamTo[1]);
    return `
      <line class="plan__beam" x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${beamTo[0].toFixed(1)}" y2="${beamTo[1].toFixed(1)}"/>
      ${body}
      <circle class="plan__badge" cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="7.5"/>
      <text class="plan__num" x="${nx.toFixed(1)}" y="${(ny + 3.5).toFixed(1)}">${i + 1}</text>`;
  }).join('');
  const [camX, camY] = at(0, s.cameraCm || 0);
  ys.push(camY - 10, camY + 10);
  const top = Math.max(0, Math.floor(Math.min(...ys)) - 6);
  const bottom = Math.min(H, Math.ceil(Math.max(...ys)) + 6);
  const desc = rows.map((r, i) => `light ${i + 1}, ${LIGHT_ROLES[r.role].label.toLowerCase()}, ${r.distanceCm > 0 ? `${r.distanceCm} cm` : 'no distance'}`).join('; ');
  return `
    <figure class="light-plan">
      <svg viewBox="0 ${top} ${W} ${bottom - top}" role="img" aria-labelledby="light-plan-title">
        <title id="light-plan-title">Seen from above: the model on its turntable, the camera ${s.cameraCm} cm in front, ${escHtml(desc)}.</title>
        <line class="plan__axis" x1="${cx}" y1="${cy}" x2="${camX.toFixed(1)}" y2="${camY.toFixed(1)}"/>
        <circle class="plan__table" cx="${cx}" cy="${cy}" r="${Math.max(10, 15 * k).toFixed(1)}"/>
        <circle class="plan__model" cx="${cx}" cy="${cy}" r="4"/>
        ${marks}
        <rect class="plan__camera" x="${(camX - 9).toFixed(1)}" y="${(camY - 6).toFixed(1)}" width="18" height="11" rx="2"/>
        <text class="plan__label plan__label--end" x="${(camX - 14).toFixed(1)}" y="${(camY + 4).toFixed(1)}">camera</text>
      </svg>
      <figcaption class="calc-note">Seen from above, distances to scale. Lights that share a role are fanned out so they stay readable; the arithmetic keeps each at its role's angle.</figcaption>
    </figure>`;
}

// ── Lights in Chile ──────────────────────────────────────────

/** The tiers with what each buys at the current exposure, then the price list. */
export function lightShop(s) {
  normalise(s);
  const tiers = SCENARIOS.filter(sc => sc.tier).map(sc => {
    const mix = lightMix(sc.lights.map(l => resolveLight(l, { panelLux1m: panelLux() })).map(r => ({ ...r, lux1m: r.lux1m ?? 0 })));
    const e = exposureFromLux({ lux: mix.onCard, aperture: s.aperture || 8, iso: s.iso || 400, shutterDenom: s.denom || 100 });
    const cost = tierCost(sc);
    const price = sc.buy.length ? (cost === null ? 'not priced here' : `from ${clp(cost)}`) : 'free';
    const iso = !e.ok ? 'no light on the card'
      : `At f/${s.aperture || 8}: ISO ${e.isoAboveRange ? 'past 32000' : `${e.isoDial} (exact ${Math.round(e.isoExact)})`}, ${times(mix.onCard / REFERENCE_LUX)} the light of ${REFERENCE_EXPOSURE.date}.`;
    return `
      <article class="tier">
        <h3 class="tier__title">${escHtml(sc.label)} <span class="tier__price">${escHtml(price)}</span></h3>
        <p class="tier__blurb">${escHtml(sc.blurb)}</p>
        <p class="tier__result">${escHtml(iso)}</p>
        <button type="button" class="btn btn--ghost btn--sm" data-tool-act="lights" data-act="scenario" data-arg="${escHtml(sc.id)}">Load it above</button>
      </article>`;
  }).join('');

  const lights = Object.entries(LIGHTS).filter(([id]) => id !== 'custom').map(([, l]) => {
    const figures = Object.values(l.mods).filter(m => Number.isFinite(m.lux1m)).map(m => `${lx(m.lux1m)} ${escHtml(lowerFirst(m.label))}`);
    const plus = l.colour.atLeast ? '+' : '';
    const colour = l.colour.cri ? `${escHtml(l.colour.cct)}, CRI ${l.colour.cri}${plus}, TLCI ${l.colour.tlci}${plus}` : 'No colour data';
    const src = l.url ? `<a href="${escHtml(l.url)}" target="_blank" rel="noopener noreferrer">${escHtml(l.src)}</a>` : escHtml(l.src);
    return `
      <article class="buy">
        <h3 class="buy__title">${escHtml(l.label)}</h3>
        <p class="buy__kind">${escHtml(l.kind)}. ${colour}.</p>
        <p class="buy__figures">${figures.length ? `At 1 m: ${figures.join('; ')}. From ${src}, read ${escHtml(CHECKED)}.` : src}</p>
        ${l.pricesNote ? `<p class="buy__kind">${escHtml(l.pricesNote)}</p>` : ''}
        <ul class="buy__prices">${l.prices.map(priceItem).join('')}</ul>
      </article>`;
  }).join('');

  const extras = Object.values(ACCESSORIES).map(a => `
      <article class="buy">
        <h3 class="buy__title">${escHtml(a.label)}</h3>
        <p class="buy__kind">${escHtml(a.kind)}</p>
        <ul class="buy__prices">${a.prices.map(priceItem).join('')}</ul>
      </article>`).join('');

  return `
    <p class="calc-sub">Four ways up from today, worked out at the exposure above:</p>
    <div class="tiers">${tiers}</div>
    <p class="calc-sub">The lights and what they cost, checked ${escHtml(CHECKED)}:</p>
    <div class="buys">${lights}${extras}</div>
    <p class="calc-note">${escHtml(SHOP_NOTE)}</p>`;
}

/** One shop's price: the model if the list mixes them, the shop, stock, and when it was read. */
function priceItem(p) {
  const shop = SHOPS[p.shop];
  const where = p.url
    ? `<a href="${escHtml(p.url)}" target="_blank" rel="noopener noreferrer">${escHtml(shop.label)}</a>`
    : `${escHtml(shop.label)} (${escHtml(shop.host)})`;
  const extra = [p.note, p.stock].filter(Boolean).map(t => `, ${escHtml(t)}`).join('');
  const when = p.seen
    ? `, as first noted ${escHtml(p.checked || CHECKED)}; not re-checked, the shop does not allow automated reading`
    : `, checked ${escHtml(p.checked || CHECKED)}`;
  const transfer = p.transfer ? ` (${p.transfer.toLocaleString('en-US')} by bank transfer)` : '';
  return `<li${p.out ? ' class="is-out"' : ''}>${p.model ? `${escHtml(p.model)}: ` : ''}${escHtml(priceLabel(p))} at ${where}${transfer}${extra}<span class="buy__date">${when}</span></li>`;
}
