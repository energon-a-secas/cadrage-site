// ── Camera menu ──────────────────────────────────────────────
// The A6700's menu tree as the entry point: same config, same findings,
// but laid out the way the camera presents them, so a finding can point
// at the exact row you would scroll to on the body.
//
// Every control is a plain `data-path` field, the same contract the quick
// editor uses, so events.js writes it with no menu-specific handler. The
// shell renders once; `#menuDerived` re-renders on every change, and
// render.js restores focus into the patched zone so number fields keep
// the caret.

import { escHtml } from '../utils.js';
import { state, activeConfig, readPath } from '../state.js';
import { lint } from '../engine/lint.js';
import { interactions } from '../engine/interactions.js';
import { MENU } from '../data/menu.js';
import { BODIES } from '../data/bodies.js';
import { panel, chip, severityPill, basisChip } from '../ui.js';

export function renderMenu() {
  return `
    <div class="view view--menu">
      ${intro()}
      <div id="menuDerived">${menuDerived()}</div>
    </div>`;
}

function intro() {
  const ex = BODIES.a6700.settingsExport;
  return panel({
    title: 'The menu, as the camera shows it',
    lead: `${escHtml(ex.note)} ${basisChip(ex.basis)} This tree is the workaround: enter values the way the body presents them, and the review's findings pin themselves to the row that owns the setting. The room, the lens and the edit have no menu rows, so they stay in the review.`,
    body: '',
  });
}

/** The whole tree, derived from the active config. */
export function menuDerived() {
  const config = activeConfig();
  const result = lint(config, state.rulesEnabled);
  const inter = interactions(config);
  const stateBySid = Object.fromEntries(inter.rows.map(r => [r.id, r]));

  const pinned = new Set();
  const tabs = MENU.map(tab => tabHtml(tab, config, result.findings, stateBySid, pinned)).join('');

  return `${tabs}${unpinned(result.findings, pinned)}`;
}

function tabHtml(tab, config, findings, stateBySid, pinned) {
  const groups = tab.groups.map(g => groupHtml(g, config, findings, stateBySid, pinned)).join('');
  const n = countFindings(tab, findings, pinned);
  return `
    <details class="mtab" open>
      <summary><span class="mtab__label">${escHtml(tab.label)}</span>${n ? `<span class="mtab__count">${n}</span>` : ''}</summary>
      <div class="mtab__body">${groups}</div>
    </details>`;
}

/** Distinct findings pinned anywhere under this tab (one finding can own two rows). */
function countFindings(tab, findings) {
  const ids = new Set();
  for (const g of tab.groups) {
    for (const item of g.items) {
      for (const f of findings) if (item.rules.includes(f.id)) ids.add(f.id);
    }
  }
  return ids.size;
}

function groupHtml(group, config, findings, stateBySid, pinned) {
  const items = group.items.map(item => itemHtml(item, config, findings, stateBySid, pinned)).join('');
  return `
    <details class="mgroup" open>
      <summary>${escHtml(group.label)}</summary>
      <ul class="mitems">${items}</ul>
    </details>`;
}

function itemHtml(item, config, findings, stateBySid, pinned) {
  const mine = findings.filter(f => item.rules.includes(f.id));
  mine.forEach(f => pinned.add(f.id));

  const srow = item.sid ? stateBySid[item.sid] : null;
  const stateChip = srow
    ? `<span class="state state--${escHtml(srow.state)}"${srow.why ? ` title="${escHtml(srow.why)}"` : ''}>${escHtml(srow.stateLabel)}</span>`
    : '';

  const worst = mine.map(f => f.severity).sort((a, b) => sevWeight(b) - sevWeight(a))[0];

  return `
    <li class="mitem"${worst ? ` data-flag="${escHtml(worst)}"` : ''}>
      <div class="mitem__main">
        <div class="mitem__text">
          <span class="mitem__label">${escHtml(item.label)}</span>
          <span class="mitem__value">${escHtml(item.value(config))}</span>
          ${stateChip}
        </div>
        <div class="mitem__controls">${item.controls.map(ctrl => controlHtml(ctrl, config)).join('')}</div>
      </div>
      ${mine.length ? `<div class="mitem__flags">${mine.map(flagHtml).join('')}</div>` : ''}
      ${item.note ? `<p class="mitem__note">${escHtml(item.note)}</p>` : ''}
    </li>`;
}

const SEV_WEIGHT = { error: 3, warn: 2, note: 1, inert: 0 };
const sevWeight = s => SEV_WEIGHT[s] ?? 0;

function flagHtml(f) {
  const fix = f.fix
    ? `<button type="button" class="btn btn--secondary btn--sm" data-fix="${escHtml(f.id)}">${escHtml(f.fix.label)}</button>`
    : '';
  return `
    <div class="mflag mflag--${escHtml(f.severity)}">
      ${severityPill(f.severity)}
      <span class="mflag__title">${escHtml(f.title)}</span>
      ${fix}
      <a class="btn btn--ghost btn--sm" href="#/review" title="See the full finding in the review">Details</a>
    </div>`;
}

function controlHtml(ctrl, config) {
  const value = readPath(config, ctrl.path);
  if (ctrl.kind === 'bool') {
    return `<input type="checkbox" class="mitem__check" data-path="${escHtml(ctrl.path)}" data-kind="bool"${value ? ' checked' : ''} aria-label="${escHtml(ctrl.path)}">`;
  }
  if (ctrl.kind === 'number') {
    return `<input type="number" class="field__input mitem__num" data-path="${escHtml(ctrl.path)}" data-kind="number"
      value="${value === null || value === undefined ? '' : escHtml(value)}"
      ${Number.isFinite(ctrl.min) ? `min="${ctrl.min}"` : ''} ${Number.isFinite(ctrl.max) ? `max="${ctrl.max}"` : ''} step="${ctrl.step || 1}"
      aria-label="${escHtml(ctrl.path)}">`;
  }
  const options = typeof ctrl.options === 'function' ? ctrl.options(config) : ctrl.options;
  const opts = options.map(o => {
    const v = o.value === null ? '' : String(o.value);
    return `<option value="${escHtml(v)}"${v === (value === null || value === undefined ? '' : String(value)) ? ' selected' : ''}>${escHtml(o.label)}</option>`;
  }).join('');
  return `<select class="field__input mitem__sel" data-path="${escHtml(ctrl.path)}" data-kind="select" aria-label="${escHtml(ctrl.path)}">${opts}</select>`;
}

/** Findings no menu row can own: the room, the lens, the edit. */
function unpinned(findings, pinned) {
  const rest = findings.filter(f => !pinned.has(f.id));
  if (!rest.length) return '';
  return panel({
    title: 'No menu row for these',
    lead: 'The room, the lens and the edit exist in no camera menu, so their findings live in the review rather than being pinned to a row they do not belong to.',
    body: `<ul class="mrest">${rest.map(f => `
      <li>${severityPill(f.severity)} <span class="mrest__title">${escHtml(f.title)}</span> ${chip(f.areaLabel, 'area')}</li>`).join('')}
    </ul>
    <p><a class="btn btn--secondary btn--sm" href="#/review">Open the review</a></p>`,
  });
}
