// ── Render ───────────────────────────────────────────────────
// One view at a time, chosen by the route. A view is a function that
// returns HTML and may return a teardown function from `mount` — nothing
// in phase 1 needs one, but the contract is here so a later view with a
// timer or an observer cannot outlive its DOM.

import { state } from './state.js';
import { $ } from './utils.js';
import { ROUTES } from './router.js';
import { renderReview, reviewResults } from './views/review.js';
import { renderMenu, menuDerived } from './views/menu.js';
import { renderTools } from './views/tools.js';

const TITLES = {
  review: 'Review',
  menu: 'Camera menu',
  learn: 'Learn',
  post: 'Post',
  profiles: 'Setups',
  tools: 'Calculators',
};

const SUBTITLES = {
  review: 'What contradicts what',
  menu: 'Enter settings the way the camera shows them',
  learn: 'What each setting does, and why it matters',
  post: 'In-camera and in-editor corrections side by side',
  profiles: 'Compare, import, export',
  tools: 'Shutter, depth of field, spill, equivalence, card time',
};

const VIEWS = {
  review: renderReview,
  menu: renderMenu,
  learn: () => placeholder('Learn', 'Short pieces on the rules that are easy to forget: flicker, focus modes, gamma curves, spill.'),
  post: () => placeholder('Post', 'In-camera and editor corrections mapped onto the same axes, so a doubled correction is visible.'),
  profiles: () => placeholder('Setups', 'Several setups side by side, with import, export and a shareable link.'),
  tools: renderTools,
};

function placeholder(title, body) {
  return `
    <div class="view">
      <section class="panel">
        <div class="panel__head"><div><h2 class="panel__title">${title}</h2></div></div>
        <div class="empty">
          <h3>Not built yet</h3>
          <p>${body}</p>
          <p><a class="btn btn--secondary btn--sm" href="#/review">Back to the review</a></p>
        </div>
      </section>
    </div>`;
}

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
  menu: ['menuDerived', menuDerived],
};

export function patchDerived() {
  const entry = DERIVED[state.route.section];
  if (!entry) return;
  const [zoneId, html] = entry;
  const box = $(zoneId);
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
