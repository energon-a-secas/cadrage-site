// ── Events ───────────────────────────────────────────────────
// Every listener is delegated from document, so views can re-render
// freely without rebinding anything. Controls declare what they do with
// `data-*` attributes; there are no inline handlers and nothing on window.

import { state, setPath, setActiveConfig, saveActive, savePrefs, saveProgress, activeConfig, toggleRule } from './state.js';
import { render, patchDerived, buildNav } from './render.js';
import { applyRoute, replace } from './router.js';
import { cameraCursor, selectItem, cameraKey } from './views/camera.js';
import { WALK_BY_ID } from './data/walkthroughs.js';
import { lint, applyFix } from './engine/lint.js';
import { RULE_BY_ID } from './engine/rules.js';
import { setToolValue, patchToolOutputs } from './views/tools.js';
import { showToast, debounce } from './utils.js';

// ── Modal (inherited from the template) ──────────────────────

function getFocusable(root) {
  const sel = [
    'a[href]', 'button:not([disabled])', 'input:not([disabled])',
    'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
  ].join(',');
  return Array.from(root.querySelectorAll(sel)).filter(el => {
    if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') return false;
    return el.getClientRects().length > 0;
  });
}

let _modalLastFocus = null;

export function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  _modalLastFocus = document.activeElement;
  modal.removeAttribute('hidden');
  document.body.classList.add('modal-open');
  const dialog = modal.querySelector('.modal__dialog');
  const list = dialog ? getFocusable(dialog) : [];
  const closeBtn = modal.querySelector('.modal__header [data-modal-close]');
  const toFocus = closeBtn && list.includes(closeBtn) ? closeBtn : list[0];
  if (toFocus) toFocus.focus();
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.setAttribute('hidden', '');
  document.body.classList.remove('modal-open');
  if (_modalLastFocus && typeof _modalLastFocus.focus === 'function') _modalLastFocus.focus();
  _modalLastFocus = null;
}

function onDocumentKeydown(e) {
  const modal = document.querySelector('.modal:not([hidden])');
  if (!modal || !modal.id) {
    onCameraKeydown(e);
    return;
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    closeModal(modal.id);
    return;
  }
  if (e.key !== 'Tab') return;
  const dialog = modal.querySelector('.modal__dialog');
  const list = dialog ? getFocusable(dialog) : [];
  if (!list.length) return;
  const first = list[0];
  const last = list[list.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// ── Config editing ───────────────────────────────────────────

/**
 * A control's string value back to the type the config stores. Empty means
 * "not recorded", which is a real state: it is what makes a rule sit out
 * rather than guess.
 */
function coerce(el) {
  const kind = el.dataset.kind;
  if (kind === 'bool') return el.checked;
  if (kind === 'number') return el.value === '' ? null : Number(el.value);
  const v = el.value;
  if (v === '') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

/**
 * Number inputs patch only the derived half of the view, because a full
 * re-render replaces the input mid-keystroke and takes the caret with it.
 * Selects and checkboxes re-render fully, since changing the container or
 * the frame rate changes which options the other selects may offer.
 */
const patchDebounced = debounce(() => patchDerived(), 150);
const patchToolsDebounced = debounce(() => patchToolOutputs(), 150);

function onInput(e) {
  // Calculator fields: patch only the `#out-*` blocks, never the inputs.
  const tool = e.target.closest('[data-tool]');
  if (tool) {
    if (tool.dataset.kind !== 'number') return;
    setToolValue(tool.dataset.tool, tool.dataset.key, tool.value, 'number');
    patchToolsDebounced();
    return;
  }

  const el = e.target.closest('[data-path]');
  if (!el || el.dataset.kind !== 'number') return;
  setPath(el.dataset.path, coerce(el));
  patchDebounced();
}

function onChange(e) {
  const picker = e.target.closest('#configPicker');
  if (picker) {
    state.activeId = picker.value;
    saveActive();
    render();
    return;
  }

  // Calculator selects: a full re-render, because the card calculator's
  // Record Setting options depend on the File Format chosen above them.
  const tool = e.target.closest('[data-tool]');
  if (tool) {
    if (tool.dataset.kind === 'number') return; // already handled on input
    setToolValue(tool.dataset.tool, tool.dataset.key, tool.value, tool.dataset.kind);
    render();
    document.querySelector(`[data-tool="${CSS.escape(tool.dataset.tool)}"][data-key="${CSS.escape(tool.dataset.key)}"]`)?.focus();
    return;
  }

  const el = e.target.closest('[data-path]');
  if (!el) return;
  if (el.dataset.kind === 'number') return; // already handled on input
  setPath(el.dataset.path, coerce(el));
  rerenderKeepingFocus(el.dataset.path);
}

/** Re-render, then put the cursor back where it was. */
function rerenderKeepingFocus(path) {
  render();
  const again = document.querySelector(`[data-path="${CSS.escape(path)}"]`);
  if (again) again.focus();
}

// ── Camera replica ───────────────────────────────────────────

/** Keep the hash and the parsed route pointing at the cursor, so a
 *  re-render lands where the user left the wheel. */
function syncCameraRoute() {
  const cur = cameraCursor();
  state.route.param = cur.itemId;
  state.route.query = { mode: cur.mode };
  replace('camera', cur.itemId, { mode: cur.mode });
}

function onCameraKeydown(e) {
  if (document.body.dataset.view !== 'camera') return;
  const tag = e.target?.tagName;
  const inField = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
  if (inField) {
    // Escape leaves the control and returns to the wheel model.
    if (e.key === 'Escape') { e.preventDefault(); e.target.blur(); }
    return;
  }
  // Older engines and automation report legacy names (Down, Esc).
  const key = ({ Down: 'ArrowDown', Up: 'ArrowUp', Left: 'ArrowLeft', Right: 'ArrowRight', Esc: 'Escape' })[e.key] || e.key;
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(key)) return;
  if (cameraKey(key)) {
    e.preventDefault();
    syncCameraRoute();
    patchDerived();
  }
}

function onCameraClick(e) {
  const modeBtn = e.target.closest('[data-cam-mode]');
  if (modeBtn) {
    cameraCursor().mode = modeBtn.dataset.camMode;
    syncCameraRoute();
    patchDerived();
    return true;
  }
  const tabBtn = e.target.closest('[data-cam-tab]');
  if (tabBtn) {
    const cur = cameraCursor();
    cur.tabId = tabBtn.dataset.camTab;
    cur.groupId = null;
    cur.itemId = null;
    cur.level = 'groups';
    syncCameraRoute();
    patchDerived();
    return true;
  }
  const groupBtn = e.target.closest('[data-cam-group]');
  if (groupBtn) {
    const cur = cameraCursor();
    cur.groupId = groupBtn.dataset.camGroup;
    cur.itemId = null;
    cur.level = 'items';
    syncCameraRoute();
    patchDerived();
    return true;
  }
  const itemBtn = e.target.closest('[data-cam-item]');
  if (itemBtn) {
    selectItem(itemBtn.dataset.camItem);
    cameraCursor().level = 'items';
    syncCameraRoute();
    patchDerived();
    return true;
  }
  return false;
}

// ── Learn and walkthrough progress ───────────────────────────

function onProgressClick(e) {
  const lessonBtn = e.target.closest('[data-lesson-done]');
  if (lessonBtn) {
    const id = lessonBtn.dataset.lessonDone;
    if (state.progress[id]) delete state.progress[id];
    else state.progress[id] = true;
    saveProgress();
    render();
    return true;
  }
  const doneBtn = e.target.closest('[data-walk-done]');
  if (doneBtn) {
    const key = `walk:${doneBtn.dataset.walkDone}`;
    if (state.progress[key]) delete state.progress[key];
    else state.progress[key] = true;
    saveProgress();
    render();
    return true;
  }
  const applyBtn = e.target.closest('[data-walk-apply]');
  if (applyBtn) {
    const step = WALK_BY_ID[applyBtn.dataset.walkApply];
    if (!step || !step.set?.length) return true;
    for (const w of step.set) {
      const value = typeof w.value === 'function' ? w.value(activeConfig()) : w.value;
      setPath(w.path, value);
    }
    state.progress[`walk:${step.id}`] = true;
    saveProgress();
    render();
    showToast(`Applied: ${step.title}`);
    return true;
  }
  return false;
}

// ── Findings ─────────────────────────────────────────────────

function onClick(e) {
  const modal = e.target.closest('.modal:not([hidden])');
  if (modal && e.target.closest('[data-modal-close]')) {
    closeModal(modal.id);
    return;
  }

  if (onCameraClick(e)) return;
  if (onProgressClick(e)) return;

  if (e.target.closest('#aboutBtn')) {
    openModal('aboutModal');
    return;
  }

  const fixBtn = e.target.closest('[data-fix]');
  if (fixBtn) {
    applyFindingFix(fixBtn.dataset.fix);
    return;
  }

  const enableBtn = e.target.closest('[data-enable-rule]');
  if (enableBtn) {
    const rule = RULE_BY_ID[enableBtn.dataset.enableRule];
    if (rule) {
      toggleRule(rule.id, rule.basis);
      render();
      showToast(state.rulesEnabled[rule.id] ? 'Rule enabled. It is still unverified.' : 'Rule disabled again.');
    }
    return;
  }

  if (e.target.closest('#toggleShowPassed')) {
    state.prefs.showPassed = !state.prefs.showPassed;
    savePrefs();
    render();
  }
}

/**
 * Fixes are looked up from a fresh lint rather than stored in the DOM, so a
 * stale button cannot write a value the engine no longer recommends.
 */
function applyFindingFix(id) {
  const result = lint(activeConfig(), state.rulesEnabled);
  const finding = result.findings.find(f => f.id === id);
  if (!finding?.fix) {
    showToast('That fix no longer applies.');
    render();
    return;
  }
  setActiveConfig(applyFix(activeConfig(), finding.fix));
  render();
  showToast(finding.fix.label);
}

// ── Boot ─────────────────────────────────────────────────────

function onHashChange() {
  applyRoute();
  render();
  window.scrollTo({ top: 0 });
}

export function bindEvents() {
  document.addEventListener('keydown', onDocumentKeydown);
  document.addEventListener('click', onClick);
  document.addEventListener('input', onInput);
  document.addEventListener('change', onChange);
  window.addEventListener('hashchange', onHashChange);
  buildNav();
}
