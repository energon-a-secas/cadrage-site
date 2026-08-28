// ── Render ───────────────────────────────────────────────────
// One view at a time, chosen by the route. A view is a function that
// returns HTML and may return a teardown function from `mount` — nothing
// in phase 1 needs one, but the contract is here so a later view with a
// timer or an observer cannot outlive its DOM.

import { state } from './state.js';
import { $ } from './utils.js';
import { ROUTES } from './router.js';
import { renderReview, reviewResults } from './views/review.js';
import { renderCamera, cameraDerived } from './views/camera.js';
import { renderLearn } from './views/learn.js';
import { renderWalkthrough } from './views/walkthrough.js';
import { renderTools } from './views/tools.js';

const TITLES = {
  learn: 'Learn',
  walkthrough: 'Walkthrough',
  camera: 'Camera',
  review: 'Review',
  tools: 'Calculators',
};

const SUBTITLES = {
  learn: 'What each setting does, and why it matters',
  walkthrough: 'The camera, in the order decisions depend on each other',
  camera: 'The a6700 menu, as the body shows it',
  review: 'What contradicts what',
  tools: 'Shutter, depth of field, spill, equivalence, card time',
};

const VIEWS = {
  learn: renderLearn,
  walkthrough: renderWalkthrough,
  camera: renderCamera,
  review: renderReview,
  tools: renderTools,
};

let teardown = null;

export function render() {
  const { section } = state.route;
  const view = VIEWS[section] || VIEWS.review;
  const mount = $('viewMount');
  if (!mount) return;

  if (typeof teardown === 'function') teardown();
  teardown = null;

  mount.innerHTML = view();
  document.body.dataset.view = section;
  syncNav(section);
  setSubtitle(section);
}

/**
 * Re-render only the derived zone of the current view, leaving the rest of
 * the DOM alone. If focus was inside the zone, put it back on the same
 * `data-path` control afterwards, so a number field survives the patch.
 */
const DERIVED = {
  review: ['reviewResults', reviewResults],
  camera: ['cameraDerived', cameraDerived],
};

export function patchDerived() {
  const entry = DERIVED[state.route.section];
  if (!entry) return;
  const [zoneId, html] = entry;
  // Fresh lookup, never the $ cache: the zone is replaced by every full
  // render, and patching a cached detached node updates nothing visible.
  const box = document.getElementById(zoneId);
  if (!box) return;
  const active = document.activeElement;
  const path = active && box.contains(active) ? active.dataset?.path : null;
  box.innerHTML = html();
  if (path) box.querySelector(`[data-path="${CSS.escape(path)}"]`)?.focus();
}

function syncNav(section) {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    const active = tab.dataset.section === section;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

function setSubtitle(section) {
  const el = document.querySelector('.header-subtitle');
  if (el) el.textContent = SUBTITLES[section] || SUBTITLES.review;
  document.title = `Cadrage | ${TITLES[section] || TITLES.review}`;
}

/** Build the nav rail once, from the route list. */
export function buildNav() {
  const rail = $('navRail');
  if (!rail) return;
  rail.innerHTML = ROUTES.map(r => `
    <a class="nav-tab" href="#/${r}" data-section="${r}">${TITLES[r]}</a>`).join('');
}

export { TITLES };
