// ── Shared UI pieces ─────────────────────────────────────────
// Markup helpers every view uses. Kept here so a basis chip looks the
// same in a finding, a data table and a lesson — the chip is the whole
// honesty mechanism, and it stops working if it renders three ways.

import { escHtml } from './utils.js';
import { BASIS } from './data/basis.js';
import { SEVERITY } from './engine/rules.js';

/** Provenance chip. Title carries the longer explanation. */
export function basisChip(basis) {
  const b = BASIS[basis];
  if (!b) return '';
  return `<span class="chip chip--basis" data-basis="${escHtml(basis)}" title="${escHtml(b.blurb)}">${escHtml(b.label)}</span>`;
}

export function severityPill(severity) {
  const s = SEVERITY[severity];
  if (!s) return '';
  return `<span class="pill pill--${escHtml(severity)}">${escHtml(s.label)}</span>`;
}

export function chip(text, mod = '') {
  return `<span class="chip${mod ? ` chip--${escHtml(mod)}` : ''}">${escHtml(text)}</span>`;
}

/** A panel with a title, optional lead, and body html. */
export function panel({ title, lead = '', body = '', actions = '', id = '' }) {
  return `
    <section class="panel"${id ? ` id="${escHtml(id)}"` : ''}>
      <div class="panel__head">
        <div>
          <h2 class="panel__title">${escHtml(title)}</h2>
          ${lead ? `<p class="panel__lead">${lead}</p>` : ''}
        </div>
        ${actions ? `<div class="panel__actions">${actions}</div>` : ''}
      </div>
      ${body}
    </section>`;
}

/** Definition rows. Values may carry markup; labels never do. */
export function kvRows(pairs) {
  return `<dl class="kv">${pairs.map(([k, v]) => `
    <div class="kv__row"><dt>${escHtml(k)}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
}

/**
 * Paragraph-per-line rendering for a finding's detail. Details are written
 * as prose with `- ` bullets, so this keeps the shape without pulling the
 * whole markdown renderer into a hot path.
 */
export function detailHtml(text) {
  const blocks = String(text).split(/\n\s*\n/);
  return blocks.map(block => {
    const lines = block.split('\n');
    if (lines.every(l => /^\s*-\s+/.test(l))) {
      return `<ul class="finding__list">${lines
        .map(l => `<li>${escHtml(l.replace(/^\s*-\s+/, ''))}</li>`).join('')}</ul>`;
    }
    const mixed = lines.filter(l => /^\s*-\s+/.test(l));
    if (mixed.length) {
      const lead = lines.filter(l => !/^\s*-\s+/.test(l)).join(' ').trim();
      return `${lead ? `<p>${escHtml(lead)}</p>` : ''}<ul class="finding__list">${mixed
        .map(l => `<li>${escHtml(l.replace(/^\s*-\s+/, ''))}</li>`).join('')}</ul>`;
    }
    return `<p>${escHtml(block.trim())}</p>`;
  }).join('');
}

/** One finding. `fix` renders as a button that writes into the config. */
export function findingCard(f) {
  const fix = f.fix
    ? `<button type="button" class="btn btn--secondary btn--sm" data-fix="${escHtml(f.id)}">${escHtml(f.fix.label)}</button>`
    : '';
  const learn = f.learn
    ? `<a class="btn btn--ghost btn--sm" href="#/learn/${encodeURIComponent(f.learn)}">Read why</a>`
    : '';
  return `
    <article class="finding finding--${escHtml(f.severity)}" data-finding="${escHtml(f.id)}">
      <header class="finding__head">
        <div class="finding__marks">
          ${severityPill(f.severity)}
          ${chip(f.areaLabel, 'area')}
          ${basisChip(f.basis)}
        </div>
        <h3 class="finding__title">${escHtml(f.title)}</h3>
      </header>
      <div class="finding__body">${detailHtml(f.detail)}</div>
      ${(fix || learn) ? `<footer class="finding__foot">${fix}${learn}</footer>` : ''}
    </article>`;
}

/** Empty state that says what was checked, not just "nothing found". */
export function emptyState(title, body) {
  return `<div class="empty"><h3>${escHtml(title)}</h3><p>${escHtml(body)}</p></div>`;
}

export function selectField({ id, label, value, options, hint = '' }) {
  const opts = options.map(o => {
    const val = typeof o === 'string' ? o : o.value;
    const text = typeof o === 'string' ? o : o.label;
    return `<option value="${escHtml(val)}"${String(val) === String(value) ? ' selected' : ''}>${escHtml(text)}</option>`;
  }).join('');
  return `
    <label class="field">
      <span class="field__label">${escHtml(label)}</span>
      <select class="field__input" id="${escHtml(id)}" data-path="${escHtml(id)}">${opts}</select>
      ${hint ? `<span class="field__hint">${escHtml(hint)}</span>` : ''}
    </label>`;
}

export function numberField({ id, label, value, min, max, step = 1, hint = '' }) {
  return `
    <label class="field">
      <span class="field__label">${escHtml(label)}</span>
      <input class="field__input" type="number" id="${escHtml(id)}" data-path="${escHtml(id)}"
        value="${value === null || value === undefined ? '' : escHtml(value)}"
        ${Number.isFinite(min) ? `min="${min}"` : ''} ${Number.isFinite(max) ? `max="${max}"` : ''} step="${step}">
      ${hint ? `<span class="field__hint">${escHtml(hint)}</span>` : ''}
    </label>`;
}

export function toggleField({ id, label, checked, hint = '' }) {
  return `
    <label class="field field--toggle">
      <input type="checkbox" id="${escHtml(id)}" data-path="${escHtml(id)}"${checked ? ' checked' : ''}>
      <span class="field__label">${escHtml(label)}</span>
      ${hint ? `<span class="field__hint">${escHtml(hint)}</span>` : ''}
    </label>`;
}
