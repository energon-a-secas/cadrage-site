// ── Camera ───────────────────────────────────────────────────
// The a6700 menu replica. Layout follows the help guide's verified
// description: a vertical tab strip on the left, a strip of numbered
// group chips beside it, then two-column item rows with the selection
// drawn as an inverted bar; the Main tab is a tile grid. Selecting a
// row shows its detail card under the screen: the live controls when
// the setup models it, the transcribed documentation when it does not,
// plus every finding, lesson and walkthrough step that points here.
//
// Cursor state lives in state.camera and the route mirrors the
// selected row (#/camera/<itemId>?mode=), so lessons and walkthrough
// steps can deep-link to the exact row. Keyboard: arrows move, Enter
// descends, Escape is the MENU button (back), exactly the model the
// guide documents for the control wheel.

import { escHtml } from '../utils.js';
import { state, activeConfig, readPath } from '../state.js';
import { lint } from '../engine/lint.js';
import { interactions } from '../engine/interactions.js';
import { MENU_ITEMS } from '../data/menu.js';
import { TREE, TREE_ITEM_BY_ID, TREE_PATH, resolveItem, groupsForMode } from '../data/menu-tree.js';
import { LESSONS } from '../data/lessons.js';
import { WALKTHROUGHS } from '../data/walkthroughs.js';
import { panel, chip, severityPill, basisChip } from '../ui.js';

const LIVE_BY_ID = Object.fromEntries(MENU_ITEMS.map(i => [i.id, i]));

/** Tab ids that vary with the dial; the rest always show everything. */
const MODE_TABS = new Set(['main', 'shooting', 'exposure-color', 'focus']);

// ── Cursor ───────────────────────────────────────────────────

export function cameraCursor() {
  if (!state.camera) {
    state.camera = { mode: 'movie', tabId: 'main', groupId: null, itemId: null, level: 'items' };
  }
  return state.camera;
}

function visibleGroups(tab, mode) {
  return MODE_TABS.has(tab.id) ? groupsForMode(tab, mode) : tab.groups;
}

/** Normalise the cursor so tab, group and item always exist and agree. */
function normalise() {
  const cur = cameraCursor();
  let tab = TREE.find(t => t.id === cur.tabId) || TREE.find(t => t.id === 'main');
  let groups = visibleGroups(tab, cur.mode);
  if (!groups.length) { tab = TREE.find(t => t.id === 'main'); groups = visibleGroups(tab, cur.mode); }
  cur.tabId = tab.id;
  // A Main tile stands for the row it links, so match through the link.
  const stands = i => (i.link || i.id) === cur.itemId;
  let group = groups.find(g => g.id === cur.groupId) || groups[0];
  if (!group.items.some(stands)) {
    const owner = groups.find(g => g.items.some(stands));
    if (owner) group = owner;
    else cur.itemId = group.items[0] ? (group.items[0].link || group.items[0].id) : null;
  }
  cur.groupId = group.id;
  return { cur, tab, groups, group };
}

/** Point the cursor at a row by id (deep links, walkthrough jumps). */
export function selectItem(itemId, mode = null) {
  const cur = cameraCursor();
  if (mode === 'still' || mode === 'movie') cur.mode = mode;
  const path = TREE_PATH[itemId];
  if (!path) return false;
  const target = TREE_ITEM_BY_ID[itemId];
  // A row invisible in the current mode drags the dial with it.
  if (target.modes !== 'both' && MODE_TABS.has(path.tabId)) cur.mode = target.modes;
  cur.tabId = path.tabId;
  cur.groupId = path.groupId;
  cur.itemId = path.parentId || itemId;
  cur.level = 'items';
  cur.focusChild = path.parentId ? itemId : null;
  return true;
}

// ── View ─────────────────────────────────────────────────────

export function renderCamera() {
  // The route wins over the stored cursor, so a shared link lands
  // exactly where it points.
  if (state.route.param && TREE_PATH[state.route.param]) {
    selectItem(state.route.param, state.route.query.mode || null);
  } else if (state.route.query.mode === 'still' || state.route.query.mode === 'movie') {
    cameraCursor().mode = state.route.query.mode;
  }
  return `
    <div class="view view--camera">
      ${intro()}
      <div id="cameraDerived">${cameraDerived()}</div>
    </div>`;
}

function intro() {
  return panel({
    title: 'The menu, as the body shows it',
    lead: 'Structure and row labels transcribed from the a6700 help guide. Rows the setup models are live: edit them here and the review re-judges. Rows it does not model say so instead of pretending. Arrows move, Enter descends, Escape is the MENU button.',
    body: '',
  });
}

export function cameraDerived() {
  const { cur, tab, groups, group } = normalise();
  const config = activeConfig();
  const result = lint(config, state.rulesEnabled);
  const inter = interactions(config);
  const stateBySid = Object.fromEntries(inter.rows.map(r => [r.id, r]));

  return `
    <div class="cam" data-level="${escHtml(cur.level)}">
      <div class="cam__frame">
        <div class="cam__topbar">
          <span class="cam__crumb">${escHtml(tab.label)}${tab.main ? '' : ` &rsaquo; ${escHtml(group.label)}`}</span>
          <span class="cam__mode">
            <button type="button" class="cam__modebtn${cur.mode === 'still' ? ' is-on' : ''}" data-cam-mode="still">Still</button>
            <button type="button" class="cam__modebtn${cur.mode === 'movie' ? ' is-on' : ''}" data-cam-mode="movie">Movie</button>
          </span>
        </div>
        <div class="cam__cols">
          <nav class="cam__tabs" aria-label="Menu tabs">
            ${TREE.map(t => `
              <button type="button" class="cam__tab${t.id === tab.id ? ' is-active' : ''}" data-cam-tab="${escHtml(t.id)}" data-tabid="${escHtml(t.id)}" title="${escHtml(t.label)}">
                <span class="cam__tabicon" aria-hidden="true"></span>
                <span class="cam__tablabel">${escHtml(t.label)}</span>
              </button>`).join('')}
          </nav>
          <nav class="cam__groups" aria-label="Menu groups">
            ${groups.map(gr => `
              <button type="button" class="cam__group${gr.id === group.id ? ' is-active' : ''}" data-cam-group="${escHtml(gr.id)}">
                <span class="cam__groupnum">${gr.num}</span>
              </button>`).join('')}
          </nav>
          ${tab.main ? tileGrid(group, cur, config, result) : itemList(group, cur, config, result, stateBySid)}
        </div>
        <div class="cam__hintbar">
          <span>&#8593;&#8595; move</span><span>&#8592;&#8594; column</span><span>Enter select</span><span>Esc MENU &#8617;</span>
        </div>
      </div>
      ${detail(cur, config, result, stateBySid)}
    </div>`;
}

// ── The item list (normal tabs) ──────────────────────────────

function itemList(group, cur, config, result, stateBySid) {
  return `
    <ul class="cam__items" aria-label="${escHtml(group.label)}">
      ${group.items.map(item => {
        const live = item.ref ? LIVE_BY_ID[item.ref] : null;
        const worst = worstSeverity(item, result);
        return `
          <li>
            <button type="button" class="cam__item${item.id === cur.itemId ? ' is-active' : ''}" data-cam-item="${escHtml(item.id)}"${worst ? ` data-flag="${escHtml(worst)}"` : ''}>
              <span class="cam__itemlabel">${escHtml(item.label)}${item.children ? ' &rsaquo;' : ''}</span>
              <span class="cam__itemvalue">${valueOf(item, live, config)}</span>
            </button>
          </li>`;
      }).join('')}
    </ul>`;
}

/** The Main tab: value tiles in a grid. */
function tileGrid(group, cur, config, result) {
  return `
    <div class="cam__tiles" role="list" aria-label="${escHtml(group.label)}">
      ${group.items.map(tile => {
        const item = resolveItem(tile);
        const live = item?.ref ? LIVE_BY_ID[item.ref] : null;
        const active = item && item.id === cur.itemId;
        const worst = item ? worstSeverity(item, result) : null;
        return `
          <button type="button" class="cam__tile${active ? ' is-active' : ''}" role="listitem" data-cam-item="${escHtml(item ? item.id : tile.id)}"${worst ? ` data-flag="${escHtml(worst)}"` : ''}>
            <span class="cam__tilelabel">${escHtml(tile.label)}</span>
            <span class="cam__tilevalue">${item ? valueOf(item, live, config) : 'n/a'}</span>
          </button>`;
      }).join('')}
    </div>`;
}

function valueOf(item, live, config) {
  if (live) return escHtml(live.value(config));
  if (item.children) {
    const liveKids = item.children.filter(ch => ch.ref && LIVE_BY_ID[ch.ref]);
    if (liveKids.length) return liveKids.map(ch => escHtml(LIVE_BY_ID[ch.ref].value(config))).join(' &middot; ');
  }
  return '<span class="cam__dim">&ndash;</span>';
}

/** Worst finding severity pinned to this row or its children. */
const SEV_WEIGHT = { error: 3, warn: 2, note: 1, inert: 0 };
function worstSeverity(item, result) {
  const rules = collectRules(item);
  if (!rules.size) return null;
  const mine = result.findings.filter(f => rules.has(f.id));
  if (!mine.length) return null;
  return mine.map(f => f.severity).sort((a, b) => (SEV_WEIGHT[b] ?? 0) - (SEV_WEIGHT[a] ?? 0))[0];
}

function collectRules(item) {
  const out = new Set();
  const add = it => {
    const live = it.ref ? LIVE_BY_ID[it.ref] : null;
    for (const r of live?.rules || []) out.add(r);
  };
  add(item);
  for (const ch of item.children || []) add(ch);
  return out;
}

// ── Detail card ──────────────────────────────────────────────

function detail(cur, config, result, stateBySid) {
  const item = TREE_ITEM_BY_ID[cur.itemId];
  if (!item) return '';
  const rows = [item, ...(item.children || [])];
  return `
    <aside class="camdetail" aria-label="Selected row">
      ${rows.map((r, i) => detailRow(r, i === 0, cur, config, result, stateBySid)).join('')}
      ${pointers(rows)}
    </aside>`;
}

function detailRow(item, isParent, cur, config, result, stateBySid) {
  const live = item.ref ? LIVE_BY_ID[item.ref] : null;
  const srow = live?.sid ? stateBySid[live.sid] : null;
  const mine = result.findings.filter(f => (live?.rules || []).includes(f.id));
  const modeChip = item.modes !== 'both' ? chip(item.modes === 'still' ? 'Stills only' : 'Movie / S&Q', 'area') : '';
  const actsOn = item.actsOn ? chip(`acts on ${item.actsOn === 'still' ? 'stills' : 'movies'}`, 'area') : '';

  return `
    <section class="camdetail__row${isParent ? '' : ' camdetail__row--child'}">
      <header class="camdetail__head">
        <h3 class="camdetail__title">${escHtml(item.label)}</h3>
        ${modeChip}${actsOn}
        ${srow ? `<span class="state state--${escHtml(srow.state)}"${srow.why ? ` title="${escHtml(srow.why)}"` : ''}>${escHtml(srow.stateLabel)}</span>` : ''}
        ${live ? '' : chip('not modelled')}
      </header>
      ${item.doc ? `<p class="camdetail__doc">${escHtml(item.doc)}</p>` : ''}
      ${item.note ? `<p class="camdetail__note">${escHtml(item.note)}</p>` : ''}
      ${live
        ? `<div class="camdetail__controls">${live.controls.map(ctrlHtml.bind(null, config)).join('')}</div>${live.note ? `<p class="camdetail__note">${escHtml(live.note)}</p>` : ''}`
        : `<p class="camdetail__static">The setup object does not record this row, so it renders as documentation rather than a control that writes nowhere.</p>`}
      ${mine.length ? `<div class="camdetail__flags">${mine.map(flagHtml).join('')}</div>` : ''}
    </section>`;
}

function flagHtml(f) {
  const fix = f.fix
    ? `<button type="button" class="btn btn--secondary btn--sm" data-fix="${escHtml(f.id)}">${escHtml(f.fix.label)}</button>`
    : '';
  return `
    <div class="mflag mflag--${escHtml(f.severity)}">
      ${severityPill(f.severity)}
      ${basisChip(f.basis)}
      <span class="mflag__title">${escHtml(f.title)}</span>
      ${fix}
      <a class="btn btn--ghost btn--sm" href="#/review" title="See the full finding in the review">Details</a>
    </div>`;
}

/** Lessons and walkthrough steps that point at any of these rows. */
function pointers(rows) {
  const ids = new Set(rows.map(r => r.id));
  const lessons = LESSONS.filter(l => (l.menu || []).some(id => ids.has(id)));
  const steps = WALKTHROUGHS.filter(s => s.menuId && ids.has(s.menuId));
  if (!lessons.length && !steps.length) return '';
  return `
    <section class="camdetail__pointers">
      ${lessons.length ? `<div class="lesson__linkrow"><span class="lesson__linklabel">Lessons</span>${lessons.map(l =>
        `<a class="btn btn--ghost btn--sm" href="#/learn/${encodeURIComponent(l.id)}">${escHtml(l.title)}</a>`).join('')}</div>` : ''}
      ${steps.length ? `<div class="lesson__linkrow"><span class="lesson__linklabel">Walkthrough</span>${steps.map(s =>
        `<a class="btn btn--ghost btn--sm" href="#/walkthrough/${escHtml(s.track)}#step-${escHtml(s.id)}">${escHtml(s.title)}</a>`).join('')}</div>` : ''}
    </section>`;
}

// The same control contract the review's quick editor uses: every
// field carries data-path, events.js does the writing.
function ctrlHtml(config, ctrl) {
  const value = readPath(config, ctrl.path);
  if (ctrl.kind === 'bool') {
    return `<label class="camdetail__ctrl"><input type="checkbox" data-path="${escHtml(ctrl.path)}" data-kind="bool"${value ? ' checked' : ''}> <span>${escHtml(ctrl.path)}</span></label>`;
  }
  if (ctrl.kind === 'number') {
    return `<label class="camdetail__ctrl"><span>${escHtml(ctrl.path)}</span><input type="number" class="field__input" data-path="${escHtml(ctrl.path)}" data-kind="number"
      value="${value === null || value === undefined ? '' : escHtml(value)}"
      ${Number.isFinite(ctrl.min) ? `min="${ctrl.min}"` : ''} ${Number.isFinite(ctrl.max) ? `max="${ctrl.max}"` : ''} step="${ctrl.step || 1}"></label>`;
  }
  const options = typeof ctrl.options === 'function' ? ctrl.options(config) : ctrl.options;
  const opts = options.map(o => {
    const v = o.value === null ? '' : String(o.value);
    return `<option value="${escHtml(v)}"${v === (value === null || value === undefined ? '' : String(value)) ? ' selected' : ''}>${escHtml(o.label)}</option>`;
  }).join('');
  return `<label class="camdetail__ctrl"><span>${escHtml(ctrl.path)}</span><select class="field__input" data-path="${escHtml(ctrl.path)}" data-kind="select">${opts}</select></label>`;
}

// ── Keyboard model ───────────────────────────────────────────
// Arrows move within the active column, left/right change column,
// Enter descends, Escape ascends (the MENU button). Returns true when
// the key was consumed, so events.js can preventDefault.

export function cameraKey(key) {
  const { cur, tab, groups, group } = normalise();
  const tabIndex = TREE.findIndex(t => t.id === tab.id);
  const groupIndex = groups.findIndex(g => g.id === group.id);
  const itemIndex = group.items.findIndex(i => (i.link || i.id) === cur.itemId);

  const clamp = (n, len) => Math.max(0, Math.min(len - 1, n));

  if (key === 'Escape') {
    if (cur.level === 'items') cur.level = 'groups';
    else if (cur.level === 'groups') cur.level = 'tabs';
    else return false; // top level: let the page handle it
    return true;
  }
  if (key === 'Enter') {
    if (cur.level === 'tabs') cur.level = 'groups';
    else if (cur.level === 'groups') cur.level = 'items';
    else return false; // items: focus stays with the detail controls
    return true;
  }
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    const order = ['tabs', 'groups', 'items'];
    const next = order[clamp(order.indexOf(cur.level) + (key === 'ArrowRight' ? 1 : -1), 3)];
    cur.level = next;
    return true;
  }
  if (key === 'ArrowUp' || key === 'ArrowDown') {
    const delta = key === 'ArrowDown' ? 1 : -1;
    if (cur.level === 'tabs') {
      const t = TREE[clamp(tabIndex + delta, TREE.length)];
      cur.tabId = t.id; cur.groupId = null; cur.itemId = null;
    } else if (cur.level === 'groups') {
      const g = groups[clamp(groupIndex + delta, groups.length)];
      cur.groupId = g.id; cur.itemId = null;
    } else {
      const it = group.items[clamp(itemIndex + delta, group.items.length)];
      cur.itemId = it.link || it.id;
    }
    return true;
  }
  return false;
}
