// ── Events ───────────────────────────────────────────────────
// Every listener is delegated from document, so views can re-render
// freely without rebinding anything. Controls declare what they do with
// `data-*` attributes; there are no inline handlers and nothing on window.

import { state, setPath, setActiveConfig, saveActive, savePrefs, activeConfig, toggleRule } from './state.js';
import { render, patchDerived, buildNav } from './render.js';
import { applyRoute } from './router.js';
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
  if (!modal || !modal.id) return;
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

// ── Findings ─────────────────────────────────────────────────

function onClick(e) {
  const modal = e.target.closest('.modal:not([hidden])');
  if (modal && e.target.closest('[data-modal-close]')) {
    closeModal(modal.id);
    return;
  }

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
