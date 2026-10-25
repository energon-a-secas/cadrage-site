// ── Calculator fields ────────────────────────────────────────
// The select and number controls every calculator renders. They carry
// `data-tool` and `data-key` for events.js, which routes them to
// setToolValue in tools.js; nothing here writes anything.

import { escHtml } from '../utils.js';
import { SHUTTER_STEPS } from '../engine/calc.js';

export function sel(tool, key, value, options, label) {
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

export function num(tool, key, value, label, { min, max, step = 1, unit = '', placeholder = '' } = {}) {
  return `
    <label class="calc-field">
      <span class="calc-field__label">${escHtml(label)}${unit ? ` (${escHtml(unit)})` : ''}</span>
      <input class="field__input" type="number" data-tool="${escHtml(tool)}" data-key="${escHtml(key)}" data-kind="number"
        value="${value === null || value === undefined ? '' : escHtml(value)}"
        ${Number.isFinite(min) ? `min="${min}"` : ''}${Number.isFinite(max) ? ` max="${max}"` : ''} step="${step}"${placeholder ? ` placeholder="${escHtml(placeholder)}"` : ''}>
    </label>`;
}

/**
 * The 1/3-stop run, plus the current value if it is off-dial. The whole
 * point of the flicker lesson is that 1/120 can be worth analysing even
 * though the camera cannot select it, so the select must be able to show it.
 */
export function shutterOptions(current) {
  const offDial = current && !SHUTTER_STEPS.includes(current);
  const list = offDial ? [...SHUTTER_STEPS, current].sort((a, b) => a - b) : SHUTTER_STEPS;
  return list.map(d => ({
    value: d,
    label: `1/${d}${offDial && d === current ? ' (not on the dial)' : ''}`,
  }));
}
